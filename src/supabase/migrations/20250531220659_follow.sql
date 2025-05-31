-- Migration to create pet_followers table and associated policies

-- Create pet_followers table to track followers
CREATE TABLE IF NOT EXISTS public.pet_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, pet_id) -- Prevent duplicate follows
);

-- Create indices for faster lookups
CREATE INDEX idx_pet_followers_follower_id ON public.pet_followers(follower_id);
CREATE INDEX idx_pet_followers_pet_id ON public.pet_followers(pet_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.pet_followers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view all follower relationships
CREATE POLICY "Anyone can view follower relationships" ON public.pet_followers
    FOR SELECT
    USING (true);

-- Allow users to follow pets (but not their own)
CREATE POLICY "Users can follow other users' pets" ON public.pet_followers
    FOR INSERT
    WITH CHECK (
        auth.uid() = follower_id AND
        auth.uid() <> (
            SELECT user_id FROM public.pet_profiles
            WHERE id = pet_id
        )
    );

-- Allow users to unfollow (delete their own follow relationships)
CREATE POLICY "Users can unfollow pets" ON public.pet_followers
    FOR DELETE
    USING (auth.uid() = follower_id);

-- Function to get follower count for a pet
CREATE OR REPLACE FUNCTION public.get_pet_follower_count(pet_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.pet_followers
        WHERE public.pet_followers.pet_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user follows a pet
CREATE OR REPLACE FUNCTION public.is_following_pet(user_id UUID, pet_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.pet_followers
        WHERE follower_id = $1 AND pet_id = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
