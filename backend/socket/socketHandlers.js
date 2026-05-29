const Room = require('../models/Room');
const Player = require('../models/Player');
const { formatRoom } = require('../controllers/roomController');

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Player joins socket room
    socket.on('joinRoom', async ({ roomCode, playerId }) => {
      try {
        if (!roomCode || !playerId) return;

        const code = roomCode.toUpperCase();
        socket.join(code);

        // Update player's socketId
        await Player.findByIdAndUpdate(playerId, { socketId: socket.id });

        const room = await Room.findOne({ code }).populate('players');
        if (room) {
          io.to(code).emit('roomUpdate', formatRoom(room));
        }

        console.log(`Player ${playerId} joined room ${code}`);
      } catch (err) {
        console.error('joinRoom socket error:', err);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        console.log(`🔌 Socket disconnected: ${socket.id}`);

        // Find player by socketId
        const player = await Player.findOne({ socketId: socket.id });
        if (!player || !player.roomCode) return;

        // Clear socketId
        await Player.findByIdAndUpdate(player._id, { socketId: null });

        const room = await Room.findOne({ code: player.roomCode }).populate('players');
        if (room && room.status === 'waiting') {
          io.to(player.roomCode).emit('roomUpdate', formatRoom(room));
        }
      } catch (err) {
        console.error('disconnect handler error:', err);
      }
    });

    // Ping/pong for latency check
    socket.on('ping', () => socket.emit('pong'));
  });
}

module.exports = { registerSocketHandlers };
