const Player = require('../models/Player');

// GET /api/player/:id
async function getPlayer(req, res) {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    return res.json({
      _id: player._id.toString(),
      name: player.name,
      roomCode: player.roomCode,
      role: player.role,
      isHost: player.isHost,
      isAlive: player.isAlive,
      hasRevealedRole: player.hasRevealedRole,
    });
  } catch (err) {
    console.error('getPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/player/:id/reveal
async function revealRole(req, res) {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { hasRevealedRole: true },
      { new: true }
    );
    if (!player) return res.status(404).json({ error: 'Player not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('revealRole error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getPlayer, revealRole };
