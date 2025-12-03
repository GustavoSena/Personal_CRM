# Personal CRM
A modern personal CRM built with Next.js, Supabase, and Tailwind CSS. Track your professional network, manage contacts, record interactions, and optionally import data from LinkedIn.

## Features

- **People Management** - Track contacts with their details, social links, skills/topics
- **Companies** - Manage organizations with logos, websites, and topics
- **Positions** - Link people to companies with job titles and dates
- **Interactions** - Record meetings and events with multiple participants
- **Topic Filtering** - Filter people and companies by topics/tags
- **LinkedIn Import** *(Optional)* - Import profiles and company data from LinkedIn using Bright Data
- **Authentication** - Email/password auth with Supabase Auth
- **Row Level Security** - Data protected at the database level

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with SSR
- **Deployment**: Vercel
- **LinkedIn Scraping** *(Optional)*: Bright Data

## Requirements

- **Node.js**: >= 20.x LTS (recommended for Next.js 16)
- **npm**: >= 10.x (bundled with recent Node LTS)
- A Supabase account and project
- *(Optional)* A Bright Data account for LinkedIn import

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/GustavoSena/Personal_CRM.git
cd Personal_CRM
npm install

# 2. Set up environment variables (see below)

# 3. Run development server
npm run dev
```

---

## Step-by-Step Setup Guide

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **New Project**
3. Choose your organization (or create one)
4. Enter a project name (e.g., "personal-crm")
5. Set a strong database password (save this somewhere safe)
6. Choose a region close to you
7. Click **Create new project** and wait for it to initialize (~2 minutes)

### Step 2: Set Up the Database Schema

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql` from this repo
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned" - this means all tables were created

**What this creates:**
- `people` - Contact records
- `companies` - Organization records
- `positions` - Job positions linking people to companies
- `interactions` - Meeting/event records
- `interaction_people` - Links interactions to participants
- `app_settings` - Application configuration
- Row Level Security policies for all tables

### Step 3: Enable Email Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Email** and ensure it's **enabled**
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to:
   - For local development: `http://localhost:3000`
   - For production: `https://your-app.vercel.app`
5. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - `https://your-app.vercel.app/**` (after deploying)

### Step 4: Create Your Single Owner Account

Since this is a single-user CRM, you should create **one owner account** that
will have access to all data:

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter your email and a strong password
4. Click **Create user**
5. Use these credentials on the `/login` page of the app

The login page includes a simple **Sign In / Sign Up** toggle. You can either:

- Create your account directly in Supabase (recommended), or
- Use the **Sign Up** mode once to create your own account.

In both cases, once your owner account exists you should **prevent any further
signups** (next step).

### Step 5: Disable New Signups (Lock Down to One Account)

To ensure no one else can create accounts:

1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Email**
2. If available, disable **"Allow new users to sign up via email"** or
   restrict signups to **invited users only**
3. Optionally, you can also:
   - Remove or hide the signup option in your own fork of the app
   - Periodically review **Authentication** → **Users** to ensure only your
     account exists

> Recommended pattern:
> - Create *one* account during setup (via Supabase or the app).
> - Then **disable self-service signup** in Supabase so the app is effectively
>   single-user.

### Step 6: Get Your API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public** key (under Project API Keys)

### Step 7: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Bright Data API Key (for LinkedIn import)
# Get from https://brightdata.com - see "LinkedIn Import" section below
# BRIGHTDATA_API_KEY=your-brightdata-api-key
```

### Step 8: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your credentials.

---

## Deploying to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `BRIGHTDATA_API_KEY` = (optional) your Bright Data API key
5. Click **Deploy**

### Step 3: Update Supabase URLs

After deployment, update your Supabase settings:

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Update **Site URL** to your Vercel URL (e.g., `https://your-app.vercel.app`)
3. Add your Vercel URL to **Redirect URLs**: `https://your-app.vercel.app/**`

---

## Pre-Deployment Checklist

Before exposing this app on the internet, make sure you have:

- **Locked down authentication**
  - Created exactly **one owner account** in Supabase
  - Disabled or restricted new email signups in Supabase (single-user only)
- **Verified environment variables**
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
  - `BRIGHTDATA_API_KEY` is set only if you intend to use LinkedIn import
- **Run the schema**
  - Executed `supabase/schema.sql` in the Supabase SQL editor without errors
- **Reviewed data sensitivity**
  - You understand that all contact/interactions data is visible to any
    authenticated Supabase user for this project

---

## LinkedIn Import (Optional)

The app includes optional LinkedIn import functionality powered by **Bright Data**. This allows you to:
- Import LinkedIn profiles with photos, positions, and company info
- Automatically create companies from imported profiles
- Fetch company logos and websites

### About Bright Data

[Bright Data](https://brightdata.com) is a web data platform that provides reliable LinkedIn scraping. **This is a paid service** with usage-based pricing.

**Pricing** (as of 2024):
- LinkedIn profile: ~$0.0015 per profile
- LinkedIn company: ~$0.0015 per company
- You only pay for what you use

### Setting Up Bright Data

1. Go to [brightdata.com](https://brightdata.com) and create an account
2. Navigate to **Web Scraper IDE** → **Datasets**
3. Find and activate:
   - **LinkedIn Person Profile** dataset
   - **LinkedIn Company Profile** dataset
4. Go to **Settings** → **Users** to get your API key
5. Add to your `.env.local`:
   ```
   BRIGHTDATA_API_KEY=your-api-key-here
   ```

### Using LinkedIn Import

1. Navigate to **People** → **Import from LinkedIn**
2. Paste LinkedIn profile URLs (one per line, max 20)
3. Click **Fetch All Profiles**
4. Wait for scraping to complete (~15-60 seconds per profile)
5. Profiles and companies are automatically saved

> **Note**: If `BRIGHTDATA_API_KEY` is not set, the LinkedIn import feature
> will not work. Additionally, some LinkedIn profiles have **non-public or
> restricted profile images**. In those cases Bright Data may not return an
> `avatar_url`, so the person will appear without an image. You can open the
> person in the UI and paste the correct image URL manually if you have one.

---

## Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `people` | Contact records with name, email, phone, social links, location, skills/topics |
| `companies` | Organizations with name, website, LinkedIn URL, logo, topics |
| `positions` | Links people to companies with job title, dates, active status |
| `interactions` | Meetings/events with title, place, date, description |
| `interaction_people` | Many-to-many: links interactions to participants |
| `app_settings` | App configuration (e.g., which person record is "you") |

### Schema Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   people    │       │  positions  │       │  companies  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │◄──────│ person_id   │       │ id          │
│ name        │       │ company_id  │──────►│ name        │
│ email       │       │ title       │       │ website     │
│ phone       │       │ active      │       │ linkedin_url│
│ linkedin_url│       │ from_date   │       │ logo_url    │
│ twitter_x   │       │ until_date  │       │ topics[]    │
│ telegram    │       │ duration    │       └─────────────┘
│ city        │       └─────────────┘
│ country     │
│ avatar_url  │       ┌─────────────────────┐
│ notes       │       │ interaction_people  │
│skills_topics│       ├─────────────────────┤
└─────────────┘       │ interaction_id      │──────┐
      ▲               │ person_id           │──────┤
      │               └─────────────────────┘      │
      │                                            │
      └────────────────────────────────────────────┤
                                                   │
┌─────────────┐                                    │
│interactions │◄───────────────────────────────────┘
├─────────────┤
│ id          │       ┌─────────────┐
│ title       │       │ app_settings│
│ place       │       ├─────────────┤
│ description │       │ id          │
│ date        │       │ my_person_id│──► people.id
│my_position_id│──►   └─────────────┘
└─────────────┘
    positions.id
```

---

## Security

### Authentication
- All routes except `/login` require authentication
- Uses Supabase Auth with SSR (`@supabase/ssr`)
- Session is validated on every server request

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies allow full access to authenticated users only
- Anonymous users cannot access any data

### Single-User Design
This CRM is designed for personal, single-user use:
- A signup UI exists but is intended only for initial setup of **one owner
  account**; new signups should be disabled in Supabase afterwards
- No per-user data isolation (any authenticated user can see all data)
- Simple RLS policies (authenticated = full access)

> **Future Multi-User Support**: To add multi-user support, you'd need to add `user_id` columns and update RLS policies to filter by `auth.uid()`.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `BRIGHTDATA_API_KEY` | No | Bright Data API key for LinkedIn import |

---

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Troubleshooting

### "Invalid login credentials"
- Make sure you created a user in Supabase Dashboard → Authentication → Users
- Check that you're using the correct email and password

### "Failed to fetch" errors
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active (not paused)

### LinkedIn import not working
- Ensure `BRIGHTDATA_API_KEY` is set in your environment variables
- Check that your Bright Data account has credits
- LinkedIn scraping can take 15-60 seconds per profile

### RLS errors (permission denied)
- Run the schema SQL again to ensure RLS policies are created
- Make sure you're logged in (check Authentication → Users)

---

## Data Privacy & Legal Considerations

> **Important: Personal, Single-User Tool – Not for Shared or Multi-User Use**
>
> This application is designed **for your own personal use only** (a single
> owner/account). It **does not** implement multi-tenant or per-user data
> isolation. In its default configuration **any authenticated user** of your
> Supabase project can read and modify all data stored by this app.
>
> If you expose this app to other people (for example by sharing your Supabase
> keys, enabling public signups, or deploying it with open registration), you
> may:
>
> - **Expose personal data** about contacts and interactions to unintended
>   users.
> - Potentially **breach privacy and data-protection laws** (such as GDPR,
>   LGPD, CCPA, etc.) if the data relates to identifiable individuals and they
>   have not consented, or if you cannot honor access/erasure requests.
>
> You are responsible for:
>
> - Running this app only for **your own private use**.
> - Ensuring **no one else can sign up or log in** to your Supabase project
>   once your own account is created (see the *Authentication* section).
> - Implementing your own legal, privacy, and security controls if you adapt
>   this project for broader or multi-user use.
>
> Nothing in this repository is legal advice. If you process others' personal
> data in a professional or shared context, consult a qualified lawyer.

---

## License

MIT
