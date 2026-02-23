DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS decks;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS next_guest_id;
DROP TABLE IF EXISTS hands;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS invites;

CREATE TABLE users (
    user TEXT PRIMARY KEY NOT NULL,
    password TEXT NOT NULL
);

-- Game state

CREATE TABLE games (
    game_id INTEGER PRIMARY KEY,
    public INTEGER NOT NULL,                            -- 0 for private, 1 for public
    host TEXT NOT NULL,                                 -- Player ID of the host
    start_time TEXT NOT NULL,                           -- When the game was started (this one may or may not be needed)
    current_turn TEXT NOT NULL,                         -- Index (typically 0 to 3) of the player whose turn it is
    players_stood INTEGER NOT NULL,                     -- Keeping count of the number of players who are stood / above 21
    round INTEGER NOT NULL,                             -- The round number of the game
    finished INTEGER NOT NULL,                          -- Whether the game is finished or not - Boolean value (0 or 1)
    status INTEGER NOT NULL,                            -- Whether the game has started or not - 0 for not started, 1 for started
    player_count INTEGER NOT NULL,                      -- Number of players currently in game
    allowed_players INTEGER NOT NULL,                   -- Number of players allowed in the game (for now will be fixed at 4)
    game_mode INTEGER NOT NULL                          -- Mode of the game - 0 is Classic, 1 is Modified                       
);

-- Keeps track of what cards are in the deck in each game
CREATE TABLE decks (
    game_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    suit TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(game_id),
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
-- 2, 13, "hearts

-- Each user will have one row in this table for each game they play in
CREATE TABLE players (
    game_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    socket_id TEXT NOT NULL,                            -- Socket ID of the socket on which the player is connected to this game
    connected INTEGER NOT NULL,                         -- Whether the player is currently connected or not - Boolean value (0 or 1)
    stood INTEGER NOT NULL,                             -- Keeping track of if the player has stood
    user TEXT,                                          -- Username if logged in - otherwise NULL
    score INTEGER NOT NULL,                             -- Players score - starts at 0
    rounds_won INTEGER NOT NULL,
    PRIMARY KEY (game_id, player_id),
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (user) REFERENCES users(user)
);

-- Stores the next number that can be used to assign a guest ID
CREATE TABLE next_guest_id (
    id INTEGER NOT NULL
);

INSERT INTO next_guest_id (id)
VALUES (0);

-- The cards currently in the hand of each player in each game
CREATE TABLE hands (
    game_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    value INTEGER NOT NULL,
    suit TEXT NOT NULL,
    CHECK(
        value >= 1 AND
        value <= 13 AND
        suit IN ("clubs", "diamonds", "hearts", "spades")
    ),
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE chat_messages (
    game_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE INDEX game_chat_messages
ON chat_messages(game_id);

CREATE TABLE invites (
    game_id INTEGER NOT NULL,
    invitee TEXT NOT NULL,                           -- The username of the player who is being invited to this game
    time TEXT NOT NULL,
    message TEXT,
    PRIMARY KEY (game_id, invitee),
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (invitee) REFERENCES users(user)
);

CREATE INDEX user_invites
ON invites(invitee);