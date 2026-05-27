const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: null },
  isHost: { type: Boolean, default: false },
  isAlive: { type: Boolean, default: true },
  socketId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Player", PlayerSchema);
