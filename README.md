# Personal CRM

A modern personal CRM built with Next.js, Supabase, and Tailwind CSS.

## Features

- **People Management** - Track contacts with their details, social links, skills/topics
- **Companies** - Manage organizations and their topics
- **Positions** - Link people to companies with job titles and dates
- **Interactions** - Record meetings and events with multiple people
- **Topic Filtering** - Filter people and companies by topics
- **Authentication** - Email/password auth with Supabase Auth
- **Row Level Security** - Data protected at the database level

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with SSR
- **Deployment**: Vercel

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get your anon key from: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### 3. Enable Authentication in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Go to Authentication → URL Configuration
4. Set **Site URL** to your deployment URL (e.g., `https://your-app.vercel.app`)
5. Add `http://localhost:3000` to Redirect URLs for local development

### 4. Enable Row Level Security

Run the SQL in `supabase/rls_policies.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/rls_policies.sql`
3. Run the query

This ensures only authenticated users can access your data.

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The database includes 5 tables:

- `people` - Contacts with name, email, phone, social links, location, skills/topics
- `companies` - Organizations with name, website, LinkedIn, topics
- `positions` - Links people to companies (title, dates, active status)
- `interactions` - Meetings/events with title, place, description
- `interaction_people` - Many-to-many join table for interactions ↔ people

## Security

- **Authentication**: All routes except `/login` require authentication
- **Row Level Security**: Database policies restrict access to authenticated users only
- **SSR Auth**: Uses `@supabase/ssr` for secure server-side authentication

### Single-User Setup

This CRM is designed for personal use with a single authenticated user. To set it up:

1. **Create your user account** in the Supabase Dashboard:
   - Go to **Authentication** → **Users**
   - Click **Add user** → **Create new user**
   - Enter your email and password
   - This will be your only account for the CRM

2. **RLS policies are pre-configured** to allow all operations for any authenticated user. Since there's only one user (you), no per-user data isolation is needed.

3. **No signup flow**: The login page only allows existing users to sign in. New accounts must be created manually in Supabase Dashboard.

> **Note**: If you need multi-user support in the future, you'll need to update the RLS policies to filter by `auth.uid()` and add user_id columns to your tables.

## Deployment

Deploy to Vercel:

```bash
vercel
```

Make sure to:
1. Add environment variables in Vercel dashboard
2. Update Supabase Site URL to your Vercel deployment URL
3. Add your Vercel URL to Supabase Redirect URLs
