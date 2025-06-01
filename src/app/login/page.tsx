'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import PetIcon from '@/components/PetIcon';
import PetLoading from '@/components/PetLoading';

// Component to handle search params separately within Suspense
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn, user } = useAuth();
  
  // Import useSearchParams inside this component
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
    
    const message = searchParams?.get('message');
    if (message) {
      setMessage(message);
    }
  }, [user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid email or password');
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
          <h1 className="text-3xl font-bold pet-gradient-text">Welcome Back</h1>
          <p className="mt-2 text-pet-gray">Sign in to continue your pet adventures</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-md bg-[#F0F7FF] dark:bg-[#1a2e44] p-4 text-sm text-pet-blue">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
              placeholder="Enter your password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="paw-button flex w-full justify-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-pet-gray">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-pet-purple hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
} 