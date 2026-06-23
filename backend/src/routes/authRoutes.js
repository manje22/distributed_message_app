const express = require("express");
const bcrypt = require("bcrypt");

const { client, getConsistencyLevel} = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "username and password are required",
      });
    }

    const result = await client.execute(
      `SELECT username, user_id, password_hash, created_at
       FROM users_by_username
       WHERE username = ?`,
      [username],
      {
        prepare: true,
        consistency: getConsistencyLevel(),
      }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

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
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;