const cassandra = require("cassandra-driver");
require("dotenv").config();

const client = new cassandra.Client({
  contactPoints: process.env.CASSANDRA_CONTACT_POINTS.split(","),
  localDataCenter: process.env.CASSANDRA_LOCAL_DATA_CENTER,
  keyspace: process.env.CASSANDRA_KEYSPACE,
});

async function connectToDatabase() {
  await client.connect();
  console.log("Connected to Cassandra");
}

function getConsistencyLevel() {
  const level = process.env.CASSANDRA_CONSISTENCY || "one";

  console.log("Using consistency level:", level);
  console.log("Driver value:", cassandra.types.consistencies[level]);

  return cassandra.types.consistencies[level];
}

module.exports = {
  client,
  connectToDatabase,
  cassandra,
  getConsistencyLevel,
};