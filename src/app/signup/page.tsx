'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import PetIcon from '@/components/PetIcon';
import PetLoading from '@/components/PetLoading';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await signUp(email, password, fullName);
      
      // Check if there's a user and we need email confirmation
      if (response.data?.user && response.data?.session === null) {
        router.push('/login?message=Please check your email to verify your account');
      } else if (response.data?.session) {
        // User is automatically signed in (if email confirmation is disabled)
        router.push('/dashboard');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PetLoading />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 pet-pattern-bg">
      <div className="w-full max-w-md space-y-8 pet-card p-8">
        <div className="text-center">
          <PetIcon size={60} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold pet-gradient-text">Join PetVentures</h1>
          <p className="mt-2 text-pet-gray">Create your account to get started</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-pet-gray">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
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
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pet-input mt-1 block w-full"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-pet-gray">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pet-input mt-1 block w-full"
              placeholder="Create a password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="paw-button flex w-full justify-center rounded-full bg-black hover:bg-pet-purple-light px-4 py-3 text-sm font-medium text-white shadow-lg transition-all"
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-pet-gray">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-pet-purple hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
} 