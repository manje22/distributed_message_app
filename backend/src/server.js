const http = require("http");
const express = require("express");
const cors = require("cors");

const { connectToDatabase } = require("./db");
const setupSocket = require("./socket");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const clusterRoutes = require("./routes/clusterRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Distributed Chat Backend is running" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/conversations", conversationRoutes);
app.use("/messages", messageRoutes(io));
app.use("/cluster", clusterRoutes);
app.use("/settings", settingsRoutes);

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
