CREATE TABLE users (
   user_id serial PRIMARY KEY,
   username VARCHAR ( 50 ) UNIQUE NOT NULL,
   password VARCHAR ( 100 ) NOT NULL,
   email VARCHAR ( 255 ) UNIQUE NOT NULL,
   created_on TIMESTAMP NOT NULL,
   last_login TIMESTAMP,
   external_id VARCHAR ( 50 ) UNIQUE NOT NULL
);

CREATE TABLE rooms (
   room_id serial PRIMARY KEY,
   name VARCHAR ( 50 ) UNIQUE NOT NULL,
   created_on TIMESTAMP NOT NULL,
   created_by INTEGER NOT NULL
);


CREATE TABLE messages (
  message_id serial PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(user_id),
  receiver_id INTEGER NOT NULL,
  content TEXT,
  media_url TEXT,       -- pour image/video
  media_type VARCHAR(10), -- 'image', 'video' ou NULL
  created_on TIMESTAMP NOT NULL DEFAULT now()
);


-- Lien room / utilisateurs
CREATE TABLE room_users (
    room_id INTEGER NOT NULL REFERENCES rooms(room_id),
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    PRIMARY KEY (room_id, user_id)
);

insert into users (username, password, email, created_on, external_id) values ('test', 'gcrjEewWyAuYskG3dd6gFTqsC6/SKRsbTZ+g1XHDO10=', 'test@univ-brest.fr', now(), 'ac7a25a9-bcc5-4fba-8a3d-d42acda26949');

insert into rooms (name, created_on, created_by) values ('General', now(), 4);
insert into rooms (name, created_on, created_by) values ('News', now(), 4);
insert into rooms (name, created_on, created_by) values ('Random', now(), 4);


