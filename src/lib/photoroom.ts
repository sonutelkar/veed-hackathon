import FormData from 'form-data';
import axios from 'axios';

const PR_BASE = 'https://sdk.photoroom.com/v1';

/**
 * Basic (fast) background removal — **file upload required** per docs.
 */
export async function removeBgBasic(file: Blob | File) {
  const form = new FormData();
  form.append('image_file', file as any);

  const { data } = await axios.post(`${PR_BASE}/remove-bg`, form, {
    headers: {
      ...form.getHeaders?.(),                // node / edge polyfill
      'x-api-key': process.env.PHOTOROOM_KEY!,
    },
  });

  return data.result_url as string;
}

/**
 * HD background removal (Plus plan) — adds the special header flag
 */
export async function removeBgHD(file: Blob | File) {
  const form = new FormData();
  form.append('imageFile', file as any);     // field name per docs

  const { data } = await axios.post('https://image-api.photoroom.com/v2/edit', form, {
    headers: {
      ...form.getHeaders?.(),
      'x-api-key': process.env.PHOTOROOM_KEY!,
      'pr-hd-background-removal': 'auto',
    },
  });

  return data.url as string;                 // HD result URL
}
