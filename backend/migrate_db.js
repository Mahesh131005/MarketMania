import { sql } from "./config/initailiseDatabase.js";

async function migrate() {
  try {
    console.log("Starting migration...");
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS details TEXT;
    `;
    console.log("Migration successful: added 'details' column to users table.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
