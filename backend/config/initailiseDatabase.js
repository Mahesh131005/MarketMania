// import { neon } from "@neondatabase/serverless";
// import dotenv from "dotenv";

// dotenv.config();

// const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

// //create connection using environamental varibles
// export const sql = neon(
//   `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`
// );
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
const { Pool } = pkg;

// Create connection pool for local PostgreSQL
const pool = new Pool({
  host: PGHOST || "localhost",
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: 5432, // default port
});

// --- Wrapper to make `sql` behave like neon's tagged template ---
export async function sql(strings, ...values) {
  // Build query text like: SELECT * FROM users WHERE id = $1
  const text = strings.reduce(
    (prev, curr, i) => prev + curr + (i < values.length ? `$${i + 1}` : ""),
    ""
  );

  const client = await pool.connect();
  try {
    const res = await client.query(text, values);
    return res.rows;
  } finally {
    client.release();
  }
}



export async function initialiseDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        hashed_password TEXT,
        google_id VARCHAR(100),
        avatar TEXT DEFAULT '😎', -- Default avatar
        isactive BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS game_chats (
          message_id SERIAL PRIMARY KEY,
          game_id VARCHAR(100) NOT NULL,
          user_id INTEGER REFERENCES users(user_id),
          username VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          round_number INTEGER DEFAULT 0, -- 0 = Lobby, 1+ = Rounds
          created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // --- NEW: Added games table to manage game sessions ---
    await sql`
    CREATE TABLE IF NOT EXISTS games (
        game_id VARCHAR(100) PRIMARY KEY,
        created_by_user_id INTEGER REFERENCES users(user_id),
        game_status VARCHAR(50) DEFAULT 'waiting', -- e.g., 'waiting', 'in_progress', 'finished'
        created_at TIMESTAMP DEFAULT NOW()
    );
    `;

    // --- NEW: Added game_participants to link users to games ---
    await sql`
    CREATE TABLE IF NOT EXISTS game_participants (
        game_id VARCHAR(100) REFERENCES games(game_id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (game_id, user_id) -- Ensures a user cannot join the same game twice
    );
    `;

    // --- NEW: Added game_rooms table for room settings ---
    await sql`
    CREATE TABLE IF NOT EXISTS game_rooms (
        room_id VARCHAR(100) PRIMARY KEY,
        room_name VARCHAR(100) NOT NULL,
        num_stocks INTEGER NOT NULL,
        round_time INTEGER NOT NULL,
        max_players INTEGER NOT NULL,
        initial_money INTEGER NOT NULL,
        num_rounds INTEGER NOT NULL,
        created_by INTEGER REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT NOW()
    );
    `;

    // --- NEW: Added player_scores table to track individual player performance ---
    await sql`
    CREATE TABLE IF NOT EXISTS player_scores (
        score_id SERIAL PRIMARY KEY,
        game_id VARCHAR(100) REFERENCES games(game_id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        cash_amount DECIMAL(15,2) NOT NULL,
        portfolio_value DECIMAL(15,2) NOT NULL,
        net_worth DECIMAL(15,2) NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(game_id, user_id, round_number)
    );
    `;

    // --- NEW: Added final_scores table for end-game leaderboard ---
    await sql`
    CREATE TABLE IF NOT EXISTS final_scores (
        final_score_id SERIAL PRIMARY KEY,
        game_id VARCHAR(100) REFERENCES games(game_id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        final_net_worth DECIMAL(15,2) NOT NULL,
        final_rank INTEGER,
        game_completed_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(game_id, user_id)
    );
    `;
    // --- NEW: Added game_stocks table to store the stocks for each game ---
    await sql`
      CREATE TABLE IF NOT EXISTS game_stocks (
        game_stock_id SERIAL PRIMARY KEY,
        game_id VARCHAR(100) REFERENCES games(game_id) ON DELETE CASCADE,
        stock_name VARCHAR(100) NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        pe_ratio DECIMAL(10,2),
        sectors TEXT[],
        total_volume INTEGER,
        volatility DECIMAL(5,4),
        UNIQUE(game_id, stock_name)
      );
    `;

    //sample end
    console.log("database intialised");
    console.log("Database initialised with Chat & Avatar support");
  } catch (error) {
    console.log("unable to intialise", error);
  }
}