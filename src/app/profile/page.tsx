'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function Profile() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const supabase = supabaseBrowser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchProfile();
    }
  }, [user, isLoading, router]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data as UserProfile);
      setFullName(data.full_name || '');
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        setUpdateMessage('Failed to update profile. Please try again.');
      } else {
        setUpdateMessage('Profile updated successfully!');
        fetchProfile();
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
      setUpdateMessage('An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !user) {
    return <PetLoading />;
  }

  return (
    <div className="min-h-screen pet-pattern-bg">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold pet-gradient-text">Your Profile</h1>
          <p className="mt-1 text-pet-gray">
            Manage your account details
          </p>
        </div>

        <div className="pet-card bg-white p-8 relative">
          <div className="absolute -right-4 -top-4 text-4xl rotate-12">🐾</div>
          
          {updateMessage && (
            <div className={`mb-6 p-4 rounded-md ${updateMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {updateMessage}
            </div>
          )}
          
          <div className="mb-8">
            <div className="flex items-center">
              <div className="h-24 w-24 rounded-full bg-black flex items-center justify-center text-3xl font-bold uppercase text-white">
                {profile?.full_name?.[0] || user.email?.[0] || 'P'}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-pet-purple">{profile?.full_name || 'Pet Lover'}</h2>
                <p className="text-pet-gray">{user.email}</p>
                <p className="text-sm text-pet-gray mt-1">
                  Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'recently'}
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={updateProfile} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-pet-gray">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pet-input mt-1 block w-full"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-pet-gray">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="pet-input mt-1 block w-full bg-gray-50"
              />
              <p className="mt-1 text-xs text-pet-gray">Email cannot be changed</p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isUpdating}
                className="paw-button inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 