import { supabaseBrowser } from './supabase-browser';
import { supabaseAdmin } from './supabase-admin';

// Define the pet profile type
export type PetProfile = {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  breed?: string;
  age?: number;
  created_at: string;
  updated_at?: string;
};

/**
 * Get a pet profile by user ID
 */
export async function getPetProfileByUserId(userId: string): Promise<PetProfile | null> {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('pet_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching pet profile:', error);
    return null;
  }
  
  return data as PetProfile;
}

/**
 * Create a new pet profile
 */
export async function createPetProfile(profile: Omit<PetProfile, 'id' | 'created_at' | 'updated_at'>): Promise<PetProfile | null> {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('pet_profiles')
    .insert([{
      ...profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating pet profile:', error);
    return null;
  }
  
  return data as PetProfile;
}

/**
 * Update an existing pet profile
 */
export async function updatePetProfile(
  profileId: string, 
  updates: Partial<Omit<PetProfile, 'id' | 'user_id' | 'created_at'>>
): Promise<PetProfile | null> {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('pet_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating pet profile:', error);
    return null;
  }
  
  return data as PetProfile;
}

/**
 * Set profile image for a pet
 */
export async function setPetProfileImage(userId: string, profileId: string, file: File): Promise<string | null> {
  const supabase = supabaseBrowser();
  
  try {
    // Upload the image to the 'videos' bucket under user's UID
    const fileExt = file.name.split('.').pop();
    const fileName = `profile-${profileId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading profile image:', uploadError);
      return null;
    }
    
    // Get the public URL for the uploaded image
    const { data } = supabase
      .storage
      .from('videos')
      .getPublicUrl(filePath);
    
    const publicUrl = data.publicUrl;
    
    // Update the pet profile with the new image URL
    const { error: updateError } = await supabase
      .from('pet_profiles')
      .update({
        profile_image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    if (updateError) {
      console.error('Error updating profile with new image:', updateError);
      return null;
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Unexpected error in setPetProfileImage:', error);
    return null;
  }
}

/**
 * Delete a pet profile
 */
export async function deletePetProfile(profileId: string): Promise<boolean> {
  const supabase = supabaseBrowser();
  
  const { error } = await supabase
    .from('pet_profiles')
    .delete()
    .eq('id', profileId);
  
  if (error) {
    console.error('Error deleting pet profile:', error);
    return false;
  }
  
  return true;
} 