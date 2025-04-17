import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useSocketStore from '../store/socketStore.js';
import auctionService from '../services/auctionService.js';
import bidService from '../services/bidService.js';
import { Card } from '../components/ui/card.jsx';
import { formatCurrency } from '../utils/format.js';
import { formatTimeAgo } from '../utils/date.js';
import { ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import useAuthStore from '../store/authStore.js';
import { motion } from "framer-motion";
import { Clock, Tag, TrendingUp, Users, Eye } from "lucide-react";
import { toast } from 'react-hot-toast';

const LiveAuctionPage = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    socket,
    isConnected,
    connect,
    disconnect,
    joinAuction,
    leaveAuction,
    error: socketError
  } = useSocketStore();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [stats, setStats] = useState({
    totalBids: 0,
    uniqueBidders: 0,
    bidHistory: []
  });

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const auctionData = await auctionService.getAuctionById(id);
      setAuction(auctionData);
      
      const bids = await bidService.getBidsByAuction(id);
      setStats({
        totalBids: bids.length,
        uniqueBidders: new Set(bids.map(bid => bid.bidder_id)).size,
        bidHistory: bids.sort((a, b) => b.amount - a.amount)
      });
      
    } catch (err) {
      console.error('Error in fetchAuctionDetails:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to fetch auction details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAuctionDetails();
    } else {
      setError('No auction ID provided');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && !isConnected) {
      connect();
    }
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [user, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    joinAuction(id);

    const handleNewBid = ({ bid }) => {
      setStats(prev => ({
        ...prev,
        totalBids: prev.totalBids + 1,
        bidHistory: [bid, ...prev.bidHistory].sort((a, b) => b.amount - a.amount)
      }));
      setAuction(prev => ({
        ...prev,
        current_price: bid.amount
      }));
      
      // Show toast notification for new highest bidder
      if (bid.bidder_id !== user?.id) {
        toast.success(
          `New highest bid of ${formatCurrency(bid.amount)} by ${bid.bidder_name}!`,
          { duration: 5000 }
        );
      }
    };

    const handlePotentialWinner = ({ bidder, amount }) => {
      toast.success(
        `${bidder.name} might win with bid of ${formatCurrency(amount)}!`,
        { duration: 5000 }
      );
    };

    const handleAuctionStarted = (data) => {
      console.log('Received auctionStarted event:', data);
      setAuction(prev => ({
        ...prev,
        status: 'live',
        start_time: data.startTime || new Date().toISOString()
      }));
      
      toast.success(`Auction "${data.title}" has started!`, { duration: 5000 });
      // Fetch latest auction details
      fetchAuctionDetails();
    };

    const handleAuctionEnded = (data) => {
      console.log('Received auctionEnded event:', data);
      if (!data) return;

      setAuction(prev => ({
        ...prev,
        status: 'ended',
        end_time: data.endTime,
        title: data.title || prev.title,
        winner_id: data.winningBid?.bidder?.id || null,
        current_price: data.winningBid?.amount || prev.current_price
      }));

      // Show appropriate toast notification
      if (data.winningBid?.bidder) {
        if (data.winningBid.bidder.id === user?.id) {
          toast.success(
            `Congratulations! You won the auction "${data.title}" with a bid of ${formatCurrency(data.winningBid.amount)}!`,
            { duration: 8000 }
          );
        } else {
          toast.info(
            `Auction "${data.title}" ended. Winner: ${data.winningBid.bidder.name} with bid of ${formatCurrency(data.winningBid.amount)}`,
            { duration: 8000 }
          );
        }
      } else {
        toast.info(`Auction "${data.title}" ended with no winners`, { duration: 5000 });
      }

      // Update auction details
      fetchAuctionDetails();
    };

    const handleAuctionStatusChanged = (data) => {
      console.log('Received auctionStatusChanged event:', data);
      if (!data) return;

      setAuction(prev => ({
        ...prev,
        status: data.status,
        title: data.title || prev.title,
        end_time: data.endTime || prev.end_time,
        start_time: data.startTime || prev.start_time,
        winner_id: data.winner?.id || prev.winner_id,
        current_price: data.currentPrice || prev.current_price
      }));
      
      if (data.status === 'live') {
        toast.success(`Auction "${data.title}" is now live!`, { duration: 5000 });
      } else if (data.status === 'ended') {
        if (data.winner) {
          if (data.winner.id === user?.id) {
            toast.success(
              `Congratulations! You won the auction "${data.title}"!`,
              { duration: 8000 }
            );
          } else {
            toast.info(
              `Auction "${data.title}" ended. Winner: ${data.winner.name}`,
              { duration: 8000 }
            );
          }
        } else {
          toast.info(`Auction "${data.title}" ended with no winners`, { duration: 5000 });
        }
      }
      
      // Update auction details
      fetchAuctionDetails();
    };

    const handleBidUpdate = ({ bid }) => {
      setStats(prev => {
        const updatedHistory = prev.bidHistory.map(b => 
          b.id === bid.id ? { ...b, ...bid } : b
        ).sort((a, b) => b.amount - a.amount);
        
        return {
          ...prev,
          bidHistory: updatedHistory
        };
      });
    };

    socket.on('newBid', handleNewBid);
    socket.on('potentialWinner', handlePotentialWinner);
    socket.on('auctionStarted', handleAuctionStarted);
    socket.on('auctionEnded', handleAuctionEnded);
    socket.on('auctionStatusChanged', handleAuctionStatusChanged);
    socket.on('bidUpdate', handleBidUpdate);

    return () => {
      leaveAuction(id);
      socket.off('newBid', handleNewBid);
      socket.off('potentialWinner', handlePotentialWinner);
      socket.off('auctionStarted', handleAuctionStarted);
      socket.off('auctionEnded', handleAuctionEnded);
      socket.off('auctionStatusChanged', handleAuctionStatusChanged);
      socket.off('bidUpdate', handleBidUpdate);
    };
  }, [socket, isConnected, id, user]);

  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  // Add auto-refresh for time remaining
  useEffect(() => {
    if (!auction) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const endTime = new Date(auction.end_time);
      const startTime = new Date(auction.start_time);

      // If auction has ended, update the status locally without fetching
      if (now >= endTime && auction.status === 'live') {
        setAuction(prev => ({
          ...prev,
          status: 'ended'
        }));
      }
      // If auction should start, update the status locally without fetching
      else if (now >= startTime && auction.status === 'upcoming') {
        setAuction(prev => ({
          ...prev,
          status: 'live'
        }));
      }
    };

    // Update every second
    const intervalId = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [auction?.status, auction?.end_time, auction?.start_time]); // Only depend on necessary fields

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please login to place a bid');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (!amount || isNaN(amount)) {
      setError('Please enter a valid bid amount');
      return;
    }

    if (amount <= (auction.current_price || auction.starting_price)) {
      setError(`Bid must be higher than ${formatCurrency(auction.current_price || auction.starting_price)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await bidService.createBid({
        auctionId: id,
        amount: parseFloat(bidAmount)
      });

      const [updatedAuction, updatedBids] = await Promise.all([
        auctionService.getAuctionById(id),
        bidService.getBidsByAuction(id)
      ]);

      setAuction(updatedAuction);
      setStats({
        totalBids: updatedBids.length,
        uniqueBidders: new Set(updatedBids.map(bid => bid.bidder_id)).size,
        bidHistory: updatedBids.sort((a, b) => b.amount - a.amount)
      });
      
      setBidAmount('');
      
    } catch (error) {
      console.error('Error placing bid:', error);
      setError(error.response?.data?.message || 'Failed to place bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAuctionStatus = () => {
    if (!auction) return 'loading';
    
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);

    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'ended';
    return 'live';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-center mb-4">
          <h2 className="text-xl font-bold mb-2">Error Loading Auction</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Auction Not Found</h2>
          <p>The requested auction could not be found.</p>
        </div>
      </div>
    );
  }

  const status = getAuctionStatus();

  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-4 p-4">
          {/* Left Column - Image and Creator Info */}
          <div className="space-y-4">
            {/* Image Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[4/3] rounded-xl overflow-hidden border bg-gradient-to-br from-gray-100 to-gray-200 shadow-md"
            >
              {auction.image ? (
                <img
                  src={auction.image}
                  alt={auction.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <ImageIcon className="h-20 w-20 text-gray-400 mb-2" />
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-white flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{auction.views || 0} views</span>
              </div>
            </motion.div>

            {/* Creator Info */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={auction.seller_avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {auction.seller_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">Created by</h3>
                    <p className="text-primary/80">{auction.seller_name || 'Unknown User'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Auction Details */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-start mb-4">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
                >
                  {auction.title}
                </motion.h1>
                <Badge 
                  variant={status === 'active' ? 'success' : status === 'upcoming' ? 'warning' : 'secondary'}
                  className="text-sm px-4 py-1 rounded-full uppercase tracking-wider"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              <p className="text-gray-600 leading-relaxed">{auction.description}</p>
            </div>

            <div className="grid gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <span className="text-gray-600">Current Bid:</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(auction.current_price || auction.starting_price)}
                </span>
              </motion.div>

              {/* Highest Bidder Info - Only show if auction is active or upcoming and there are bids */}
              {status !== 'ended' && stats?.bidHistory?.[0] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-primary/5 rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {stats.bidHistory[0].bidder_name?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Highest Bidder</p>
                      <p className="text-sm text-gray-500">{stats.bidHistory[0].bidder_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Bid placed</p>
                    <p className="text-sm font-medium text-primary">{formatTimeAgo(stats.bidHistory[0].created_at)}</p>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">Starting Price:</span>
                </div>
                <span className="text-xl text-gray-900">{formatCurrency(auction.starting_price)}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">Time Remaining:</span>
                </div>
                <span className="text-xl text-gray-900">{formatTimeAgo(auction.end_time)}</span>
              </div>

              {status === 'ended' && stats?.bidHistory?.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm space-y-2"
                >
                  <h3 className="font-semibold text-xl text-green-800 mb-4">🏆 Auction Winner</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12 ring-2 ring-green-500/20">
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {stats.bidHistory[0].bidder_name?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-green-800">{stats.bidHistory[0].bidder_name}</p>
                        <p className="text-green-600">
                          Winning Bid: {formatCurrency(stats.bidHistory[0].amount)}
                        </p>
                      </div>
                    </div>
                    {user?.id === stats.bidHistory[0].bidder_id && (
                      <Badge variant="success" className="animate-pulse">You Won! 🎉</Badge>
                    )}
                  </div>
                </motion.div>
              )}

              {status === 'ended' && stats?.bidHistory?.length === 0 && (
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-gray-500">Auction ended with no bids</p>
                </div>
              )}
            </div>

            {/* Bidding Form */}
            {getAuctionStatus() === 'live' && (
              <div className="space-y-4">
                {auction.seller_id === user?.id ? (
                  <p className="text-sm text-gray-500 italic bg-yellow-50 p-4 rounded-xl">
                    You cannot bid on your own auction
                  </p>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleBidSubmit} 
                    className="space-y-4"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Your Bid</label>
                        <span className="text-sm text-primary">
                          Min: {formatCurrency((auction.current_price || auction.starting_price) + 1)}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="Enter bid amount"
                          min={auction.current_price || auction.starting_price}
                          step="0.01"
                          required
                          className="flex-1 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/20"
                          disabled={loading}
                        />
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="min-w-[120px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            'Place Bid'
                          )}
                        </Button>
                      </div>
                      {error && (
                        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
                      )}
                      {stats?.bidHistory?.[0]?.bidder_id === user?.id && (
                        <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                          You are currently the highest bidder! 🎉
                        </p>
                      )}
                    </div>
                  </motion.form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="details" className="p-4">
          <TabsList className="bg-gray-100/80 backdrop-blur-sm p-1 rounded-lg">
            <TabsTrigger value="details" className="rounded-lg">Details</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">Bid History</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-2">
            <div className="grid gap-2">
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Created On:</span>
                <span className="font-medium">{new Date(auction.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Start Time:</span>
                <span className="font-medium">{new Date(auction.start_time).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">End Time:</span>
                <span className="font-medium">{new Date(auction.end_time).toLocaleString()}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-2">
            {stats?.bidHistory?.length > 0 ? (
              <div className="space-y-2">
                {stats.bidHistory.map((bid, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={bid.id || index}
                    className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {bid.bidder_name?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{bid.bidder_name}</p>
                        <p className="text-sm text-gray-500">{formatTimeAgo(bid.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">{formatCurrency(bid.amount)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No bids yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-4 space-y-2">
            <div className="grid gap-2">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg"
              >
                <span className="text-gray-600">Total Bids:</span>
                <span className="font-semibold text-xl">{stats?.totalBids || 0}</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg"
              >
                <span className="text-gray-600">Unique Bidders:</span>
                <span className="font-semibold text-xl">{stats?.uniqueBidders || 0}</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg"
              >
                <span className="text-gray-600">Highest Bid:</span>
                <span className="font-semibold text-xl">
                  {stats?.bidHistory?.[0]?.amount ? formatCurrency(stats.bidHistory[0].amount) : 'No bids yet'}
                </span>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default LiveAuctionPage;