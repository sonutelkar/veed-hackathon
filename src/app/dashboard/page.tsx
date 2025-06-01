'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import UploadDropzone from '@/components/UploadDropzone';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <PetLoading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pet-pattern-bg">
      <Navbar />

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold pet-gradient-text">Welcome to PetVentures</h1>
          <p className="mt-1 text-pet-gray">
            Transform your furry friends into epic adventurers with our AI magic
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-pet-purple mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="pet-card p-6 relative">
              <div className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-pet-purple flex items-center justify-center text-white font-bold">1</div>
              <div className="text-center mb-4">
                <div className="text-5xl mb-4 mx-auto">📸</div>
                <h3 className="text-xl font-bold text-pet-purple">Upload Pet Photos</h3>
              </div>
              <p className="text-pet-gray text-center">
                Start by uploading images of your furry friend. The more photos you provide, the better results you'll get!
              </p>
            </div>

            {/* Step 2 */}
            <div className="pet-card p-6 relative">
              <div className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-pet-purple flex items-center justify-center text-white font-bold">2</div>
              <div className="text-center mb-4">
                <div className="text-5xl mb-4 mx-auto">✨</div>
                <h3 className="text-xl font-bold text-pet-purple">Create Your Adventure</h3>
              </div>
              <p className="text-pet-gray text-center">
                Add a creative prompt like "my cat as an astronaut" or "my dog surfing on waves" and let our AI do the magic!
              </p>
            </div>

            {/* Step 3 */}
            <div className="pet-card p-6 relative">
              <div className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-pet-purple flex items-center justify-center text-white font-bold">3</div>
              <div className="text-center mb-4">
                <div className="text-5xl mb-4 mx-auto">🎉</div>
                <h3 className="text-xl font-bold text-pet-purple">Share & Enjoy</h3>
              </div>
              <p className="text-pet-gray text-center">
                Share your pet's adventures with friends and family on social media and watch them smile!
              </p>
            </div>
          </div>
        </div>

        {/* Upload section */}
        <div className="pet-card relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-4xl rotate-12">🐾</div>
          <div className="px-6 py-8">
            <h3 className="text-xl font-bold text-pet-purple mb-2">Upload your pet photos</h3>
            <div className="mb-4 text-pet-gray">
              <p>Upload photos of your pet to get started with your adventure</p>
            </div>
            <div className="mt-5">
              <UploadDropzone />
            </div>
          </div>
        </div>

        {/* Create Adventure Button */}
        <div className="text-center my-8">
          <Link
            href="/create"
            className="paw-button inline-flex items-center rounded-full bg-pet-purple px-8 py-4 text-base font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
          >
            Create Your First Adventure
            <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
} 