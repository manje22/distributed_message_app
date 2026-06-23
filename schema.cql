CREATE KEYSPACE IF NOT EXISTS chat_app
WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 3
};

USE chat_app;

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    username TEST,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users_by_username (
    username TEXT PRIMARY KEY,
    user_id UUID,
    password_hash TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    conversation_id UUID PRIMARY KEY,
    participant_ids LIST<UUID>,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages_by_conversation (
    conversation_id UUID,
    message_time TIMESTAMP,
    message_id UUID,
    sender_id UUID,
    message_text TEXT,
    PRIMARY KEY (
        conversation_id,
        message_time,
        message_id
    )
) WITH CLUSTERING ORDER BY (
    message_time DESC,
    message_id DESC
);

CREATE TABLE IF NOT EXISTS messages_by_user (
    sender_id UUID,
    message_time TIMESTAMP,
    message_id UUID,
    conversation_id UUID,
    message_text TEXT,
    PRIMARY KEY (
        sender_id,
        message_time,
        message_id
    )
) WITH CLUSTERING ORDER BY (
    message_time DESC,
    message_id DESC
);