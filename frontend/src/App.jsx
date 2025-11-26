import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//import GameArena from "./pages/GameArena";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserHomePage from "./pages/UserHomePage";
import GameLobby from './pages/GameLobby'; // Make sure this path is correct
import LobbyPage from './pages/LobbyPage';
import GameArena from './pages/GameArena';
import ProfilePage from "./pages/ProfilePage";
import  {HowToPlay}  from "./pages/Howtoplay";
import  {ContactUs}  from "./pages/ContactUs";
import  {AboutUs}  from "./pages/AboutUs";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/user-home" element={<UserHomePage />} />
        <Route path="/profile/" element={<ProfilePage />} />
         <Route path="/about" element={<AboutUs />} />
  <Route path="/contact" element={<ContactUs />} />
  <Route path="/howto" element={<HowToPlay />} />
        {/* New Route for creating/joining a game */}
     {/*}   <Route path="/lobby" element={<GameLobby />} />*/}


 <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/game/:gameId" element={<GameArena />} />
        {/* This route remains the same, but it will now get its data from the lobby */}
       {/* <Route path="/game/:gameId" element={<GameArena />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
