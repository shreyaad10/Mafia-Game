const express = require("express");
const router = express.Router();

const { getPlayer } = require("../controllers/playerController");

router.get("/:id", getPlayer);

module.exports = router;
