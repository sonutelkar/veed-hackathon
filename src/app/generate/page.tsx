'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import PetIcon from '@/components/PetIcon';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { generateAdventure } from '@/lib/generate-adventure';

interface ImageFile {
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
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isImagesLoading, setIsImagesLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);
  const [generatedScenes, setGeneratedScenes] = useState<string[]>([]);
  const [backgroundRemovedUrl, setBackgroundRemovedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchUserImages() {
      if (!user) return;
      
      setIsImagesLoading(true);
      const supabase = supabaseBrowser();
      
      try {
        // Get all files from the user's folder in the 'videos' bucket
        const { data, error } = await supabase
          .storage
          .from('videos')
          .list(user.id);
        
        if (error) {
          console.error('Error fetching images:', error);
          setIsImagesLoading(false);
          return;
        }
        
        // Filter for image files only
        const imageFiles = data
          .filter((file: StorageFile) => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map((file: StorageFile) => {
            // Get public URL for each image
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
        
        setImages(imageFiles);
      } catch (err) {
        console.error('Unexpected error fetching images:', err);
      } finally {
        setIsImagesLoading(false);
      }
    }
    
    if (user) {
      fetchUserImages();
    }
  }, [user]);

  const handleImageSelection = (imageId: string) => {
    setImages(prevImages => {
      const updatedImages = prevImages.map(image => {
        if (image.id === imageId) {
          return { ...image, selected: !image.selected };
        }
        return { ...image, selected: false };
      });
      
      // Update selected image
      const selected = updatedImages.find(image => image.selected);
      setSelectedImage(selected || null);
      
      return updatedImages;
    });
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      alert('Please select an image to generate content');
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setBackgroundRemovedUrl(null);
    
    try {
      // Call the API to generate adventure
      const result = await generateAdventure(prompt, selectedImage.url);
      
      // Set the generated scenes
      setGeneratedScenes(result.scenes);
      
      // Set the background removed image URL if available
      if (result.backgroundRemovedUrl) {
        setBackgroundRemovedUrl(result.backgroundRemovedUrl);
      }
      
      // Set a summary result message
      setGenerationResult(`Generated a pet adventure with ${result.scenes.length} scenes! Videos will be available in approximately 20 minutes.`);
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

      {/* Fullscreen Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-lg">
            {/* Animated colorful blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            <div className="absolute -bottom-8 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-3000"></div>
            
            {/* Centered content */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex items-center justify-center mb-8">
                <div className="h-24 w-24 relative">
                  {/* Spinning gradient ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-spin"></div>
                  {/* Inner white circle */}
                  <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                    <span className="text-4xl">🐾</span>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                Creating Your Pet's Adventure
              </h2>
              
              <p className="text-center text-gray-600 max-w-md mb-6">
                Our AI is crafting a unique adventure for your pet. This magical process takes a moment...
              </p>
              
              {/* Animated dots */}
              <div className="flex space-x-2 justify-center items-center">
                <div className="w-3 h-3 rounded-full bg-purple-600 animate-bounce"></div>
                <div className="w-3 h-3 rounded-full bg-pink-600 animate-bounce animation-delay-200"></div>
                <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce animation-delay-400"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold pet-gradient-text">Generate Pet Content</h1>
            <p className="mt-1 text-pet-gray">
              Enter a prompt and select an image to create something special
            </p>
          </div>
          <Link
            href="/videos"
            className="paw-button inline-flex items-center rounded-full bg-white border border-black px-6 py-3 text-sm font-medium text-pet-purple shadow-lg hover:bg-[#F5F0FF] transition-all"
          >
            Back to Memories
          </Link>
        </div>

        {/* Prompt input */}
        <div className="pet-card bg-white p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold text-pet-purple mb-3">
            <span className="text-2xl mr-2">🐾</span> Enter Your Prompt
          </h2>
          <div className="relative">
            <textarea
              className="w-full px-4 py-3 border-2 border-[#E5DAFF] rounded-lg focus:outline-none focus:border-pet-purple transition-colors"
              placeholder="Describe what you want to create with your pet's image..."
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            ></textarea>
            <div className="absolute bottom-3 right-3 text-pet-gray text-sm">
              {prompt.length}/500
            </div>
          </div>
          <p className="text-sm text-pet-gray mt-2">
            Examples: "Create a space adventure with my pet", "My pet as a superhero", "My pet in a magical forest"
          </p>
        </div>

        {/* Selection summary */}
        <div className="pet-card bg-white p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-pet-purple">Selected Image: {selectedImage ? '1' : '0'}</h2>
              <p className="text-sm text-pet-gray">
                {selectedImage 
                  ? 'Click on the selected image to deselect it' 
                  : 'Select an image from your gallery below'}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!selectedImage || !prompt.trim() || isGenerating}
              className={`paw-button mt-4 sm:mt-0 inline-flex items-center rounded-full px-6 py-3 text-sm font-medium text-white shadow-lg transition-all
                ${!selectedImage || !prompt.trim() || isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-pet-purple-light'
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
              ) : 'Generate Content 🚀'}
            </button>
          </div>
        </div>

        {/* Generation result */}
        {generationResult && (
          <div className="pet-card bg-white p-6 mb-6 border-2 border-pet-purple">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">✨</span>
              <h3 className="text-xl font-bold text-pet-purple">Generation Result</h3>
            </div>
            <p className="text-pet-gray">{generationResult}</p>
            
            {backgroundRemovedUrl && (
              <>
                <div className="mt-6 mb-4">
                  <h4 className="text-lg font-semibold text-pet-purple mb-2">Your Pet (Background Removed)</h4>
                  <div className="flex justify-center bg-[#F9F5FF] p-4 rounded-lg">
                    <img 
                      src={backgroundRemovedUrl} 
                      alt="Pet with background removed" 
                      className="max-h-64 object-contain rounded-lg shadow-md"
                    />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">⏳</span>
                    <h4 className="text-md font-semibold text-yellow-700">Video Generation In Progress</h4>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Your pet videos are being generated with AI. This process takes approximately 20 minutes. 
                    Please check back later in the Videos section to view your completed videos.
                  </p>
                </div>
              </>
            )}
            
            {generatedScenes.length > 0 && (
              <div className="mt-4">
                <h4 className="text-lg font-semibold text-pet-purple mb-2">Your Pet's Adventure</h4>
                <div className="space-y-4">
                  {generatedScenes.map((scene, index) => (
                    <div key={index} className="p-4 bg-[#F9F5FF] rounded-lg">
                      <p className="text-pet-gray">{scene}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image grid */}
        {isImagesLoading ? (
          <div className="flex justify-center py-12">
            <PetLoading />
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div 
                key={image.id} 
                className={`pet-card bg-white overflow-hidden relative cursor-pointer transition-all
                  ${image.selected ? 'ring-4 ring-pet-purple shadow-lg transform scale-[1.02]' : 'hover:shadow-md'}
                `}
                onClick={() => handleImageSelection(image.id)}
              >
                {image.selected && (
                  <div className="absolute top-2 right-2 z-10 bg-pet-purple text-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="absolute -right-4 -top-4 rotate-12 text-2xl z-10">🐾</div>
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-pet-purple">
                    {image.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-sm text-pet-gray">
                    <span>Created: {formatDate(image.createdAt)}</span>
                    <span>{formatFileSize(image.size)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pet-card bg-white py-12 text-center">
            <PetIcon size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-pet-purple">No images available</h3>
            <p className="mt-2 text-pet-gray">You need to upload some pet images before you can generate content.</p>
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="paw-button inline-flex items-center rounded-full bg-pet-purple px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
              >
                Upload Images
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
