# NOTE: Do not use `flask run` to start the server. 
# Instead, run this file and code at the end of the file will start the server.

# NOTE: You may need to run the schema.sql file to setup app.db first.

# Required to set up gevent
from gevent import monkey, sleep
monkey.patch_all()
import os
from flask import Flask,flash,request, render_template, request, session, g, redirect, url_for
from flask_socketio import SocketIO, join_room, disconnect
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime
from gevent.lock import BoundedSemaphore
from random import randint
from database import *
from forms import *
from werkzeug.utils import secure_filename


UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), "static", "pfp", "uploads")
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = "this-is-my-secret-key"
app.config["SESSION_TYPE"] = "filesystem"
app.teardown_appcontext(close_db)
Session(app)

socketio = SocketIO(app, async_mode="gevent", cors_allowed_origins="*", logger=True, engineio_logger=True, ping_timeout=5)

deck_creation_statement = """
INSERT INTO decks (game_id, value, suit)
VALUES
(X, 1, "clubs"),
(X, 2, "clubs"),
(X, 3, "clubs"),
(X, 4, "clubs"),
(X, 5, "clubs"),
(X, 6, "clubs"),
(X, 7, "clubs"),
(X, 8, "clubs"),
(X, 9, "clubs"),
(X, 10, "clubs"),
(X, 11, "clubs"),
(X, 12, "clubs"),
(X, 13, "clubs"),
(X, 1, "diamonds"),
(X, 2, "diamonds"),
(X, 3, "diamonds"),
(X, 4, "diamonds"),
(X, 5, "diamonds"),
(X, 6, "diamonds"),
(X, 7, "diamonds"),
(X, 8, "diamonds"),
(X, 9, "diamonds"),
(X, 10, "diamonds"),
(X, 11, "diamonds"),
(X, 12, "diamonds"),
(X, 13, "diamonds"),
(X, 1, "hearts"),
(X, 2, "hearts"),
(X, 3, "hearts"),
(X, 4, "hearts"),
(X, 5, "hearts"),
(X, 6, "hearts"),
(X, 7, "hearts"),
(X, 8, "hearts"),
(X, 9, "hearts"),
(X, 10, "hearts"),
(X, 11, "hearts"),
(X, 12, "hearts"),
(X, 13, "hearts"),
(X, 1, "spades"),
(X, 2, "spades"),
(X, 3, "spades"),
(X, 4, "spades"),
(X, 5, "spades"),
(X, 6, "spades"),
(X, 7, "spades"),
(X, 8, "spades"),
(X, 9, "spades"),
(X, 10, "spades"),
(X, 11, "spades"),
(X, 12, "spades"),
(X, 13, "spades");
"""

insert_special_cards = """
INSERT INTO decks (game_id, value, suit)
VALUES
(X, -7, "special"),
(X, -7, "special"),
(X, -5, "special"),
(X, -5, "special"),
(X, -3, "special"),
(X, -3, "special"),
(X, 3, "special"),
(X, 3, "special"),
(X, 5, "special"),
(X, 5, "special"),
(X, 7, "special"),
(X, 7, "special");
"""

# Locks to used to ensure guest IDs and game IDs are always unique
guest_id_lock = BoundedSemaphore()
game_id_lock = BoundedSemaphore()

@app.before_request
def get_username():
    g.user = session.get("username", None)
    if g.user is None:
        session["username"] = None
    else:
        db = get_db()
        session["profile_picture"] = db.execute("SELECT picture FROM users WHERE user = ?", (g.user,)).fetchone()["picture"]

    if "sockets" not in session:
        session["sockets"] = {}        #Maps socket IDs to game IDs

    # Assign a player ID based on the username, or on number if not logged in
    if g.user is not None:
        session["player_id"] = "u" + g.user
        # Add "u" to the username to ensure this can never match a guest's player ID
    elif "player_id" not in session:
        # If not logged in and a player ID has not already been assigned

        # Use a lock to ensure two guests will not accidentally get the same player ID
        with guest_id_lock:
            db = get_db()
            id = db.execute("SELECT * FROM next_guest_id").fetchone()["id"]
            db.execute("UPDATE next_guest_id SET id = ?", (id+1,))
            db.commit()

        session["player_id"] = "_Guest" + str(id)

def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.user is None:
            return redirect( url_for("log_in", next=request.url) )
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
    return render_template("main.html", title="BlackJack Fever")

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
            db.execute('''INSERT INTO users(user, password, picture) VALUES (?, ?, ?); ''',(user_id, generate_password_hash(password),'logo.jpg'))
            db.commit()
            session.clear()
            session["username"]=user_id
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
        user = db.execute(''' SELECT * FROM users WHERE user =?; ''', (user_id,)).fetchone()
        if user is None:
            form.user_id.errors.append('No such username!')
        elif not check_password_hash(user['password'],password):
            form.password.errors.append('Incorrect password!')
        else:
            session.clear()
            session["username"]=user_id
            next_page=request.args.get('next')
            if not next_page:
                next_page = url_for('main')
            return redirect(next_page)
        
    return render_template("log_in.html",form=form,title="Sign Up for BlackJack")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('main'))

@app.route("/games")
def games():
    db=get_db()
    player_id = session["player_id"]
    games = db.execute("""
                       SELECT * FROM games
                       WHERE
                       finished = 0 AND
                       (public = 1 AND player_count < allowed_players) OR
                       game_id IN (SELECT game_id FROM players WHERE player_id = ?)
                       ORDER BY start_time DESC;
                       """, (player_id,)).fetchall()

    return render_template("game_list.html", title="BlackJack Fever", games=games, scripts=[
        "https://cdn.socket.io/4.8.1/socket.io.min.js",
        url_for("static", filename="game_list.js")
    ])

@app.route("/create", methods = ['GET', 'POST'])
def create():
    form = CreateGameForm()

    if form.validate_on_submit():
        invited_users = [user for user in form.invites.data if user]

        db = get_db()
        if invited_users:
            user_entries_query = "SELECT * FROM users WHERE user IN (" + ("?," * (len(invited_users)-1)) + "?);"
            user_entries = db.execute(user_entries_query, tuple(invited_users)).fetchall()
        else:
            user_entries = []

        if len(user_entries) < len(invited_users):
            form.invites.errors.append("Some usernames do not exist or have been entered multiple times")
        else:
            player_id = session["player_id"]
            t = datetime.strftime(datetime.now(), "%Y-%m-%d %H:%M:%S")

            with game_id_lock:
                while True:
                    game_id = randint(10000, 99999)
                    conflict_game = db.execute("SELECT * FROM games WHERE game_id = ?", (game_id,)).fetchone()
                    if conflict_game is None:
                        break

            db.execute("""
                    INSERT INTO games (game_id, public, host, start_time, current_turn, players_stood, round, finished, status, player_count, allowed_players, game_mode)
                    VALUES (?, ?, ?, ?, 0, 0, 1, 0, 0, 0, 4, ?)
                    """, (game_id, form.visibility.data, player_id, t, form.game_mode.data))
            db.execute(deck_creation_statement.replace("X", str(game_id)))
            if form.game_mode.data == "1":
                db.execute(insert_special_cards.replace("X", str(game_id)))
            for user in invited_users:
                db.execute("INSERT INTO invites (game_id, invitee, time, message) VALUES (?, ?, ?, ?)", (game_id, user, t, form.invite_message.data))
            db.commit()

            if form.visibility.data == "1":
                game = db.execute("SELECT * FROM games WHERE game_id = ?", (game_id,)).fetchone()
                socketio.emit("new_public_game", render_template("game_entry.html", game=game), to="game_list")

            return redirect(url_for("play", game_id=game_id))

    return render_template("create.html", form=form, title="BlackJack Fever")

@app.route("/code", methods = ['GET', 'POST'])
def enter_code():
    form = EnterCodeForm()

    if form.validate_on_submit():
        return redirect(url_for("play", game_id=form.code.data))

    return render_template("enter_code.html", form=form, title="BlackJack Fever")

@app.route("/inbox")
@login_required
def inbox():
    db = get_db()
    invites = db.execute("""
                            SELECT *
                            FROM invites JOIN games
                            ON games.game_id = invites.game_id
                            WHERE invitee = ?
                            AND finished = 0
                            AND player_count < allowed_players
                            ORDER BY time DESC""", (g.user,)).fetchall()
    return render_template("inbox.html", invites=invites, datetime=datetime, title="BlackJack Fever", scripts=[url_for("static", filename="inbox.js")])

@app.route("/invite_list")
@login_required
def invite_list():
    db = get_db()
    invites = db.execute("""
                            SELECT *
                            FROM invites JOIN games
                            ON games.game_id = invites.game_id
                            WHERE invitee = ?
                            AND finished = 0
                            AND player_count < allowed_players
                            ORDER BY time DESC""", (g.user,)).fetchall()
    return render_template("invite_list.html", invites=invites, datetime=datetime)

@app.route("/play/<game_id>")
def play(game_id):
    db = get_db()

    game = db.execute("SELECT * FROM games WHERE game_id = ?", (game_id,)).fetchone()

    if game is None:
        return render_template("error.html", title="Not Found", error="This game does not exist."), 404
    
    if game["finished"] == 1:
        return render_template("error.html", title="Game Finished", error="This game has finished."), 403
    
    # If the game is full and this player was not connected to this game previously, don't allow them to connect
    if game["player_count"] == game["allowed_players"]:
        player_entry = db.execute("SELECT * FROM players WHERE game_id = ? AND player_id = ?", (game_id, session["player_id"])).fetchone()
        if player_entry is None:
            return render_template("error.html", title="Game Full", error="This game is full."), 403
    
    player_id = session["player_id"]
    player_entry = db.execute("SELECT * FROM players WHERE game_id = ? AND player_id = ?", (game_id, player_id)).fetchone()

    if player_entry is not None and player_entry["score"] == 404:
        return render_template("error.html", title="Removed", error="You did not reconnect in time and have been removed from this game."), 403

    game_mode = "Modified" if game["game_mode"] == 1 else "Classic"

    messages = db.execute("SELECT * FROM chat_messages WHERE game_id = ?", (game_id,)).fetchall()

    return render_template("play.html", game_id=game_id, game_mode=game_mode, messages=messages, title="BlackJack Fever")

# The code for file uploads is adapted from the Flask documentation
# https://flask.palletsprojects.com/en/2.3.x/patterns/fileuploads/
@app.route("/account_settings",methods=['GET','POST'])
@login_required
def account_settings():
    form=accountForm()
    formTwo=pictureForm()
    formThree=uploadForm()

    img=['user.png','man.png','woman.png','logo.jpg','business.png']
    avatar=session['profile_picture']
    
    if session['profile_picture'] in img:
        img.remove(session['profile_picture'])
    

    if request.method == 'POST' and formThree.upload.data:
        if 'file' not in request.files:
                flash('No file part')
                return redirect(request.url)
        file = request.files['file']
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
                flash('No selected file')
                return redirect(request.url)
        if file and allowed_file(file.filename):
                # Use a fixed filename
                filename = secure_filename(g.user + "_pfp." + get_extension(file.filename))
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                db = get_db()
                db.execute("UPDATE users SET picture = ? WHERE user = ?", ("uploads/" + filename, g.user))
                db.commit()
                return redirect(url_for("account_settings"))


   
    if formTwo.submitTwo.data:
        if formTwo.selected_picture.data is not None:
            db = get_db()
            db.execute("UPDATE users SET picture = ? WHERE user = ?", (formTwo.selected_picture.data, g.user))
            db.commit()

            return redirect(url_for("account_settings"))

            # img=['user.png','man.png','woman.png','logo.jpg','business.png']
    
            # if session['profile_picture'] in img:
            #     img.remove(session['profile_picture'])





    if request.method=='GET' or form.cancel.data or formTwo.submitTwo.data:
        form.user_id.data=g.user
    elif form.submit.data and form.validate_on_submit() :
        db = get_db()
        user_data = db.execute('''SELECT * FROM users WHERE user = ?;''', (g.user,)).fetchone()
        if form.user_id.data != g.user:
            
            db.execute('''UPDATE users SET user=? WHERE user = ?;''',(form.user_id.data,g.user),)
            db.commit()
            session['username']=form.user_id.data
            g.user=form.user_id.data
        if form.old_password.data !='' and form.new_password.data !='':
            if check_password_hash(user_data["password"],form.old_password.data):
            
                db.execute('''UPDATE users SET password=? WHERE user = ?;''',(generate_password_hash(form.new_password.data),g.user),)
                db.commit()
                return redirect(url_for('main'))
            else:
                form.old_password.errors.append('Old password is incorrect!')
        
    return render_template("account_settings.html",images=img,avatar=avatar, title = "My Account",form=form,formTwo=formTwo,formThree=formThree,scripts=[url_for("static", filename="account_settings.js")])

# SocketIO event handlers
@socketio.on("join_request")
def handle_join(game_id):
    player_id = session["player_id"]
    db = get_db()

    game_already_started = False
    update_game_list = False

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
            # If the game is full or finished, refuse the connection
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
        if player_entry["score"] == 404:
            disconnect(request.sid)
            print("----handle_join(): Refused connection as this player has been removed from this game after disconnecting.-----")    # Message for debugging
            return
        else:
            # The player was previously connected to this game, but disconnected and is now reconnecting
            db.execute("""
                        UPDATE players
                        SET socket_id = ?, connected = 1
                        WHERE game_id = ? AND player_id = ?""",
                        (request.sid, game_id, player_id))
            if player_entry["status"] == 1:
                game_already_started = True
    else:
        # The player is connecting to this game for the first time
        game = db.execute("SELECT * FROM games WHERE game_id = ?", (game_id,)).fetchone()
        if game["player_count"] == game["allowed_players"]:
            disconnect(request.sid)
            print("----handle_join(): Refused connection as the game is full.-----")    # Message for debugging
            return
        if game["finished"] == 1:
            # If the game is finished, refuse the connection
            # This should not occur, but is included to be safe
            disconnect(request.sid)
            print("----handle_join(): Refused connection as the game is finished.-----")    # Message for debugging
            return
        
        db.execute("""
                    INSERT INTO players (game_id, player_id, socket_id, connected, stood, user, score, rounds_won)
                    VALUES (?, ?, ?, 1, 0, ?, 0, 0)""",
                    (game_id, player_id, request.sid, session["username"]))
        db.execute("UPDATE games SET player_count = `player_count` + 1 WHERE game_id = ?", (game_id,))
        # If the newly updated player count is 4, the game can start
        if game["player_count"] + 1 == 4:
            join_room(game_id)
            game_start(game_id)
        if game["public"] == 1:
            update_game_list = True
    join_message = "%s joined the game" % player_id[1:] 
    db.execute("INSERT INTO chat_messages VALUES (?, NULL, ?)", (game_id, join_message))
    db.commit()

    session["sockets"][request.sid] = game_id
    session.modified = True
    join_room(game_id)

    if game_already_started:
        game = db.execute("SELECT current_turn, round FROM games WHERE game_id = ?", (game_id,)).fetchone()
        player_rows = db.execute("SELECT player_id, stood, score, rounds_won FROM players WHERE game_id = ? ORDER BY player_id", (game_id,)).fetchall()
        hand_cards_rows = db.execute("SELECT * FROM hands WHERE game_id = ? AND player_id = ?", (game_id, player_id)).fetchall()

        players = [dict(player) for player in player_rows]
        current_turn_id = player_rows[game["current_turn"]]["player_id"]
        round_num = game["round"]
        cards_remaining = db.execute("SELECT COUNT(*) FROM decks WHERE game_id = ?", (game_id,)).fetchone()[0]
        hand_cards = [dict(card) for card in hand_cards_rows]

        game_state = {
            "players": players,
            "turn": current_turn_id,
            "round": round_num,
            "numCards": cards_remaining,
            "hands": hand_cards
        }

        socketio.emit("join_accepted", (player_id, None), to=game_id, skip_sid=request.sid)
        socketio.emit("join_accepted", (player_id, game_state), to=request.sid)
    else:
        socketio.emit("join_accepted", (player_id, None), to=game_id)

    if update_game_list:
        player_count = db.execute("SELECT player_count, allowed_players FROM games WHERE game_id = ?", (game_id,)).fetchone()
        if player_count["player_count"] == player_count["allowed_players"]:
            socketio.emit("game_removed", game_id, to="game_list")
        else:
            socketio.emit("player_count_update", (game_id, player_count["player_count"]), to="game_list")

    # Inform clients currently looking at the games list that the player count has changed
    # Handling this at the end so the other events and database updates can be handled first

def game_start(game_id):
    db = get_db()
    db.execute("UPDATE games SET status = 1 WHERE game_id = ?", (game_id,))
    player_rows = db.execute("SELECT player_id, stood, score, rounds_won FROM players WHERE game_id = ? ORDER BY player_id", (game_id,)).fetchall()
    players = [dict(player) for player in player_rows]
    turn_index = int(db.execute("SELECT current_turn FROM games WHERE game_id = ?", (game_id,)).fetchone()["current_turn"])
    current_turn_id = player_rows[turn_index]["player_id"]
    
    socketio.emit("game_start", (current_turn_id, players), to=game_id)    

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
            # If the game has not started yet
            if player_entry["status"] == 0:
                db.execute("DELETE FROM players WHERE game_id = ? AND player_id = ?", (game_id, player_id))
                num_remaining = db.execute("SELECT COUNT(*) FROM players WHERE game_id = ?", (game_id,)).fetchone()[0]
                if num_remaining == 0:
                    print("------------Deleting game")
                    db.execute("DELETE FROM games WHERE game_id = ?", (game_id,))
                else:
                    db.execute("UPDATE games SET player_count = `player_count` - 1 WHERE game_id = ?", (game_id,))
                    message = "%s left the game" % player_id[1:]
                    socketio.emit("chat_message_from_server", (None, message), to=game_id)
                    db.execute("INSERT INTO chat_messages VALUES (?, NULL, ?)", (game_id, message))
                db.commit()
                return
            # Emit message if the game is not finished
            if player_entry["finished"] == 0:
                socketio.emit("other_player_disconnect", player_id, to=game_id, include_self=False)
                message = "%s disconnected. Waiting for reconnect..." % player_id[1:]
                db.execute("INSERT INTO chat_messages VALUES (?, NULL, ?)", (game_id, message))

            db.execute("""
                        UPDATE players
                        SET connected = 0
                        WHERE game_id = ? AND player_id = ?""",
                        (game_id, player_id))
            db.commit()
            close_db()

            # This greenlet will sleep for a while and then check if the player has reconnected
            # Other greenlets will continue to run during this time

            print("-------------Beginning sleep")
            sleep(10)
            print("-------------Finished sleep")

            end_round = False

            db = get_db()
            game = db.execute("SELECT current_turn, finished, status FROM games WHERE game_id = ?", (game_id,)).fetchone()
            players = db.execute("SELECT player_id, stood, connected, score FROM players WHERE game_id = ? ORDER BY player_id", (game_id,)).fetchall()

            for p in players:
                if p["player_id"] == player_id:
                    player_entry = p
                    break
            
            # If the player has reconnected, the player has already been removed, or the game has finished, do nothing 
            if player_entry["connected"] == 1 or player_entry["score"] == 404 or game["finished"] == 1:
                return
            
            num_remaining = db.execute("SELECT COUNT(*) FROM players WHERE game_id = ? AND player_id != ? AND score != 404", (game_id, player_id)).fetchone()[0]

            # If there are no other remaining players, mark the game as finished
            if num_remaining == 0:
                db.execute("UPDATE games SET finished = 1 WHERE game_id = ?", (game_id,))
                db.commit()
                return

            db.execute("UPDATE players SET stood = 1, score = 404, rounds_won = 0 WHERE game_id = ? AND player_id = ?", (game_id, player_id))
            if player_entry["stood"] != 1:
                db.execute("UPDATE games SET players_stood = `players_stood` + 1 WHERE game_id = ?", (game_id,))

            # Check if players stood is now 4, in which case end the round
            players_stood = db.execute("SELECT players_stood FROM games WHERE game_id = ?", (game_id,)).fetchone()["players_stood"]

            if players_stood >= 4:
                end_round = True
            elif players[game["current_turn"]]["player_id"] == player_id:
                advance_turn(game_id)
            send_game_update(game_id)

            message = "%s did not reconnect in time and has been removed from the game" % (player_id[1:])
            socketio.emit("chat_message_from_server", (None, message), to=game_id)
            db.execute("INSERT INTO chat_messages VALUES (?, NULL, ?)", (game_id, message))
            db.commit()

            if end_round:
                round_finish(game_id)
        
@socketio.on("chat_message_from_client")
def handle_chat_message(content):
    game_id = session["sockets"].get(request.sid, None)
    player_id = session["player_id"]

    if game_id is not None:
        socketio.emit("chat_message_from_server", (player_id, content), to=game_id)

        # Write to database afterwards, so it does not delay the emitting of the message
        db = get_db()
        db.execute("""
                    INSERT INTO chat_messages (game_id, player_id, content)
                    VALUES (?, ?, ?)""",
                    (game_id, player_id, content))
        db.commit()

@socketio.on("game_list_connect")
def handle_game_list_connect():
    join_room("game_list")

# Other event handlers can probably follow this template:
# @socketio.on("event_name")
# def handle_event_name(data):
#     game_id = session["sockets"].get(request.sid, None)
#     player_id = session["player_id"]
# 
#     if game_id is not None:
#         (code here)

# Function to be used in hit and stand handlers
def advance_turn(game_id):
    db = get_db()
    players = db.execute("SELECT player_id, stood FROM players WHERE game_id = ? ORDER BY player_id", (game_id,)).fetchall()
    current_turn = db.execute("SELECT current_turn FROM games WHERE game_id = ?", (game_id,)).fetchone()["current_turn"]

    #This will check the next 3 players in order (wrapping around to 0 when it reaches 3), and then go back to the current player if all others are stood
    for n in range(1, 5):
        i = (current_turn + n) % 4
        if players[i]["stood"] == 0:
            new_turn = i
            break

    db.execute("UPDATE games SET current_turn = ? WHERE game_id = ?", (new_turn, game_id))
    db.commit()

@socketio.on("hit")
def handle_hit(): 
    game_id = session["sockets"].get(request.sid, None)
    player_id = session["player_id"]

    if game_id is not None:
        db = get_db()
        currentT = db.execute("""SELECT current_turn FROM games WHERE game_id == ?""", (game_id,)).fetchone()["current_turn"]
        playersTurn = db.execute(""" SELECT player_id FROM players WHERE game_id = ? ORDER BY player_id""", (game_id,)).fetchall()

        if player_id == playersTurn[currentT]["player_id"]:
            # Deal a card and update the scores
            card = db.execute(""" SELECT * FROM decks WHERE game_id == (?)
                              ORDER BY RANDOM() LIMIT 1; """, (game_id,)).fetchone()
            db.execute(""" INSERT INTO hands VALUES (?, ?, ?, ?)""", (game_id, player_id, card["value"], card["suit"]))
            db.execute(""" DELETE FROM decks WHERE game_id = ? AND card_number = ?""", (game_id, card["card_number"]))
            
            if card["suit"] == "special":
                db.execute(""" UPDATE players SET score = MAX(0, `score` + ?) WHERE game_id = ? AND player_id != ? AND score != 404""", (card["value"], game_id, player_id))
                message = "%s drew a special card of value %d" % (player_id[1:], card["value"])
                db.execute("INSERT INTO chat_messages VALUES (?, NULL, ?)", (game_id, message))
                socketio.emit("chat_message_from_server", (None, message), to=game_id)
            else:
                card_value = card["value"] if card["value"] < 10 else 10
                db.execute(""" UPDATE players SET score = `score` + ? WHERE game_id = ? AND player_id = ? """, (card_value, game_id, player_id))

            # Check if the round should end
            new_scores = db.execute("SELECT player_id, stood, score FROM players WHERE game_id = ?", (game_id,)).fetchall()

            for p in new_scores:
                if p["score"] == 21:
                    db.commit()
                    round_finish(game_id)
                    return
                
                if p["score"] > 21 and p["stood"] == 0:
                    db.execute("""UPDATE players SET stood = 1 WHERE game_id = ? AND player_id = ?""", (game_id, p["player_id"]))
                    db.execute("""UPDATE games SET players_stood = `players_stood` + 1 WHERE game_id = ?""", (game_id,))

            players_stood = db.execute(""" SELECT players_stood FROM games WHERE game_id == (?)""", (game_id,)).fetchone()["players_stood"]

            if players_stood == 4:
                db.commit()
                round_finish(game_id)
                return

            db.commit()

            # If the round is not over, advanced the turn and send an update to the clients
            advance_turn(game_id)

            send_game_update(game_id, card_taken=(player_id, card["value"], card["suit"]))
        else:
            # Debugging
            print("--------------------Not your turn! The current turn is:", playersTurn[currentT]["player_id"])
            print("--------------------currentT is:", currentT)
            print("--------------------playersTurn:", [playersTurn[i]["player_id"] for i in range(4)])

@socketio.on("stand")
def handle_stand():
    game_id = session["sockets"].get(request.sid, None)
    player_id = session["player_id"]

    if game_id is not None:
        db = get_db()
        currentT = db.execute("""SELECT current_turn FROM games WHERE game_id == (?)""", (game_id,)).fetchone()["current_turn"]
        playersTurn = db.execute(""" SELECT player_id FROM players WHERE game_id == (?) ORDER BY player_id""", (game_id,)).fetchall()

        if player_id == playersTurn[currentT]["player_id"]:
            playersStood = db.execute(""" SELECT players_stood FROM games WHERE game_id == (?)""", (game_id,)).fetchone()["players_stood"]
            if db.execute("""SELECT stood FROM players WHERE game_id == (?) AND player_id ==(?)""", (game_id, player_id)).fetchone()["stood"] == 0:
                db.execute("""UPDATE players SET stood = (?) WHERE game_id == (?) AND player_id == (?)""", (1, game_id, player_id))
                
                db.execute("""UPDATE games SET players_stood = `players_stood` + 1 WHERE game_id == (?)""", (game_id,))
                db.commit()

            if int(playersStood) + 1 == 4:
                round_finish(game_id)
                return

            advance_turn(game_id)

        send_game_update(game_id)
    else:
        # Debugging
        print("--------------------Not your turn! The current turn is:", playersTurn[currentT]["player_id"])
        print("--------------------currentT is:", currentT)
        print("--------------------playersTurn:", [playersTurn[i]["player_id"] for i in range(4)])

def send_game_update(game_id, card_taken=None):
    # card_taken is a triple of (player id, value, suit)
    db = get_db()
    player_rows = db.execute("SELECT player_id, stood, score FROM players WHERE game_id = ? ORDER BY player_id", (game_id,)).fetchall()
    players = [dict(player) for player in player_rows]
    turn_index = int(db.execute("SELECT current_turn FROM games WHERE game_id = ?", (game_id,)).fetchone()["current_turn"])
    current_turn_id = player_rows[turn_index]["player_id"]

    socketio.emit("game_update", (players, current_turn_id, card_taken), to=game_id)

def round_finish(game_id):
    print("-----------------------------Round Finish")
    
    db = get_db()

    game_info = db.execute(""" SELECT round, game_mode FROM games WHERE game_id = ? """, (game_id,)).fetchone()

    players = db.execute(""" SELECT player_id, score, rounds_won FROM players WHERE game_id = ? ORDER BY player_id""", (game_id,)).fetchall()

    # Get the player who has the smallest difference between their score and 21
    winning_player = min(players, key=lambda p: abs(21 - p["score"]))

    db.execute(""" UPDATE players SET rounds_won = `rounds_won` + 1 WHERE player_id = ? AND game_id = ? """, (winning_player["player_id"], game_id))
    db.execute(""" DELETE FROM hands WHERE game_id = ? """, (game_id,))
    db.execute(""" DELETE FROM decks WHERE game_id = ?  """, (game_id,))

    message = "%s won round %d with a score of %s" % (winning_player["player_id"][1:], game_info["round"], winning_player["score"])
    db.execute("INSERT INTO chat_messages VALUES (?, NULL, ?)", (game_id, message))

    if game_info["round"] == 5:
        db.commit()
        game_finish(game_id, winning_player["player_id"], winning_player["score"])
        return
    
    db.execute(""" UPDATE players SET stood = 0, score = 0 WHERE game_id = ? AND score != 404""", (game_id,))

    num_removed = db.execute("SELECT COUNT(*) FROM players WHERE game_id = ? AND score = 404", (game_id,)).fetchone()[0]

    db.execute(""" UPDATE games SET round = `round` + 1, current_turn = 0, players_stood = ? WHERE game_id = ? """, (num_removed, game_id))
    if players[0]["score"] == 404:
        advance_turn(game_id)
    
    db.execute(deck_creation_statement.replace("X", str(game_id)))
    if game_info["game_mode"] == 1:
        db.execute(insert_special_cards.replace("X", str(game_id)))

    db.commit()

    turn_index = int(db.execute("SELECT current_turn FROM games WHERE game_id = ?", (game_id,)).fetchone()["current_turn"])
    current_turn_id = players[turn_index]["player_id"]

    #Args: (number of the round just finished, winning player ID, winning score, current turn ID)
    socketio.emit("round_finish", (game_info["round"], winning_player["player_id"], winning_player["score"], current_turn_id), to=game_id)

def game_finish(game_id, final_round_winner, final_round_winning_score):
    print("------------------Game finish")
    db = get_db()

    players = db.execute(""" SELECT player_id, score, rounds_won FROM players WHERE game_id = ? ORDER BY player_id""", (game_id,)).fetchall()
    
    game_winner = max(players, key=lambda p: -1 if p["score"] == 404 else p["rounds_won"])

    db.execute("UPDATE games SET finished = 1 WHERE game_id = ?", (game_id,))
    db.commit()

    # Args: (game winner, final round winner, final round winning score, player list)
    player_list = [dict(player) for player in players]
    socketio.emit("game_finish", (game_winner["player_id"], final_round_winner, final_round_winning_score, player_list), to=game_id)


    
    
def allowed_file(filename):
    return '.' in filename and get_extension(filename) in ALLOWED_EXTENSIONS

def get_extension(filename):
    return filename.rsplit('.', 1)[1].lower()

# Run the server locally
if __name__ == "__main__":
    # On a restart of the development server, mark all players as disconnected
    # This prevents issues where the server thinks players are still connected and does not allow them to reconnect
    db = db_connection()
    db.execute("UPDATE players SET connected = 0")
    db.commit()
    db.close()

    socketio.run(app, host="127.0.0.1", port=5000, debug=True)