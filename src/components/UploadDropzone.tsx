'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase-store';

export default function UploadDropzone() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();
  
  // Use the centralized Supabase store
  const { supabase, user, session, loading: authLoading, error: authError } = useSupabase();

  async function handleSubmit() {
    if (!files.length || !user) return;
    
    setUploading(true);
    setUploadError(null);

    try {
      /* Upload each file to the `videos` bucket under user's UID folder */
      const paths: string[] = [];
      for (const file of files) {
        // Create path with user's UID as folder
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        
        // Use the authenticated client for storage operations
        const { error, data } = await supabase.storage
          .from('videos')
          .upload(path, file, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: false,
          });
        
        if (error) {
          console.error('Upload error:', error);
          setUploadError(`Upload failed: ${error.message}`);
          setUploading(false);
          return;
        }
        
        // Get the public URL for the uploaded file
        const { data: publicURLData } = supabase.storage
          .from('videos')
          .getPublicUrl(path);
          
        paths.push(path);
      }

      setUploading(false);
      
      // Redirect to videos page after successful upload
      router.push('/videos');
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setUploadError(err.message || 'An unexpected error occurred during upload');
      setUploading(false);
    }
  }

  // Show auth errors if they happen
  useEffect(() => {
    if (authError) {
      console.error('Auth error:', authError);
    }
  }, [authError]);

  return (
    <section className="w-full max-w-md border-dashed border-2 p-6 rounded-xl">
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        className="w-full"
        onChange={e => {
          setFiles(Array.from(e.target.files || []));
          setUploadError(null); // Clear errors when new files selected
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!files.length || uploading || !user || authLoading}
        className="mt-4 w-full rounded bg-black py-2 text-white disabled:opacity-50"
      >
        {uploading ? 'Processing…' : 'Generate Adventure'}
      </button>
      
      {/* Authentication status messages */}
      {!user && !authLoading && <p className="mt-2 text-sm text-red-500">Please login to upload files</p>}
      {authLoading && <p className="mt-2 text-sm">Checking authentication status...</p>}
      {authError && <p className="mt-2 text-sm text-red-500">Authentication error: {authError.message}</p>}
      
      {/* Upload error message */}
      {uploadError && <p className="mt-2 text-sm text-red-500">{uploadError}</p>}
    </section>
  );
}

