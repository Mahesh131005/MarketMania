import { useState, useEffect, useCallback } from 'react';

// --- Initial Game Setup ---
const INITIAL_MONEY = 10000;
const ROUND_DURATION_MS = 10000; // A new round happens every 10 seconds

const INITIAL_STOCKS = [
  { name: "Apple", price: 172.25, pe: 28, liabilities: "High", sector: "Tech", volatility: 0.05 },
  { name: "Tesla", price: 184.57, pe: 35, liabilities: "Medium", sector: "Auto", volatility: 0.12 },
  { name: "Microsoft", price: 427.56, pe: 30, liabilities: "Low", sector: "Tech", volatility: 0.04 },
  { name: "Google", price: 177.85, pe: 26, liabilities: "Low", sector: "Tech", volatility: 0.04 },
  { name: "JPMorgan", price: 201.50, pe: 12, liabilities: "High", sector: "Finance", volatility: 0.06 },
  { name: "NVIDIA", price: 121.58, pe: 65, liabilities: "Medium", sector: "Tech", volatility: 0.15 },
];

// --- Simulated News Events ---
const GAME_EVENTS = [
    { text: "Major tech conference unveils groundbreaking AI. Tech stocks are soaring!", sector: "Tech", effect: 0.15, isGood: true },
    { text: "Interest rates are unexpectedly hiked by the Fed. The entire market is feeling the pressure.", sector: "All", effect: -0.08, isGood: false },
    { text: "New government regulations impact the auto industry, causing investor uncertainty.", sector: "Auto", effect: -0.12, isGood: false },
    { text: "A market correction is hitting overvalued companies. Stocks with high P/E ratios are dropping.", type: "peRatio", threshold: 30, effect: -0.10, isGood: false },
    { text: "Global supply chain issues have eased, boosting manufacturers across the board.", sector: "All", effect: 0.05, isGood: true },
    { text: "Major banks report record profits, leading to a rally in the finance sector.", sector: "Finance", effect: 0.10, isGood: true },
    { text: "A revolutionary new chip design has been announced by NVIDIA, investors are ecstatic!", name: "NVIDIA", effect: 0.25, isGood: true },
];

/**
 * A custom React hook to manage the entire state and logic for the stock trading game.
 */
export function useGameLogic() {
  const [round, setRound] = useState(1);
  const [money, setMoney] = useState(INITIAL_MONEY);
  const [stocks, setStocks] = useState(INITIAL_STOCKS);
  const [notices, setNotices] = useState(["Welcome to MarketMania! The market is now open."]);
  const [holdings, setHoldings] = useState(() => {
    // Initialize holdings with 0 for each stock
    const initialHoldings = {};
    INITIAL_STOCKS.forEach(stock => {
      initialHoldings[stock.name] = 0;
    });
    return initialHoldings;
  });

  // --- Core Game Loop ---
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Pick a random event
      const event = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
      
      // 2. Update stock prices based on the event
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          let priceChange = 0;
          // General random market fluctuation for every stock
          const randomFluctuation = (Math.random() - 0.5) * stock.volatility;

          // Check if the event affects this stock
          if (
            event.sector === "All" ||
            event.sector === stock.sector ||
            event.name === stock.name ||
            (event.type === "peRatio" && stock.pe > event.threshold)
          ) {
            priceChange = stock.price * event.effect;
          }
          
          const newPrice = stock.price + priceChange + (stock.price * randomFluctuation);
          // Ensure price doesn't go below zero
          return { ...stock, price: Math.max(0, newPrice) };
        })
      );

      // 3. Add the event to the notices
      const noticePrefix = event.isGood ? '📈 GOOD NEWS:' : '📉 BAD NEWS:';
      setNotices(prevNotices => [`Round ${round + 1}: ${noticePrefix} ${event.text}`, ...prevNotices]);
      
      // 4. Advance the round
      setRound(prevRound => prevRound + 1);

    }, ROUND_DURATION_MS);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(timer);
  }, [round]); // Rerun the effect when the round changes

  // --- Player Actions ---
  const buyStock = useCallback((stockName, quantity) => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return { success: false, message: "Please enter a valid quantity." };
    }

    const stockToBuy = stocks.find(s => s.name === stockName);
    const cost = stockToBuy.price * numQuantity;

    if (money < cost) {
      return { success: false, message: "Not enough money!" };
    }

    setMoney(prevMoney => prevMoney - cost);
    setHoldings(prevHoldings => ({
      ...prevHoldings,
      [stockName]: prevHoldings[stockName] + numQuantity,
    }));
    
    return { success: true, message: `Successfully bought ${numQuantity} of ${stockName}.` };
  }, [money, stocks]);

  const sellStock = useCallback((stockName, quantity) => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
        return { success: false, message: "Please enter a valid quantity." };
    }

    if (holdings[stockName] < numQuantity) {
      return { success: false, message: "You don't own that many shares." };
    }

    const stockToSell = stocks.find(s => s.name === stockName);
    const earnings = stockToSell.price * numQuantity;

    setMoney(prevMoney => prevMoney + earnings);
    setHoldings(prevHoldings => ({
      ...prevHoldings,
      [stockName]: prevHoldings[stockName] - numQuantity,
    }));

    return { success: true, message: `Successfully sold ${numQuantity} of ${stockName}.` };
  }, [holdings, stocks]);


  // --- Derived State (Calculated on the fly) ---
  const portfolioValue = stocks.reduce((total, stock) => {
    const quantityOwned = holdings[stock.name] || 0;
    return total + (quantityOwned * stock.price);
  }, 0);

  const netWorth = money + portfolioValue;

  return { 
    round, 
    money, 
    stocks, 
    holdings, 
    notices, 
    portfolioValue, 
    netWorth, 
    buyStock, 
    sellStock 
  };
}
