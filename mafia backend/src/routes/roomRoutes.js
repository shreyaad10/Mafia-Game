const express = require("express");
const router = express.Router();

const { createRoom, joinRoom, getRoom } = require("../controllers/roomController");
const { getPlayer } = require("../controllers/playerController");

router.post("/create", createRoom);
router.post("/join", joinRoom);
router.get("/:code", getRoom);

// START GAME → trigger socket role assignment
router.post("/:code/start", (req, res) => {
  const io = req.app.get("io");
  const roomCode = req.params.code;

  io.to(roomCode).emit("startRound", {}); 

  return res.json({ success: true });
});

// Reveal role
router.get("/player/:id", getPlayer);

module.exports = router;
