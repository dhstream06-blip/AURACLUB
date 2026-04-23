-- ============================================================
-- AURA DESIGN — Supabase Database Schema
-- Run this in Supabase SQL Editor to set up your database
-- ============================================================

-- ---- 1. Projects table ----
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT DEFAULT 'branding',
  client_name TEXT,
  description TEXT,
  file_url    TEXT NOT NULL,
  file_type   TEXT DEFAULT 'image',
  storage_path TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---- 2. Feedback table ----
CREATE TABLE IF NOT EXISTS feedback (
  id          BIGSERIAL PRIMARY KEY,
  project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- 'annotation' or 'decision'
  x_percent   FLOAT,           -- annotation x position (%)
  y_percent   FLOAT,           -- annotation y position (%)
  comment     TEXT,            -- annotation comment text
  value       TEXT,            -- decision value: 'approved' | 'needs_changes'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Allow public read/write (since we use admin password in JS)
-- For production, add proper auth policies
-- ============================================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read projects (clients can view their project)
CREATE POLICY "Public read projects"
  ON projects FOR SELECT
  USING (true);

-- Allow anyone to insert projects (protected by JS password check)
CREATE POLICY "Public insert projects"
  ON projects FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update projects (for status updates)
CREATE POLICY "Public update projects"
  ON projects FOR UPDATE
  USING (true);

-- Allow anyone to delete projects
CREATE POLICY "Public delete projects"
  ON projects FOR DELETE
  USING (true);

-- Allow anyone to read feedback
CREATE POLICY "Public read feedback"
  ON feedback FOR SELECT
  USING (true);

-- Allow anyone to insert feedback (clients submitting)
CREATE POLICY "Public insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete feedback
CREATE POLICY "Public delete feedback"
  ON feedback FOR DELETE
  USING (true);

-- ============================================================
-- STORAGE BUCKET SETUP
-- Run this OR create it manually in Supabase Dashboard
-- ============================================================

-- Create the 'designs' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', true)
ON CONFLICT DO NOTHING;

-- Allow public to read files
CREATE POLICY "Public read designs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'designs');

-- Allow public to upload files
CREATE POLICY "Public upload designs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'designs');

-- Allow public to delete files
CREATE POLICY "Public delete designs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'designs');
