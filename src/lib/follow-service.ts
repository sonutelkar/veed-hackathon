import { supabaseBrowser } from './supabase-browser';

// Define interface for follower record
interface FollowerRecord {
  follower_id: string;
  pet_id: string;
}

/**
 * Follow a pet
 * @param userId User ID of the follower
 * @param petId ID of the pet to follow
 * @returns True if successful, false otherwise
 */
export async function followPet(userId: string, petId: string): Promise<boolean> {
  const supabase = supabaseBrowser();
  
  const { error } = await supabase
    .from('pet_followers')
    .insert({
      follower_id: userId,
      pet_id: petId
    });
  
  if (error) {
    console.error('Error following pet:', error);
    return false;
  }
  
  return true;
}

/**
 * Unfollow a pet
 * @param userId User ID of the follower
 * @param petId ID of the pet to unfollow
 * @returns True if successful, false otherwise
 */
export async function unfollowPet(userId: string, petId: string): Promise<boolean> {
  const supabase = supabaseBrowser();
  
  const { error } = await supabase
    .from('pet_followers')
    .delete()
    .match({ follower_id: userId, pet_id: petId });
  
  if (error) {
    console.error('Error unfollowing pet:', error);
    return false;
  }
  
  return true;
}

/**
 * Check if a user follows a pet
 * @param userId User ID of the potential follower
 * @param petId ID of the pet
 * @returns True if following, false otherwise
 */
export async function isFollowingPet(userId: string, petId: string): Promise<boolean> {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .rpc('is_following_pet', {
      user_id: userId,
      pet_id: petId
    });
  
  if (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
  
  return data || false;
}

/**
 * Get the number of followers for a pet
 * @param petId ID of the pet
 * @returns Number of followers
 */
export async function getPetFollowerCount(petId: string): Promise<number> {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .rpc('get_pet_follower_count', {
      pet_id: petId
    });
  
  if (error) {
    console.error('Error getting follower count:', error);
    return 0;
  }
  
  return data || 0;
}

/**
 * Get all followers of a pet
 * @param petId ID of the pet
 * @returns Array of follower user IDs
 */
export async function getPetFollowers(petId: string): Promise<string[]> {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('pet_followers')
    .select('follower_id')
    .eq('pet_id', petId);
  
  if (error) {
    console.error('Error getting pet followers:', error);
    return [];
  }
  
  return data.map((item: FollowerRecord) => item.follower_id);
}

/**
 * Get all pets a user follows
 * @param userId User ID
 * @returns Array of pet IDs the user follows
 */
export async function getFollowedPets(userId: string): Promise<string[]> {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('pet_followers')
    .select('pet_id')
    .eq('follower_id', userId);
  
  if (error) {
    console.error('Error getting followed pets:', error);
    return [];
  }
  
  return data.map((item: FollowerRecord) => item.pet_id);
} 