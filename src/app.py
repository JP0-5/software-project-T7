# NOTE: Do not use `flask run` to start the server.
# Instead, run this file and code at the end of the file will start the server.

# Required to set up gevent
from gevent import monkey
monkey.patch_all()

from flask import Flask, render_template, request, session, g, redirect, url_for
from flask_socketio import SocketIO, join_room, disconnect
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from time import time
from gevent.lock import BoundedSemaphore
from database import get_db, close_db
from forms import *

app = Flask(__name__)
app.config['SECRET_KEY'] = "this-is-my-secret-key"
app.config["SESSION_TYPE"] = "filesystem"
app.teardown_appcontext(close_db)
Session(app)

socketio = SocketIO(app, async_mode="gevent", cors_allowed_origins="*", logger=True, engineio_logger=True, ping_timeout=5)

# Used to ensure guests are always given unique player IDs
guest_id_lock = BoundedSemaphore()

@app.before_request
def get_username():
    g.user = session.get("username", None)
    if g.user is None:
        session["username"] = None

    if "sockets" not in session:
        session["sockets"] = {}        #Maps socket IDs to game IDs

def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.user is None:
            return redirect( url_for("login", next=request.url) )
        return view(*args, **kwargs)
    return wrapped_view

def logged_out_required(view):
    @wraps(view)
    def wrapped_view2(*args, **kwargs):
        if g.user is not None:
            return redirect(url_for("main"))
        return view(*args,**kwargs)
    return wrapped_view2

@app.errorhandler(404)
def page_not_found(error):
    return render_template("error.html", title="Not Found", error="404 Not Found"), 404


# Routes
@app.route("/")
def main():
    return render_template("main.html",title="BlackJack")

@app.route('/sign_in', methods=['GET','POST'])
@logged_out_required
def sign_up():
    form = RegistrationForm()
    if form.submit.data and form.validate_on_submit():
        user_id=form.user_id.data
        password=form.password.data

        db = get_db()
        conflict_user = db.execute('''SELECT * FROM users WHERE user = ?;''', (user_id,)).fetchone()
        if conflict_user is not None:
            form.user_id.errors.append('Username already taken!')
            form.user_id.data = ''
            form.password.data = ''
            form.passwordRepeat.data = ''
            
        else:
            db.execute('''INSERT INTO users(user, password) VALUES (?, ?); ''',(user_id, generate_password_hash(password)))
            db.commit()
            next_page=request.args.get('next')
            if not next_page:
                next_page = url_for('main')
            return redirect(next_page)
    return render_template("sign_up.html",form=form,title="Sign Up for BlackJack")
    
@app.route('/log_in', methods = ['GET', 'POST'])
@logged_out_required
def log_in():
    form = LoginForm()
    if form.submit.data and form.validate_on_submit():
    
        user_id=form.user_id.data
        password=form.password.data
        db = get_db()
        user = db.execute(''' SELECT * FROM users WHERE user =?; ''', (user_id,)).fetchOne()
        if user is None:
            form.user_id.errors.append('No such username!')
        elif not check_password_hash(user['password'],password):
            form.login_password.errors.append('Incorrect password!')
        else:
            if not next_page:
                next_page = url_for('main')
            return redirect(next_page)
        
    return render_template("log_in.html",form=form,title="Sign Up for BlackJack")

@app.route("/play/<game_id>")
def play(game_id):
    db = get_db()

    # Assign a player ID based on the username, or on number if not logged in
    if g.user is not None:
        session["player_id"] = "u" + g.user
        # Add "u" to the username to ensure this can never match a guest's player ID
    elif "player_id" not in session:
        # If not logged in and a player ID has not already been assigned

        # Use a lock to ensure two guests will not accidentally get the same player ID
        with guest_id_lock:
            id = db.execute("SELECT * FROM next_guest_id").fetchone()["id"]
            db.execute("UPDATE next_guest_id SET id = ?", (id+1,))
            db.commit()

        session["player_id"] = "_Guest" + str(id)

    

    # To be expanded

    messages = db.execute("SELECT * FROM chat_messages WHERE game_id = ?", (game_id,)).fetchall()

    return render_template("play.html", game_id=game_id, messages=messages)


# SocketIO event handlers
@socketio.on("join_request")
def handle_join(game_id):
    player_id = session["player_id"]
    db = get_db()

    # Get player and game info
    player_entry = db.execute("""
                                SELECT *
                                FROM players JOIN games
                                ON players.game_id = games.game_id
                                WHERE players.game_id = ? AND players.player_id = ?
                                """, (game_id, player_id)).fetchone()

    # Check if this player is already connected to this game, or was previously
    if player_entry is not None:
        if player_entry["finished"] == 1:
            # If the game is finished, refuse the connection
            # This should not occur, but is included to be safe
            disconnect(request.sid)
            print("----handle_join(): Refused connection as the game is finished.-----")    # Message for debugging
            return
        if player_entry["connected"] == 1:
            # If the same player is currently connected to this room on another socket, refuse the connection
            # This is important to prevent conflicts
            disconnect(request.sid)
            print("----handle_join(): Refused connection as the player is already connected to this game.-----")    # Message for debugging
            return
        else:
            # The player was previously connected to this game, but disconnected and is now reconnecting
            db.execute("""
                        UPDATE players
                        SET socket_id = ?, connected = 1
                        WHERE game_id = ? AND player_id = ?""",
                        (request.sid, game_id, player_id))
    else:
        # The player is connecting to this game for the first time
        game = db.execute("SELECT * FROM games WHERE game_id = ?", (game_id,)).fetchone()
        if game["finished"] == 1:
            # If the game is finished, refuse the connection
            # This should not occur, but is included to be safe
            disconnect(request.sid)
            print("----handle_join(): Refused connection as the game is finished.-----")    # Message for debugging
            return
        
        db.execute("""
                    INSERT INTO players (game_id, player_id, socket_id, connected, user, score)
                    VALUES (?, ?, ?, 1, ?, 0)""",
                    (game_id, player_id, request.sid, session["username"]))
    db.commit()

    session["sockets"][request.sid] = game_id
    session.modified = True
    join_room(game_id)
    socketio.emit("join_accepted", (player_id, request.sid), to=game_id)

@socketio.on("disconnect")
def handle_disconnect(*args):
    game_id = session["sockets"].pop(request.sid, None)
    
    if game_id is not None:
        session.modified = True
        player_id = session["player_id"]
        db = get_db()

        # Get player and game info
        player_entry = db.execute("""
                                    SELECT *
                                    FROM players JOIN games
                                    ON players.game_id = games.game_id
                                    WHERE players.game_id = ? AND players.player_id = ?""",
                                    (game_id, player_id)).fetchone()
        if player_entry is not None:
            if player_entry["finished"] == 0:
                # Only emit if the game is not finished
                socketio.emit("other_player_disconnect", player_id, to=game_id, include_self=False)

            db.execute("""
                        UPDATE players
                        SET connected = 0
                        WHERE game_id = ? AND player_id = ?""",
                        (game_id, player_id))
            db.commit()
        
@socketio.on("chat_message_from_client")
def handle_chat_message(content):
    game_id = session["sockets"].get(request.sid, None)

    if game_id is not None:
        session.modified = True
        player_id = session["player_id"]
        socketio.emit("chat_message_from_server", (player_id, content), to=game_id)

        # Write to database afterwards, so it does not delay the emitting of the message
        db = get_db()
        db.execute("""
                    INSERT INTO chat_messages (game_id, player_id, content)
                    VALUES (?, ?, ?)""",
                    (game_id, player_id, content))
        db.commit()

# Run the server locally
if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)