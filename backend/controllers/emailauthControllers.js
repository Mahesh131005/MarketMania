import bcrypt from 'bcrypt';
import {
  checkEmailExists,
  createUser,
  findUser,
  updateLastLogin,
  getUserById,
  setUserActiveStatus
} from '../config/loginAndRegisterQueries.js';
import { sql } from '../config/initailiseDatabase.js';
//import { config } from './../../frontend/node_modules/use-sidecar/dist/es2015/config';
// ✅ Password validation logic (unchanged)
const validatePassword = (password) => {
  const minLength = 8;
  let hasLowerCaseLetter = false;
  let hasUpperCaseLetter = false;
  let hasNumber = false;
  let hasOtherCharacter = false;

  for (let i = 0; i < password.length; i++) {
    if (password[i] >= '0' && password[i] <= '9') hasNumber = true;
    else if (password[i] >= 'a' && password[i] <= 'z') hasLowerCaseLetter = true;
    else if (password[i] >= 'A' && password[i] <= 'Z') hasUpperCaseLetter = true;
    else hasOtherCharacter = true;
  }

  const errors = [];
  if (password.length < minLength)
    errors.push('Password must have at least 8 characters');
  if (!hasUpperCaseLetter)
    errors.push('Password must have at least one uppercase letter');
  if (!hasLowerCaseLetter)
    errors.push('Password must have at least one lowercase letter');
  if (!hasNumber)
    errors.push('Password must have at least one number');
  if (!hasOtherCharacter)
    errors.push('Password must have at least one special character');

  return errors;
};

// ✅ Register a new user
export const registerUser = async (req, res) => {
  try {
    const { email, password, full_name, avatar } = req.body;
    console.log("📩 Register request received:", { email, full_name });

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        error: 'Password validation failed',
        details: passwordErrors
      });
    }

    // Check if email already exists
    const emailExists = await checkEmailExists(email);
    console.log("🔍 Email exists?", emailExists);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRound = 10;
    const hashed_password = await bcrypt.hash(password, saltRound);
    console.log("🔒 Password hashed successfully.");

    // Create user in DB
    const user = await createUser({ email, full_name, hashed_password, avatar });
    console.log("🆕 User created in DB:", user);
    const inserted = await sql`
      INSERT INTO users (email, full_name, hashed_password, avatar, last_login)
      VALUES (${email}, ${full_name}, ${hashed_password}, ${avatar || '😎'}, NOW())
      RETURNING user_id;
    `;
    const user_id = inserted[0].user_id;
    // Mark as active after successful registration
    await setUserActiveStatus(user.user_id, true);
    console.log("✅ User marked as active after registration:", user.user_id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        google_id: null,
        isactive: true
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
};

// ✅ Login user (no JWT)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Login attempt for:", email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Fetch user
    const user = await findUser(email);
    console.log("🧠 User fetched from DB:", user);

    if (!user) {
      console.log("❌ No user found for email:", email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Google account protection
    if (user.google_id) {
      console.log("⚠️ Tried to log in with Google account using password");
      return res.status(401).json({
        error: 'This account uses Google authentication. Please sign in with Google.'
      });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.hashed_password);
    console.log("🔐 Password match:", validPassword);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 🟡 Debug the isActive check
    console.log("👀 Checking isActive status:", user.isactive, typeof user.isactive);

    if (user.isactive === true) {
      console.log("🚫 User already active, blocking login");
      return res.status(401).json({
        error: 'Already logged in on another device. Please log out from other devices first.'
      });
    }

    // ✅ Mark user as active now
    console.log("🟢 Setting user active status to true...");
    await setUserActiveStatus(user.user_id, true);

    // Update last login time
    await updateLastLogin(user.user_id);
    console.log("🕒 Last login updated for user:", user.user_id);

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        google_id: user.google_id,
        isactive: true,
        last_login: new Date()
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
};
