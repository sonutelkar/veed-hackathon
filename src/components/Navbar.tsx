'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import PetIcon from './PetIcon';
import { getUserById, UserProfile } from '@/lib/users-service';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserById(user.id);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  // Display name logic: use full_name if available, otherwise use email or fallback
  const displayName = userProfile?.full_name || user.email || 'User';
  // First letter for avatar
  const avatarInitial = userProfile?.full_name?.[0] || user.email?.[0] || 'P';

  return (
    <nav className="bg-white border-b border-[#F0F0FF] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 justify-between items-center">
          <div className="flex items-center">
            <div className="flex shrink-0 items-center">
              <div className="flex items-center">
                <PetIcon className="mr-2" />
                <span className="text-xl font-bold pet-gradient-text">PetVentures</span>
              </div>
            </div>
            <div className="ml-8 paw-tabs hidden sm:flex">
              <Link
                href="/dashboard"
                className={`mr-6 py-2 font-medium text-[15px] ${
                  pathname === '/dashboard'
                    ? 'text-[#8A4FFF] active'
                    : 'text-[#667085] hover:text-[#8A4FFF]'
                }`}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Dashboard
                </span>
              </Link>
              <Link
                href="/videos"
                className={`mr-6 py-2 font-medium text-[15px] ${
                  pathname === '/videos'
                    ? 'text-[#8A4FFF] active'
                    : 'text-[#667085] hover:text-[#8A4FFF]'
                }`}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  My Memories
                </span>
              </Link>
              <Link
                href="/generate"
                className={`mr-6 py-2 font-medium text-[15px] ${
                  pathname === '/generate'
                    ? 'text-[#8A4FFF] active'
                    : 'text-[#667085] hover:text-[#8A4FFF]'
                }`}
              >
                <span className="flex items-center">
                <svg className="w-5 h-5 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM4 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm16 0l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
</svg>
                  Generate
                </span>
              </Link>
              <Link
  href="/pets"
  className={`mr-6 py-2 font-medium text-[15px] ${
    pathname === '/pets'
      ? 'text-[#8A4FFF] active'
      : 'text-[#667085] hover:text-[#8A4FFF]'
  }`}
>
  <span className="flex items-center">
    <svg className="w-5 h-5 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 14c0 3.314 4 6 4 6s4-2.686 4-6a4 4 0 0 0-8 0z" />
    </svg>
    Pets
  </span>
</Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-sm text-[#667085] hidden sm:inline">{loading ? 'Loading...' : displayName}</span>
                  <div className="h-8 w-8 rounded-full bg-[#8A4FFF] text-center text-sm font-bold uppercase text-white flex items-center justify-center">
                    {avatarInitial}
                  </div>
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-[#667085] hover:bg-[#F5F0FF]"
                      onClick={() => setShowMenu(false)}
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleSignOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-[#667085] hover:bg-[#F5F0FF]"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 