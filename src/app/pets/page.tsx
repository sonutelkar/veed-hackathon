'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { PetProfile } from '@/lib/pet-profile-service';

export default function PetsDirectory() {
  const { user } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPets, setFilteredPets] = useState<PetProfile[]>([]);

  useEffect(() => {
    async function fetchAllPets() {
      setIsLoading(true);
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('pet_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching pets:', error);
          return;
        }
        
        setPets(data as PetProfile[]);
        setFilteredPets(data as PetProfile[]);
      } catch (err) {
        console.error('Unexpected error fetching pets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAllPets();
  }, []);

  useEffect(() => {
    // Filter pets based on search query
    if (searchQuery.trim() === '') {
      setFilteredPets(pets);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = pets.filter(pet => 
        pet.name.toLowerCase().includes(query) || 
        (pet.breed && pet.breed.toLowerCase().includes(query)) ||
        (pet.bio && pet.bio.toLowerCase().includes(query))
      );
      setFilteredPets(filtered);
    }
  }, [searchQuery, pets]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen pet-pattern-bg">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold pet-gradient-text">Discover Pets</h1>
            <p className="mt-1 text-pet-gray">
              Find and follow amazing pets on the platform
            </p>
          </div>
          {user && (
            <Link
              href="/videos"
              className="mt-4 md:mt-0 paw-button inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
            >
              My Profile
            </Link>
          )}
        </div>

        {/* Search bar */}
        <div className="pet-card bg-white p-4 mb-8">
          <div className="relative">
            <input
              type="text"
              className="pet-input block w-full pr-12 focus:outline-none"
              placeholder="Search by pet name, breed, or bio..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-pet-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <PetLoading />
          </div>
        ) : filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet) => (
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
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center text-pet-gray text-sm hover:text-black">
                          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{Math.floor(Math.random() * 100)}</span>
                        </button>
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
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-pet-gray">No pets found</h3>
            <p className="mt-2 text-pet-gray">
              {searchQuery.trim() !== '' 
                ? "We couldn't find any pets matching your search." 
                : "There are no pets registered on the platform yet."}
            </p>
            {searchQuery.trim() !== '' && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 paw-button inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 