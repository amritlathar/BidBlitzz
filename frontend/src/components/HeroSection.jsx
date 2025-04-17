import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gavel, PlusCircle, Loader2 } from 'lucide-react';
import statsService from '../services/statsService';

const HeroSection = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsService.getPlatformStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-indigo-700 via-purple-700 to-violet-800 rounded-2xl overflow-hidden">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-grid-white/5 bg-grid-pattern-light opacity-10"></div>
      
      {/* Animated floating shapes */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse delay-700"></div>
      
      <div className="relative py-15 px-8 md:px-16 text-white max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
              {stats.activeAuctions} Live Auctions
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              Real-Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">Bidding</span> Marketplace
            </h1>
            
            <p className="text-xl text-white/90 max-w-xl">
              Discover exclusive collectibles and place competitive bids in real-time. Create your own auctions and transform your items into profit.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                onClick={() => navigate('/auctions')}
                size="lg" 
                className="bg-white text-indigo-700 hover:bg-gray-200 font-bold px-6 gap-2 shadow-md"
              >
                Browse Auctions <Gavel size={18} />
              </Button>
              <Button 
                onClick={() => navigate('/create-auction')}
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 font-medium px-6 gap-2"
              >
                Create Auction <PlusCircle size={18} />
              </Button>
            </div>
          </div>
          
          <div className="flex-shrink-0 hidden md:block">
            <div className="relative w-64 h-64 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 shadow-2xl rotate-3 transform hover:rotate-0 transition-transform">
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-green-400 rounded-full shadow-lg z-10"></div>
              <div className="h-full w-full rounded-lg bg-gradient-to-br from-indigo-800/30 to-purple-900/30 flex items-center justify-center">
                <div className="text-center">
                  <Gavel size={48} className="mx-auto mb-4 text-white/80" />
                  <div className="text-xl font-bold">Premium Items</div>
                  <div className="text-sm text-white/70">Bid Now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {loading ? (
            <div className="col-span-4 py-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          ) : (
            <>
              <div>
                <div className="text-3xl font-bold">{stats.activeAuctions}</div>
                <div className="text-white/70">Active Auctions</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.totalBids}</div>
                <div className="text-white/70">Total Bids</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.totalAuctions}</div>
                <div className="text-white/70">Total Auctions</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.totalViews}</div>
                <div className="text-white/70">Total Views</div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;