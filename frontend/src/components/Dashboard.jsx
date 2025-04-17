import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import auctionService from '../services/auctionService';
import AuctionCard from './AuctionCard';
import { formatCurrency } from '../utils/helpers';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCreated: 0,
    totalParticipating: 0,
    totalWon: 0,
    totalFavorites: 0,
    totalSpent: 0
  });
  
  const [auctions, setAuctions] = useState({
    created: [],
    participating: [],
    won: [],
    favorites: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [created, participating, won, favorites] = await Promise.all([
        auctionService.getUserCreatedAuctions(),
        auctionService.getUserParticipatingAuctions(),
        auctionService.getUserWonAuctions(),
        auctionService.getUserFavoriteAuctions()
      ]);

      setAuctions({
        created,
        participating,
        won,
        favorites
      });

      // Calculate total spent on won auctions
      const totalSpent = won.reduce((total, auction) => total + auction.winning_bid, 0);

      setStats({
        totalCreated: created.length,
        totalParticipating: participating.length,
        totalWon: won.length,
        totalFavorites: favorites.length,
        totalSpent
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = () => {
    navigate('/create-auction');
  };

  const handleBrowseAuctions = () => {
    navigate('/auctions');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Auctions Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCreated}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Participating In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalParticipating}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Auctions Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalWon}</div>
            <div className="text-sm text-gray-500">
              {stats.totalSpent > 0 && `Total spent: ${formatCurrency(stats.totalSpent)}`}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Favorite Auctions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalFavorites}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="created">
        <TabsList className="mb-4">
          <TabsTrigger value="created">Created</TabsTrigger>
          <TabsTrigger value="participating">Participating</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="created">
          {auctions.created.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.created.map(auction => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 mb-4">You haven't created any auctions yet.</p>
                <Button onClick={handleCreateAuction}>Create Your First Auction</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="participating">
          {auctions.participating.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.participating.map(auction => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction}
                  showHighestBid
                  userHighestBid={auction.user_highest_bid}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 mb-4">You haven't placed any bids yet.</p>
                <Button onClick={handleBrowseAuctions}>Browse Auctions</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="won">
          {auctions.won.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.won.map(auction => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction}
                  showWinningBid
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 mb-4">You haven't won any auctions yet.</p>
                <Button onClick={handleBrowseAuctions}>Browse Auctions</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="favorites">
          {auctions.favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.favorites.map(auction => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction}
                  showFavoritedAt
                  favoritedAt={auction.favorited_at}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 mb-4">You haven't favorited any auctions yet.</p>
                <Button onClick={handleBrowseAuctions}>Browse Auctions</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
                      
                      