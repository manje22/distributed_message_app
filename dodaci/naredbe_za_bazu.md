U ovoj datoteci se nalaze naredbe koje su se koristile prilikom izrade apache cassandra baze
tribali bi ih u danom redoslijedu izvršiti

U powershellu:

docker exec -it cassandra1 cqlsh

CREATE KEYSPACE IF NOT EXISTS chat_app
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 3
};

USE chat_app;

CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY,
  username text,
  created_at timestamp
);

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id uuid PRIMARY KEY,
  participant_ids set<uuid>,
  created_at timestamp
);

CREATE TABLE IF NOT EXISTS messages_by_conversation (
  conversation_id uuid,
  message_time timestamp,
  message_id uuid,
  sender_id uuid,
  message_text text,
  PRIMARY KEY (conversation_id, message_time, message_id)
) WITH CLUSTERING ORDER BY (message_time ASC);