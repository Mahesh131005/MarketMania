import { sql } from "../config/initailiseDatabase.js";
import ALL_COMPANIES from "../../frontend/src/Companysectors.json" with { type: "json" };
//

//
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const createRoom = async (req, res) => {
  try {

    const {
      roomID,
      name: room_name,
      numStocks,
      roundTime,
      maxPlayers,
      initialMoney,
      numRounds,
      createdBy, // user_id of the creator
    } = req.body;
    console.log(roomID + "from backend");
    if (!roomID || !room_name || !numStocks || !roundTime || !maxPlayers || !initialMoney || !numRounds || !createdBy) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    console.log("ALL filelds corect");
    // ✅ Check if creator exists
    const userExists = await sql`SELECT * FROM users WHERE user_id = ${createdBy}`;
    if (userExists.length === 0) {
      return res.status(400).json({ message: "Creator user does not exist" });
    }

    // 1️⃣ Insert into game_rooms
    await sql`
      INSERT INTO game_rooms 
        (room_id, room_name, num_stocks, round_time, max_players, initial_money, num_rounds, created_by) 
      VALUES 
        (${roomID}, ${room_name}, ${numStocks}, ${roundTime}, ${maxPlayers}, ${initialMoney}, ${numRounds}, ${createdBy})
    `;

    // 2️⃣ Insert into games table so participants can be added
    await sql`
      INSERT INTO games (game_id, created_by_user_id)
      VALUES (${roomID}, ${createdBy})
    `;

    // 3️⃣ Add creator to participants
    await sql`
      INSERT INTO game_participants (game_id, user_id) 
      VALUES (${roomID}, ${createdBy})
    `;

    // 4️⃣ Select and insert stocks for the game
    const selectedStocks = shuffleArray(ALL_COMPANIES).slice(0, numStocks);
    for (const stock of selectedStocks) {
      await sql`
        INSERT INTO game_stocks (game_id, stock_name, price, pe_ratio, sectors, total_volume, volatility)
        VALUES (${roomID}, ${stock.name}, ${stock.price}, ${stock.pe}, ${stock.sectors}, ${stock.totalVolume}, ${stock.volatility})
      `;
    }


    res.status(201).json({ success: true, roomID, message: "Room created successfully" });
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ success: false, message: "Server error while creating room" });
  }
};
// ✅ Join an existing room
export const joinGame = async (req, res) => {
  try {
    const { roomID, userId } = req.body;

    if (!roomID || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Check if room exists
    const rooms = await sql`SELECT * FROM game_rooms WHERE room_id = ${roomID}`;
    if (rooms.length === 0) {
      return res.status(404).json({ exists: false, message: "Room not found" });
    }

    // 2️⃣ Add user to participants if not already
    const participantCheck = await sql`
      SELECT * FROM game_participants 
      WHERE game_id = ${roomID} AND user_id = ${userId}
    `;
    if (participantCheck.length === 0) {
      await sql`
        INSERT INTO game_participants (game_id, user_id) 
        VALUES (${roomID}, ${userId})
      `;
    }

    // 3️⃣ Extract formatted data
    const room = rooms[0];
    const roomData = {
      createdBy: room.created_by,
      initialMoney: String(room.initial_money),
      maxPlayers: String(room.max_players),
      name: room.room_name,
      numRounds: String(room.num_rounds),
      numStocks: String(room.num_stocks),
      roomID: room.room_id,
      roundTime: String(room.round_time)
    };

    // ✅ Respond in frontend-compatible format
    res.status(200).json({
      exists: true,
      roomData
    });

  } catch (err) {
    console.error("Error joining room:", err);
    res.status(500).json({ message: "Server error while joining room" });
  }
};


// ✅ Add chat message to a game
export const addChatMessage = async (req, res) => {
  try {
    const { gameId } = req.params;
    // Expect roundNumber in body now
    const { userId, username, text: message, roundNumber = 0 } = req.body;

    if (!gameId || !userId || !username || !message) {
      return res.status(400).json({ error: "Missing fields." });
    }

    await sql`
      INSERT INTO game_chats (game_id, user_id, username, message, round_number) 
      VALUES (${gameId}, ${userId}, ${username}, ${message}, ${roundNumber})
    `;

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error adding chat:", error);
    res.status(500).json({ error: "Failed to add message." });
  }
};

// ✅ Get chats with User Avatars
export const getGameChats = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Join with users table to get the avatar
    const chats = await sql`
      SELECT 
        gc.username, 
        gc.message as text, 
        gc.round_number, 
        gc.created_at,
        u.avatar,
        u.user_id
      FROM game_chats gc
      JOIN users u ON gc.user_id = u.user_id
      WHERE gc.game_id = ${gameId} 
      ORDER BY gc.created_at ASC
    `;

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats." });
  }
};

// ✅ Submit player score after each round
export const submitPlayerScore = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { userId, roundNumber, cashAmount, portfolioValue, netWorth } = req.body;

    if (!gameId || !userId || !roundNumber || cashAmount === undefined || portfolioValue === undefined || netWorth === undefined) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Insert or update player score for this round
    console.log(roundNumber + " room numb4 " + netWorth);
    await sql`
      INSERT INTO player_scores (game_id, user_id, round_number, cash_amount, portfolio_value, net_worth)
      VALUES (${gameId}, ${userId}, ${roundNumber}, ${cashAmount}, ${portfolioValue}, ${netWorth})
      ON CONFLICT (game_id, user_id, round_number) 
      DO UPDATE SET 
        cash_amount = ${cashAmount},
        portfolio_value = ${portfolioValue},
        net_worth = ${netWorth},
        submitted_at = NOW()
    `;

    res.status(200).json({ success: true, message: "Score submitted successfully." });
  } catch (error) {
    console.error("Error in submitPlayerScore:", error);
    res.status(500).json({ error: "Internal Server Error: Failed to submit score." });
  }
};

// ✅ Get round leaderboard
export const getRoundLeaderboard = async (req, res) => {
  try {
    const { gameId, roundNumber } = req.params;
    if (!gameId || !roundNumber) {
      return res.status(400).json({ error: "Game ID and round number are required." });
    }

    const leaderboard = await sql`
      SELECT 
        ps.user_id,
        u.full_name as username,
        ps.cash_amount,
        ps.portfolio_value,
        ps.net_worth,
        ps.submitted_at
      FROM player_scores ps
      JOIN users u ON ps.user_id = u.user_id
      WHERE ps.game_id = ${gameId} AND ps.round_number = ${roundNumber}
      ORDER BY ps.net_worth DESC
    `;

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error in getRoundLeaderboard:", error);
    res.status(500).json({ error: "Internal Server Error: Failed to fetch leaderboard." });
  }
};
// ✅ Submit final score and get final leaderboard
export const submitFinalScore = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { userId, finalNetWorth } = req.body;

    if (!gameId || !userId || finalNetWorth === undefined) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Insert final score
    await sql`
      INSERT INTO final_scores (game_id, user_id, final_net_worth)
      VALUES (${gameId}, ${userId}, ${finalNetWorth})
      ON CONFLICT (game_id, user_id) 
      DO UPDATE SET 
        final_net_worth = ${finalNetWorth},
        game_completed_at = NOW()
    `;

    // Get final leaderboard with rankings
    const finalLeaderboard = await sql`
      SELECT 
        fs.user_id,
        u.full_name as username,
        fs.final_net_worth,
        fs.game_completed_at,
        ROW_NUMBER() OVER (ORDER BY fs.final_net_worth DESC) as rank
      FROM final_scores fs
      JOIN users u ON fs.user_id = u.user_id
      WHERE fs.game_id = ${gameId}
      ORDER BY fs.final_net_worth DESC
    `;

    // Update the rank in the database
    for (const player of finalLeaderboard) {
      await sql`
        UPDATE final_scores 
        SET final_rank = ${player.rank}
        WHERE game_id = ${gameId} AND user_id = ${player.user_id}
      `;
    }

    res.status(200).json({
      success: true,
      message: "Final score submitted successfully.",
      leaderboard: finalLeaderboard
    });
  } catch (error) {
    console.error("Error in submitFinalScore:", error);
    res.status(500).json({ error: "Internal Server Error: Failed to submit final score." });
  }
};

// ✅ Get final leaderboard
export const getFinalLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({ error: "Game ID is required." });
    }

    const finalLeaderboard = await sql`
      SELECT 
        fs.user_id,
        u.full_name as username,
        fs.final_net_worth,
        fs.final_rank,
        fs.game_completed_at
      FROM final_scores fs
      JOIN users u ON fs.user_id = u.user_id
      WHERE fs.game_id = ${gameId}
      ORDER BY fs.final_rank ASC
    `;

    res.status(200).json(finalLeaderboard);
  } catch (error) {
    console.error("Error in getFinalLeaderboard:", error);
    res.status(500).json({ error: "Internal Server Error: Failed to fetch final leaderboard." });
  }
};

export const getGameLobby = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({ error: "Game ID is required." });
    }

    const players = await sql`
      SELECT u.user_id, u.full_name
      FROM users u
      JOIN game_participants gp ON u.user_id = gp.user_id
      WHERE gp.game_id = ${gameId}
    `;

    const room = await sql`
      SELECT * FROM game_rooms WHERE room_id = ${gameId}
    `;

    res.status(200).json({ players, room: room[0] });
  } catch (error) {
    console.error("Error in getGameLobby:", error);
    res.status(500).json({ error: "Internal Server Error: Failed to fetch lobby data." });
  }
}

export const getGameStocks = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({ error: "Game ID is required." });
    }

    const stocks = await sql`
      SELECT stock_name as name, price, pe_ratio as pe, sectors, total_volume, volatility
      FROM game_stocks
      WHERE game_id = ${gameId}
    `;

    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error in getGameStocks:", error);
    res.status(500).json({ error: "Internal Server Error: Failed to fetch game stocks." });
  }
}