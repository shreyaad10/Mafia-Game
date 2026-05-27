// controllers/roomController.js
const Room = require("../models/Room");
const Player = require("../models/Player");

function makeCode(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < length; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

/* ---------------------- CREATE ROOM ---------------------- */
exports.createRoom = async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName) return res.json({ success: false, message: "name required" });

    // Create creator player
    const player = await Player.create({ name: playerName });
    const playerId = player._id.toString();

    // Generate room code
    let code, exists;
    do {
      code = makeCode(5);
      exists = await Room.findOne({ code });
    } while (exists);

    // MARK CREATOR AS HOST
    const room = await Room.create({
      code,
      players: [playerId],
      hostId: playerId,  // ⭐ HOST IS CREATOR
      currentRound: 0
    });

    return res.json({
      success: true,
      roomCode: code,
      playerId,
      isHost: true
    });

  } catch (err) {
    console.log("createRoom error:", err);
    return res.status(500).json({ success: false });
  }
};

/* ---------------------- JOIN ROOM ---------------------- */
exports.joinRoom = async (req, res) => {
  try {
    const { roomCode, playerName } = req.body;

    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.json({ success: false, message: "room not found" });

    const player = await Player.create({ name: playerName });
    const playerId = player._id.toString();

    room.players.push(playerId);
    await room.save();

    return res.json({
      success: true,
      roomCode,
      playerId,
      isHost: room.hostId === playerId
    });

  } catch (err) {
    console.log("joinRoom error:", err);
    return res.status(500).json({ success: false });
  }
};

/* ---------------------- GET ROOM ---------------------- */
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code }).populate("players");
    if (!room) return res.json({ success: false });

    return res.json({ success: true, room });

  } catch (err) {
    console.log("getRoom error:", err);
    return res.status(500).json({ success: false });
  }
};
