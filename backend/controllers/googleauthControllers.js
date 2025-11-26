import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { linkGoogleAccount } from "../config/loginAndRegisterQueries.js";

import { sql } from "../config/initailiseDatabase.js"
// Configure passport strategies
export const configurePassport = () => {
  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  // Google Strategy if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/googleauth/google/callback",
          scope: ["profile", "email"]
        },
        async function (accessToken, refreshToken, profile, cb) {
          try {
            // Create or update user in database
            const user = await linkGoogleAccount({
              email: profile.emails[0].value,
              full_name: profile.displayName,
              google_id: profile.id
            });

            return cb(null, user);
          } catch (error) {
            return cb(error);
          }
        }
      )
    );
  } else {
    console.log('⚠️ Google OAuth credentials not found in environment variables.');
    console.log('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.');
  }
};

// Controller for initiating Google authentication
export const googleAuth = (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

// Controller for Google authentication callback (no tokens)
export const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/login?error=Google%20authentication%20failed' })(
    req,
    res,
    async (err) => {
      if (err) return next(err);

      try {
        if (!req.user) {
          console.error('OAuth callback error: No user data in request');
          return res.redirect(`${process.env.CLIENT_URL}/login?error=Authentication%20failed%20-%20No%20user%20data`);
        }

        console.log('✅ OAuth user data:', req.user);

        // Optionally update last_login timestamp
        try {
          
          await sql`
            UPDATE users
            SET last_login = NOW()
            WHERE email = ${req.user.email}
          `;
        } catch (dbErr) {
          console.warn('⚠️ Could not update last_login:', dbErr.message);
        }

        // Encode user data for redirect
     // ✅ Safely encode user data for redirect
const userData = encodeURIComponent(JSON.stringify({
  email: req.user.email,
  user_id:req.user.user_id,
  full_name: req.user.full_name,
  google_id: req.user.google_id
}));

const clientURL = process.env.CLIENT_URL;

// ✅ Redirect back to frontend (only user param)
console.log('Redirecting user after successful Google login...');
res.redirect(`${clientURL}/login?user=${userData}`);

      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=Authentication%20failed`);
      }
    }
  );
};
