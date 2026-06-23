# distributed_message_app

Za pokrenuti projekt potrebno je izvrsiti iduce naredbe u danom redoslijedu
1. docker compose up -d
2. docker cp schema.cql cassandra1:/schema.cql
4. Za import podataka u powershell:
    docker cp ./data/users.csv cassandra1:/tmp/users.csv
    docker cp ./data/users_by_username.csv cassandra1:/tmp/users_by_username.csv
    docker cp ./data/conversations.csv cassandra1:/tmp/conversations.csv
    docker cp ./data/messages_by_conversation.csv cassandra1:/tmp/messages_by_conversation.csv
    docker cp ./data/messages_by_user.csv cassandra1:/tmp/messages_by_user.csv

5. docker exec -it cassandra1 cqlsh
6. USE chat_app;
7. COPY users FROM '/tmp/users.csv' WITH HEADER = true;
    COPY users_by_username FROM '/tmp/users_by_username csv' WITH HEADER = true;
    COPY conversations FROM '/tmp/conversations.csv' WITH HEADER = true;
    COPY messages_by_conversation FROM '/tmp/messages_by_conversation.csv' WITH HEADER = true;
    COPY messages_by_user FROM '/tmp/messages_by_user.csv' WITH HEADER = true;

#U novom terminalu
1. cd backend
2. npm install
3. npm run dev
#U novom terminalu
1. cd frontend
2. npm install
3. npm run dev