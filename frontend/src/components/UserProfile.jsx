// components/UserProfile.jsx
import React, { useState, useRef } from 'react';
import useAuthStore from '../store/authStore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const UserProfile = () => {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.contact || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/update-user`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true // This enables sending cookies
        }
      );

      if (response.data.success) {
        const userData = response.data.data;
        setAvatarPreview(userData.avatar);
        updateProfile(userData);
        toast.success('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/update-user`,
        {
          full_name: profileData.name,
          contact: profileData.phone
        },
        {
          withCredentials: true // This enables sending cookies
        }
      );

      if (response.data.success) {
        updateProfile(response.data.data);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="mb-4">Please log in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload Section */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={loading}
              />
              <div className="relative cursor-pointer" onClick={() => !loading && fileInputRef.current?.click()}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-xl font-semibold">
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
                disabled={!isEditing || loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                disabled={true}
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleChange}
                placeholder="Your phone number"
                disabled={!isEditing || loading}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {isEditing ? (
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setProfileData({
                  name: user?.full_name || '',
                  email: user?.email || '',
                  phone: user?.contact || '',
                });
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} disabled={loading}>
            Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default UserProfile;