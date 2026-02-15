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
  getPublicRooms,
  getGameStocks,
  getGameStockHistory
} from '../controllers/gameControllers.js';
import { askAI, listModels } from "../controllers/gameControllers.js";
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
router.get('/:gameId/history', getGameStockHistory);

router.get('/public', getPublicRooms); // NEW
router.post('/learn', askAI); // NEW
router.get('/list-models', listModels); // DEBUG


export default router;