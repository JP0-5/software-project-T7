# NOTE: Do not use `flask run` to start the server.
# Instead, run this file and code at the end of the file will start the server.

# Required to set up gevent
from gevent import monkey
monkey.patch_all()

from forms import RegistrationForm, LoginForm
from werkzeug.security import generate_password_hash, check_password_hash

from flask import Flask, render_template, request, session, g, redirect, url_for
from flask_socketio import SocketIO, send, emit, join_room, leave_room, disconnect
from flask_session import Session
from functools import wraps
from database import get_db, close_db

app = Flask(__name__)
app.config['SECRET_KEY'] = "this-is-my-secret-key"
app.config["SESSION_TYPE"] = "filesystem"
app.teardown_appcontext(close_db)
Session(app)

socketio = SocketIO(app, async_mode="gevent", cors_allowed_origins="*", logger=True, engineio_logger=True)

@app.before_request
def get_username():
    if "username" in session:
        g.user = session["username"]
    else:
        g.user = None
        session["username"] = None
        # Need to store something in session, even if the user is not logged in, to ensure a session ID is created

# Some standard things from Web Dev
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
            return redirect(url_for('base'))
        return view(*args,**kwargs)
    return wrapped_view2

@app.errorhandler(404)
def page_not_found(error):
    # TODO
    return "error"


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
    return "Under construction"


# SocketIO event handlers
@socketio.on("disconnect")
def handle_disconnect(*args):
    # TODO
    pass


# Run the server locally
if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)