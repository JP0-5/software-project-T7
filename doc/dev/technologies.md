# Technologies Used
[PythonAnywhere](
https://www.pythonanywhere.com) is a web hosting platform that allows you to Python web apps in the cloud using frameworks such as Flask or Django. The free tier should be enough for our needs.

[Flask](https://flask.palletsprojects.com/en/stable/) is a lightweight web application framework for Python.

[WebSockets](
https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) is a communications protocol that allows for a real-time, bidirectional communication  between a server and a web application, removing the need for repeated polling over HTTP in many cases.

[Socket.IO](https://socket.io/) is a library built on WebSockets that makes them easier to work with and lets us do things like broadcasting to multiple clients at once and grouping clients into rooms. We will use the Socket.IO client on the client side.

[Flask-SocketIO](
https://flask-socketio.readthedocs.io/en/latest/) is a Python package that allows you to run a Python Socket.IO server and integrate it with a Flask application.

Flask-SocketIO runs asynchronous code since it uses WebSockets. Flask-SocketIO supports 3 async modes:

- Normal threads using the Flask development server. This is less performant, is intended only for development use, and doesn't seem to be supported by PythonAnywhere.
- Eventlet, a library which is deprecated and discourages use in new projects.
- gevent, another async library. This seems to be the best option.

[More info](https://flask-socketio.readthedocs.io/en/latest/intro.html#requirements)

## Data Stores
We originally considered using in memory-structures such as dictionaries, stored in global variables, to store the game state, as this data is non-permanent and will be updated relatively frequently. However, it would require the use of locks, such as Semaphores, to make this thread-safe, which would be difficult to work with and would be fairly error-prone, as we would need to be careful of what actions would be performed while a lock is held.

An in-memory database such as Redis might be suitable for this, however, this is not supported on PythonAnywhere

For now, we will use the SQLite database to store the game state. This is not ideal, as changes have to be written to disk, but it should be fine for our needs, and some steps have been taken to improve performance, such as using the [WAL journal method](https://www.sqlite.org/wal.html).