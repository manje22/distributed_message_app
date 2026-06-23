const express = require("express");
const { exec } = require("child_process");

const router = express.Router();

router.get("/status", (req, res) => {
  exec("docker exec cassandra1 nodetool status", (error, stdout) => {
    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    const nodes = [];

    const lines = stdout.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (
        trimmed.startsWith("UN") ||
        trimmed.startsWith("DN") ||
        trimmed.startsWith("UJ")
      ) {
        const parts = trimmed.split(/\s+/);

        nodes.push({
          status: parts[0],
          address: parts[1],
        });
      }
    }

    res.json({ nodes });
  });
});

module.exports = router;
