import { createBrowserClient } from '@supabase/ssr';

export const supabaseBrowser = (() => {
  let client: ReturnType<typeof createBrowserClient> | null = null;
  return () =>
    client ??
    (client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ));
})();
