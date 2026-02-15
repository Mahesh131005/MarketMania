import { sql } from "../config/initailiseDatabase.js";

async function verify() {
    try {
        const count = await sql`SELECT COUNT(*) FROM game_stock_history`;
        console.log(`History records: ${count[0].count}`);

        const sample = await sql`SELECT * FROM game_stock_history LIMIT 3`;
        console.table(sample);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

verify();
