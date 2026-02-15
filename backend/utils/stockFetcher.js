import axios from 'axios';
import * as cheerio from 'cheerio';
import { sql } from "../config/initailiseDatabase.js";

// Mapping from stock name to Google Finance ticker
const TICKER_MAPPING = {
    "Reliance Industries (RIL)": "RELIANCE:NSE",
    "HDFC Bank": "HDFCBANK:NSE",
    "ICICI Bank": "ICICIBANK:NSE",
    "Infosys": "INFY:NSE",
    "Bharti Airtel": "BHARTIARTL:NSE",
    "Larsen & Toubro": "LT:NSE",
    "ITC": "ITC:NSE",
    "Tata Consultancy Services": "TCS:NSE",
    "State Bank of India (SBI)": "SBIN:NSE",
    "Axis Bank": "AXISBANK:NSE",
    "Bajaj Finance": "BAJFINANCE:NSE",
    "Hindustan Unilever": "HINDUNILVR:NSE",
    "Maruti Suzuki": "MARUTI:NSE",
    "Mahindra & Mahindra": "M_M:NSE",
    "Kotak Bank": "KOTAKBANK:NSE",
    "Sun Pharmaceutical": "SUNPHARMA:NSE",
    "HCL Technologies": "HCLTECH:NSE",
    "UltraTech Cement": "ULTRACEMCO:NSE",
    "Adani Ports": "ADANIPORTS:NSE",
    "Apollo Hospitals": "APOLLOHOSP:NSE",
    "Asian Paints": "ASIANPAINT:NSE",
    "Bajaj Auto": "BAJAJ_AUTO:NSE",
    "Bajaj Finserv": "BAJAJFINSV:NSE",
    "Bharat Electronics (BEL)": "BEL:NSE",
    "Cipla": "CIPLA:NSE",
    "Coal India": "COALINDIA:NSE",
    "Dr. Reddy's Laboratories": "DRREDDY:NSE",
    "Eicher Motors": "EICHERMOT:NSE",
    "Grasim Industries": "GRASIM:NSE",
    "HDFC Life Insurance": "HDFCLIFE:NSE",
    "Hero MotoCorp": "HEROMOTOCO:NSE",
    "Hindalco Industries": "HINDALCO:NSE",
    "IndusInd Bank": "INDUSINDBK:NSE",
    "Jio Financial Services": "JIOFIN:NSE",
    "JSW Steel": "JSWSTEEL:NSE",
    "Nestle India": "NESTLEIND:NSE",
    "NTPC": "NTPC:NSE",
    "ONGC": "ONGC:NSE",
    "Power Grid Corporation of India": "POWERGRID:NSE",
    "SBI Life Insurance": "SBILIFE:NSE",
    "Shriram Finance": "SHRIRAMFIN:NSE",
    "Tata Consumer Products": "TATACONSUM:NSE",
    "Tata Motors": "TATAMOTORS:NSE",
    "Tata Steel": "TATASTEEL:NSE",
    "Tech Mahindra": "TECHM:NSE",
    "Titan Company": "TITAN:NSE",
    "Trent": "TRENT:NSE",
    "Wipro": "WIPRO:NSE",
    "Zomato": "ZOMATO:NSE",
    "Adani Enterprises": "ADANIENT:NSE"
};

/**
 * Fetches the current price of a stock from Google Finance.
 * @param {string} symbol - Google Finance ticker (e.g., "RELIANCE:NSE")
 * @returns {Promise<number|null>} - The price or null if failed
 */
async function fetchStockPrice(symbol) {
    try {
        const url = `https://www.google.com/finance/quote/${symbol}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const priceElement = $('.YMlKec.fxKbKc').first();
        if (priceElement.length) {
            const priceText = priceElement.text().replace(/[^0-9.]/g, '');
            return parseFloat(priceText);
        }
        return null;
    } catch (error) {
        // console.error(`Error fetching price for ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Reads the latest stock prices from the database.
 * @returns {Promise<Array>} - List of stocks with DB prices
 */
export async function getGlobalStockPrices() {
    try {
        const stocks = await sql`
            SELECT 
                stock_name as name, 
                price, 
                pe_ratio as pe, 
                sectors, 
                total_volume as "totalVolume", 
                volatility 
            FROM global_stocks
        `;
        return stocks;
    } catch (err) {
        console.error("Failed to read global stocks from DB:", err);
        return [];
    }
}

/**
 * Updates global stock prices in the database using live data.
 */
export async function updateGlobalStockPrices() {
    console.log("Updating global stock prices from Google Finance...");

    // Get list of stocks from DB to know what to update
    const stocks = await getGlobalStockPrices();

    if (stocks.length === 0) {
        console.warn("No stocks found in database to update.");
        return;
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
        const batch = stocks.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (stock) => {
            const ticker = TICKER_MAPPING[stock.name];
            if (ticker) {
                const livePrice = await fetchStockPrice(ticker);
                if (livePrice !== null && !isNaN(livePrice)) {
                    await sql`
                        UPDATE global_stocks 
                        SET price = ${livePrice}, last_updated = NOW()
                        WHERE stock_name = ${stock.name}
                    `;
                }
            }
        }));
        // Small delay to behave nicely
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("Global stock prices updated successfully in DB.");
}
