import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { useNavigate } from "react-router-dom";

const Spinner = () => (
  <div className="flex items-center justify-center gap-4">
    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-sky-500"></div>
    <span className="text-lg text-gray-600">Calculating final results...</span>
  </div>
);

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const getRankIcon = (rank) => {
  switch (rank) {
    case 1: return "🏆";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return `${rank}.`;
  }
};

const getRankColor = (rank) => {
  switch (rank) {
    case 1: return "text-yellow-600";
    case 2: return "text-gray-500";
    case 3: return "text-orange-600";
    default: return "text-slate-700";
  }
};

export default function FinalLeaderboard({ gameId, isOpen, userId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && gameId) fetchFinalLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, gameId]);

  const fetchFinalLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://localhost:3000/api/game/${gameId}/final-leaderboard`);
      if (!response.ok) throw new Error("Failed to fetch final leaderboard");
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("Error fetching final leaderboard:", err);
      setError("Failed to load final leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => navigate("/user-home");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-4xl mx-auto"
      >
        <Card className="rounded-2xl overflow-hidden shadow-2xl border border-sky-100">
          <CardHeader className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-6">
            <div className="text-center">
              <CardTitle className="text-3xl md:text-4xl font-extrabold">🎉 Game Complete! 🎉</CardTitle>
              <p className="mt-1 text-sm md:text-lg opacity-90">Final Leaderboard</p>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center">
                <Spinner />
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <div className="text-red-500 text-lg mb-6">⚠️ {error}</div>
                <Button onClick={fetchFinalLeaderboard} className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  Retry
                </Button>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-gray-500 text-lg">No final scores available</div>
                <div className="text-gray-400 text-sm mt-2">Something went wrong with score calculation</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Winner card */}
                <motion.div
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center mb-2 p-6 rounded-2xl bg-gradient-to-r from-sky-50 to-white border border-sky-100"
                >
                  <div className="text-4xl md:text-5xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-sky-700 mb-1">
                    Congratulations {leaderboard[0].username}!
                  </div>
                  <div className="text-lg text-gray-600">
                    You won with a net worth of <span className="font-semibold">{formatCurrency(leaderboard[0].final_net_worth)}</span>
                  </div>
                </motion.div>

                {/* Leaderboard list */}
                <div className="space-y-3">
                  {leaderboard.map((player) => {
                    const isYou = player.user_id === userId;
                    const highlightClass = isYou ? "border-indigo-300 bg-indigo-50 shadow" : player.final_rank <= 3 ? "border-yellow-200 bg-yellow-50" : "border-gray-100 bg-white";
                    return (
                      <motion.div
                        key={player.user_id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center justify-between p-5 rounded-2xl border ${highlightClass} transition-transform hover:scale-[1.01]`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`text-3xl font-bold ${getRankColor(player.final_rank)}`}>
                            {getRankIcon(player.final_rank)}
                          </div>
                          <div>
                            <div className={`font-bold text-lg ${isYou ? "text-indigo-700" : "text-gray-800"}`}>
                              {player.username}
                              {isYou && <span className="ml-3 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">You</span>}
                            </div>
                            <div className="text-sm text-gray-500">Final Net Worth</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-2xl font-bold ${isYou ? "text-indigo-700" : "text-gray-800"}`}>
                            {formatCurrency(player.final_net_worth)}
                          </div>
                          <div className="text-xs text-gray-400">Rank #{player.final_rank}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Summary */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <div className="p-5 rounded-2xl bg-sky-50 border border-sky-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Game Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-indigo-600">{leaderboard.length}</div>
                        <div className="text-sm text-gray-600">Players</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(leaderboard[0]?.final_net_worth || 0)}</div>
                        <div className="text-sm text-gray-600">Highest Score</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(leaderboard[leaderboard.length - 1]?.final_net_worth || 0)}</div>
                        <div className="text-sm text-gray-600">Lowest Score</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(
                            leaderboard.reduce((sum, p) => sum + parseFloat(p.final_net_worth || 0), 0) / leaderboard.length
                          )}
                        </div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Exit button */}
                <div className="mt-4 flex justify-center">
                  <Button onClick={handleExit} className="bg-gradient-to-r from-red-500 to-rose-600 px-12 py-3 text-lg">
                    Exit Game
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
