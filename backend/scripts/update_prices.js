import { updateStockFile } from '../utils/stockFetcher.js';

console.log("Starting stock price update script...");
updateStockFile()
    .then(() => {
        console.log("Script finished successfully.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Script failed:", err);
        process.exit(1);
    });
