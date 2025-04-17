import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import {
  LoginPage,
  SignupPage,
  AuctionsPage,
  CreateAuctionPage,
  LiveAuctionPage,
  DashboardPage,
  HomePage,
  AdminDashboardPage,
  UserProfilePage,
} from './pages/index.js';
import useAuthStore from './store/authStore.js';
import { PageLoader } from './components/ui/loader.jsx';

function App() {
  const { checkAuth, user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  if (!isInitialized) {
    return <PageLoader />;
  }

  return (
    <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" reverseOrder={false} />
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public routes */}
              <Route
                path="login"
                element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="signup"
                element={!user ? <SignupPage /> : <Navigate to="/dashboard" replace />}
              />

              {/* Protected routes */}
              <Route
                path="/"
                element={user ? <HomePage /> : <Navigate to="/login" state={{ from: "/" }} replace />}
              />
              <Route
                path="auctions"
                element={user ? <AuctionsPage /> : <Navigate to="/login" state={{ from: "/auctions" }} replace />}
              />
              
              <Route
                path="create-auction"
                element={user ? <CreateAuctionPage /> : <Navigate to="/login" state={{ from: "/create-auction" }} replace />}
              />
              
              <Route
                path="auction/:id"
                element={user ? <LiveAuctionPage /> : <Navigate to="/login" state={{ from: "/auction/:id" }} replace />}
              />
              
              <Route
                path="dashboard"
                element={user ? <DashboardPage /> : <Navigate to="/login" state={{ from: "/dashboard" }} replace />}
              />
              
              <Route
                path="profile"
                element={user ? <UserProfilePage /> : <Navigate to="/login" state={{ from: "/profile" }} replace />}
              />
              
              <Route
                path="admin"
                element={
                  user?.role === 'admin' ? (
                    <AdminDashboardPage />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            </Routes>
          </div>
        </div>
    </Router>
  );
}

export default App;