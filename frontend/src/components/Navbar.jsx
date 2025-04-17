import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from '../store/authStore';
import { Button } from "@/components/ui/button";
import { Star, LogOut, Shield, User, Menu, X } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const NavLinks = ({ isMobile }) => (
    <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex items-center space-x-4'} w-full`}>
      <Link
        to="/auctions"
        className={`text-gray-700 hover:text-indigo-600 ${isMobile ? 'p-2 rounded-md hover:bg-gray-50' : ''}`}
        onClick={closeMenu}
      >
        Auctions
      </Link>
      {user ? (
        <>
          <Link
            to="/create-auction"
            className={`text-gray-700 hover:text-indigo-600 ${isMobile ? 'p-2 rounded-md hover:bg-gray-50' : ''}`}
            onClick={closeMenu}
          >
            Create Auction
          </Link>
          <Link
            to="/dashboard"
            className={`text-gray-700 hover:text-indigo-600 ${isMobile ? 'p-2 rounded-md hover:bg-gray-50' : ''}`}
            onClick={closeMenu}
          >
            Dashboard
          </Link>
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className={`text-gray-700 hover:text-indigo-600 flex items-center gap-1 ${isMobile ? 'p-2 rounded-md hover:bg-gray-50' : ''}`}
              onClick={closeMenu}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
          <Link
            to="/profile"
            className={`text-gray-700 hover:text-indigo-600 ${isMobile ? 'p-2 rounded-md hover:bg-gray-50' : ''}`}
            onClick={closeMenu}
          >
            Profile
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.full_name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <span className="text-sm font-medium">{user.full_name}</span>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </>
      ) : (
        <div className="flex items-center space-x-4">
          <Link to="/login" onClick={closeMenu}>
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/signup" onClick={closeMenu}>
            <Button>Sign Up</Button>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <nav className="bg-white shadow-md sticky top-0 w-full z-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600" onClick={closeMenu}>
              BidBlitz
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-gray-700"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLinks isMobile={false} />
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <NavLinks isMobile={true} />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
