import { sql } from "../config/initailiseDatabase.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPANY_SECTORS_PATH = path.join(__dirname, '../../frontend/src/Companysectors.json');

async function migrateStocks() {
    console.log("Starting stock migration...");
    try {
        const fileContent = fs.readFileSync(COMPANY_SECTORS_PATH, 'utf-8');
        const stocks = JSON.parse(fileContent);

        for (const stock of stocks) {
            await sql`
                INSERT INTO global_stocks (stock_name, price, pe_ratio, sectors, total_volume, volatility, last_updated)
                VALUES (${stock.name}, ${stock.price}, ${stock.pe}, ${stock.sectors}, ${stock.totalVolume}, ${stock.volatility}, NOW())
                ON CONFLICT (stock_name) 
                DO UPDATE SET 
                    price = ${stock.price},
                    pe_ratio = ${stock.pe},
                    sectors = ${stock.sectors},
                    total_volume = ${stock.totalVolume},
                    volatility = ${stock.volatility},
                    last_updated = NOW()
            `;
        }
        console.log(`Migrated ${stocks.length} stocks successfully.`);
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrateStocks().then(() => process.exit(0));
