# Aura Design — Complete Setup Guide

A professional client-facing portfolio and design review platform.
Built with HTML, CSS, JavaScript + Supabase backend.

---

## File Structure

```
aura-design/
├── index.html          ← Public homepage / gallery
├── admin.html          ← Admin dashboard (password protected)
├── client.html         ← Client review page (accessed via link)
├── style.css           ← All styles (dark glassmorphism)
├── script.js           ← Homepage logic
├── admin.js            ← Admin dashboard logic
├── client.js           ← Client page + annotation system
├── supabase-client.js  ← Supabase API wrapper (CONFIGURE THIS)
├── supabase-schema.sql ← SQL to run in Supabase
└── README.md           ← This file
```

---

## STEP 1 — Set Up Supabase (Free Forever)

### 1.1 Create Account
1. Go to **https://supabase.com**
2. Click "Start your project" → Sign up with GitHub or email
3. Click "New Project"
4. Choose a name (e.g. `aura-design`), set a database password, pick a region
5. Wait ~2 minutes for the project to be created

### 1.2 Create the Database Tables
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste it into the editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success" for each statement

### 1.3 Create the Storage Bucket (if SQL didn't work)
1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Name it exactly: `designs`
4. Toggle **Public bucket** to ON
5. Click **Save**

### 1.4 Get Your API Credentials
1. Click **Project Settings** (gear icon) in left sidebar
2. Click **API** tab
3. You need two values:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **anon / public key** — a long JWT string starting with `eyJ...`

### 1.5 Configure the Project
Open `supabase-client.js` and replace lines 17-18:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY_HERE';
```

Replace with your actual values:

```javascript
const SUPABASE_URL = 'https://abcdefghijk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

> **Security note:** The `anon` key is safe to expose in frontend code.
> Never use your `service_role` key in frontend code.

---

## STEP 2 — Deploy to GitHub Pages (Free)

### 2.1 Create a GitHub Repository
1. Go to **https://github.com** → Log in
2. Click the **+** button → **New repository**
3. Name it `aura-design` (or anything you like)
4. Set to **Public** (required for free GitHub Pages)
5. Click **Create repository**

### 2.2 Upload Your Files
**Option A — GitHub Web Interface (easiest):**
1. Open your new repository
2. Click **Add file** → **Upload files**
3. Drag all your project files into the upload area
4. Scroll down and click **Commit changes**

**Option B — Git CLI:**
```bash
cd /path/to/your/aura-design/folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aura-design.git
git push -u origin main
```

### 2.3 Enable GitHub Pages
1. In your repository, click **Settings** tab
2. Scroll down to **Pages** section (left sidebar under Code and automation)
3. Under **Source**, select **Deploy from a branch**
4. Under **Branch**, select `main` and folder `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes, then your site is live at:
   `https://YOUR_USERNAME.github.io/aura-design/`

### 2.4 Update Client Links
Once you know your GitHub Pages URL, the client links will automatically
generate correctly (they use `window.location.origin` dynamically).

---

## STEP 3 — Alternative Free Hosting Options

### Netlify (Recommended — even better than GitHub Pages)
1. Go to **https://netlify.com** → Sign up free
2. Click **Add new site** → **Deploy manually**
3. Drag your entire `aura-design` folder to the upload area
4. Your site is live instantly at a URL like `https://random-name.netlify.app`
5. **Custom domain:** Go to Domain settings → Add custom domain (free)
6. **Continuous deployment:** Connect to GitHub repo for auto-deploy on push

### Vercel (Great for speed)
1. Go to **https://vercel.com** → Sign up free (use GitHub)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Click **Deploy** — done in 30 seconds
5. Get a URL like `https://aura-design.vercel.app`

### Cloudflare Pages (Fastest globally)
1. Go to **https://pages.cloudflare.com**
2. Click **Create a project** → **Connect to Git**
3. Select your GitHub repository
4. Leave build settings blank (it's static HTML)
5. Click **Save and Deploy**

---

## How the System Works

### Client Link System
When you upload a project in the admin dashboard:
1. A unique ID is generated (e.g. `k7x2m9abc123`)
2. The file is uploaded to Supabase Storage
3. Project metadata is saved to the `projects` table
4. A client link is generated: `yoursite.com/client.html?project=k7x2m9abc123`
5. The client visits this link → the page fetches that specific project

### Annotation System
1. Client clicks "Add Comment" button → annotation mode activates
2. Client clicks anywhere on the design → a numbered marker appears
3. A comment modal opens → client types their note
4. The marker and comment are stored locally until submitted
5. On "Submit Feedback" → all annotations + decision saved to Supabase
6. Admin can see all feedback in the Admin → Feedback tab

### Offline Fallback
If Supabase is not configured, the system automatically falls back to
`localStorage` — so everything still works, but data only persists in
the current browser on the current device.

---

## Admin Access

- **URL:** `yoursite.com/admin.html`
- **Password:** `1040`
- **Change password:** Edit line `const ADMIN_PASS = '1040'` in `admin.js`
  and `const ADMIN_PASSWORD = '1040'` in `script.js`

---

## Customization

### Change Brand Name
Search and replace "Aura Design" in all HTML files.

### Change Colors
Edit CSS variables at the top of `style.css`:
```css
:root {
  --accent: #a78bfa;    /* Primary purple */
  --accent-2: #60a5fa;  /* Secondary blue */
  --accent-3: #34d399;  /* Tertiary green */
}
```

### Add Categories
Edit the `<select>` in `admin.html` and the filter buttons in `index.html`.

---

## Troubleshooting

**"Failed to load projects" error:**
→ Check your Supabase URL and key in `supabase-client.js`
→ Make sure you ran the SQL schema
→ Check Supabase Dashboard → Table Editor to confirm tables exist

**File upload fails:**
→ Check the `designs` storage bucket exists and is set to public
→ Verify RLS policies are created correctly
→ File must be under 10MB

**Client link shows "Project Not Found":**
→ Make sure the project was successfully uploaded (check Supabase Table Editor)
→ Verify the project ID in the URL matches one in the database

**GitHub Pages shows old version:**
→ GitHub Pages can take 1-5 minutes to update after a push
→ Try hard refreshing: Ctrl+Shift+R

---

## Support

Need help? Open an issue on GitHub or contact your developer.
