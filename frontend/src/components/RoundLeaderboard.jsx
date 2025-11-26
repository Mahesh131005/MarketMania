import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const Spinner = ({ size = 12 }) => (
  <div className="flex items-center justify-center gap-4">
    <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-sky-500`} />
    <span className="text-lg text-gray-600">Loading leaderboard...</span>
  </div>
);

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const getRankIcon = (index) => {
  switch (index) {
    case 0: return "🥇";
    case 1: return "🥈";
    case 2: return "🥉";
    default: return `${index + 1}.`;
  }
};

export default function RoundLeaderboard({ gameId, roundNumber, isOpen, onClose, userId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && gameId && roundNumber) fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, gameId, roundNumber]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://localhost:3000/api/game/${gameId}/leaderboard/${roundNumber}`);
      if (!response.ok) throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(`Failed to load leaderboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="rounded-2xl overflow-hidden shadow-2xl border border-sky-100">
          <CardHeader className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-2xl font-extrabold">🏆 Round {roundNumber} Leaderboard</CardTitle>
              <Button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 px-3 py-2 rounded-lg"
              >
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {loading ? (
              <div className="py-8 flex justify-center">
                <Spinner size={14} />
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
                <Button onClick={fetchLeaderboard} className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2">
                  Retry
                </Button>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-gray-500 text-lg">No scores submitted yet</div>
                <div className="text-gray-400 text-sm mt-2">Waiting for players to submit their scores...</div>
                <div className="mt-4">
                  <Button onClick={fetchLeaderboard} className="bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2">
                    Refresh
                  </Button>
                </div>
                <div className="mt-3 text-xs text-gray-400">Game ID: {gameId} • Round: {roundNumber}</div>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((player, index) => {
                  const isYou = player.user_id === userId;
                  const highlight =
                    isYou
                      ? "border-indigo-300 bg-indigo-50 shadow"
                      : index <= 2
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-gray-100 bg-white";

                  return (
                    <motion.div
                      key={player.user_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: index * 0.03 }}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 ${highlight} transition-transform hover:scale-[1.01]`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-800">{getRankIcon(index)}</div>
                        <div>
                          <div className={`font-semibold text-lg ${isYou ? "text-indigo-700" : "text-gray-800"}`}>
                            {player.username}
                            {isYou && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">You</span>}
                          </div>
                          <div className="text-sm text-gray-500">
                            Cash: {formatCurrency(player.cash_amount)} • Portfolio: {formatCurrency(player.portfolio_value)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xl font-bold ${isYou ? "text-indigo-700" : "text-gray-900"}`}>
                          {formatCurrency(player.net_worth)}
                        </div>
                        <div className="text-xs text-gray-400">Net Worth</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-2">
                Continue Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

