# PetVentures - AI Pet Adventure Generator

Transform your pet photos into exciting adventure videos with AI-powered video generation.

## Features

- 🔒 Secure authentication with Supabase
- 🐾 Pet-themed UI with custom components
- 🤖 AI-powered video generation
- 🎬 Video management and sharing

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Supabase account (free tier available)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/veed-hackathon.git
cd veed-hackathon
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

## Supabase Setup

### Setting up the Database

1. Create a new Supabase project from the [Supabase Dashboard](https://app.supabase.com/)

2. Set up the database schema
   - The project includes a migration file in `supabase/migrations/20240101000000_create_tables.sql`
   - You can run this migration using the Supabase CLI:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

3. Alternatively, you can run the SQL commands manually from the Supabase SQL Editor:

```sql
-- Create users table function
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'users'
  ) THEN
    -- Create the users table
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );

    -- Set up Row Level Security (RLS)
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Create policies
    -- Allow users to view their own data
    CREATE POLICY "Users can view own data" ON public.users
      FOR SELECT
      USING (auth.uid() = id);

    -- Allow users to update their own data
    CREATE POLICY "Users can update own data" ON public.users
      FOR UPDATE
      USING (auth.uid() = id);

    -- Allow service role to do anything
    CREATE POLICY "Service role can do anything" ON public.users
      USING (auth.role() = 'service_role');
      
    -- Create an insert policy for the service role
    CREATE POLICY "Service role can insert" ON public.users
      FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Call the function to create the users table
SELECT create_users_table();

-- Function to create a new user record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up the trigger to automatically create a user record on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

### Configuring Auth

1. Go to Authentication > Settings in your Supabase Dashboard

2. Configure Email Auth:
   - Set Site URL to your deployment URL or `http://localhost:3000` for local development
   - Enable "Confirm email" if you want email verification
   - Configure "Additional redirect URLs" if needed

3. Customize email templates (optional):
   - Go to Authentication > Email Templates
   - Customize the templates to match your brand

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and services
  - `/lib/supabase-browser.ts` - Supabase client for browser
  - `/lib/supabase-admin.ts` - Supabase admin client
  - `/lib/auth-context.tsx` - Authentication context provider
  - `/lib/users-service.ts` - User management service
- `/supabase` - Supabase configuration and migrations

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/) 