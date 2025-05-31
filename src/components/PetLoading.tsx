import React from 'react';
import PetIcon from './PetIcon';

export default function PetLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="mb-6 relative">
        <PetIcon size={120} className="pet-bounce" />
      </div>
      <div className="paw-loading">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="mt-4 text-pet-purple font-medium">Fetching paw-some content...</p>
    </div>
  );
} 