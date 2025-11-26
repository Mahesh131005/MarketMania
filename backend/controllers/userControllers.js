import { sql } from "../config/initailiseDatabase.js";

// POST /api/auth/logoutuser
export const logoutUser = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Update user’s status to inactive
    await sql`
      UPDATE users
      SET isActive = FALSE
      WHERE user_id = ${user_id};
    `;

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const gamesPlayedResult = await sql`
            SELECT COUNT(*) FROM final_scores WHERE user_id = ${userId};
        `;
        const gamesPlayed = parseInt(gamesPlayedResult[0].count, 10);

        const winsResult = await sql`
            SELECT COUNT(*) FROM final_scores WHERE user_id = ${userId} AND final_rank = 1;
        `;
        const wins = parseInt(winsResult[0].count, 10);

        const history = await sql`
            SELECT game_id, final_rank, game_completed_at
            FROM final_scores
            WHERE user_id = ${userId}
            ORDER BY game_completed_at DESC
            LIMIT 5;
        `;

        res.status(200).json({
            gamesPlayed,
            wins,
            history
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};