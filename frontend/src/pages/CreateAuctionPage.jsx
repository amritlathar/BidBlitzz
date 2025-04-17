import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import auctionService from '../services/auctionService';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/Label';
import { toast } from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// These categories must match the database enum values exactly
const CATEGORIES = [
  'Electronics',
  'Collectibles',
  'Fashion',
  'Home',
  'Sports',
  'Toys',
  'Other'
];

const CreateAuctionPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    startTime: '',
    endTime: '',
    category: '',
    image: null
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }

    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }

    if (!CATEGORIES.includes(formData.category)) {
      toast.error('Invalid category selected');
      return false;
    }

    const now = new Date();
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (startTime < now) {
      toast.error('Start time must be in the future');
      return false;
    }

    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return false;
    }

    const price = parseFloat(formData.startingPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Starting price must be a positive number');
      return false;
    }

    // Check for maximum price limit
    if (price >= 99999999.99) {
      toast.error('Starting price must be less than 100 million');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to create an auction');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for the request
      const formDataToSend = new FormData();
      
      // Append all fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('startingPrice', parseFloat(formData.startingPrice));
      formDataToSend.append('startTime', new Date(formData.startTime).toISOString());
      formDataToSend.append('endTime', new Date(formData.endTime).toISOString());
      formDataToSend.append('category', formData.category);
      
      // Append image if exists
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await auctionService.createAuction(formDataToSend);
      toast.success('Auction created successfully!');
      navigate('/auctions');
    } catch (error) {
      console.error('Error creating auction:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create auction';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-4">You need to be logged in to create an auction.</p>
        <Button onClick={() => navigate('/login')}>Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Auction</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={255}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={handleCategoryChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startingPrice">Starting Price</Label>
          <Input
            id="startingPrice"
            name="startingPrice"
            type="number"
            min="0"
            max="99999999.99"
            step="0.01"
            value={formData.startingPrice}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            name="startTime"
            type="datetime-local"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            name="endTime"
            type="datetime-local"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="image">Image (Optional)</Label>
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-xs rounded-lg shadow-md"
              />
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Auction'}
        </Button>
      </form>
    </div>
  );
};

export default CreateAuctionPage;