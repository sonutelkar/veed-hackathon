'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PetProfile, getPetProfileByUserId, getOtherPetProfiles } from '@/lib/pet-profile-service';
import { generateDuet } from '@/lib/generate-duet';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import Image from 'next/image';

export default function Duet() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [myPetProfile, setMyPetProfile] = useState<PetProfile | null>(null);
  const [otherPets, setOtherPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState('');
  const [backgroundRemovedUrl1, setBackgroundRemovedUrl1] = useState<string | null>(null);
  const [backgroundRemovedUrl2, setBackgroundRemovedUrl2] = useState<string | null>(null);
  const [duetResult, setDuetResult] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchMyPetProfile() {
      if (!user) return;
      
      try {
        const profile = await getPetProfileByUserId(user.id);
        setMyPetProfile(profile);
      } catch (err) {
        console.error('Error fetching pet profile:', err);
      }
    }
    
    if (user) {
      fetchMyPetProfile();
    }
  }, [user]);

  useEffect(() => {
    async function fetchOtherPets() {
      if (!user) return;
      
      try {
        const pets = await getOtherPetProfiles(user.id);
        // Filter to only include pets that have profile images
        const petsWithImages = pets.filter(pet => pet.profile_image_url);
        setOtherPets(petsWithImages);
      } catch (err) {
        console.error('Error fetching other pets:', err);
      }
    }
    
    if (user) {
      fetchOtherPets();
    }
  }, [user]);

  const handleSelectPet = (pet: PetProfile) => {
    setSelectedPet(pet);
  };

  const handleGenerate = async () => {
    if (!myPetProfile || !myPetProfile.profile_image_url) {
      alert('Your pet needs a profile image to create a duet');
      return;
    }

    if (!selectedPet || !selectedPet.profile_image_url) {
      alert('Please select another pet with a profile image');
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setBackgroundRemovedUrl1(null);
    setBackgroundRemovedUrl2(null);
    setDuetResult(null);
    setVideoUrl(null);
    setProcessingStatus('processing');
    
    try {
      // Call the API to generate duet with user ID for storage
      const result = await generateDuet(
        prompt, 
        myPetProfile.profile_image_url, 
        selectedPet.profile_image_url,
        user?.id // Pass user ID for storage
      );
      
      if (result.status === 'success') {
        // Set the background removed image URLs if available
        if (result.backgroundRemovedUrl1) {
          setBackgroundRemovedUrl1(result.backgroundRemovedUrl1);
        }
        
        if (result.backgroundRemovedUrl2) {
          setBackgroundRemovedUrl2(result.backgroundRemovedUrl2);
        }
        
        setDuetResult(result.result);
        
        // Set the video URL if available
        if (result.videoUrl) {
          setVideoUrl(result.videoUrl);
          setProcessingStatus('completed');
        } else {
          setProcessingStatus('processing');
        }
        
        setGenerationResult('Duet generated successfully! The duet video will be available in approximately 5-10 minutes.');
      } else {
        setProcessingStatus('error');
        setGenerationResult(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating duet:', error);
      setProcessingStatus('error');
      setGenerationResult('Error generating duet. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
                Creating Your Pet Duet
              </h2>
              
              <p className="text-center text-gray-600 max-w-md mb-6">
                Our AI is crafting a unique duet with your pets. This magical process takes a moment...
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
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 pet-gradient-text">Create a Duet</h1>
        
        {!myPetProfile || !myPetProfile.profile_image_url ? (
          <div className="pet-card p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Complete Your Pet Profile First</h2>
            <p className="mb-4">Your pet needs a profile image to create duets.</p>
            <button
              onClick={() => router.push('/profile')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 transition"
            >
              Go to Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="pet-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">1. Create Your Duet</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Enter a prompt for your duet:
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                  rows={4}
                  placeholder="Describe what you want your pets to do together. E.g., 'Two cute dogs playing in a park with a ball'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Your Pet</h3>
                {myPetProfile.profile_image_url && (
                  <div className="flex items-center space-x-4">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-purple-400">
                      <Image
                        src={myPetProfile.profile_image_url}
                        alt={myPetProfile.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{myPetProfile.name}</p>
                      {myPetProfile.breed && <p className="text-pet-gray">{myPetProfile.breed}</p>}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Select a Pet to Duet With</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {otherPets.length > 0 ? (
                    otherPets.map((pet) => (
                      <div
                        key={pet.id}
                        onClick={() => handleSelectPet(pet)}
                        className={`p-2 rounded-lg cursor-pointer transition ${
                          selectedPet?.id === pet.id ? 'bg-purple-600 border-2 border-purple-400' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pet.profile_image_url && (
                          <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden">
                            <Image
                              src={pet.profile_image_url}
                              alt={pet.name}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        )}
                        <p className="text-center text-sm font-medium truncate">{pet.name}</p>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-3 text-gray-500">No other pets with profile images found</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedPet || !prompt.trim()}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded font-medium hover:bg-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {isGenerating ? 'Generating...' : 'Generate Duet'}
              </button>
            </div>
            
            <div className="pet-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">2. Results</h2>
              
              {generationResult && (
                <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <p>{generationResult}</p>
                </div>
              )}
              
              {duetResult ? (
                <>
                  {(backgroundRemovedUrl1 || backgroundRemovedUrl2) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Background Removed Images</h3>
                      <div className="flex flex-wrap gap-4">
                        {backgroundRemovedUrl1 && (
                          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                            <Image
                              src={backgroundRemovedUrl1}
                              alt="Your pet with background removed"
                              fill
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                        )}
                        {backgroundRemovedUrl2 && (
                          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                            <Image
                              src={backgroundRemovedUrl2}
                              alt="Selected pet with background removed"
                              fill
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {processingStatus === 'processing' && generationResult && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">⏳</span>
                        <h4 className="text-md font-semibold text-yellow-700 dark:text-yellow-300">Video Generation In Progress</h4>
                      </div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-200 mt-1">
                        Your pet duet video is being generated with AI. This process takes approximately 5-10 minutes. 
                        Please check back later in the Videos section to view your completed video.
                      </p>
                    </div>
                  )}
                  
                  {videoUrl && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Duet Preview</h3>
                      <video 
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
                        controls
                        poster={duetResult?.thumbnail_url || ''}
                      >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Your duet has been saved to your videos. You can find it in the Videos section!
                      </p>
                    </div>
                  )}
                  
                  {duetResult && duetResult.video_url && !videoUrl && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Duet Preview</h3>
                      <video 
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
                        controls
                        poster={duetResult.thumbnail_url || ''}
                      >
                        <source src={duetResult.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500">Your duet is not generated yet. Please click "Generate Duet" to create one!</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
