import React, { useState, useEffect } from 'react';
import auctionService from '../services/auctionService';
import AuctionCard from '../components/AuctionCard';
import { Input } from '../components/ui/input.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';

const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports',
  'Collectibles',
  'Art',
  'Vehicles',
  'Books',
  'Other'
];

const AuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await auctionService.getAllAuctions();
        setAuctions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching auctions:', error);
        setError('Failed to load auctions. Please try again later.');
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctions();
  }, []);
  
  const handleToggleStar = async (auctionId) => {
    try {
      await auctionService.toggleFavorite(auctionId);
      // Update the auction's starred status in the local state
      setAuctions(auctions.map(auction => 
        auction.id === auctionId 
          ? { ...auction, is_starred: !auction.is_starred } 
          : auction
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  // Filter and sort auctions
  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || auction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'price-high':
        return (b.current_price || b.starting_price) - (a.current_price || a.starting_price);
      case 'price-low':
        return (a.current_price || a.starting_price) - (b.current_price || b.starting_price);
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">All Auctions</h1>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <Input
            type="text"
            placeholder="Search auctions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAuctions.map(auction => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAuctions
              .filter(auction => auction.status === 'active')
              .map(auction => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction}
                  onToggleStar={handleToggleStar}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAuctions
              .filter(auction => auction.status === 'upcoming')
              .map(auction => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction}
                  onToggleStar={handleToggleStar}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAuctions
              .filter(auction => auction.status === 'completed')
              .map(auction => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction}
                  onToggleStar={handleToggleStar}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuctionsPage;