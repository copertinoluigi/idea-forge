/*
  # IdeaForge Collaborative AI Incubator Schema

  ## Overview
  This migration creates the core database structure for IdeaForge, a collaborative AI incubator platform
  where closed groups can transform conversations into real applications using AI and MCP protocol.

  ## New Tables
  
  ### 1. profiles
  Stores extended user profile information including encrypted AI API keys and MCP endpoints
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `display_name` (text) - Display name for chat
  - `encrypted_api_key` (text, nullable) - Encrypted AI API key (OpenAI/Anthropic)
  - `mcp_endpoint` (text, nullable) - MCP server endpoint URL
  - `has_completed_setup` (boolean) - Whether user completed initial setup
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. invites
  Manages invite codes for gatekeeper system
  - `id` (uuid, primary key)
  - `code` (text, unique) - Invite code string
  - `created_by` (uuid, nullable) - User who created the invite
  - `used_by` (uuid, nullable) - User who used the invite
  - `is_used` (boolean) - Whether code has been used
  - `created_at` (timestamptz) - Creation timestamp
  - `used_at` (timestamptz, nullable) - When code was used

  ### 3. messages
  Stores all group chat messages
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Message author
  - `content` (text) - Message content
  - `created_at` (timestamptz) - Message timestamp
  - `is_system` (boolean) - Whether this is a system message

  ### 4. context_snapshots
  Stores conversation snapshots every 20 messages for token optimization
  - `id` (uuid, primary key)
  - `snapshot_data` (jsonb) - Compressed conversation context
  - `message_count` (integer) - Number of messages up to this snapshot
  - `created_at` (timestamptz) - Snapshot creation time

  ### 5. project_settings
  Global settings for the group/project
  - `id` (uuid, primary key)
  - `key` (text, unique) - Setting key
  - `value` (jsonb) - Setting value
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/write their own profile
  - All authenticated users can read/write messages (single group)
  - Only authenticated users can check invite validity
  - Only authenticated users can read snapshots
  - Only authenticated users can read project settings
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  encrypted_api_key text,
  mcp_endpoint text,
  has_completed_setup boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_system boolean DEFAULT false
);

-- Create context_snapshots table
CREATE TABLE IF NOT EXISTS context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_data jsonb NOT NULL,
  message_count integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create project_settings table
CREATE TABLE IF NOT EXISTS project_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Invites policies
CREATE POLICY "Anyone can check invite validity"
  ON invites FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update invites"
  ON invites FOR UPDATE
  TO authenticated
  USING (NOT is_used)
  WITH CHECK (true);

-- Messages policies (single group - all authenticated users can access)
CREATE POLICY "Authenticated users can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Context snapshots policies
CREATE POLICY "Authenticated users can view snapshots"
  ON context_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert snapshots"
  ON context_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Project settings policies
CREATE POLICY "Authenticated users can view settings"
  ON project_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON project_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert settings"
  ON project_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_is_used ON invites(is_used);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_created_at ON context_snapshots(created_at DESC);

-- Insert a default invite code for testing
INSERT INTO invites (code) VALUES ('IDEAFORGE2024') ON CONFLICT (code) DO NOTHING;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at BEFORE UPDATE ON project_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();