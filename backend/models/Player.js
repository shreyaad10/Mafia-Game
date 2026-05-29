const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 32,
  },
  roomCode: {
    type: String,
    ref: 'Room',
  },
  role: {
    type: String,
    enum: ['God', 'Doctor', 'Mafia', 'Villager', null],
    default: null,
  },
  isHost: {
    type: Boolean,
    default: false,
  },
  isAlive: {
    type: Boolean,
    default: true,
  },
  socketId: {
    type: String,
    default: null,
  },
  hasRevealedRole: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
