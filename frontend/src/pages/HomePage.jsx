import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import auctionService from '../services/auctionService';
import AuctionCard from '../components/AuctionCard';
import HeroSection from '../components/HeroSection';
import useAuthStore from '../store/authStore';

const HomePage = () => {
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch live auctions
        const live = await auctionService.getAuctionsByStatus('live');
        setLiveAuctions(live);
        
        // For featured auctions, get all auctions and sort by view count
        const allAuctions = await auctionService.getAllAuctions();
        const featured = allAuctions
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 3);
        setFeaturedAuctions(featured);
      } catch (error) {
        console.error('Error fetching auctions:', error);
        setError(error.response?.data?.message || 'Failed to load auctions');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchAuctions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const renderErrorMessage = () => (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  const renderLoadingMessage = () => (
    <div className="text-center py-12">
      <p className="text-lg">Loading auctions...</p>
    </div>
  );

  const renderEmptyMessage = () => (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-gray-500 mb-4">No auctions available at the moment.</p>
        <Button onClick={() => navigate('/create-auction')}>
          Create the First Auction
        </Button>
      </CardContent>
    </Card>
  );

  const renderAuctionGrid = (auctions, gridCols = 3) => (
    <div className={`grid grid-cols-1 md:grid-cols-${gridCols} gap-6`}>
      {auctions.map(auction => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );

  return (
    <div className="space-y-12">
      <HeroSection/>
      
      {!user ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Please sign in to view auctions</p>
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      ) : error ? (
        renderErrorMessage()
      ) : (
        <>
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Featured Auctions</h2>
            </div>
            
            {loading ? renderLoadingMessage() : 
             featuredAuctions.length > 0 ? renderAuctionGrid(featuredAuctions) : null}
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Live Auctions</h2>
              <Button variant="outline" onClick={() => navigate('/auctions')}>
                View All
              </Button>
            </div>
            
            {loading ? renderLoadingMessage() : 
             liveAuctions.length > 0 ? renderAuctionGrid(liveAuctions.slice(0, 6)) : 
             renderEmptyMessage()}
          </section>
          
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-indigo-50 p-6 rounded-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Auctions</h3>
              <p className="text-gray-600 mb-4">
                List your items for auction with a starting price and duration of your choice.
              </p>
              <Button variant="outline" className="mt-auto" onClick={() => navigate('/create-auction')}>
                Get Started
              </Button>
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Bid & Win</h3>
              <p className="text-gray-600 mb-4">
                Participate in live auctions and win items at competitive prices.
              </p>
              <Button variant="outline" className="mt-auto" onClick={() => navigate('/auctions')}>
                Browse Auctions
              </Button>
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600 mb-4">
                Monitor your auctions and bids in real-time with a comprehensive dashboard.
              </p>
              <Button variant="outline" className="mt-auto" onClick={() => navigate('/dashboard')}>
                View Dashboard
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;