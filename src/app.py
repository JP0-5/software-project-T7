# NOTE: Do not use `flask run` to start the server.
# Instead, run this file and code at the end of the file will start the server.

# Required to set up gevent
from gevent import monkey
monkey.patch_all()

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

@app.errorhandler(404)
def page_not_found(error):
    # TODO
    return "error"


# Routes
@app.route("/")
def index():
    return "Under construction"

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