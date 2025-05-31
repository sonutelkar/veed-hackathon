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

        // Optionally get the public URL for the uploaded file
        // const { data: publicURLData } = supabase.storage
        //   .from('videos')
        //   .getPublicUrl(path);
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

  // Handler for file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files || []));
    setUploadError(null); // Clear errors when new files selected
  }

  return (
    <>
      <div className="w-full">
        {/* Custom dropzone area */}
        <label
          htmlFor="fileInput"
          className="group relative flex flex-col items-center justify-center w-full h-48 border-4 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-indigo-500 transition-colors duration-200 bg-gray-50"
        >
          <input
            id="fileInput"
            type="file"
            accept="image/*,video/*"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16V4m0 12l-4-4m4 4l4-4M17 8v12m0-12l4 4m-4-4l-4 4"
              />
            </svg>
            <span className="mt-2 text-gray-500 group-hover:text-indigo-600 transition-colors duration-200">
              Click or drag files here to upload
            </span>
            {files.length > 0 && (
              <span className="mt-2 text-sm text-gray-700">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </label>

        {/* List selected files (optional preview) */}
        {files.length > 0 && (
          <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {files.map((file) => (
              <li key={file.name} className="text-sm text-gray-700 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-2 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 2H4v10h12V5z"
                    clipRule="evenodd"
                  />
                </svg>
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!files.length || uploading || !user || authLoading}
        className={`
          mt-6 w-full py-3 rounded-2xl text-white text-lg font-semibold
          bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
          focus:outline-none focus:ring-4 focus:ring-indigo-300 
          transition-transform transform ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
      >
        {uploading ? 'Processing…' : 'Generate Adventure'}
      </button>

      {/* Authentication status messages */}
      {!user && !authLoading && (
        <p className="mt-4 text-sm text-red-500 text-center">
          Please log in to upload files
        </p>
      )}
      {authLoading && (
        <p className="mt-4 text-sm text-gray-600 text-center">Checking authentication status...</p>
      )}
      {authError && (
        <p className="mt-4 text-sm text-red-500 text-center">
          Authentication error: {authError.message}
        </p>
      )}

      {/* Upload error message */}
      {uploadError && (
        <p className="mt-4 text-sm text-red-500 text-center">{uploadError}</p>
      )}
      </>
  );
}
