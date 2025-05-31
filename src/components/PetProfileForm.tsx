import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { PetProfile, createPetProfile, updatePetProfile, setPetProfileImage } from '@/lib/pet-profile-service';

interface PetProfileFormProps {
  profile: PetProfile | null;
  userId: string;
  onProfileUpdate: (profile: PetProfile) => void;
  onCancel?: () => void;
}

export default function PetProfileForm({ profile, userId, onProfileUpdate, onCancel }: PetProfileFormProps) {
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [breed, setBreed] = useState(profile?.breed || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(profile?.profile_image_url || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Pet name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert age to number if provided
      const ageNumber = age ? parseInt(age, 10) : undefined;
      
      let updatedProfile: PetProfile | null;
      
      if (profile) {
        // Update existing profile
        updatedProfile = await updatePetProfile(profile.id, {
          name,
          bio,
          breed,
          age: ageNumber
        });
      } else {
        // Create new profile
        updatedProfile = await createPetProfile({
          user_id: userId,
          name,
          bio,
          breed,
          age: ageNumber
        });
      }
      
      if (!updatedProfile) {
        throw new Error('Failed to save profile');
      }
      
      // Upload profile image if selected
      if (selectedImage && updatedProfile) {
        try {
          setIsImageUploading(true);
          console.log('Uploading profile image...');
          const imageUrl = await setPetProfileImage(userId, updatedProfile.id, selectedImage);
          
          if (imageUrl) {
            console.log('Image upload successful:', imageUrl);
            // Update the local profile object with the image URL
            updatedProfile.profile_image_url = imageUrl;
            
            // Ensure the profile in the database is updated with the image URL
            const updateResult = await updatePetProfile(updatedProfile.id, {
              profile_image_url: imageUrl
            });
            
            if (updateResult) {
              // Use the fully updated profile with image URL
              updatedProfile = updateResult;
            }
          } else {
            console.error('Image upload returned null URL');
            setError('Profile saved but image upload failed. Please try again.');
          }
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          setError('Profile saved but image upload failed. Please try again.');
        } finally {
          setIsImageUploading(false);
        }
      }
      
      // Pass the updated profile back to the parent component
      onProfileUpdate(updatedProfile);
    } catch (err) {
      setError('An error occurred while saving the profile');
      console.error('Profile save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-700">
          {error}
        </div>
      )}
      
      <div className="flex flex-col items-center mb-6">
        <div 
          className="h-32 w-32 rounded-full overflow-hidden bg-black mb-4 cursor-pointer flex items-center justify-center relative"
          onClick={handleImageClick}
        >
          {imagePreview ? (
            <>
              <img 
                src={imagePreview} 
                alt="Pet profile" 
                className="h-full w-full object-cover"
              />
              {isImageUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-white text-5xl">🐾</div>
              {isImageUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium">
              {isImageUploading ? 'Uploading...' : 'Change Photo'}
            </span>
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
          disabled={isSubmitting || isImageUploading}
        />
        {selectedImage && !imagePreview && (
          <p className="text-xs text-pet-gray mt-1">
            New image selected: {selectedImage.name}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-pet-gray">
          Pet Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="pet-input mt-1 block w-full"
          placeholder="What's your pet's name?"
          required
        />
      </div>
      
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-pet-gray">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={bio || ''}
          onChange={(e) => setBio(e.target.value)}
          className="pet-input mt-1 block w-full"
          placeholder="Tell us about your pet"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="breed" className="block text-sm font-medium text-pet-gray">
            Breed
          </label>
          <input
            id="breed"
            name="breed"
            type="text"
            value={breed || ''}
            onChange={(e) => setBreed(e.target.value)}
            className="pet-input mt-1 block w-full"
            placeholder="Pet's breed"
          />
        </div>
        
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-pet-gray">
            Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min="0"
            max="30"
            value={age || ''}
            onChange={(e) => setAge(e.target.value)}
            className="pet-input mt-1 block w-full"
            placeholder="Pet's age"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="paw-button inline-flex rounded-full border border-black px-6 py-3 text-sm font-medium text-black shadow-sm hover:bg-[#F5F0FF]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isImageUploading}
          className="paw-button inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-pet-purple-light transition-all"
        >
          {isSubmitting ? 'Saving...' : (isImageUploading ? 'Uploading Image...' : (profile ? 'Update Profile' : 'Create Profile'))}
        </button>
      </div>
    </form>
  );
} 