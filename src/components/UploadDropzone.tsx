'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr'; // ✅ new helper (replaces auth‑helpers)
// import { useStore } from '@/lib/store';

// Initialise once per module – keeps single supabase instance in the browser
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UploadDropzone() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  //const setVideo = useStore(s => s.setVideo);

  async function handleSubmit() {
    if (!files.length) return;
    setLoading(true);

    /* 🐱 1 — Upload each file to the `raw-media` bucket */
    const paths: string[] = [];
    for (const file of files) {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from('raw-media')
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });
      if (error) {
        console.error(error);
        alert('Upload failed');
        setLoading(false);
        return;
      }
      paths.push(path);
    }

    /* 🐱 2 — Kick off the backend pipeline */
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths, templateKey: 'spaceCat' }),
    }).then(r => r.json());

    // setVideo(res.video);
    setLoading(false);
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
        disabled={!files.length || loading}
        className="mt-4 w-full rounded bg-black py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Generate Adventure'}
      </button>
    </section>
  );
}
