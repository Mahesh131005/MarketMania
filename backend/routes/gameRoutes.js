import express from 'express';
import {
  createRoom, 
  addChatMessage, 
  getGameChats, 
  joinGame,
  submitPlayerScore,
  getRoundLeaderboard,
  submitFinalScore,
  getFinalLeaderboard,
  getGameLobby,
  getGameStocks
} from '../controllers/gameControllers.js';

const router = express.Router();

// Room management routes
router.post('/create', createRoom);
router.post('/join', joinGame);

// Chat routes
router.post('/:gameId/chat', addChatMessage);
router.get('/:gameId/chats', getGameChats);

// Leaderboard routes
router.post('/:gameId/score', submitPlayerScore);
router.get('/:gameId/leaderboard/:roundNumber', getRoundLeaderboard);
router.post('/:gameId/final-score', submitFinalScore);
router.get('/:gameId/final-leaderboard', getFinalLeaderboard);

// Game data routes
router.get('/:gameId/lobby', getGameLobby);
router.get('/:gameId/stocks', getGameStocks);


export default router;