# Supabase Database & Vercel Deployment Setup Guide

This guide describes how to configure your Supabase cloud database and deploy the Lead Outreach Assistant to Vercel.

---

## 1. Required Supabase Tables & SQL Schema

Run the following scripts in your Supabase project's **SQL Editor**:

```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  phone_display TEXT,
  category TEXT,
  city TEXT,
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Replied', 'Not Interested', 'Interested', 'Follow-up Needed')),
  notes TEXT DEFAULT '',
  follow_up_date TIMESTAMP WITH TIME ZONE,
  selected_language TEXT DEFAULT '',
  replied_language TEXT DEFAULT '',
  assigned_to TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  message_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Activity Logs Table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Realtime Replication
-- This enables Supabase to broadcast database changes to all clients in real-time.
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
```

---

## 2. Environment Variables

Create a file named `.env` in the root of your project directory for local development, and configure the variables in your Vercel project settings for production.

**Local Environment Configuration (`.env`):**
```env
VITE_SUPABASE_URL=https://mocyyxuiuibajvscsnhx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3l5eHVpdWliYWp2c2Nzbmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDkxMTksImV4cCI6MjA5NzA4NTExOX0.W-EAWCWeyAKZeOfSqDZ-KXuKkXN-vwsS5UADbSeR4l4
```

---

## 3. Vercel Deployment Steps

Follow these steps to deploy the application on Vercel:

### Step 1: Push Project to GitHub / GitLab / Bitbucket
Initialize a Git repository if you haven't already, add the files, and push your repository to your online Git provider.

### Step 2: Import Project on Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your Git repository.

### Step 3: Configure Build & Development Settings
Vercel automatically detects **Vite** projects. Keep the default settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 4: Configure Production Environment Variables
In the **Environment Variables** section on Vercel, add the following key-value pairs:
1. **Key**: `VITE_SUPABASE_URL`
   - **Value**: `https://mocyyxuiuibajvscsnhx.supabase.co`
2. **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3l5eHVpdWliYWp2c2Nzbmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDkxMTksImV4cCI6MjA5NzA4NTExOX0.W-EAWCWeyAKZeOfSqDZ-KXuKkXN-vwsS5UADbSeR4l4`

### Step 5: Deploy
Click the **Deploy** button. Vercel will build and publish your application, providing you with a public `.vercel.app` URL.
