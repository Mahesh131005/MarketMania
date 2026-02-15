import { sql } from "../config/initailiseDatabase.js";

async function checkStocks() {
    try {
        const stocks = await sql`SELECT stock_name, price, last_updated FROM global_stocks LIMIT 5`;
        console.log("Global Stocks Sample:");
        console.table(stocks);
    } catch (err) {
        console.error("Query failed:", err);
    }
}

checkStocks().then(() => process.exit(0));
