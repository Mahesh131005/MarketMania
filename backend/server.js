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
import userRoutes from "./routes/userRoutes.js"; // Corrected import


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

//sessions

app.use(session({
  secret: process.env.SESSION_SECRET || 'random string',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true only if using https
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());


// JSON request parsing
app.use(express.json());

//cors enables communication 
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);




// Helmet for security
app.use(helmet());

// HTTP request logging
app.use(morgan("dev"));



const PORT = process.env.PORT || 3000;

const gameStates = {};

const runMarketEvents = (gameId) => {
  const gameState = gameStates[gameId];
  if (!gameState) return;

  // First, apply price changes from last round's events
  if (gameState.roundEvents) {
    let updatedStocks = gameState.stocks;
    gameState.roundEvents.forEach(event => {
      if (event.company) { // Company event
        updatedStocks = updatedStocks.map((stock) => {
          if (stock.name === event.company) {
            const priceChangePercentage = event.impact.priceChange / 100;
            return { ...stock, price: stock.price * (1 + priceChangePercentage) };
          }
          return stock;
        });
      } else if (event.sectorImpact) { // General/Historical event with sectorImpact
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

  // Now, generate new events for the current round
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



app.get("/", (req, res) => {
  res.send("hello from the server route");
});


// Authentication routes
app.use("/api/googleauth", googleauthRoutes);
app.use("/api/emailauth", emailauthRoutes);

app.use("/api/game", gameRoutes);
app.use("/api/user", userRoutes); // Added this line to use the new routes


app.post("/api/auth/logoutuser", logoutUser);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join-lobby', (roomId) => {
    socket.join(roomId);
    console.log(`user ${socket.id} joined room ${roomId}`);

    // Notify others
    socket.to(roomId).emit('player-joined');

    // ✅ FIX: Send current round to the user who just joined
    if (gameStates[roomId]) {
      socket.emit('sync-state', {
        round: gameStates[roomId].round,
        // Add other sync data here if needed (e.g., stocks)
      });
    }
  });
  //
  socket.on('send-message', (data) => {
    // data includes: gameId, userId, username, text, roundNumber
    // We need to fetch the avatar to broadcast it immediately, 
    // OR the frontend can fetch profile, but let's query DB quickly or pass it in data if stored locally

    // Broadcast to everyone in the room
    io.to(data.gameId).emit('receive-message', data);
  });
  //
  socket.on('start-game', async (roomId) => {
    if (gameStates[roomId] && gameStates[roomId].interval) {
      console.log(`Game ${roomId} is already in progress.`);
      return;
    }

    io.to(roomId).emit('game-started');

    try {
      const roomSettingsRes = await sql`SELECT round_time, num_rounds FROM game_rooms WHERE room_id = ${roomId}`;
      if (roomSettingsRes.length === 0) {
        console.error(`Attempted to start game for non-existent room: ${roomId}`);
        return;
      }
      const settings = roomSettingsRes[0];
      const roundTimeMs = settings.round_time * 1000;
      const numRounds = settings.num_rounds;

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
        interval: null,
        roundEvents: null
      };

      const gameLoop = () => {
        const gameState = gameStates[roomId];
        if (!gameState) {
          if (gameStates[roomId] && gameStates[roomId].interval) clearInterval(gameStates[roomId].interval);
          return;
        }

        gameState.round++;

        if (gameState.round > numRounds) {
          console.log(`Game ${roomId} finished.`);
          clearInterval(gameState.interval);
          io.to(roomId).emit('game-over');
          delete gameStates[roomId];
          return;
        }

        console.log(`Running round ${gameState.round} for game ${roomId}`);
        io.to(roomId).emit('new-round', gameState.round);
        runMarketEvents(roomId);
      };

      setTimeout(() => {
        gameLoop();
        gameStates[roomId].interval = setInterval(gameLoop, roundTimeMs);
      }, 1000);

    } catch (error) {
      console.error(`Error starting game ${roomId}:`, error);
    }
  });


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


server.listen(PORT, () => {
  console.log("server is running on port 3000");
});