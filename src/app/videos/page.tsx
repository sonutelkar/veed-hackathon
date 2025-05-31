'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import PetIcon from '@/components/PetIcon';

// Mock data for demo purposes
const MOCK_VIDEOS = [
  {
    id: '1',
    title: 'Space Adventure',
    thumbnail: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    createdAt: '2023-10-15T10:30:00.000Z',
    views: 24,
  },
  {
    id: '2',
    title: 'Jungle Explorer',
    thumbnail: 'https://images.unsplash.com/photo-1557684387-08927d28c72a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    createdAt: '2023-10-12T14:45:00.000Z',
    views: 18,
  },
  {
    id: '3',
    title: 'Day out',
    thumbnail: 'https://plus.unsplash.com/premium_photo-1661503280224-a86d7ad2a574?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    createdAt: '2023-10-10T09:15:00.000Z',
    views: 31,
  },
];

export default function Videos() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState(MOCK_VIDEOS);
  const [activeFilter, setActiveFilter] = useState('all');

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

  const filterVideos = (filter: 'all' | 'recent' | 'popular') => {
    setActiveFilter(filter);
    // In a real app, this would filter videos from the database
    // For now, we'll just use the mock data
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen pet-pattern-bg">
      <Navbar />

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold pet-gradient-text">My Adventures</h1>
            <p className="mt-1 text-pet-gray">
              View and share your pet's amazing journeys
            </p>
          </div>
          <Link
            href="/dashboard"
            className="paw-button inline-flex items-center rounded-full bg-pet-purple px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
          >
            Create New Adventure
          </Link>
        </div>

        {/* Filters */}
        <div className="pet-card bg-white p-4 mb-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="mt-2 sm:mt-0">
              <div className="flex rounded-full overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => filterVideos('all')}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                    activeFilter === 'all'
                      ? 'bg-pet-purple text-purple'
                      : 'bg-white text-pet-purple hover:bg-[#F5F0FF]'
                  } border border-[#E5DAFF]`}
                >
                  All Adventures
                </button>
                <button
                  type="button"
                  onClick={() => filterVideos('recent')}
                  className={`relative -ml-px inline-flex items-center px-4 py-2 text-sm font-medium ${
                    activeFilter === 'recent'
                      ? 'bg-pet-purple text-purple'
                      : 'bg-white text-pet-purple hover:bg-[#F5F0FF]'
                  } border border-[#E5DAFF]`}
                >
                  Recent
                </button>
                <button
                  type="button"
                  onClick={() => filterVideos('popular')}
                  className={`relative -ml-px inline-flex items-center px-4 py-2 text-sm font-medium ${
                    activeFilter === 'popular'
                      ? 'bg-pet-purple text-purple'
                      : 'bg-white text-pet-purple hover:bg-[#F5F0FF]'
                  } border border-[#E5DAFF]`}
                >
                  Popular
                </button>
              </div>
            </div>
            <div className="mt-2 sm:mt-0">
              <div className="relative">
                <input
                  type="text"
                  className="pet-input block w-full pr-12 focus:outline-none sm:text-sm"
                  placeholder="Search adventures..."
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-pet-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div key={video.id} className="pet-card bg-white overflow-hidden relative">
                <div className="absolute -right-4 -top-4 rotate-12 text-2xl z-10">🐾</div>
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button className="rounded-full bg-white p-3 text-pet-purple shadow-lg transform hover:scale-110 transition-transform">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-pet-purple">{video.title}</h3>
                  <div className="mt-2 flex items-center justify-between text-sm text-pet-gray">
                    <span>Created: {formatDate(video.createdAt)}</span>
                    <span>{video.views} views</span>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button className="paw-button inline-flex items-center rounded-full border border-[#E5DAFF] bg-white px-3 py-1.5 text-xs font-medium text-pet-purple shadow-sm hover:bg-[#F5F0FF]">
                      <svg className="mr-1.5 h-4 w-4 text-pet-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </button>
                    <button className="paw-button inline-flex items-center rounded-full border border-[#E5DAFF] bg-white px-3 py-1.5 text-xs font-medium text-pet-purple shadow-sm hover:bg-[#F5F0FF]">
                      <svg className="mr-1.5 h-4 w-4 text-pet-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pet-card bg-white py-12 text-center">
            <PetIcon size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-pet-purple">No adventures yet</h3>
            <p className="mt-2 text-pet-gray">Get started by creating your first pet adventure video.</p>
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="paw-button inline-flex items-center rounded-full bg-pet-purple px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
              >
                Create First Adventure
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 