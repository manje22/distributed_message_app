const cassandra = require("cassandra-driver");
require("dotenv").config();

const client = new cassandra.Client({
  contactPoints: process.env.CASSANDRA_CONTACT_POINTS.split(","),
  localDataCenter: process.env.CASSANDRA_LOCAL_DATA_CENTER,
  keyspace: process.env.CASSANDRA_KEYSPACE,
});

let currentConsistency = process.env.CASSANDRA_CONSISTENCY || "one";

async function connectToDatabase() {
  await client.connect();
  console.log("Connected to Cassandra");
}

function getConsistencyLevel() {
  console.log("Using consistency level:", currentConsistency);
  console.log(
    "Driver value:",
    cassandra.types.consistencies[currentConsistency],
  );

  return cassandra.types.consistencies[currentConsistency];
}

function getConsistencyName() {
  return currentConsistency;
}

function setConsistencyLevel(level) {
  currentConsistency = level;
}

module.exports = {
  client,
  connectToDatabase,
  cassandra,
  getConsistencyLevel,
  getConsistencyName,
  setConsistencyLevel,
};
