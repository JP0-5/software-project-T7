A quick outline of the basic structure for the app I have set up for now.

## Database Schema
I have created the bones of a DB schema for storing the game state in `schema.sql`. You may need to run this file to setup your local version of `app.db`.

This schema can be changed, and may need to be expanded since I may not have captured everything here that is needed to store the game state.

Since we can't store list-like structures in SQL, I had to create separate tables for `decks` and `hands`.

## Play page
To test the socket functionality, I had to create a bare-bones version of the play page in `play.html`; feel free to change the contents and layout of it.

I also started the corresponding JavaScript file `play.js`. Again, feel free to change and add to it.

For the moment, this page just implements the chat and informs the user whether they are connected or not. It can be seen here: https://blackjack.eu.pythonanywhere.com/play/0

## WebSockets
The play page uses the WebSocket functionality I have set up in the SocketIO event handlers in `app.py` and `play.js`. I have tried to allow for a player to disconnect and then reconnect fairly easily, though this still needs to be worked on.

## Game Logic
These are just some ideas for how to go about implementing the game logic - they don't have to be followed.

- There will need to be pages to allow a user to choose between joining an existing game (listing the existing active games in the database) and starting/hosting a game (adding it to the database). These pages can be added first, or later on.

- When a host has created a game, it should be in a state of "waiting to start" until enough players have joined (this can be when a fixed number of players have joined, or when the host decides there is enough), at which point the game can start. (this should all be done within the `play` page using AJAX, since redirecting the players to a different page will disconnect the WebSocket connections).

- The game state can be changed by emitting events, either from a client to the server or from the server to a client.

- Example of a client-to server event\
Client code to emit event:
    ```
    socket.emit("event_abc", data);
    ```

    Server code to handle event:
    ```
    @socketio.on("event_abc")
    def handle_event_abc(data):
        game_id = session["sockets"].get(request.sid, None)
        player_id = session["player_id"]

        if game_id is not None:
            # do something - maybe emit another event and/or do something to the database
    ```

    The player ID is used to uniquely identify each player. When a game is running, it should be used rather than the username because it works for both logged in users and guests.

- Example of a server-to-client event\
Server code to emit event:
    ```
    socketio.emit("event_xyz", data, to=game_id)
    ```

    `game_id` can be replaced with the socket ID of a particular player to emit the event to just that player.

    Client code to handle the event:
    ```
    socket.on("event_xyz", (data) => {
        // do something
    })
    ```

- Make whatever changes are necessary to the database schema, `play.html` and `play.js` to allow for this.

- In my socket code, I have tried to allow for reconnecting after a disconnect, but the game logic will have to accomodate this. It may be best to work on the core game logic first and then worry about this later.