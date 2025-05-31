'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import UploadDropzone from '@/components/UploadDropzone';
import VideoPlayer from '@/components/VideoPlayer';
import Navbar from '@/components/Navbar';
import PetLoading from '@/components/PetLoading';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold pet-gradient-text">Welcome to PetVentures</h1>
          <p className="mt-1 text-pet-gray">
            Transform your furry friends into epic adventurers with our AI magic
          </p>
        </div>

        {/* Dashboard stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="pet-card bg-white p-5">
            <div className="flex items-center">
              <div className="shrink-0 rounded-full bg-pet-purple p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-pet-gray truncate">Adventure Views</dt>
                  <dd className="text-xl font-semibold text-pet-purple">0</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="pet-card bg-white p-5">
            <div className="flex items-center">
              <div className="shrink-0 rounded-full bg-pet-pink p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-pet-gray truncate">Adventures Created</dt>
                  <dd className="text-xl font-semibold text-pet-pink">0</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="pet-card bg-white p-5">
            <div className="flex items-center">
              <div className="shrink-0 rounded-full bg-pet-teal p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-pet-gray truncate">Processing Time</dt>
                  <dd className="text-xl font-semibold text-pet-teal">~30s</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Upload section */}
        <div className="pet-card bg-white mb-8 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-4xl rotate-12">🐾</div>
          <div className="px-6 py-8">
            <h3 className="text-xl font-bold text-pet-purple mb-2">Upload your memories</h3>
            <div className="mb-4 text-pet-gray">
              <p>Upload your memories which you can use to generate your pet adventures</p>
            </div>
            <div className="mt-5">
              <UploadDropzone />
            </div>
          </div>
        </div>

        {/* Recent video preview */}
        <div className="pet-card bg-white relative overflow-hidden">
          <div className="absolute -left-4 -top-4 text-4xl -rotate-12">🐾</div>
          <div className="px-6 py-8">
            <h3 className="text-xl font-bold text-pet-purple mb-2">Latest Adventure</h3>
            <div className="mb-4 text-pet-gray">
              <p>Preview your most recent pet adventure</p>
            </div>
            <div className="mt-5 rounded-xl overflow-hidden">
              <VideoPlayer />
            </div>
            <div className="mt-6">
              <Link
                href="/videos"
                className="paw-button inline-flex items-center rounded-full bg-pet-purple px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
              >
                View All Adventures
                <svg className="ml-2 -mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 