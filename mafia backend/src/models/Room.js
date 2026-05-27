const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    socketId: { type: String, default: "" }
});

const RoomSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  rounds: { type: Number, default: 0 },
  status: { type: String, default: "waiting" } // waiting|in-progress|ended
}, { timestamps: true });

module.exports = mongoose.model("Room", RoomSchema);

