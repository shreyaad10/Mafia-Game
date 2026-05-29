const Room = require('../models/Room');
const Player = require('../models/Player');

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Role assignment logic
function assignRoles(playerCount) {
  const roles = [];

  // Always 1 God
  roles.push('God');

  // Always 1 Doctor
  roles.push('Doctor');

  // Mafia count based on player count
  let mafiaCount = 1;
  if (playerCount >= 8 && playerCount <= 11) mafiaCount = 2;
  else if (playerCount >= 12) mafiaCount = 3;

  for (let i = 0; i < mafiaCount; i++) roles.push('Mafia');

  // Remaining are Villagers
  const villagerCount = playerCount - roles.length;
  for (let i = 0; i < villagerCount; i++) roles.push('Villager');

  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  return roles;
}

// POST /api/rooms/create
async function createRoom(req, res) {
  try {
    const { playerName } = req.body;
    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    // Generate unique code
    let code;
    let exists = true;
    while (exists) {
      code = generateRoomCode();
      exists = await Room.exists({ code });
    }

    // Create host player
    const host = new Player({
      name: playerName.trim(),
      roomCode: code,
      isHost: true,
    });
    await host.save();

    // Create room
    const room = new Room({
      code,
      hostId: host._id,
      players: [host._id],
    });
    await room.save();

    return res.status(201).json({
      roomCode: code,
      playerId: host._id,
      isHost: true,
    });
  } catch (err) {
    console.error('createRoom error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/rooms/join
async function joinRoom(req, res) {
  try {
    const { playerName, roomCode } = req.body;
    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    if (!roomCode || !roomCode.trim()) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    const code = roomCode.trim().toUpperCase();
    const room = await Room.findOne({ code }).populate('players');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started or ended' });
    }

    // Check for duplicate name
    const duplicateName = room.players.some(
      (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
    );
    if (duplicateName) {
      return res.status(400).json({ error: 'That name is already taken in this room' });
    }

    // Create player
    const player = new Player({
      name: playerName.trim(),
      roomCode: code,
      isHost: false,
    });
    await player.save();

    room.players.push(player._id);
    await room.save();

    // Emit roomUpdate
    const updatedRoom = await Room.findOne({ code }).populate('players');
    req.io.to(code).emit('roomUpdate', formatRoom(updatedRoom));

    return res.status(200).json({
      roomCode: code,
      playerId: player._id,
      isHost: false,
    });
  } catch (err) {
    console.error('joinRoom error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/rooms/:code
async function getRoom(req, res) {
  try {
    const code = req.params.code.toUpperCase();
    const room = await Room.findOne({ code }).populate('players');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    return res.json(formatRoom(room));
  } catch (err) {
    console.error('getRoom error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/rooms/:code/start
async function startGame(req, res) {
  try {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;

    const room = await Room.findOne({ code }).populate('players');
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Verify host
    if (room.hostId.toString() !== playerId) {
      return res.status(403).json({ error: 'Only the host can start the game' });
    }
    if (room.players.length < 4) {
      return res.status(400).json({ error: 'Need at least 4 players to start' });
    }
    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started' });
    }

    // Assign roles
    const roles = assignRoles(room.players.length);
    for (let i = 0; i < room.players.length; i++) {
      await Player.findByIdAndUpdate(room.players[i]._id, { role: roles[i] });
    }

    room.status = 'in_progress';
    room.currentRound = 1;
    room.rolesAssigned = true;
    await room.save();

    // Emit to all in room
    const updatedRoom = await Room.findOne({ code }).populate('players');
    req.io.to(code).emit('roundStarted', {
      round: 1,
      room: formatRoom(updatedRoom),
    });

    return res.json({ success: true, round: 1 });
  } catch (err) {
    console.error('startGame error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/rooms/:code/eliminate
async function eliminatePlayer(req, res) {
  try {
    const code = req.params.code.toUpperCase();
    const { playerId, targetPlayerId } = req.body;

    const room = await Room.findOne({ code }).populate('players');
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.hostId.toString() !== playerId) {
      return res.status(403).json({ error: 'Only God can eliminate players' });
    }

    await Player.findByIdAndUpdate(targetPlayerId, { isAlive: false });

    const updatedRoom = await Room.findOne({ code }).populate('players');
    req.io.to(code).emit('playerEliminated', {
      targetPlayerId,
      room: formatRoom(updatedRoom),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('eliminatePlayer error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/rooms/:code/nextround
async function nextRound(req, res) {
  try {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;

    const room = await Room.findOne({ code }).populate('players');
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.hostId.toString() !== playerId) {
      return res.status(403).json({ error: 'Only God can advance rounds' });
    }

    room.currentRound += 1;
    await room.save();

    const updatedRoom = await Room.findOne({ code }).populate('players');
    req.io.to(code).emit('roundStarted', {
      round: room.currentRound,
      room: formatRoom(updatedRoom),
    });

    return res.json({ success: true, round: room.currentRound });
  } catch (err) {
    console.error('nextRound error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/rooms/:code/end
async function endGame(req, res) {
  try {
    const code = req.params.code.toUpperCase();
    const { playerId, winner } = req.body;

    const room = await Room.findOne({ code }).populate('players');
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.hostId.toString() !== playerId) {
      return res.status(403).json({ error: 'Only God can end the game' });
    }

    room.status = 'ended';
    room.winner = winner || 'Villagers';
    await room.save();

    const updatedRoom = await Room.findOne({ code }).populate('players');
    req.io.to(code).emit('gameEnded', {
      winner: room.winner,
      room: formatRoom(updatedRoom),
    });

    return res.json({ success: true, winner: room.winner });
  } catch (err) {
    console.error('endGame error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/rooms/:code/reset  — reuse same room code for a new game
async function resetRoom(req, res) {
  try {
    const code = req.params.code.toUpperCase();
    const { playerId, playerName } = req.body;

    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.hostId.toString() !== playerId) {
      return res.status(403).json({ error: 'Only the host can reset the room' });
    }

    // Delete all old players
    await Player.deleteMany({ roomCode: code });

    // Create fresh host player with same name
    const host = new Player({
      name: playerName.trim(),
      roomCode: code,
      isHost: true,
    });
    await host.save();

    // Reset room state
    room.players = [host._id];
    room.hostId = host._id;
    room.status = 'waiting';
    room.currentRound = 0;
    room.winner = null;
    room.rolesAssigned = false;
    await room.save();

    const updatedRoom = await Room.findOne({ code }).populate('players');
    req.io.to(code).emit('roomReset', formatRoom(updatedRoom));

    return res.json({
      roomCode: code,
      playerId: host._id,
      isHost: true,
    });
  } catch (err) {
    console.error('resetRoom error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/rooms/:code/leave
async function leaveRoom(req, res) {
  try {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;

    const room = await Room.findOne({ code }).populate('players');
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const isHost = room.hostId.toString() === playerId;

    // Remove player from room
    room.players = room.players.filter((p) => p._id.toString() !== playerId);
    await Player.findByIdAndDelete(playerId);

    // If host leaves and game hasn't started, try to assign new host
    if (isHost && room.status === 'waiting') {
      if (room.players.length > 0) {
        const newHost = room.players[0];
        room.hostId = newHost._id;
        await Player.findByIdAndUpdate(newHost._id, { isHost: true });
      } else {
        // No players left — delete room
        await Room.findByIdAndDelete(room._id);
        return res.json({ success: true, roomDeleted: true });
      }
    }

    // If host leaves mid-game, end the game
    if (isHost && room.status === 'in_progress') {
      room.status = 'ended';
      room.winner = null;
      await room.save();
      const updatedRoom = await Room.findOne({ code }).populate('players');
      req.io.to(code).emit('gameEnded', {
        winner: null,
        room: formatRoom(updatedRoom),
        reason: 'hostLeft',
      });
      return res.json({ success: true, hostLeft: true });
    }

    await room.save();

    const updatedRoom = await Room.findOne({ code }).populate('players');
    req.io.to(code).emit('roomUpdate', formatRoom(updatedRoom));

    return res.json({ success: true });
  } catch (err) {
    console.error('leaveRoom error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function formatRoom(room) {
  return {
    code: room.code,
    status: room.status,
    currentRound: room.currentRound,
    winner: room.winner,
    rolesAssigned: room.rolesAssigned,
    hostId: room.hostId?.toString(),
    players: room.players.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      isHost: p.isHost,
      isAlive: p.isAlive,
      role: p.role,
      hasRevealedRole: p.hasRevealedRole,
    })),
  };
}

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  startGame,
  eliminatePlayer,
  nextRound,
  endGame,
  leaveRoom,
  resetRoom,
  formatRoom,
};
