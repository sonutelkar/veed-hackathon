'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import PetLoading from '@/components/PetLoading';
import PetIcon from '@/components/PetIcon';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <PetLoading />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 pet-pattern-bg">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-8 relative inline-block">
          <PetIcon size={100} className="mx-auto pet-bounce" />
        </div>
        
        <h1 className="mb-4 text-5xl font-bold pet-gradient-text">Pet‑Adventure Generator</h1>
        <p className="mb-8 text-xl text-pet-gray">
          Transform your furry friends into epic adventurers with our AI-powered video creation tool!
        </p>
        
        <div className="relative">
          <div className="absolute -top-12 -right-12 rotate-12 text-4xl">🐾</div>
          <div className="absolute -bottom-10 -left-10 -rotate-12 text-4xl">🐾</div>
          
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="paw-button rounded-full bg-black px-8 py-4 text-white font-medium shadow-lg hover:bg-pet-purple-light transition-all"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="paw-button rounded-full border-2 border-pet-purple bg-white px-8 py-4 text-pet-purple font-medium shadow-lg hover:bg-[#F5F0FF] transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="pet-card bg-white p-6">
            <div className="mb-4 text-pet-purple text-4xl">📸</div>
            <h3 className="font-bold text-lg mb-2 text-pet-purple">Upload</h3>
            <p className="text-pet-gray">Share a photo of your beloved pet</p>
          </div>
          
          <div className="pet-card bg-white p-6">
            <div className="mb-4 text-pet-teal text-4xl">✨</div>
            <h3 className="font-bold text-lg mb-2 text-pet-teal">Transform</h3>
            <p className="text-pet-gray">Our AI works its magic</p>
          </div>
          
          <div className="pet-card bg-white p-6">
            <div className="mb-4 text-pet-pink text-4xl">🎬</div>
            <h3 className="font-bold text-lg mb-2 text-pet-pink">Adventure</h3>
            <p className="text-pet-gray">Watch your pet's epic journey unfold</p>
          </div>
        </div>
      </div>
    </main>
  );
}
