import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-10 w-10 border-3',
    large: 'h-16 w-16 border-4'
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`${sizeClasses[size]} rounded-full border-t-indigo-500 border-r-indigo-500 border-b-indigo-200 border-l-indigo-200 animate-spin`}
      ></div>
    </div>
  );
};

export default LoadingSpinner; 