import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { create } from 'zustand';

// Define the store state type
interface SupabaseState {
  supabase: SupabaseClient;
  session: Session | null;
  user: any | null;
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  // Methods
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create a single instance of Supabase client
const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Create the store
export const useSupabaseStore = create<SupabaseState>((set, get) => ({
  // Initial state
  supabase: createSupabaseClient(),
  session: null,
  user: null,
  loading: true,
  initialized: false,
  error: null,

  // Initialize the store with session data
  initialize: async () => {
    try {
      set({ loading: true, error: null });
      const supabase = get().supabase;

      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      set({ 
        session, 
        user: session?.user || null,
        initialized: true,
        loading: false
      });

      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          set({ 
            session, 
            user: session?.user || null 
          });
        }
      );

      // Note: We don't return the cleanup function here as it would change the return type
      // In a real app, you might want to handle this in a useEffect in a component
    } catch (error: any) {
      set({ error, loading: false });
      console.error('Supabase initialization error:', error);
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const supabase = get().supabase;
      await supabase.auth.signOut();
      set({ session: null, user: null });
    } catch (error: any) {
      set({ error });
      console.error('Sign out error:', error);
    }
  }
}));

// Helper hook to ensure the store is initialized
export function useSupabase() {
  const store = useSupabaseStore();
  
  if (!store.initialized && typeof window !== 'undefined') {
    store.initialize();
  }
  
  return store;
} 