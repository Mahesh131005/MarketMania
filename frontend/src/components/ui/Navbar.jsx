import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent } from './sheet.jsx';
import toast from 'react-hot-toast';
import axios from "../../utils/axios.js";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    try {    await axios.post('/api/auth/logout', {}, { withCredentials: true }); //  call backend to clear cookie
  } catch (err) {
    console.error("Logout API failed", err);
  }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const linkStyle = (path) =>
    `transition ${
      currentPath === path ? 'text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600'
    }`;

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="flex h-16 items-center justify-between">
        {/* Logo - outside the max-width container, pinned to left */}
        <div className="pl-4">
          <Link to="/" className="text-2xl font-bold text-gray-800">
            MarketMania
          </Link>
        </div>

        {/* Right section inside max-width container */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Center links */}
              <div className="flex items-center space-x-6 text-sm font-medium mr-auto ml-10">
                <Link to="/" className={linkStyle('/')}>Home</Link>
                {user && (
                  <>
                    <Link to="/user-home" className={linkStyle('/user-home')}>User Home</Link>
                  </>
                )}
              </div>

              {/* Mobile Menu */}
              <div className="sm:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <div className="flex flex-col space-y-5 mt-6 text-base font-medium">
                      <Link to="/" className={linkStyle('/')}>Home</Link>
                      {user && (
                        <>
                          <Link to="/user-home" className={linkStyle('/user-home')}>User Home</Link>
                          <Link to="/marketplace" className={linkStyle('/marketplace')}>Marketplace</Link>
                          <Link to="/doubt" className={linkStyle('/doubt')}>Doubtplace</Link>
                          <Link to="/profile" className={linkStyle('/profile')}>Profile</Link>
                          <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 w-fit px-0"
                          >
                            Logout
                          </Button>
                        </>
                      )}
                      {!user && (
                        <>
                          <Link to="/login" className="text-blue-600 hover:text-blue-700">Login</Link>
                          <Link to="/register" className="text-blue-600 hover:text-blue-700">Sign Up</Link>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop Right Side */}
              <div className="hidden sm:flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                      <div className="relative">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <span className="font-semibold">{user.full_name}</span>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={() => navigate('/login')}>
                      Login
                    </Button>
                   <Button
                  onClick={() => navigate('/register')}
                     className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                       Sign Up
                </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}