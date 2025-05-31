-- Migration to create pet_profiles table and associated policies

-- Create pet_profiles table
CREATE TABLE IF NOT EXISTS public.pet_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    breed TEXT,
    age INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_pet_profiles_user_id ON public.pet_profiles(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.pet_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view all pet profiles
CREATE POLICY "Anyone can view pet profiles" ON public.pet_profiles
    FOR SELECT
    USING (true);

-- Allow users to create their own pet profiles
CREATE POLICY "Users can create their own pet profiles" ON public.pet_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own pet profiles
CREATE POLICY "Users can update their own pet profiles" ON public.pet_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own pet profiles
CREATE POLICY "Users can delete their own pet profiles" ON public.pet_profiles
    FOR DELETE
    USING (auth.uid() = user_id); 