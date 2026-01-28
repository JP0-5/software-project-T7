CREATE TABLE users (user_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user TEXT NOT NULL, password TEXT NOT NULL);

INSERT INTO users (user,password) VALUES ('user','password');
SELECT * 
FROM users;