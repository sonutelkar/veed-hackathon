import UploadDropzone from '@/components/UploadDropzone';
import VideoPlayer from '@/components/VideoPlayer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Pet‑Adventure Generator 🚀</h1>
      <UploadDropzone />
      <VideoPlayer />
    </main>
  );
}
