import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import session from 'express-session';
import { Server } from 'socket.io';
import http from 'http';

import googleauthRoutes from "./routes/googleauthRoutes.js";
import emailauthRoutes from "./routes/emailauthRoutes.js";
import { configurePassport } from "./controllers/googleauthControllers.js";
import gameRoutes from "./routes/gameRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { logoutUser } from "./controllers/userControllers.js";
import { initialiseDatabase, sql } from "./config/initailiseDatabase.js";

import COMPANY_EVENTS from "../frontend/src/companyEvents.json" with { type: "json" };
import GENERAL_EVENTS from "../frontend/src/generalEvents.json" with { type: "json" };
import HISTORICAL_EVENTS from "../frontend/src/eventsforall.json" with { type: "json" };

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

configurePassport();
initialiseDatabase();

app.use(session({
  secret: process.env.SESSION_SECRET || 'random string',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;
const gameStates = {};

// Helper to run market events (Same as before)
const runMarketEvents = async (gameId) => {
  const gameState = gameStates[gameId];
  if (!gameState) return;

  if (gameState.roundEvents) {
    let updatedStocks = gameState.stocks;
    gameState.roundEvents.forEach(event => {
      if (event.company) {
        updatedStocks = updatedStocks.map((stock) => {
          if (stock.name === event.company) {
            const priceChangePercentage = event.impact.priceChange / 100;
            return { ...stock, price: stock.price * (1 + priceChangePercentage) };
          }
          return stock;
        });
      } else if (event.sectorImpact) {
        updatedStocks = updatedStocks.map((stock) => {
          let priceChangePercentage = event.movePercent || 0;
          let sectorAffected = false;
          for (const sector of stock.sectors) {
            if (event.sectorImpact[sector]) {
              priceChangePercentage = event.sectorImpact[sector];
              sectorAffected = true;
              break;
            }
          }
          if (priceChangePercentage !== 0 && !sectorAffected && event.movePercent) {
            return { ...stock, price: stock.price * (1 + priceChangePercentage / 100) };
          } else if (sectorAffected) {
            return { ...stock, price: stock.price * (1 + priceChangePercentage / 100) };
          }
          return stock;
        });
      }
    });

    updatedStocks = updatedStocks.map((stock) => {
      const randomFluctuation = (Math.random() - 0.5) * (stock.volatility || 0.02);
      const newPrice = stock.price * (1 + randomFluctuation);
      return { ...stock, price: Math.max(0.01, newPrice) };
    });
    gameState.stocks = updatedStocks;
    io.to(gameId).emit('price-update', updatedStocks);

  }

  // Ensure we have current stocks even if no events happened
  let currentStocks = gameState.stocks;

  // Save history for graph (Run every round)
  try {
    for (const stock of currentStocks) {
      await sql`
        INSERT INTO game_stock_history (game_id, round_number, stock_name, price)
        VALUES (${gameId}, ${gameState.round}, ${stock.name}, ${stock.price})
        ON CONFLICT (game_id, round_number, stock_name) DO NOTHING
      `;
    }
  } catch (err) {
    console.error("Error saving stock history:", err);
  }


  let notices = [];
  let newEvents = [];
  for (let i = 0; i < 5; i++) {
    let eventNotice = "";
    const eventType = Math.random();
    let event;

    if (eventType < 0.6 && gameState.companyEvents.length > 0) {
      event = gameState.companyEvents[Math.floor(Math.random() * gameState.companyEvents.length)];
      eventNotice = `[${event.company}] ${event.event}`;
    } else if (eventType < 0.95) {
      event = GENERAL_EVENTS[Math.floor(Math.random() * GENERAL_EVENTS.length)];
      eventNotice = `[SECTOR NEWS] ${event.event}`;
    } else {
      event = HISTORICAL_EVENTS[Math.floor(Math.random() * HISTORICAL_EVENTS.length)];
      eventNotice = `[MARKET SHOCK] ${event.event}`;
    }
    newEvents.push(event);
    notices.push(eventNotice);
  }

  gameState.roundEvents = newEvents;
  io.to(gameId).emit('news-update', notices);
}

app.use("/api/googleauth", googleauthRoutes);
app.use("/api/emailauth", emailauthRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/user", userRoutes);
app.post("/api/auth/logoutuser", logoutUser);

const socketUsers = {}; // Map socket.id -> { userId, roomId }

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join-lobby', async (data) => {
    // Support both old (roomId only) and new ({roomId, userId}) formats
    const roomId = typeof data === 'object' ? data.roomId : data;
    const userId = typeof data === 'object' ? data.userId : null;

    socket.join(roomId);

    if (userId) {
      socketUsers[socket.id] = { userId, roomId };
    }

    // Emit to everyone in room including sender (for real-time update)
    io.to(roomId).emit('player-joined');

    // Sync state if game is running
    if (gameStates[roomId]) {
      socket.emit('sync-state', { round: gameStates[roomId].round });
    }
  });

  socket.on('send-message', async (data) => {
    // data = { gameId, userId, username, avatar, text, roundNumber } // roundNumber from client is a fallback/hint

    const { gameId, userId, username, avatar, text } = data;

    // 1. Determine Authoritative Round
    let currentRound = data.roundNumber || 0;
    if (gameStates[gameId]) {
      currentRound = gameStates[gameId].round;
    }

    // 2. Construct Message Object
    const msgWithTime = {
      gameId,
      userId,
      username,
      avatar,
      text,
      round_number: currentRound, // Use server-side round
      created_at: new Date().toISOString()
    };

    // 3. Emit to Room (Immediate Display)
    // Send 'round_number' property to match DB column name expected by frontend
    io.to(gameId).emit('receive-message', msgWithTime);

    // 4. Persist to Database (Async)
    try {
      await sql`
        INSERT INTO game_chats (game_id, user_id, username, message, round_number) 
        VALUES (${gameId}, ${userId}, ${username}, ${text}, ${currentRound})
      `;
    } catch (err) {
      console.error("Error saving chat message to DB:", err);
    }
  });

  socket.on('kick-player', ({ roomId, userId }) => {
    io.to(roomId).emit('player-kicked', userId);
    io.to(roomId).emit('player-left', userId);
  });

  socket.on('start-game', async (roomId) => {
    if (gameStates[roomId]) return;

    io.to(roomId).emit('game-started');

    // Update DB status to 'in_progress'
    await sql`UPDATE games SET game_status = 'in_progress' WHERE game_id = ${roomId}`;

    try {
      const roomSettingsRes = await sql`SELECT round_time, num_rounds FROM game_rooms WHERE room_id = ${roomId}`;
      if (roomSettingsRes.length === 0) return;

      const settings = roomSettingsRes[0];
      const roundTimeMs = settings.round_time * 1000; // e.g., 30000ms
      const numRounds = settings.num_rounds;
      const breakTimeMs = 6000; // 6 seconds break for leaderboard

      const stocks = await sql`SELECT * FROM game_stocks WHERE game_id = ${roomId}`;
      const companyNames = new Set(stocks.map(c => c.stock_name));
      const filteredCompanyEvents = COMPANY_EVENTS.filter(event => companyNames.has(event.company));

      gameStates[roomId] = {
        round: 0,
        stocks: stocks.map(s => ({
          name: s.stock_name,
          price: parseFloat(s.price),
          pe: parseFloat(s.pe_ratio),
          sectors: s.sectors,
          totalVolume: parseInt(s.total_volume, 10),
          volatility: parseFloat(s.volatility)
        })),
        companyEvents: filteredCompanyEvents,
        roundEvents: null,
        timeout: null // Using timeout instead of interval
      };

      const runRound = async () => {
        const gameState = gameStates[roomId];
        if (!gameState) return;

        gameState.round++;

        if (gameState.round > numRounds) {
          io.to(roomId).emit('game-over');
          sql`UPDATE games SET game_status = 'finished' WHERE game_id = ${roomId}`;
          delete gameStates[roomId];
          return;
        }

        // Start Round
        console.log(`Starting Round ${gameState.round} for ${roomId}`);
        io.to(roomId).emit('new-round', gameState.round);
        runMarketEvents(roomId);

        // Schedule End of Round (Break)
        gameState.timeout = setTimeout(() => {
          console.log(`Round ${gameState.round} ended. Showing leaderboard.`);
          io.to(roomId).emit('round-ended'); // Triggers leaderboard on frontend

          // Schedule Next Round
          gameState.timeout = setTimeout(() => {
            runRound();
          }, breakTimeMs);

        }, roundTimeMs);
      };

      // Start with Market Preview (Round 0 logic replacement)
      console.log(`Starting Market Preview for ${roomId}`);
      io.to(roomId).emit('market-preview', 10); // 10 seconds preview

      setTimeout(() => {
        // Start the first round after 10s preview
        runRound();
      }, 10000);

    } catch (error) {
      console.error(`Error starting game ${roomId}:`, error);
    }
  });

<<<<<<< HEAD
  socket.on('disconnect', async () => {
    console.log('user disconnected:', socket.id);

    // Handle Lobby Cleanup
    const userInfo = socketUsers[socket.id];
    if (userInfo) {
      const { userId, roomId } = userInfo;
      delete socketUsers[socket.id];

      try {
        // If game is still 'waiting', remove player from DB
        const gameStatusRes = await sql`SELECT game_status FROM games WHERE game_id = ${roomId}`;
        if (gameStatusRes.length > 0 && gameStatusRes[0].game_status === 'waiting') {
          await sql`DELETE FROM game_participants WHERE game_id = ${roomId} AND user_id = ${userId}`;

          // Notify others to refresh lobby
          io.to(roomId).emit('player-left', userId); // OR just 'player-joined' to trigger refetch
          io.to(roomId).emit('player-joined');

          // Check if room is empty
          const countRes = await sql`SELECT COUNT(*) FROM game_participants WHERE game_id = ${roomId}`;
          if (parseInt(countRes[0].count) === 0) {
            console.log(`Room ${roomId} is empty. Marking as inactive.`);
            await sql`UPDATE games SET game_status = 'inactive' WHERE game_id = ${roomId}`;
          }
        }
      } catch (err) {
        console.error("Error handling disconnect cleanup:", err);
      }
    }
=======
  socket.on('disconnect', () => {
    console.log('user disconnected');//just for now
>>>>>>> 38478c6d08c2b111dff012a71c26266ba32b8d6c
  });
});


// ... (imports)
import { updateGlobalStockPrices } from "./utils/stockFetcher.js";

// ... (existing code)

server.listen(PORT, async () => {
  console.log("server is running on port 3000");

  // Trigger initial update in background
  updateGlobalStockPrices().catch(err => console.error("Initial stock update failed:", err));

  // Schedule updates every 30 minutes (30 * 60 * 1000 ms)
  setInterval(() => {
    updateGlobalStockPrices().catch(err => console.error("Scheduled stock update failed:", err));
  }, 30 * 60 * 1000);
});

