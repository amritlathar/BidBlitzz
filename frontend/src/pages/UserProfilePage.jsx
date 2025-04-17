
import React from 'react';
import UserProfile from '../components/UserProfile';

const UserProfilePage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <UserProfile />
    </div>
  );
};

export default UserProfilePage;