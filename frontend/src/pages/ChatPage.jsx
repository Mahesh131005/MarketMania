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
import { X, Send, MessageSquare } from "lucide-react";

const backend_url = "http://localhost:3000";

export default function ChatPage({ gameId, chatOpen, setChatOpen, currentRound = 0 }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef(null);

  // Load user from local storage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setCurrentUser(user);
  }, []);

  // Fetch history and connect socket
  useEffect(() => {
    if (gameId) {
      initializeSocket();
      joinGameChat(gameId);

      // Fetch existing messages
      fetch(`${backend_url}/api/game/${gameId}/chats`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(data);
          } else {
            setMessages([]);
          }
        })
        .catch(err => {
          console.error("Error loading chats:", err);
          setMessages([]);
        });

      // Subscribe to real-time messages
      const unsubscribe = subscribeToMessages((msg) => {
        setMessages(prev => [...prev, msg]);

        // Sound and Notification Logic
        const user = JSON.parse(localStorage.getItem("user"));

        // If message is NOT from me
        if (user && msg.username !== user.full_name) {
          // Play sound
          const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
          audio.play().catch(e => console.warn("Audio blocked or failed", e));

          // Set unread if chat is closed
          if (!chatOpen) {
            setHasUnread(true);
          }
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [gameId, chatOpen]); // Re-run if gameId changes. chatOpen dependency ensures we have fresh state for the "unread" check inside the closure, though using a ref for chatOpen would be cleaner, this works for React 18+ auto-batching.

  // Clear unread status when chat opens
  useEffect(() => {
    if (chatOpen) {
      setHasUnread(false);
    }
  }, [chatOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && chatOpen) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentUser) return;

    sendMessage(
      gameId,
      currentUser.user_id,
      currentUser.full_name,
      currentUser.avatar || "👤",
      newMessage,
      currentRound
    );
    setNewMessage("");
  };

  // --- RENDER: Floating Button if Closed ---
  if (!chatOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in zoom-in duration-300">
        <Button
          onClick={() => setChatOpen(true)}
          className="rounded-full h-14 w-14 shadow-xl bg-indigo-600 hover:bg-indigo-700 relative flex items-center justify-center transition-transform hover:scale-110"
        >
          <MessageSquare size={24} className="text-white" />
          {hasUnread && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </Button>
      </div>
    );
  }

  // --- RENDER: Full Chat Window ---
  let lastRound = -1;

  return (
    <div className="fixed right-4 bottom-4 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 flex-col font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white shadow-md">
        <div className="flex flex-col">
          <h3 className="font-bold flex items-center gap-2 text-lg">
            Trading Floor
          </h3>
          <span className="text-xs text-indigo-100 opacity-90">
            {currentRound === 0 ? "Pre-Game Lobby" : `Live: Round ${currentRound}`}
          </span>
        </div>
        <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 bg-gray-50/50">
        <div className="flex flex-col gap-4">
          {messages.map((msg, idx) => {
            const isMe = String(msg.username) === String(currentUser?.full_name); // Robust check
            const msgRound = msg.round_number ?? 0; // Default to 0

            // Only show header if round changes
            const showRoundHeader = msgRound !== lastRound;
            if (showRoundHeader) lastRound = msgRound;

            return (
              <React.Fragment key={idx}>
                {/* Round Separator */}
                {showRoundHeader && (
                  <div className="flex items-center justify-center my-4 opacity-80">
                    <div className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] px-4 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                      {msgRound === 0 ? "🏛️ Lobby" : `🔔 Round ${msgRound}`}
                    </div>
                  </div>
                )}

                <div className={`flex items-end gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-100 select-none cursor-default shrink-0 ${isMe ? "bg-indigo-100" : "bg-white"}`}
                    title={msg.username}
                  >
                    {msg.avatar || "👤"}
                  </div>

                  {/* Bubble Container */}
                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {/* Name (only for others) */}
                    {!isMe && <span className="text-[10px] text-gray-400 font-medium ml-1 mb-1">{msg.username}</span>}

                    {/* Message Bubble */}
                    <div className={`p-3 rounded-2xl text-sm shadow-sm leading-relaxed break-words relative group ${isMe
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                      }`}>
                      {msg.text}

                      {/* Timestamp (visible on hover or always small) */}
                      <div className={`text-[9px] mt-1 text-right opacity-70 ${isMe ? "text-indigo-100" : "text-gray-400"}`}>
                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="rounded-full bg-gray-50 border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 flex-1 pl-4"
        />
        <Button
          size="icon"
          onClick={handleSend}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-md h-10 w-10 shrink-0 transition-transform hover:scale-105 active:scale-95"
          disabled={!newMessage.trim()}
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}