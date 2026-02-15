import { initialiseDatabase } from "../config/initailiseDatabase.js";

console.log("Initializing database (adding history table)...");
initialiseDatabase()
    .then(() => {
        console.log("Database history table initialization complete.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Database initialization failed:", err);
        process.exit(1);
    });
