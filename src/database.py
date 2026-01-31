from flask import g 
import os
import sqlite3

DATABASE = os.path.join(os.path.abspath(os.path.dirname(__file__)), "app.db")

def get_db():
    if "db" not in g:
        g.db = db_connection()
    return g.db

def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def db_connection():
    db = sqlite3.connect(DATABASE,
        detect_types=sqlite3.PARSE_DECLTYPES
    )
    db.row_factory = sqlite3.Row

    # Options to improve performance
    db.execute("PRAGMA journal_mode=WAL;")        # https://www.sqlite.org/wal.html
    db.execute("PRAGMA synchronous=NORMAL;")      # https://www.sqlite.org/pragma.html#pragma_synchronous
    db.execute("PRAGMA busy_timeout = 3000;")     # https://www.sqlite.org/c3ref/busy_timeout.html

    return db