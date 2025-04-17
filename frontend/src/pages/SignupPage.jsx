import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Camera, Upload } from 'lucide-react';
import { showToast } from '../utils/toast';
import useAuthStore from '../store/authStore';

const SignupPage = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showToast.error('Image size should be less than 5MB');
      return;
    }

    // Clean up previous object URL if it exists
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    // Create a URL for preview
    const imageUrl = URL.createObjectURL(file);
    setAvatarPreview(imageUrl);
    
    // Store the actual file in formData
    setFormData(prev => ({ ...prev, avatar: file }));
  };

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const userData = {
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password,
      contact: formData.contact,
      avatar: formData.avatar
    };

    const response = await register(userData);
    if (response.success) {
      // navigate('/login');
    } else {
      setError(response.message); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
        </CardHeader>

        {/* Avatar Upload Section */}
        <div className="flex justify-center -mt-2 mb-6">
          <div className="relative group">
            <input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <label
              htmlFor="avatar"
              className="cursor-pointer block"
            >
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 group-hover:border-indigo-500 transition-colors">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">Upload Photo</span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 shadow-lg border-2 border-white">
                <Upload className="h-4 w-4 text-white" />
              </div>
            </label>
          </div>
        </div>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                name="contact"
                type="tel"
                required
                value={formData.contact}
                onChange={handleChange}
                placeholder="Enter your contact number"
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-gray-600 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage; 