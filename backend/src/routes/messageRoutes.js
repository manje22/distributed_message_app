const express = require("express");

const { client, cassandra, getConsistencyLevel } = require("../db");

function messageRoutes(io) {
  const router = express.Router();

  router.post("/", async (req, res) => {
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
          consistency: getConsistencyLevel(),
        },
      );

      await client.execute(
        `INSERT INTO messages_by_user
         (sender_id, message_time, message_id, conversation_id, message_text)
         VALUES (?, ?, ?, ?, ?)`,
        [senderId, messageTime, messageId, conversationId, message_text],
        {
          prepare: true,
          consistency: getConsistencyLevel(),
        },
      );

      const messageResponse = {
        conversation_id,
        message_id: messageId.toString(),
        sender_id,
        message_text,
        message_time: messageTime,
      };

      io.to(conversation_id).emit("newMessage", messageResponse);

      res.status(201).json(messageResponse);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  return router;
}

module.exports = messageRoutes;
