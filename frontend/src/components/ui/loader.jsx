import React from 'react';

export const Loader = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin border-t-blue-600`} />
    </div>
  );
};

export const PageLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
      <Loader size="xl" />
    </div>
  );
};

export const ButtonLoader = () => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader size="sm" />
      <span>Loading...</span>
    </div>
  );
};

export const CardLoader = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
      </div>
    </div>
  );
}; 