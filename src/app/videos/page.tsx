'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import PetIcon from '@/components/PetIcon';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface VideoFile {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  size: number;
}

// Interface for Supabase storage file
interface StorageFile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl?: string;
  };
}

export default function Videos() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isVideosLoading, setIsVideosLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchUserVideos() {
      if (!user) return;
      
      setIsVideosLoading(true);
      const supabase = supabaseBrowser();
      
      try {
        // Get all files from the user's folder in the 'videos' bucket
        const { data, error } = await supabase
          .storage
          .from('videos')
          .list(user.id);
        
        if (error) {
          console.error('Error fetching videos:', error);
          setIsVideosLoading(false);
          return;
        }
        
        // Filter for video files only
        const videoFiles = data
          .filter((file: StorageFile) => file.name.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i))
          .map((file: StorageFile) => {
            // Get public URL for each video
            const url = supabase.storage.from('videos').getPublicUrl(`${user.id}/${file.name}`).data.publicUrl;
            
            return {
              id: file.id,
              name: formatDate(file.created_at),
              url: url,
              createdAt: file.created_at,
              size: file.metadata?.size || 0
            };
          });
        
        setVideos(videoFiles);
      } catch (err) {
        console.error('Unexpected error fetching videos:', err);
      } finally {
        setIsVideosLoading(false);
      }
    }
    
    if (user) {
      fetchUserVideos();
    }
  }, [user]);

  if (isLoading) {
    return <PetLoading />;
  }

  if (!user) {
    return null;
  }

  const filterVideos = (filter: 'all' | 'recent' | 'popular') => {
    setActiveFilter(filter);
    // In a real app, this would filter videos from the database
    // For now, we'll just use the fetched data
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen pet-pattern-bg">
      <Navbar />

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold pet-gradient-text">My Memories</h1>
            <p className="mt-1 text-pet-gray">
              View and share your pet's amazing moments
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
                  All Memories
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
                  placeholder="Search memories..."
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
        {isVideosLoading ? (
          <div className="flex justify-center py-12">
            <PetLoading />
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div key={video.id} className="pet-card bg-white overflow-hidden relative">
                <div className="absolute -right-4 -top-4 rotate-12 text-2xl z-10">🐾</div>
                <div className="relative">
                  <video
                    className="h-48 w-full object-cover"
                    controls
                    preload="metadata"
                  >
                    <source src={video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-pet-purple">
                    {video.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-sm text-pet-gray">
                    <span>Created: {formatDate(video.createdAt)}</span>
                    <span>{formatFileSize(video.size)}</span>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button 
                      onClick={() => navigator.clipboard.writeText(video.url)}
                      className="paw-button inline-flex items-center rounded-full border border-[#E5DAFF] bg-white px-3 py-1.5 text-xs font-medium text-pet-purple shadow-sm hover:bg-[#F5F0FF]"
                    >
                      <svg className="mr-1.5 h-4 w-4 text-pet-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </button>
                    <a 
                      href={video.url} 
                      download={video.name}
                      className="paw-button inline-flex items-center rounded-full border border-[#E5DAFF] bg-white px-3 py-1.5 text-xs font-medium text-pet-purple shadow-sm hover:bg-[#F5F0FF]"
                    >
                      <svg className="mr-1.5 h-4 w-4 text-pet-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pet-card bg-white py-12 text-center">
            <PetIcon size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-pet-purple">No memories yet</h3>
            <p className="mt-2 text-pet-gray">Get started by creating your first pet video memory.</p>
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="paw-button inline-flex items-center rounded-full bg-pet-purple px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
              >
                Create First Memory
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 