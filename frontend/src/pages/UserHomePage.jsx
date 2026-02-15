import React, { useState, useEffect } from "react";
import RoomControls from "./RoomControls";
import { Sidebar } from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { Home, User, BookOpen, Info, Phone, Gamepad2, LogOut } from "lucide-react";
import CreateRoom from "./CreateRoom";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

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
          <div className="bg-sky-50 p-4 rounded-xl shadow-md border border-sky-100 col-span-1 md:col-span-2">
            <h2 className="font-semibold text-lg text-sky-700 mb-4">Public Rooms</h2>
            <PublicRoomsList />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function PublicRoomsList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3000/api/game/public')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRooms(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch rooms", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading rooms...</p>;
  if (rooms.length === 0) return <p className="text-sm text-gray-500">No public rooms available. Create one!</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map(room => (
        <div key={room.room_id} className="bg-white p-4 rounded-lg shadow-sm border border-sky-100 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-800">{room.room_name}</h3>
            <p className="text-xs text-gray-500">Players: {room.current_players}/{room.max_players}</p>
          </div>
          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={() => navigate(`/lobby/${room.room_id}`)}
            disabled={room.current_players >= room.max_players}
          >
            {room.current_players >= room.max_players ? "Full" : "Join"}
          </Button>
        </div>
      ))}
    </div>
  );
}

export default UserHomePage;
