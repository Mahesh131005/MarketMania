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
             className="rounded-full h-14 w-14 shadow-xl bg-indigo-600 hover:bg-indigo-700 relative flex items-center justify-center"
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
    <div className="fixed right-4 bottom-4 w-80 md:w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shadow-md">
        <h3 className="font-bold flex items-center gap-2">
          💬 Trading Floor
          <span className="bg-indigo-500 border border-indigo-400 text-xs px-2 py-1 rounded-full shadow-sm">
            {currentRound === 0 ? "Lobby" : `Round ${currentRound}`}
          </span>
        </h3>
        <button onClick={() => setChatOpen(false)} className="hover:bg-indigo-500 p-1 rounded transition-colors">
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
                {/* Round Separator */}
                {showRoundHeader && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide shadow-sm">
                      {msgRound === 0 ? "🏛️ Lobby / Pre-Game" : `🔔 Round ${msgRound}`}
                    </div>
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div 
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm shadow-sm border border-gray-200 select-none cursor-default" 
                    title={msg.username}
                  >
                    {msg.avatar || "👤"}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm transition-all ${isMe
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                    }`}>
                    
                    {/* Header inside bubble for others */}
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                        {!isMe && <span className="text-[11px] font-bold text-indigo-600">{msg.username}</span>}
                        <span className={`text-[9px] ${isMe ? "text-indigo-200" : "text-gray-400"}`}>
                            {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>

                    <p className="leading-relaxed break-words">{msg.text}</p>
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
          className="rounded-full bg-gray-50 border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <Button size="icon" onClick={handleSend} className="rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-md">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}