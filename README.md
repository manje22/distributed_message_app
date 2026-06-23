# distributed_message_app

Za pokrenuti projekt
1. docker compose up -d
2. docker cp schema.cql cassandra1:/schema.cql
3. dockerexec -it cassandra1 cqlsh -f /schema.cql
4. cd backend
5. npm install
6. npm run dev
#U novom terminalu
7. cd frontend
8. npm install
9. npm run dev