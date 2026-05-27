const Player = require("../models/Player");

exports.getPlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.json({ success: false, message: "Player not found" });
    }

    return res.json({
      success: true,
      role: player.role,
      name: player.name,
    });
  } catch (err) {
    console.log("getPlayer error:", err);
    return res.status(500).json({ success: false });
  }
};
