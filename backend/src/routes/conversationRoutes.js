const express = require("express");

const { client, cassandra, getConsistencyLevel } = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { participant_ids } = req.body;

    if (!participant_ids || !Array.isArray(participant_ids)) {
      return res.status(400).json({
        error: "participant_ids array is required",
      });
    }

    const conversationId = cassandra.types.Uuid.random();
    const createdAt = new Date();

    const participants = participant_ids.map((id) =>
      cassandra.types.Uuid.fromString(id),
    );

    await client.execute(
      `INSERT INTO conversations
       (conversation_id, participant_ids, created_at)
       VALUES (?, ?, ?)`,
      [conversationId, participants, createdAt],
      {
        prepare: true,
        consistency: getConsistencyLevel(),
      },
    );

    res.status(201).json({
      conversation_id: conversationId.toString(),
      participant_ids,
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
    res.status(500).json({
      error: error.message,
    });
  }
});

router.get("/:id/messages", async (req, res) => {
  try {
    const conversationId = cassandra.types.Uuid.fromString(req.params.id);

    const result = await client.execute(
      `SELECT conversation_id,
              message_time,
              message_id,
              sender_id,
              message_text
       FROM messages_by_conversation
       WHERE conversation_id = ?`,
      [conversationId],
      {
        prepare: true,
        consistency: getConsistencyLevel(),
      },
    );

    res.json(
      result.rows.map((row) => ({
        conversation_id: row.conversation_id.toString(),
        message_time: row.message_time,
        message_id: row.message_id.toString(),
        sender_id: row.sender_id.toString(),
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
