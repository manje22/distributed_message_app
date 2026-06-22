const http = require("http");
const { Server } = require("socket.io");

const express = require("express");

const app = express();
const server = http.createServer(app);

const cors = require("cors");
const { client, connectToDatabase, cassandra, getConsistencyLevel } = require("./db");

const bcrypt = require("bcrypt");

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);

    console.log(
      `${socket.id} joined conversation ${conversationId}`
    );
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Distributed Chat Backend is running" });
});

app.post("/users", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "username and password are required",
      });
    }

    const existingUser = await client.execute(
      "SELECT username FROM users_by_username WHERE username = ?",
      [username],
      { prepare: true, consistency: getConsistencyLevel() },
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Username already exists",
      });
    }

    const userId = cassandra.types.Uuid.random();
    const createdAt = new Date();
    const passwordHash = await bcrypt.hash(password, 10);

    await client.execute(
      "INSERT INTO users (user_id, username, created_at) VALUES (?, ?, ?)",
      [userId, username, createdAt],
      { prepare: true, consistency: getConsistencyLevel() },
    );

    await client.execute(
      "INSERT INTO users_by_username (username, user_id, password_hash, created_at) VALUES (?, ?, ?, ?)",
      [username, userId, passwordHash, createdAt],
      { prepare: true, consistency: getConsistencyLevel() },
    );

    res.status(201).json({
      user_id: userId.toString(),
      username,
      created_at: createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/conversations", async (req, res) => {
  try {
    const { participant_ids } = req.body;

    if (!participant_ids || !Array.isArray(participant_ids)) {
      return res.status(400).json({ error: "participant_ids array is required" });
    }

    const conversationId = cassandra.types.Uuid.random();
    const createdAt = new Date();

    const participants = participant_ids.map((id) =>
      cassandra.types.Uuid.fromString(id)
    );

    await client.execute(
      "INSERT INTO conversations (conversation_id, participant_ids, created_at) VALUES (?, ?, ?)",
      [conversationId, participants, createdAt],
      { prepare: true, consistency: getConsistencyLevel() }
    );

    res.status(201).json({
      conversation_id: conversationId.toString(),
      participant_ids,
      created_at: createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/messages", async (req, res) => {
  try {
    const { conversation_id, sender_id, message_text } = req.body;

    if (!conversation_id || !sender_id || !message_text) {
      return res.status(400).json({
        error: "conversation_id, sender_id, and message_text are required",
      });
    }

    const conversationId = cassandra.types.Uuid.fromString(conversation_id);
    const senderId = cassandra.types.Uuid.fromString(sender_id);
    const messageId = cassandra.types.Uuid.random();
    const messageTime = new Date();

    await client.execute(
      `INSERT INTO messages_by_conversation 
      (conversation_id, message_time, message_id, sender_id, message_text)
      VALUES (?, ?, ?, ?, ?)`,
      [conversationId, messageTime, messageId, senderId, message_text],
      {
        prepare: true,
        consistency: getConsistencyLevel()
      }
    );

    const messageResponse = {
        conversation_id,
        message_id: messageId.toString(),
        sender_id,
        message_text,
        message_time: messageTime,
    };

    console.log("Emitting newMessage to room:", conversation_id);
    console.log(messageResponse);

    io.to(conversation_id).emit("newMessage", messageResponse);

    res.status(201).json(messageResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/conversations/:id/messages", async (req, res) => {
  try {
    const conversationId = cassandra.types.Uuid.fromString(req.params.id);

    const result = await client.execute(
      `SELECT conversation_id, message_time, message_id, sender_id, message_text
       FROM messages_by_conversation
       WHERE conversation_id = ?`,
      [conversationId],
      { prepare: true, consistency: getConsistencyLevel() }
    );

    res.json(
      result.rows.map((row) => ({
        conversation_id: row.conversation_id.toString(),
        message_time: row.message_time,
        message_id: row.message_id.toString(),
        sender_id: row.sender_id.toString(),
        message_text: row.message_text,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await client.execute("SELECT * FROM users");

    res.json(
      result.rows.map((row) => ({
        user_id: row.user_id.toString(),
        username: row.username,
        created_at: row.created_at,
      })),
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/conversations", async (req, res) => {
  try {
    const result = await client.execute("SELECT * FROM conversations");

    res.json(
      result.rows.map((row) => ({
        conversation_id: row.conversation_id.toString(),
        participant_ids: Array.from(row.participant_ids).map((id) =>
          id.toString(),
        ),
        created_at: row.created_at,
      })),
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "username and password are required",
      });
    }

    const result = await client.execute(
      "SELECT username, user_id, password_hash, created_at FROM users_by_username WHERE username = ?",
      [username],
      { prepare: true, consistency: getConsistencyLevel() },
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    res.json({
      user_id: user.user_id.toString(),
      username: user.username,
      created_at: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

connectToDatabase()
  .then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to Cassandra:", error);
    process.exit(1);
  });