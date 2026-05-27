const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  }));
app.use(express.json());

// ---- HTTP SERVER ----
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  }
});

// make io available inside routes
app.set("io", io);

// ROUTES
app.use("/rooms", require("./src/routes/roomRoutes"));

// SOCKETS
const setupSockets = require("./socket");
setupSockets(io);

// DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✔ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// START SERVER
server.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
