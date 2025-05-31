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
  selected?: boolean;
}

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

export default function Generate() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isVideosLoading, setIsVideosLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<VideoFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);

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
              size: file.metadata?.size || 0,
              selected: false
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

  const handleVideoSelection = (videoId: string) => {
    setVideos(prevVideos => {
      const updatedVideos = prevVideos.map(video => {
        if (video.id === videoId) {
          return { ...video, selected: !video.selected };
        }
        return video;
      });
      
      // Update selected videos list
      const selected = updatedVideos.filter(video => video.selected);
      setSelectedVideos(selected);
      
      return updatedVideos;
    });
  };

  const handleGenerate = async () => {
    if (selectedVideos.length === 0) {
      alert('Please select at least one video to generate content');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Placeholder for API call
      // In a real implementation, you would make an API call here
      console.log('Selected video URLs:', selectedVideos.map(v => v.url));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Placeholder result
      setGenerationResult('Generated content with your selected videos! (This is a placeholder result)');
    } catch (error) {
      console.error('Error generating content:', error);
      setGenerationResult('Error generating content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold pet-gradient-text">Generate Content</h1>
            <p className="mt-1 text-pet-gray">
              Select videos from your memories to create something special
            </p>
          </div>
          <Link
            href="/videos"
            className="paw-button inline-flex items-center rounded-full bg-white border border-pet-purple px-6 py-3 text-sm font-medium text-pet-purple shadow-lg hover:bg-[#F5F0FF] transition-all"
          >
            Back to Memories
          </Link>
        </div>

        {/* Selection summary */}
        <div className="pet-card bg-white p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-pet-purple">Selected Videos: {selectedVideos.length}</h2>
              <p className="text-sm text-pet-gray">
                {selectedVideos.length > 0 
                  ? 'Click on videos below to select or deselect them' 
                  : 'Select videos from your gallery below'}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={selectedVideos.length === 0 || isGenerating}
              className={`paw-button inline-flex items-center rounded-full px-6 py-3 text-sm font-medium text-white shadow-lg transition-all
                ${selectedVideos.length === 0 || isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-pet-purple hover:bg-pet-purple-light'
                }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : 'Generate Content'}
            </button>
          </div>
        </div>

        {/* Generation result */}
        {generationResult && (
          <div className="pet-card bg-white p-6 mb-6 border-2 border-pet-purple">
            <h3 className="text-xl font-bold text-pet-purple mb-2">Generation Result</h3>
            <p className="text-pet-gray">{generationResult}</p>
          </div>
        )}

        {/* Video grid */}
        {isVideosLoading ? (
          <div className="flex justify-center py-12">
            <PetLoading />
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className={`pet-card bg-white overflow-hidden relative cursor-pointer transition-all
                  ${video.selected ? 'ring-4 ring-pet-purple shadow-lg transform scale-[1.02]' : 'hover:shadow-md'}
                `}
                onClick={() => handleVideoSelection(video.id)}
              >
                {video.selected && (
                  <div className="absolute top-2 right-2 z-10 bg-pet-purple text-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pet-card bg-white py-12 text-center">
            <PetIcon size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-pet-purple">No memories available</h3>
            <p className="mt-2 text-pet-gray">You need to create some pet videos before you can generate content.</p>
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
