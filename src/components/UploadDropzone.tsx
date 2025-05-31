'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase-store';

export default function UploadDropzone() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Use the centralized Supabase store instead of local state
  const { supabase, user, session, loading: authLoading } = useSupabase();

  async function handleSubmit() {
    if (!files.length || !user) return;
    setLoading(true);

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
          alert(`Upload failed: ${error.message}`);
          setLoading(false);
          return;
        }
        
        // Get the public URL for the uploaded file
        const { data: publicURLData } = supabase.storage
          .from('videos')
          .getPublicUrl(path);
          
        paths.push(path);
      }

      /* 🐱 2 — Kick off the backend pipeline */
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({ 
          paths, 
          templateKey: 'spaceCat',
          userId: user.id
        }),
      }).then(r => r.json());

      // setVideo(res.video);
      setLoading(false);
      
      // Redirect to videos page after successful upload
      router.push('/videos');
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred during upload');
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md border-dashed border-2 p-6 rounded-xl">
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        className="w-full"
        onChange={e => setFiles(Array.from(e.target.files || []))}
      />
      <button
        onClick={handleSubmit}
        disabled={!files.length || loading || !user || authLoading}
        className="mt-4 w-full rounded bg-black py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Generate Adventure'}
      </button>
      {!user && !authLoading && <p className="mt-2 text-sm text-red-500">Please login to upload files</p>}
      {authLoading && <p className="mt-2 text-sm">Checking authentication status...</p>}
    </section>
  );
}
