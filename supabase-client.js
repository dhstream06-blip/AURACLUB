/* ============================================================
   SUPABASE CLIENT CONFIGURATION
   ============================================================
   SETUP INSTRUCTIONS:
   1. Go to https://supabase.com and create a free account
   2. Create a new project
   3. Go to Project Settings > API
   4. Copy your Project URL and anon/public key
   5. Replace the values below

   IMPORTANT: The anon/public key is safe to use in frontend code.
   Never use your service_role key in frontend code.
   ============================================================ */

// ============================================================
// REPLACE THESE WITH YOUR SUPABASE PROJECT CREDENTIALS
// ============================================================
const SUPABASE_URL = 'https://slqjwiyntcokxpcjfqox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNscWp3aXludGNva3hwY2pmcW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzI1MjksImV4cCI6MjA5MjM0ODUyOX0.S28qgYieihoXpW9F6mIM7j5YTEX2oY3YvCkf_LIT3Cc';
// ============================================================

// ---- Supabase REST API helpers (no npm needed) ----

const supabase = {

  // --- Database Operations ---

  async select(table, query = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  // --- Storage Operations ---

  async uploadFile(bucket, path, file) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-upsert': 'true',
      },
      body: file
    });
    if (!res.ok) throw new Error(await res.text());
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  },

  async deleteFile(bucket, path) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  getPublicUrl(bucket, path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
};

// ---- Utility: Generate unique project ID ----
function generateProjectId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// ---- Utility: Get base URL of the site ----
function getSiteBaseUrl() {
  return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
}
