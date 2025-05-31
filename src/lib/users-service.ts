import { supabaseAdmin } from './supabase-admin';
import { User } from '@supabase/supabase-js';

// Define the user profile type
export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
};

// Create the users table if it doesn't exist
export const createUsersTable = async () => {
  try {
    // Check if the table exists first
    const { error: checkError } = await supabaseAdmin.from('users').select('id').limit(1);
    
    // If we get a 'relation "users" does not exist' error, create the table
    if (checkError && checkError.message.includes('relation "users" does not exist')) {
      // Using SQL to create the table with proper constraints
      const { error } = await supabaseAdmin.rpc('create_users_table', {});
      
      if (error) {
        console.error('Error creating users table:', error);
        throw error;
      }
      
      console.log('Users table created successfully');
    }
  } catch (error) {
    console.error('Error checking/creating users table:', error);
    throw error;
  }
};

// Create a user in the users table
export const createUser = async (user: User) => {
  try {
    await createUsersTable(); // Ensure the table exists
    
    const { error } = await supabaseAdmin.from('users').insert({
      id: user.id,
      email: user.email,
      created_at: new Date().toISOString(),
    });
    
    if (error) {
      console.error('Error creating user in users table:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

// Get a user by ID
export const getUserById = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user:', error);
    throw error;
  }
  
  return data as UserProfile;
};

// Update a user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select();
  
  if (error) {

    console.error('Error updating user profile:', error);
    throw error;
  }
  
  return data[0] as UserProfile;
};