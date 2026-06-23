const express = require("express");

const { client, cassandra, getConsistencyLevel } = require("../db");

const bcrypt = require("bcrypt");

const router = express.Router();

router.post("/", async (req, res) => {
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
      {
        prepare: true,
        consistency: getConsistencyLevel(),
      },
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
      {
        prepare: true,
        consistency: getConsistencyLevel(),
      },
    );

    await client.execute(
      "INSERT INTO users_by_username (username, user_id, password_hash, created_at) VALUES (?, ?, ?, ?)",
      [username, userId, passwordHash, createdAt],
      {
        prepare: true,
        consistency: getConsistencyLevel(),
      },
    );

    res.status(201).json({
      user_id: userId.toString(),
      username,
      created_at: createdAt,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});


router.get("/", async (req, res) => {
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
    res.status(500).json({
      error: error.message,
    });
  }
});


router.get("/:id/messages", async (req, res) => {
  try {
    const senderId = cassandra.types.Uuid.fromString(req.params.id);

    const result = await client.execute(
      `SELECT sender_id,
              message_time,
              message_id,
              conversation_id,
              message_text
       FROM messages_by_user
       WHERE sender_id = ?`,
      [senderId],
      {
        prepare: true,
        consistency: getConsistencyLevel(),
      },
    );

    res.json(
      result.rows.map((row) => ({
        sender_id: row.sender_id.toString(),
        message_time: row.message_time,
        message_id: row.message_id.toString(),
        conversation_id: row.conversation_id.toString(),
        message_text: row.message_text,
      })),
    );
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
