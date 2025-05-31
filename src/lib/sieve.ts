/**
 * Minimal wrapper around the public Sieve function endpoints.
 * Docs: https://www.sievedata.com/functions/sieve/autocrop 🡕
 */
const SIEVE_BASE = 'https://api.sievedata.com/v1/function';
const AUTH = `Bearer ${process.env.SIEVE_KEY!}`;

/** Smart crop a video or image to the desired aspect ratio */
export async function autoCrop(
  fileUrl: string,
  ratio: '9:16' | '1:1' | '16:9' = '9:16'
) {
  const res = await fetch(`${SIEVE_BASE}/autocrop`, {
    method: 'POST',
    headers: {
      Authorization: AUTH,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: fileUrl, ratio }),
    // Sieve queues longer jobs, so keep streaming on
  });

  if (!res.ok) throw new Error(`Sieve autocrop failed ${res.status}`);
  const { url } = await res.json();      // cropped media URL
  return url as string;
}
