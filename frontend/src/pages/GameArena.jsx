import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams, Navigate } from 'react-router-dom';
import ChatPage from './ChatPage';
import RoundLeaderboard from '../components/RoundLeaderboard';
import FinalLeaderboard from '../components/FinalLeaderboard';
import { io } from "socket.io-client";

// --- UI Components (no changes) ---
const Button = ({ children, onClick, variant, className = "", disabled }) => {
  const base = "px-4 py-2 text-sm rounded-md font-semibold text-white shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = variant === "destructive" ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" : variant === "secondary" ? "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500" : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
  return (<button onClick={onClick} className={`${base} ${styles} ${className}`} disabled={disabled}>{children}</button>);
};
const Input = (props) => (<input {...props} className={`p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className}`}/>);
const Card = ({ children, className = "" }) => (<div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>{children}</div>);
const CardHeader = ({ children }) => <div className="p-3 border-b border-gray-200">{children}</div>;
const CardTitle = ({ children }) => <h3 className="text-base font-bold text-gray-900">{children}</h3>;
const CardContent = ({ children }) => <div className="p-3">{children}</div>;
const ScrollArea = ({ children, className = "" }) => (<div className={`overflow-y-auto ${className}`}>{children}</div>);


// --- Main Game Component ---
export default function GameArena() {
  const location = useLocation();
  const { gameId } = useParams();
  const [initialStocks, setInitialStocks] = useState(null);
  const [socket, setSocket] = useState(null);

  const roomSettings = location.state?.roomSettings;

  if (!roomSettings) {
    return <Navigate to="/user-home" replace />;
  }
  
  const [quantity, setQuantity] = useState({});
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRoundLeaderboardOpen, setIsRoundLeaderboardOpen] = useState(false);
  const [isFinalLeaderboardOpen, setIsFinalLeaderboardOpen] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showRoundEndModal, setShowRoundEndModal] = useState(false);

  const [round, setRound] = useState(0);
  const [money, setMoney] = useState(parseInt(roomSettings.initialMoney, 10));
  const [stocks, setStocks] = useState([]);
  const [notices, setNotices] = useState(["Waiting for the game to start..."]);
  const [holdings, setHoldings] = useState({});
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [netWorth, setNetWorth] = useState(parseInt(roomSettings.initialMoney, 10));

  const moneyRef = useRef(money);
  const portfolioValueRef = useRef(portfolioValue);
  const netWorthRef = useRef(netWorth);

  useEffect(() => {
    moneyRef.current = money;
    portfolioValueRef.current = portfolioValue;
    netWorthRef.current = netWorth;
  });

  const submitScore = useCallback(async (roundNumber) => {
    if (!currentUserId || !gameId) return;
    setIsSubmittingScore(true);
    const scoreData = {
      userId: currentUserId,
      roundNumber: roundNumber,
      cashAmount: moneyRef.current,
      portfolioValue: portfolioValueRef.current,
      netWorth: netWorthRef.current
    };
    try {
      const response = await fetch(`http://localhost:3000/api/game/${gameId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      });
       if (!response.ok) throw new Error('Failed to submit score to server');
    } catch (error) {
      console.error('Error submitting score:', error);
    } finally {
      setIsSubmittingScore(false);
    }
  }, [currentUserId, gameId]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);
    newSocket.emit('join-lobby', gameId);

    const fetchInitialStocks = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/game/${gameId}/stocks`);
        if (!res.ok) throw new Error("Failed to fetch game stocks");
        const data = await res.json();
        const parsedData = data.map(stock => ({
          ...stock,
          price: parseFloat(stock.price),
          pe: parseFloat(stock.pe),
          volatility: parseFloat(stock.volatility),
          totalVolume: parseInt(stock.total_volume, 10) || stock.totalVolume
        }));
        setInitialStocks(parsedData);
        setStocks(parsedData);
        const initialHoldings = {};
        parsedData.forEach(s => initialHoldings[s.name] = 0);
        setHoldings(initialHoldings);
      } catch (error) {
        console.error(error);
      }
    }
    fetchInitialStocks();

    newSocket.on('new-round', (newRound) => {
      if (newRound > 1) submitScore(newRound - 1);
      setRound(newRound);
    });
    newSocket.on('news-update', (newNotices) => setNotices(newNotices));
    newSocket.on('price-update', (updatedStocks) => {
      setStocks(updatedStocks);
      setShowRoundEndModal(true);
      setTimeout(() => {
        setShowRoundEndModal(false);
        if (round >= 1) setIsRoundLeaderboardOpen(true);
      }, 3000);
    });
    newSocket.on('game-over', () => {
      setGameCompleted(true);
      submitFinalScore();
    });

    return () => {
      newSocket.off('new-round');
      newSocket.off('news-update');
      newSocket.off('price-update');
      newSocket.off('game-over');
      newSocket.disconnect();
    }
  }, [gameId, submitScore]);

  // --- SHORT/LONG ---: Updated portfolio and net worth calculation
  useEffect(() => {
    if (!stocks || stocks.length === 0) return;

    let longValue = 0;
    let shortLiability = 0;

    stocks.forEach(stock => {
        const quantity = holdings[stock.name] || 0;
        if (quantity > 0) {
            longValue += quantity * stock.price;
        } else if (quantity < 0) {
            shortLiability += Math.abs(quantity) * stock.price;
        }
    });

    const netPortfolioValue = longValue - shortLiability;
    setPortfolioValue(netPortfolioValue);
    setNetWorth(money + netPortfolioValue);
  }, [stocks, holdings, money]);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      const user = JSON.parse(userString);
      setCurrentUserId(user.user_id);
    }
  }, []);

  const submitFinalScore = async () => {
    if (!currentUserId || !gameId) return;
    await submitScore(parseInt(roomSettings.numRounds, 10));
    setIsSubmittingScore(true);
    try {
      await fetch(`http://localhost:3000/api/game/${gameId}/final-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, finalNetWorth: netWorthRef.current }),
      });
      setIsFinalLeaderboardOpen(true);
    } catch (error) {
      console.error('Error submitting final score:', error);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleQuantityChange = (stock, val) => {
    if (/^\d*$/.test(val)) setQuantity({ ...quantity, [stock]: val });
  };

  const showFeedback = (message, type) => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: "", type: "" }), 3000);
  };

  // --- SHORT/LONG ---: Updated trading logic to handle long and short positions
  const buyStock = useCallback((stockName, quantity) => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) return { success: false, message: "Invalid quantity." };

    const stockToTrade = stocks.find((s) => s.name === stockName);
    if (!stockToTrade) return { success: false, message: "Stock not found." };
    
    const cost = stockToTrade.price * numQuantity;
    const currentHolding = holdings[stockName] || 0;

    // If we are long, or have no position, buying costs money from our cash pile
    if (currentHolding >= 0 && money < cost) {
      return { success: false, message: "Not enough money!" };
    }

    // Buying costs money (to buy shares from market), even if it's to cover a short
    setMoney((m) => m - cost);
    setHoldings((h) => ({
      ...h,
      [stockName]: (h[stockName] || 0) + numQuantity,
    }));
    
    const action = currentHolding < 0 ? "Covered" : "Bought";
    return { success: true, message: `${action} ${numQuantity} of ${stockName}.` };
  }, [money, stocks, holdings]);

  const sellStock = useCallback((stockName, quantity) => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) return { success: false, message: "Invalid quantity." };
    
    const stockToTrade = stocks.find((s) => s.name === stockName);
    if (!stockToTrade) return { success: false, message: "Stock not found." };

    const currentHolding = holdings[stockName] || 0;
    if (currentHolding < numQuantity) {
      return { success: false, message: "Not enough shares to sell." };
    }

    const proceeds = stockToTrade.price * numQuantity;
    setMoney((m) => m + proceeds);
    setHoldings((h) => ({
      ...h,
      [stockName]: currentHolding - numQuantity,
    }));

    return { success: true, message: `Sold ${numQuantity} of ${stockName}.` };
  }, [stocks, holdings]);

  const shortStock = useCallback((stockName, quantity) => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) return { success: false, message: "Invalid quantity." };

    const stockToTrade = stocks.find((s) => s.name === stockName);
    if (!stockToTrade) return { success: false, message: "Stock not found." };

    // For simplicity, no margin check. In a real scenario, you'd check if player has enough collateral.
    const proceeds = stockToTrade.price * numQuantity;

    // When shorting, you receive cash immediately from selling the "borrowed" shares
    setMoney((m) => m + proceeds);
    // Holdings become negative
    setHoldings((h) => ({
      ...h,
      [stockName]: (h[stockName] || 0) - numQuantity,
    }));

    return { success: true, message: `Shorted ${numQuantity} of ${stockName}.` };
  }, [stocks, holdings]);


  const handleAction = (actionFn, stockName) => {
    const result = actionFn(stockName, quantity[stockName] || 0);
    showFeedback(result.message, result.success ? "success" : "error");
  };

  // --- SHORT/LONG ---: Updated holdingsList to identify position type
  const holdingsList = Object.entries(holdings)
    .filter(([_, qty]) => qty !== 0)
    .map(([name, qty]) => {
        const stock = stocks.find((s) => s.name === name);
        const currentPrice = stock?.price || 0;
        const value = currentPrice * qty; // This will be negative for short positions
        const positionType = qty > 0 ? "Long" : "Short";
        return { name, qty, value, positionType, currentPrice };
    });

  if (!initialStocks) return <div className="flex items-center justify-center h-screen">Loading game data...</div>

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-sans text-gray-800">
      <aside className="w-full md:w-1/3 lg:w-1/4 p-4 bg-white border-r border-gray-200 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-indigo-700">Dalal Street Simulator</h2>
        <div className="text-base p-3 bg-gray-100 rounded-lg shadow-inner">
          <p>Round: <span className="font-semibold">{round}</span> of <span className="font-semibold">{roomSettings.numRounds}</span></p>
          <p>Cash: <span className="font-semibold text-green-600">₹{money.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></p>
          {/* --- SHORT/LONG ---: Changed "Holdings" to "Portfolio Value" for clarity */}
          <p>Portfolio Value: <span className="font-semibold">₹{portfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></p>
          <p className="text-lg font-bold">Net Worth: <span className="text-indigo-800">₹{netWorth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></p>
        </div>
        <ScrollArea className="flex-1 -mx-4 px-4">
          {stocks.map((stock) => (
            <Card key={stock.name} className="mb-3">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{stock.name}</CardTitle>
                  <span className="text-lg font-bold text-gray-800">₹{stock.price.toFixed(2)}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>PE: {stock.pe}</span>
                  {/* --- SHORT/LONG ---: Show position type in owned display */}
                  <span className="font-semibold">
                    Position: {holdings[stock.name] > 0 ? `Long ${holdings[stock.name]}` : holdings[stock.name] < 0 ? `Short ${Math.abs(holdings[stock.name])}`: 'None'}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Input type="text" placeholder="Qty" className="w-16 text-center" value={quantity[stock.name] || ""} onChange={(e) => handleQuantityChange(stock.name, e.target.value)} />
                  <Button onClick={() => handleAction(buyStock, stock.name)}>Buy</Button>
                  <Button variant="destructive" onClick={() => handleAction(sellStock, stock.name)}>Sell</Button>
                  {/* --- SHORT/LONG ---: Added a Short button */}
                  <Button variant="secondary" onClick={() => handleAction(shortStock, stock.name)}>Short</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </aside>

      <main className="flex-1 p-6 flex flex-col gap-6">
        <div className="flex items-center justify-end gap-4">
            <Button 
              variant="secondary" 
              onClick={() => setIsRoundLeaderboardOpen(true)}
              disabled={isSubmittingScore || round < 1}
            >
              📊 Round Leaderboard
            </Button>
           <Button variant="secondary" onClick={() => setIsChatOpen(true)}>💬 Chat</Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Market News Feed</h2>
          <ScrollArea className="h-80 border rounded-lg p-3 bg-white shadow-inner">
            {notices.map((notice, index) => {
              const colorClass = "bg-gray-50 text-gray-700";
              return (<p key={index} className={`mb-2 p-2 text-sm rounded-md ${colorClass}`}>{notice}</p>);
            })}
          </ScrollArea>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">My Portfolio</h2>
          <Card className="p-3 h-full">
            <ScrollArea className="h-full">
              {holdingsList.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {/* --- SHORT/LONG ---: Updated portfolio rendering */}
                  {holdingsList.map((item) => (
                    <li key={item.name} className={`flex justify-between items-center p-2 rounded-md ${item.positionType === 'Short' ? 'bg-red-50' : 'bg-green-50'}`}>
                      <div>
                        <span className="font-bold text-base">{item.name}</span>
                        <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${item.positionType === 'Short' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                          {item.positionType}
                        </span>
                      </div>
                      <span>{Math.abs(item.qty)} shares</span>
                      <span className={`font-semibold ${item.value >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        Value: ₹{item.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 pt-10">You do not have any open positions. Start trading!</p>
              )}
            </ScrollArea>
          </Card>
        </div>
      </main>

      {feedback.message && (
        <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-2xl text-white font-bold transition-opacity duration-300 ${feedback.message ? "opacity-100" : "opacity-0"} ${feedback.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {feedback.message}
        </div>
      )}
      
      {showRoundEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-10 rounded-xl shadow-2xl text-center transform animate-scale-in">
                <h2 className="text-4xl font-bold text-indigo-700">Round {round - 1} Completed!</h2>
                <p className="mt-2 text-gray-600">Updating prices and preparing next round...</p>
            </div>
        </div>
      )}

      <RoundLeaderboard
        gameId={gameId}
        roundNumber={round > 1 ? round - 1 : 1}
        isOpen={isRoundLeaderboardOpen}
        onClose={() => setIsRoundLeaderboardOpen(false)}
        userId={currentUserId}
      />

      <FinalLeaderboard
        gameId={gameId}
        isOpen={isFinalLeaderboardOpen}
        userId={currentUserId}
      />

      <ChatPage
        gameId={gameId}
        chatOpen={isChatOpen}
        setChatOpen={setIsChatOpen}
      />
    </div>
  );
}