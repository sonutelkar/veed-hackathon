'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-6 text-5xl font-bold">Pet‑Adventure Generator 🚀</h1>
        <p className="mb-8 text-xl text-gray-600">
          Transform your pet photos into exciting adventures with AI-powered video generation.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-3 text-white shadow-md hover:bg-blue-700"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-blue-600 bg-white px-6 py-3 text-blue-600 shadow-md hover:bg-gray-50"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
