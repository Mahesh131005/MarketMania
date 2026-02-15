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

    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({ error: "Invalid User ID" });
    }

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

    const userDetailsResult = await sql`
            SELECT full_name, email, details, last_login FROM users WHERE user_id = ${userId};
        `;
    const userInfo = userDetailsResult[0];

    res.status(200).json({
      gamesPlayed,
      wins,
      history,
      details: userInfo?.details || "",
      full_name: userInfo?.full_name,
      email: userInfo?.email,
      last_login: userInfo?.last_login
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
///
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, avatar, details } = req.body; // Expecting avatar as emoji or string

    await sql`
      UPDATE users 
      SET full_name = ${fullName}, avatar = ${avatar}, details = ${details}
      WHERE user_id = ${userId}
    `;

    res.status(200).json({ success: true, message: "Profile updated", user: { fullName, avatar, details } });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
//  