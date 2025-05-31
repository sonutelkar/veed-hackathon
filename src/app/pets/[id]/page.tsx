'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { PetProfile } from '@/lib/pet-profile-service';

interface VideoFile {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  size: number;
  type: string;
}

export default function PetProfile() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isVideosLoading, setIsVideosLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: Math.floor(Math.random() * 1000),
    following: Math.floor(Math.random() * 500)
  });

  useEffect(() => {
    async function fetchPetProfile() {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('pet_profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching pet profile:', error);
          router.push('/pets');
          return;
        }
        
        setPet(data as PetProfile);
        
        // Set random following status for demo
        setIsFollowing(Math.random() > 0.5);
      } catch (err) {
        console.error('Unexpected error fetching pet profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPetProfile();
  }, [id, router]);

  useEffect(() => {
    async function fetchPetVideos() {
      if (!pet) return;
      
      setIsVideosLoading(true);
      try {
        const supabase = supabaseBrowser();
        
        // Get all files from the user's folder in the 'videos' bucket
        const { data, error } = await supabase
          .storage
          .from('videos')
          .list(pet.user_id);
        
        if (error) {
          console.error('Error fetching videos:', error);
          setIsVideosLoading(false);
          return;
        }
        
        // Filter for video and image files only
        const mediaFiles = data
          .filter((file: any) => 
            file.name.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv|jpg|jpeg|png|gif)$/i))
          .map((file: any) => {
            // Get public URL for each media file
            const url = supabase.storage.from('videos').getPublicUrl(`${pet.user_id}/${file.name}`).data.publicUrl;
            
            return {
              id: file.id,
              name: file.name,
              url: url,
              createdAt: file.created_at,
              size: file.metadata?.size || 0,
              type: file.name.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i) ? 'video' : 'image'
            };
          });
        
        setVideos(mediaFiles);
        setStats(prev => ({ ...prev, posts: mediaFiles.length }));
      } catch (err) {
        console.error('Unexpected error fetching videos:', err);
      } finally {
        setIsVideosLoading(false);
      }
    }
    
    if (pet) {
      fetchPetVideos();
    }
  }, [pet]);

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    // In a real app, you would save this to a database
    setStats(prev => ({
      ...prev,
      followers: prev.followers + (isFollowing ? -1 : 1)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pet-pattern-bg">
        <Navbar />
        <div className="flex justify-center py-20">
          <PetLoading />
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen pet-pattern-bg">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="pet-card bg-white p-8 text-center">
            <div className="text-5xl mb-4">😿</div>
            <h2 className="text-2xl font-bold text-pet-gray mb-2">Pet Not Found</h2>
            <p className="text-pet-gray mb-6">The pet you're looking for doesn't exist or has been removed.</p>
            <Link
              href="/pets"
              className="paw-button inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
            >
              Discover Other Pets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pet-pattern-bg">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="pet-card bg-white p-6 mb-8">
          <div className="md:flex items-start">
            {/* Profile Image */}
            <div className="flex-shrink-0 mx-auto md:mx-0 mb-4 md:mb-0">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-black">
                {pet.profile_image_url ? (
                  <img 
                    src={pet.profile_image_url} 
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <span className="text-white text-5xl">🐾</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 md:ml-8 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <h1 className="text-3xl font-bold pet-gradient-text mb-2 md:mb-0">
                  {pet.name}
                </h1>
                <div className="flex justify-center md:justify-start space-x-2">
                  {user && user.id !== pet.user_id && (
                    <button
                      onClick={toggleFollow}
                      className={`paw-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium shadow-sm ${
                        isFollowing 
                          ? 'bg-white text-black border border-black' 
                          : 'bg-black text-white'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  <Link
                    href="/pets"
                    className="paw-button inline-flex items-center rounded-full border border-black px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-[#F5F0FF]"
                  >
                    Back to Pets
                  </Link>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex justify-center md:justify-start space-x-8 mb-4">
                <div className="text-center">
                  <span className="block font-bold text-gray-800">{stats.posts}</span>
                  <span className="text-sm text-pet-gray">posts</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-gray-800">{stats.followers}</span>
                  <span className="text-sm text-pet-gray">followers</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-gray-800">{stats.following}</span>
                  <span className="text-sm text-pet-gray">following</span>
                </div>
              </div>
              
              {/* Bio */}
              <div className="mb-4">
                {pet.breed && (
                  <p className="font-medium text-gray-700">{pet.breed}</p>
                )}
                {pet.age && (
                  <p className="text-gray-700">{pet.age} years old</p>
                )}
                <p className="text-gray-600 mt-1">{pet.bio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram-style grid */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-bold text-black mb-4">Posts</h2>
          
          {isVideosLoading ? (
            <div className="flex justify-center py-12">
              <PetLoading />
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {videos.map((media) => (
                <div key={media.id} className="relative aspect-square overflow-hidden bg-gray-100 group">
                  {media.type === 'video' ? (
                    <>
                      <div className="absolute top-2 right-2 z-10">
                        <svg className="h-6 w-6 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <video
                        className="h-full w-full object-cover cursor-pointer"
                        preload="metadata"
                        onClick={() => window.open(media.url, '_blank')}
                      >
                        <source src={media.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </>
                  ) : (
                    <img
                      src={media.url}
                      alt={media.name}
                      className="h-full w-full object-cover cursor-pointer"
                      onClick={() => window.open(media.url, '_blank')}
                    />
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-4 text-white">
                      <div className="flex items-center">
                        <svg className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{Math.floor(Math.random() * 100)}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{Math.floor(Math.random() * 20)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pet-card bg-white py-12 text-center">
              <div className="text-5xl mb-4">📷</div>
              <h3 className="text-xl font-bold text-pet-gray">No posts yet</h3>
              <p className="mt-2 text-pet-gray">This pet hasn't shared any memories yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 