const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  }],
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'ended'],
    default: 'waiting',
  },
  currentRound: {
    type: Number,
    default: 0,
  },
  winner: {
    type: String,
    enum: ['Villagers', 'Mafia', null],
    default: null,
  },
  rolesAssigned: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
