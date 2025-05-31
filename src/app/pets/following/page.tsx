'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { PetProfile } from '@/lib/pet-profile-service';
import { getFollowedPets } from '@/lib/follow-service';

export default function FollowingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [followedPets, setFollowedPets] = useState<PetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchFollowedPets() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get IDs of pets the user follows
        const petIds = await getFollowedPets(user.id);
        
        if (petIds.length === 0) {
          setFollowedPets([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch details for those pets
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('pet_profiles')
          .select('*')
          .in('id', petIds);
        
        if (error) {
          console.error('Error fetching followed pets:', error);
          return;
        }
        
        setFollowedPets(data as PetProfile[]);
      } catch (err) {
        console.error('Unexpected error fetching followed pets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (user) {
      fetchFollowedPets();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pet-pattern-bg">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold pet-gradient-text">Pets You Follow</h1>
            <p className="mt-1 text-pet-gray">
              Keep up with your favorite furry friends
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              href="/pets"
              className="paw-button inline-flex items-center rounded-full border border-black px-6 py-3 text-sm font-medium text-black shadow-sm hover:bg-[#F5F0FF]"
            >
              Discover Pets
            </Link>
            <Link
              href="/videos"
              className="paw-button inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
            >
              My Profile
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <PetLoading />
          </div>
        ) : followedPets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {followedPets.map((pet) => (
              <Link 
                key={pet.id} 
                href={`/pets/${pet.id}`}
                className="block"
              >
                <div className="pet-card bg-white overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    {pet.profile_image_url ? (
                      <img 
                        src={pet.profile_image_url} 
                        alt={pet.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <span className="text-white text-5xl">🐾</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <h2 className="text-xl font-bold text-white">{pet.name}</h2>
                      {pet.breed && <p className="text-sm text-white opacity-90">{pet.breed}</p>}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-pet-gray text-sm">
                        {pet.age ? `${pet.age} years old` : 'Age unknown'}
                      </span>
                      <div className="flex items-center">
                        <span className="inline-flex items-center text-pet-gray text-sm">
                          <svg className="h-5 w-5 mr-1 text-black fill-current" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                          </svg>
                          Following
                        </span>
                      </div>
                    </div>
                    {pet.bio && (
                      <p className="text-pet-gray text-sm line-clamp-2">{pet.bio}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pet-card bg-white py-12 text-center">
            <div className="text-5xl mb-4">👀</div>
            <h3 className="text-xl font-bold text-pet-gray">Not following any pets yet</h3>
            <p className="mt-2 text-pet-gray">
              Discover and follow amazing pets to see them here.
            </p>
            <Link
              href="/pets"
              className="mt-6 paw-button inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
            >
              Discover Pets
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 