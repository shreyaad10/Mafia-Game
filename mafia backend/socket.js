// socket.js
const Room = require("./src/models/Room");
const Player = require("./src/models/Player");

function setupSockets(io) {
  io.on("connection", (socket) => {
    console.log("⚡ socket connected:", socket.id);

    /* ---------------------- JOIN ROOM ---------------------- */
    socket.on("joinRoom", async ({ roomCode, playerId }) => {
      try {
        socket.join(roomCode);

        await Player.findByIdAndUpdate(playerId, { socketId: socket.id });

        const room = await Room.findOne({ code: roomCode }).populate("players");
        if (!room) return;

        const hostId = room.hostId;

        // Send updated players list
        io.to(roomCode).emit("roomUpdate", {
          players: room.players.map((p) => ({
            _id: p._id,
            name: p.name,
            role: p.role,
            isHost: p._id.toString() === hostId
          })),
          hostId
        });

      } catch (err) {
        console.log("joinRoom error:", err);
      }
    });

    /* ---------------------- START ROUND ---------------------- */
    socket.on("startRound", async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode }).populate("players");
        if (!room) return;

        room.currentRound += 1;

        const players = room.players;
        const count = players.length;

        /* ---------------- AUTOMATIC ROLE LOGIC ---------------- */
        let roles = [];

        roles.push("god"); // compulsory god
        roles.push("doctor"); // 1 doctor

        if (count >= 4) {
          roles.push("mafia");
          roles.push("mafia");
        } else {
          roles.push("mafia");
        }

        // remaining = villagers
        while (roles.length < count) roles.push("villager");

        // shuffle
        for (let i = roles.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [roles[i], roles[j]] = [roles[j], roles[i]];
        }

        // assign
        for (let i = 0; i < players.length; i++) {
          await Player.findByIdAndUpdate(players[i]._id, {
            role: roles[i]
          });
        }

        await room.save();

        io.to(roomCode).emit("roundStarted");

      } catch (err) {
        console.log("startRound error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ socket disconnected", socket.id);
    });
  });
}

module.exports = setupSockets;
