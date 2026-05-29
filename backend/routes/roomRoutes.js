const express = require('express');
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getRoom,
  startGame,
  eliminatePlayer,
  nextRound,
  endGame,
  leaveRoom,
  resetRoom,
} = require('../controllers/roomController');

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/:code', getRoom);
router.post('/:code/start', startGame);
router.post('/:code/eliminate', eliminatePlayer);
router.post('/:code/nextround', nextRound);
router.post('/:code/end', endGame);
router.post('/:code/leave', leaveRoom);
router.post('/:code/reset', resetRoom);

module.exports = router;
