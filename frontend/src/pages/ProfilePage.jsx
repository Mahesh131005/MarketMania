import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Sidebar } from '../components/ui/sidebar';
import { motion } from 'framer-motion';
// Imports for Edit Profile Modal
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0, history: [] });
    
    // State for Edit Profile
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editAvatar, setEditAvatar] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
            // Initialize edit state fields
            setEditName(storedUser.full_name || "");
            setEditAvatar(storedUser.avatar || "😎");
            
            fetchProfileData(storedUser.user_id);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchProfileData = async (userId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/user/profile/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                console.error("Failed to fetch profile data");
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleUpdateProfile = async () => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) return;

        try {
            const response = await fetch(`http://localhost:3000/api/user/profile/${storedUser.user_id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ fullName: editName, avatar: editAvatar })
            });
            
            if (response.ok) {
                // Update local storage and UI
                const updated = { ...storedUser, full_name: editName, avatar: editAvatar };
                localStorage.setItem("user", JSON.stringify(updated));
                setUser(updated);
                setIsEditing(false);
            } else {
                console.error("Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-sky-50 to-white">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {/* Header Section with Edit & Logout */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                        <motion.h1 
                            className="text-4xl md:text-5xl font-extrabold text-sky-700"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >My Profile</motion.h1>
                        
                        <div className="flex gap-2">
                             {/* Edit Profile Modal */}
                             <Dialog open={isEditing} onOpenChange={setIsEditing}>
                                  <DialogTrigger asChild>
                                      <Button variant="outline" onClick={() => { 
                                          setEditName(user.full_name); 
                                          setEditAvatar(user.avatar || '😎'); 
                                      }}>Edit Profile</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                      <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                                      <div className="space-y-4 py-4">
                                          <div>
                                             <label className="text-sm font-medium mb-1 block">Full Name</label>
                                             <Input value={editName} onChange={e => setEditName(e.target.value)} />
                                          </div>
                                          <div>
                                             <label className="text-sm font-medium mb-1 block">Avatar (Emoji)</label>
                                             <div className="flex gap-2 mt-2">
                                                {['😎','🚀','🦁','💎','🤖'].map(emoji => (
                                                    <button 
                                                        key={emoji} 
                                                        onClick={() => setEditAvatar(emoji)} 
                                                        className={`text-2xl p-2 rounded transition-colors ${editAvatar === emoji ? 'bg-sky-100 ring-2 ring-sky-300' : 'hover:bg-gray-100'}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                             </div>
                                          </div>
                                          <Button onClick={handleUpdateProfile} className="w-full mt-2">Save Changes</Button>
                                      </div>
                                  </DialogContent>
                               </Dialog>

                            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
                        </div>
                    </div>

                    {/* User Info Card */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <Card className="mb-8 border border-sky-100 shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4">
                                    {/* Display Avatar */}
                                    <div className="text-4xl bg-gray-50 p-3 rounded-full border border-sky-100 shadow-sm">
                                        {user.avatar || '😎'}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="text-lg font-semibold text-gray-800">{user.full_name}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-lg font-semibold text-gray-800">{user.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Last Login</p>
                                    <p className="text-lg font-semibold text-gray-800">{new Date(user.last_login).toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
                        <Card className="border border-sky-100 shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle>Games Played</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-sky-700">{stats.gamesPlayed}</p>
                            </CardContent>
                        </Card>
                        <Card className="border border-sky-100 shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle>Wins</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-green-500">{stats.wins}</p>
                            </CardContent>
                        </Card>
                        <Card className="border border-sky-100 shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle>Learning</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <Button className="bg-sky-600 hover:bg-sky-700 text-white">Start Learning</Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Game History */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
                        <Card className="border border-sky-100 shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle>Recent Game History (Last 5)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {stats.history.length > 0 ? (
                                    <ul className="space-y-4">
                                        {stats.history.map((game, index) => (
                                            <li key={index} className="flex items-center justify-between p-4 bg-sky-50 rounded-xl border border-sky-100">
                                                <div>
                                                    <p className="font-semibold text-gray-800">Game ID: {game.game_id}</p>
                                                    <p className="text-sm text-gray-500">Finished on: {new Date(game.game_completed_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className={`text-lg font-bold ${game.final_rank === 1 ? 'text-green-500' : 'text-gray-600'}`}>
                                                    Rank: #{game.final_rank}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500">No recent games to show.</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;