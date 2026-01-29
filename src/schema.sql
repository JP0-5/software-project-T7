CREATE TABLE users (user_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user TEXT NOT NULL, password TEXT NOT NULL);

-- Game state
CREATE TABLE games (
    game_id INTEGER PRIMARY KEY AUTOINCREMENT,
    host TEXT NOT NULL,                                 -- Player ID of the host
    start_time INTEGER NOT NULL,                        -- When the game was started - in a Unix timestamp for easy comparison
    next_turn TEXT NOT NULL                             -- Player ID of the player whose turn it is next
);

-- Keeps track of what cards are in the deck in each game
CREATE TABLE decks (
    game_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    suit TEXT NOT NULL,
    CHECK(
        value >= 1 AND
        value <= 13 AND
        suit IN ("clubs", "diamonds", "hearts", "spades")
    )
);
-- One possible way to represent cards - feel free to try a different representation 
-- suit: A string in ("clubs", "diamonds", "hearts", "spades")
-- value: An integer in the range 1-13      (1 for Ace, 2-10, 11 for Jack, 12 for Queen, 13 for King)
-- Jokers could also be included if we want
-- These could be represented as tuples or lists in Python e.g. (13, "clubs"), or as arrays in JavaScript e.g. [13, "clubs"]

-- For example, if the deck in game 1 had a 2 of Hearts and an Ace of Spades, and the deck in game 2 had a 3 of Clubs and a King of Hearts,
-- there would be the following rows:
-- 1, 2, "hearts"
-- 1, 1, "spades"
-- 2, 3, "clubs"
-- 2, 13, "hearts"

-- Each user will have one row in this table for each game they play in
CREATE TABLE players (
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    socket_id INTEGER NOT NULL UNIQUE,
    connected INTEGER NOT NULL,                         -- Boolean value (0 or 1)
    disconnect_time INTEGER,
    user TEXT,
    score INTEGER NOT NULL,
    PRIMARY KEY (game_id, player_id)
);

-- Allow for efficient lookup of player info based on socket ID when a message comes in on a socket
CREATE UNIQUE INDEX socket_player
ON players(socket_id);

-- The cards currently in the hand of each player in each game
CREATE TABLE hands (
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    suit TEXT NOT NULL,
    CHECK(
        value >= 1 AND
        value <= 13 AND
        suit IN ("clubs", "diamonds", "hearts", "spades")
    )
);

CREATE TABLE chat_messages (
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    content TEXT NOT NULL
);

CREATE INDEX game_chat_messages
ON chat_messages(game_id);
