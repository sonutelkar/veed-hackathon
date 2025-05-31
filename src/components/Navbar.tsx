'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PetIcon from './PetIcon';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

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
                  My Adventures
                </span>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#667085]">{user.email}</span>
              <div className="h-8 w-8 rounded-full bg-[#8A4FFF] text-center text-sm font-bold uppercase text-white flex items-center justify-center">
                {user.email?.[0] || 'P'}
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 paw-button rounded-full bg-white px-4 py-2 text-sm font-medium text-[#8A4FFF] hover:bg-[#F5F0FF] border border-[#E5DAFF] transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 