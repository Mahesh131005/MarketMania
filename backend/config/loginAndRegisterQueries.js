import { sql } from './initailiseDatabase.js';

// 🔹 Link Google account to existing user or create a new one
export const linkGoogleAccount = async ({ email, full_name, google_id }) => {
  try {
    // Check if user already exists
    const existing = await sql`
      SELECT user_id FROM users WHERE email = ${email};
    `;

    let user_id;
    if (existing.length > 0) {
      // User exists → update last login
      user_id = existing[0].user_id;
      await sql`
        UPDATE users
        SET last_login = NOW()
        WHERE user_id = ${user_id};
      `;
    } else {
      // User does not exist → insert new
      const inserted = await sql`
        INSERT INTO users (email, full_name, google_id, last_login)
        VALUES (${email}, ${full_name}, ${google_id}, NOW())
        RETURNING user_id;
      `;
      user_id = inserted[0].user_id;
    }

    return { user_id, email, full_name, google_id };
  } catch (error) {
    console.error("Error while linking or creating Google account:", error.message);
    throw error;
  }
};

// 🔹 Check if email exists
export const checkEmailExists = async (email) => {
  try {
    const result = await sql`
      SELECT user_id, google_id FROM users WHERE email = ${email};
    `;
    return result.length > 0 ? result : null;
  } catch (error) {
    console.error("Error while checking email:", error.message);
    throw error;
  }
};

// 🔹 Create a new user (email/password)
export const createUser = async ({ email, full_name, hashed_password }) => {
  try {
    const inserted = await sql`
      INSERT INTO users (email, full_name, hashed_password, last_login)
      VALUES (${email}, ${full_name}, ${hashed_password}, NOW())
      RETURNING user_id;
    `;

    const user_id = inserted[0].user_id;
    return { user_id, email, full_name };
  } catch (error) {
    console.error("Error while creating new user:", error.message);
    throw error;
  }
};

// 🔹 Find a user by email (for login)
export const findUser = async (email) => {
  try {
    const user = await sql`
      SELECT user_id, full_name, hashed_password, google_id,isactive
      FROM users
      WHERE email = ${email};
    `;
    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error("Error while finding user:", error.message);
    throw error;
  }
};

// 🔹 Update user's last login timestamp
export const updateLastLogin = async (user_id) => {
  try {
    await sql`
      UPDATE users
      SET last_login = NOW()
      WHERE user_id = ${user_id};
    `;
  } catch (error) {
    console.error("Error while updating last login:", error.message);
    throw error;
  }
};

// 🔹 Get user by ID
export const getUserById = async (user_id) => {
  try {
    const user = await sql`
      SELECT user_id, email, full_name, google_id, last_login
      FROM users
      WHERE user_id = ${user_id};
    `;
    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error("Error while fetching user by ID:", error.message);
    throw error;
  }
};

export const setUserActiveStatus = async (user_id, status) => {
  await sql`
    UPDATE users
    SET isactive = ${status}
    WHERE user_id = ${user_id};
  `;
};