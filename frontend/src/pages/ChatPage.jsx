import React, { useEffect, useState, useRef } from "react";
import {
  initializeSocket,
  joinGameChat,
  sendMessage,
  subscribeToMessages
} from "../services/chatService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { X, Send } from "lucide-react";

const backend_url = "http://localhost:3000";

export default function ChatPage({ gameId, chatOpen, setChatOpen, currentRound = 0 }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user from local storage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setCurrentUser(user);
  }, []);

  // Fetch history and connect socket
  useEffect(() => {
    if (chatOpen && gameId) {
      initializeSocket();
      joinGameChat(gameId);

      // Fetch existing messages safely
      fetch(`${backend_url}/api/game/${gameId}/chats`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then(data => {
          // ✅ SAFETY CHECK: Only set messages if data is actually an array
          if (Array.isArray(data)) {
            setMessages(data);
          } else {
            console.error("Expected array but got:", data);
            setMessages([]); // Fallback to empty array
          }
        })
        .catch(err => {
          console.error("Error loading chats:", err);
          setMessages([]); // Prevent map() crash
        });

      // Subscribe to real-time messages
      const unsubscribe = subscribeToMessages((msg) => {
        setMessages(prev => [...prev, msg]);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [chatOpen, gameId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentUser) return;

    sendMessage(
      gameId,
      currentUser.user_id,
      currentUser.full_name,
      newMessage,
      currentRound // Pass current round
    );
    setNewMessage("");
  };

  if (!chatOpen) return null;

  // --- Group Messages by Round ---
  let lastRound = -1;

  return (
    <div className="fixed right-4 bottom-4 w-80 md:w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
        <h3 className="font-bold flex items-center gap-2">
          💬 Trading Floor
          <span className="bg-indigo-500 text-xs px-2 py-1 rounded-full">
            {currentRound === 0 ? "Lobby" : `Round ${currentRound}`}
          </span>
        </h3>
        <button onClick={() => setChatOpen(false)} className="hover:bg-indigo-500 p-1 rounded">
          <X size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        <div className="flex flex-col gap-3">
          {messages.map((msg, idx) => {
            const isMe = msg.username === currentUser?.full_name;
            const msgRound = msg.round_number ?? 0;
            const showRoundHeader = msgRound !== lastRound;
            if (showRoundHeader) lastRound = msgRound;

            return (
              <React.Fragment key={idx}>
                {showRoundHeader && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                      {msgRound === 0 ? "🏛️ Lobby / Pre-Game" : `🔔 Round ${msgRound}`}
                    </div>
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg shadow-sm border border-gray-100 select-none" title={msg.username}>
                    {msg.avatar || "👤"}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${isMe
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                    }`}>
                    {!isMe && <p className="text-[10px] font-bold text-indigo-500 mb-1">{msg.username}</p>}
                    {msg.text}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Negotiate deals..."
          className="rounded-full bg-gray-50 border-gray-200 focus:ring-indigo-500"
        />
        <Button size="icon" onClick={handleSend} className="rounded-full bg-indigo-600 hover:bg-indigo-700">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}