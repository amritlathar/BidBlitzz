import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAuction, placeBid, starAuction, unstarAuction } from '../utils/api';
import { formatCurrency, formatTimeLeft } from '../utils/helpers';
import { Star, Eye, Tag } from 'lucide-react';

const LiveAuction = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [error, setError] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const data = await getAuction(id, user?.id || 'anonymous');
        setAuction(data);
        setBidAmount((data.currentBid + 1).toString());
        setIsStarred(data.starredBy?.includes(user?.id));
      } catch (error) {
        console.error('Error fetching auction:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuction();
    
    // Setup interval to refresh auction data
    const intervalId = setInterval(fetchAuction, 5000);
    return () => clearInterval(intervalId);
  }, [id, user?.id]);
  
  useEffect(() => {
    if (!auction) return;
    
    const updateTimeLeft = () => {
      const endTime = new Date(auction.end_time).getTime();
      const now = new Date().getTime();
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        setTimeLeft('Auction ended');
        return;
      }
      
      setTimeLeft(formatTimeLeft(now, endTime));
    };
    
    updateTimeLeft();
    const timeInterval = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(timeInterval);
  }, [auction]);
  

  const handleBidChange = (e) => {
    setBidAmount(e.target.value);
    setError('');
  };
  
  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    
    if (!amount || isNaN(amount)) {
      setError('Please enter a valid bid amount');
      return;
    }
    
    if (amount <= auction.currentBid) {
      setError(`Bid must be higher than ${formatCurrency(auction.currentBid)}`);
      return;
    }
    
    try {
      await placeBid(auction.id, {
        userId: user.id,
        amount,
        timestamp: new Date().toISOString()
      });
      
      // Fetch updated auction data
      const updatedAuction = await getAuction(id);
      setAuction(updatedAuction);
      setBidAmount((updatedAuction.currentBid + 1).toString());
    } catch (error) {
      console.error('Error placing bid:', error);
      setError('Failed to place bid. Please try again.');
    }
  };
  
  const handleStarClick = async () => {
    try {
      if (isStarred) {
        await unstarAuction(auction.id, user.id);
      } else {
        await starAuction(auction.id, user.id);
      }
      setIsStarred(!isStarred);
    } catch (error) {
      console.error('Error updating starred status:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading auction data...</div>
      </div>
    );
  }
  
  if (!auction) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Auction Not Found</h2>
        <p>The auction you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  const isLive = new Date(auction.start_time) < new Date() && 
    new Date(auction.end_time) > new Date().getTime();
  
  const isUpcoming = new Date(auction.start_time) > new Date();
  const isCompleted = !isLive && !isUpcoming;
  
  const topBidder = auction.bids.length > 0 ? auction.bids[auction.bids.length - 1].userId : null;
  const isTopBidder = user && topBidder === user.id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{auction.title}</h1>
            <div className="flex items-center gap-3">
              {isLive && <Badge className="bg-green-500">Live</Badge>}
              {isUpcoming && <Badge className="bg-blue-500">Upcoming</Badge>}
              {isCompleted && <Badge className="bg-gray-500">Completed</Badge>}
              
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {auction.category || 'Uncategorized'}
              </Badge>
              
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {auction.viewCount || 0} views
              </Badge>
              
              <button 
                onClick={handleStarClick}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100"
              >
                <Star 
                  className={`h-4 w-4 ${isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
                />
                <span className="text-sm text-gray-600">
                  {auction.starredBy?.length || 0}
                </span>
              </button>
            </div>
          </div>
          <span className="text-sm text-gray-500">ID: {auction.id}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-gray-200 rounded-lg overflow-hidden h-80 mb-4">
            {auction.image ? (
              <img src={auction.image} alt={auction.title} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                No Image Available
              </div>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{auction.description}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card className={isLive ? "border-green-500 border-2" : ""}>
            <CardHeader className="pb-2">
              <CardTitle>Auction Details</CardTitle>
              {isLive && (
                <CardDescription className="text-red-500 font-semibold text-lg">
                  {timeLeft}
                </CardDescription>
              )}
              {isUpcoming && (
                <CardDescription className="text-blue-500">
                  Starts in {formatTimeLeft(new Date(), new Date(auction.start_time))}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Bid:</span>
                  <span className="font-bold text-lg">{formatCurrency(auction.currentBid)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Base Value:</span>
                  <span>{formatCurrency(auction.baseValue)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Bids:</span>
                  <span>{auction.bids.length}</span>
                </div>
                
                {topBidder && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Top Bidder:</span>
                    <span className={isTopBidder ? "text-green-600 font-semibold" : ""}>
                      {isTopBidder ? "You" : `User #${topBidder.substring(0, 6)}`}
                    </span>
                  </div>
                )}
              </div>
              
              {isLive && user && (
                <div className="space-y-2 pt-2">
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      min={auction.currentBid + 0.01}
                      step="0.01"
                      value={bidAmount}
                      onChange={handleBidChange}
                      placeholder={`Min bid: ${formatCurrency(auction.currentBid + 1)}`}
                    />
                    <Button onClick={handlePlaceBid}>
                      Bid
                    </Button>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {isTopBidder && (
                    <p className="text-green-600 text-sm">You are currently the highest bidder!</p>
                  )}
                </div>
              )}
              
              {isCompleted && (
                <div className="bg-gray-100 p-3 rounded-md">
                  <h3 className="font-semibold mb-1">Auction Ended</h3>
                  {auction.bids.length > 0 ? (
                    <p>
                      Winner: {isTopBidder ? "You" : `User #${topBidder.substring(0, 6)}`} with a bid of {formatCurrency(auction.currentBid)}
                    </p>
                  ) : (
                    <p>No bids were placed on this auction.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bid History</CardTitle>
            </CardHeader>
            <CardContent>
              {auction.bids.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...auction.bids].reverse().map((bid, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border-b">
                      <div>
                        <span className={bid.userId === user?.id ? "font-semibold text-green-600" : ""}>
                          {bid.userId === user?.id ? "You" : `User #${bid.userId.substring(0, 6)}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(bid.amount)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(bid.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No bids yet. Be the first to bid!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveAuction;