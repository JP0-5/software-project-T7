This a temporary file to help us get started. The contents may be removed or moved to another file later on.

# Setup
Install the required packages. You may have some of these installed already.\
`python -m pip install -U flask flask-wtf flask-session flask-socketio gevent`

Run this to verify everything is working:\
`python -c "import flask, flask_wtf, flask_session, flask_socketio, gevent"`

Note:
- If not on Windows, start the commands with `python3` instead of `python`.
- You could also install these in a virtual environment, like we used for ML.

# Technologies Used
WebSockets is a communications protocol that allows for a real-time, bidirectional communication  between a server and a web application, removing the need for repeated polling over HTTP in many cases.\
https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

Socket.IO is a library built on WebSockets that makes them easier to work with and lets us do things like broadcasting to multiple clients at once and grouping clients into rooms. We will use the Socket.IO client on the client side.\
https://socket.io/

Flask-SocketIO is a Python package that allows you to run a Python Socket.IO server and integrate it with a Flask application.\
https://flask-socketio.readthedocs.io/en/latest/

Flask-SocketIO runs asynchronous code since it uses WebSockets. Flask-SocketIO supports 3 async modes:

- Normal threads using the Flask development server. This is less performant, is intended only for development use, and doesn't seem to be supported by PythonAnywhere.
- Eventlet, a library which is deprecated and discourages use in new projects.
- gevent, another async library. This seems to be the best option.

More info: https://flask-socketio.readthedocs.io/en/latest/intro.html#requirements