const express = require("express");

const {
  getConsistencyName,
  setConsistencyLevel,
} = require("../db");

const router = express.Router();

router.get("/consistency", (req, res) => {
  res.json({
    consistency: getConsistencyName(),
  });
});

router.post("/consistency", (req, res) => {
  const { consistency } = req.body;

  if (!["one", "quorum"].includes(consistency)) {
    return res.status(400).json({
      error: "Consistency must be 'one' or 'quorum'",
    });
  }

  setConsistencyLevel(consistency);

  console.log("Consistency changed to:", getConsistencyName());

  res.json({
    consistency: getConsistencyName(),
  });
});

module.exports = router;