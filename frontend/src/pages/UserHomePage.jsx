import React from "react";
import RoomControls from "./RoomControls";
import { Sidebar } from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { Home, User, BookOpen, Info, Phone, Gamepad2, LogOut } from "lucide-react";
import CreateRoom from "./CreateRoom";
import { motion } from "framer-motion";

function UserHomePage() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-sky-50 to-white">
      {/* Sidebar */}
      <Sidebar className="bg-white shadow-lg border-r border-sky-100" />

      {/* Main Content Area */}
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-lg rounded-2xl p-6 border border-sky-100"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-sky-700 mb-2">
            Welcome to Market Mania!
          </h1>
          <p className="text-gray-600 text-lg">
            Select a room from the available rooms by ID or create a new room. Compete with friends and master the market!
          </p>
        </motion.div>

        {/* Room Controls: Input + Join + Create */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white shadow-lg rounded-2xl p-6 border border-sky-100"
        >
          <RoomControls />
        </motion.div>

        {/* Optional: Featured Rooms or Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-sky-50 p-4 rounded-xl shadow-md border border-sky-100">
            <h2 className="font-semibold text-lg text-sky-700">Pro Tip</h2>
            <p className="text-gray-600 mt-1 text-sm">
              Check room leaderboards frequently to track your progress and optimize trading strategies.
            </p>
          </div>
          <div className="bg-sky-50 p-4 rounded-xl shadow-md border border-sky-100">
            <h2 className="font-semibold text-lg text-sky-700">Feature</h2>
            <p className="text-gray-600 mt-1 text-sm">
              Create private rooms with friends to compete and earn badges on the seasonal leaderboard.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default UserHomePage;
