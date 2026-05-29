const express = require('express');
const router = express.Router();
const { getPlayer, revealRole } = require('../controllers/playerController');

router.get('/:id', getPlayer);
router.post('/:id/reveal', revealRole);

module.exports = router;
