import { initialiseDatabase } from "../config/initailiseDatabase.js";

console.log("Initializing database tables...");
initialiseDatabase()
    .then(() => {
        console.log("Database initialization complete.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Database initialization failed:", err);
        process.exit(1);
    });
