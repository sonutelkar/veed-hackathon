'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import PetIcon from '@/components/PetIcon';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { PetProfile, getPetProfileByUserId } from '@/lib/pet-profile-service';
import PetProfileForm from '@/components/PetProfileForm';
import { getPetFollowerCount, getFollowedPets } from '@/lib/follow-service';

interface VideoFile {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  size: number;
  type: string;
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
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const [mediaLikes, setMediaLikes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchPetProfile() {
      if (!user) return;
      
      setIsProfileLoading(true);
      try {
        const profile = await getPetProfileByUserId(user.id);
        setPetProfile(profile);
      } catch (err) {
        console.error('Error fetching pet profile:', err);
      } finally {
        setIsProfileLoading(false);
      }
    }
    
    if (user) {
      fetchPetProfile();
    }
  }, [user]);

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
        
        // Filter for video and image files only
        const mediaFiles = data
          .filter((file: StorageFile) => 
            file.name.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv|jpg|jpeg|png|gif)$/i))
          .map((file: StorageFile) => {
            // Get public URL for each media file
            const url = supabase.storage.from('videos').getPublicUrl(`${user.id}/${file.name}`).data.publicUrl;
            
            return {
              id: file.id,
              name: formatDate(file.created_at),
              url: url,
              createdAt: file.created_at,
              size: file.metadata?.size || 0,
              type: file.name.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i) ? 'video' : 'image' // Determine type
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
    
    if (user) {
      fetchUserVideos();
    }
  }, [user]);

  useEffect(() => {
    async function fetchFollowerStats() {
      if (!user || !petProfile) return;
      
      try {
        // Get followers count for this pet
        const followerCount = await getPetFollowerCount(petProfile.id);
        
        // Get count of pets this user follows
        const followedPets = await getFollowedPets(user.id);
        
        setStats(prev => ({
          ...prev,
          followers: followerCount,
          following: followedPets.length
        }));
      } catch (err) {
        console.error('Error fetching follower stats:', err);
      }
    }
    
    if (petProfile) {
      fetchFollowerStats();
    }
  }, [user, petProfile]);

  const handleProfileUpdate = (updatedProfile: PetProfile) => {
    setPetProfile(updatedProfile);
    setShowEditProfile(false);
  };

  if (isLoading) {
    return <PetLoading />;
  }

  if (!user) {
    return null;
  }

  const filterVideos = (filter: 'all' | 'newest' | 'oldest') => {
    setActiveFilter(filter);
    
    let sortedVideos = [...videos];
    
    if (filter === 'newest') {
      sortedVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filter === 'oldest') {
      sortedVideos.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    setVideos(sortedVideos);
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

  // Function to get random but stable like count for a media item
  const getLikeCount = (mediaId: string) => {
    if (mediaLikes[mediaId] !== undefined) {
      return mediaLikes[mediaId];
    }
    
    // Create a stable pseudo-random number based on the media ID
    const hash = mediaId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Generate a number between 5 and 150
    const likeCount = Math.abs(hash % 146) + 5;
    
    // Store it for consistency
    setMediaLikes(prev => ({
      ...prev,
      [mediaId]: likeCount
    }));
    
    return likeCount;
  };

  // Function to get random but stable comment count for a media item
  const getCommentCount = (mediaId: string) => {
    // Create a different hash than likes
    const hash = mediaId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 4) - acc);
    }, 0);
    
    // Generate a number between 0 and 30
    return Math.abs(hash % 31);
  };

  return (
    <div className="min-h-screen pet-pattern-bg">
      <Navbar />

      {/* Profile Header */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {isProfileLoading ? (
          <div className="flex justify-center py-8">
            <PetLoading />
          </div>
        ) : showEditProfile ? (
          <div className="pet-card bg-white p-8 mb-8">
            <h2 className="text-2xl font-bold text-pet-purple mb-6">
              {petProfile ? 'Edit Pet Profile' : 'Create Pet Profile'}
            </h2>
            <PetProfileForm 
              profile={petProfile} 
              userId={user.id} 
              onProfileUpdate={handleProfileUpdate}
              onCancel={() => setShowEditProfile(false)}
            />
          </div>
        ) : (
          <div className="pet-card bg-white p-6 mb-8">
            <div className="md:flex items-start">
              {/* Profile Image */}
              <div className="flex-shrink-0 mx-auto md:mx-0 mb-4 md:mb-0">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-pet-purple">
                  {petProfile?.profile_image_url ? (
                    <img 
                      src={petProfile.profile_image_url} 
                      alt={petProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-pet-purple flex items-center justify-center">
                      <span className="text-white text-5xl">🐾</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 md:ml-8 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h1 className="text-3xl font-bold pet-gradient-text mb-2 md:mb-0">
                    {petProfile?.name || 'My Pet'}
                  </h1>
                  <div className="flex justify-center md:justify-start space-x-2">
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="paw-button inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pet-purple-light"
                    >
                      {petProfile ? 'Edit Profile' : 'Create Profile'}
                    </button>
                    <Link
                      href="/generate"
                      className="paw-button inline-flex items-center rounded-full border border-pet-purple px-4 py-2 text-sm font-medium text-pet-purple shadow-sm hover:bg-[#F5F0FF]"
                    >
                      New Post
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
                {petProfile && (
                  <div className="mb-4">
                    {petProfile.breed && (
                      <p className="font-medium text-gray-700">{petProfile.breed}</p>
                    )}
                    {petProfile.age && (
                      <p className="text-gray-700">{petProfile.age} years old</p>
                    )}
                    <p className="text-gray-600 mt-1">{petProfile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="pet-card bg-white p-4 mb-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="mt-2 sm:mt-0">
              <div className="flex rounded-full overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => filterVideos('newest')}
                  className={`relative -ml-px inline-flex items-center px-4 py-2 text-sm font-medium ${
                    activeFilter === 'newest'
                      ? 'bg-pet-purple text-white'
                      : 'bg-white text-pet-purple hover:bg-[#F5F0FF]'
                  } border border-[#E5DAFF]`}
                >
                  Newest First
                </button>
                <button
                  type="button"
                  onClick={() => filterVideos('oldest')}
                  className={`relative -ml-px inline-flex items-center px-4 py-2 text-sm font-medium ${
                    activeFilter === 'oldest'
                      ? 'bg-pet-purple text-white'
                      : 'bg-white text-pet-purple hover:bg-[#F5F0FF]'
                  } border border-[#E5DAFF]`}
                >
                  Oldest First
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

        {/* Instagram-style grid */}
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
                      <span>{getLikeCount(media.id)}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{getCommentCount(media.id)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pet-card bg-white py-12 text-center">
            <PetIcon size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-pet-purple">No posts yet</h3>
            <p className="mt-2 text-pet-gray">Share your first pet memory and start building your profile.</p>
            <div className="mt-6">
              <Link
                href="/generate"
                className="paw-button inline-flex items-center rounded-full bg-pet-purple px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
              >
                Create First Post
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 