import React from "react";
import { Button } from "./button"; // shadcn/ui Button
import { Home, User, BookOpen, Info, Phone, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export const Sidebar = () => {
  const navigate = useNavigate();

  const handleHome=async()=>{
    navigate('/user-home');
  }
  // Frontend-only logout

 const handleLogout = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const user_id = storedUser.user_id;

    const backend_url = "http://localhost:3000";

    if (!user_id) {
      console.warn("No user_id found in localStorage — skipping backend logout.");
    } else {
      console.log("Logging out user:", user_id);

      const res = await fetch(`${backend_url}/api/auth/logoutuser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });

      const data = await res.json();
      console.log("Logout response:", data);
    }

    // Clear local storage after backend confirmation
    localStorage.removeItem("user");
    localStorage.removeItem("redirectUrl");

    navigate("/login");
  } catch (err) {
    console.error("Error during logout:", err);
    // Still clear local storage and navigate, even if backend call fails
    localStorage.removeItem("user");
    localStorage.removeItem("redirectUrl");
    navigate("/login");
  }
};


  return (
    <div className="w-64 h-screen bg-white shadow-md p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-6">Market Mania</h2>

      <Button variant="ghost" className="flex items-center gap-2 mb-2" onClick={() => navigate('/profile')}>
        <User size={18} /> Profile
      </Button>
      <Button variant="ghost" className="flex items-center gap-2 mb-2"  onClick={handleHome}>
        <BookOpen size={18} /> UserHome
      </Button>
     <Button asChild variant="ghost" className="flex items-center gap-2 mb-2">
  <Link to="/about">
    <Info size={18} /> About Us
  </Link>
</Button>

<Button asChild variant="ghost" className="flex items-center gap-2 mb-2">
  <Link to="/contact">
    <Phone size={18} /> Contact Us
  </Link>
</Button>
      <Button asChild variant="ghost" className="flex items-center gap-2 mb-2">
  <Link to="/howto">
    <Home size={18} /> How to Play
  </Link>
</Button>

      <Button
        variant="ghost"
        className="flex items-center gap-2 mt-auto"
        onClick={handleLogout}
      >
        <LogOut size={18} /> Logout
      </Button>
    </div>
  );
};