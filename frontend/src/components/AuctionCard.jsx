import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Star, ImageIcon, Eye } from 'lucide-react';
import { formatCurrency, formatTimeAgo } from '../utils/helpers';
import { Badge } from '../components/ui/badge';
import useAuthStore from '../store/authStore';
import auctionService from '../services/auctionService';

const AuctionCard = ({ 
  auction, 
  showStarredAt, 
  showWinningBid, 
  showHighestBid, 
  userHighestBid,
  onToggleStar,
  starredAt 
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isStarred, setIsStarred] = useState(auction.is_starred || showStarredAt);
  const [isTogglingStarred, setIsTogglingStarred] = useState(false);

  const handleStarClick = async (e) => {
    e.stopPropagation();
    if (isTogglingStarred || !user) return;

    try {
      setIsTogglingStarred(true);
      
      if (typeof onToggleStar === 'function') {
        await onToggleStar(auction.id);
      } else {
        // Use the service directly if no callback is provided
        await auctionService.toggleFavorite(auction.id);
      }
      
      setIsStarred(!isStarred);
    } catch (error) {
      console.error('Error toggling star:', error);
    } finally {
      setIsTogglingStarred(false);
    }
  };

  const getStatusBadge = () => {
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);

    if (now < startTime) {
      return <Badge variant="warning">Upcoming</Badge>;
    } else if (now > endTime) {
      return <Badge variant="secondary">Ended</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  const getBidInfo = () => {
    if (showWinningBid && auction.winning_bid) {
      return (
        <div className="text-sm text-gray-500">
          Winning Bid: <span className="font-semibold text-green-600">{formatCurrency(auction.winning_bid)}</span>
        </div>
      );
    }

    if (showHighestBid && userHighestBid) {
      return (
        <div className="text-sm text-gray-500">
          Your Highest Bid: <span className="font-semibold">{formatCurrency(userHighestBid)}</span>
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-500">
        Current Bid: <span className="font-semibold">{formatCurrency(auction.current_price || auction.starting_price)}</span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div 
        className="relative h-48 cursor-pointer"
        onClick={() => navigate(`/auction/${auction.id}`)}
      >
        {auction.image ? (
          <img
            src={auction.image}
            alt={auction.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">No image available</span>
          </div>
        )}
        {/* Category Badge */}
        {auction.category && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-white/80 text-xs">
              {auction.category}
            </Badge>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="bg-white/80 px-2 py-1 rounded-full text-sm flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {auction.views || 0}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`bg-white/80 hover:bg-white ${
              isStarred ? 'text-yellow-500' : 'text-gray-500'
            }`}
            onClick={handleStarClick}
            disabled={isTogglingStarred}
          >
            <Star className={`w-5 h-5 ${isStarred ? 'fill-yellow-500' : ''}`} />
          </Button>
        </div>
      </div>

      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{auction.title}</h3>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <span>By {auction.seller_name || 'Unknown Seller'}</span>
          </div>
          
          <p className="text-sm text-gray-500 line-clamp-2">{auction.description}</p>
          
          {getBidInfo()}
          
          <div className="text-sm text-gray-500">
            Ends: {formatTimeAgo(auction.end_time)}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default AuctionCard;