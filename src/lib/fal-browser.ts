import { fal } from '@fal-ai/client';

/**
 * Browser-side client **talks to your in-app proxy** instead of api.fal.ai
 * so no key leakage.  All requests are streamed automatically.
 */
export const falClient = fal.config({
  proxyUrl: '/api/fal/proxy',
});
