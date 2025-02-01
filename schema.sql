-- Create API schema
CREATE SCHEMA api;

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create tables with RLS enabled in api schema
CREATE TABLE api.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gov_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_sign_in TIMESTAMP WITH TIME ZONE
);

CREATE TABLE api.proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  bundestag_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE api.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES api.users(id) NOT NULL,
  proposal_id UUID REFERENCES api.proposals(id) NOT NULL,
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, proposal_id)
);

-- Create internal schema for non-API tables
CREATE SCHEMA internal;

-- Create audit log table in internal schema
CREATE TABLE internal.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security on all api tables
ALTER TABLE api.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.votes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only read their own data
CREATE POLICY "Users can view own data" ON api.users
  FOR SELECT USING (auth.uid() = id);

-- Anyone can read proposals
CREATE POLICY "Anyone can view proposals" ON api.proposals
  FOR SELECT USING (true);

-- Only authenticated users can vote
CREATE POLICY "Authenticated users can vote" ON api.votes
  FOR INSERT TO authenticated USING (auth.uid() = user_id);

-- Users can only view their own votes
CREATE POLICY "Users can view own votes" ON api.votes
  FOR SELECT USING (auth.uid() = user_id);

-- Create functions in api schema
CREATE OR REPLACE FUNCTION api.get_proposal_votes(proposal_id UUID)
RETURNS TABLE (
  yes_votes BIGINT,
  no_votes BIGINT,
  total_votes BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE vote = true) as yes_votes,
    COUNT(*) FILTER (WHERE vote = false) as no_votes,
    COUNT(*) as total_votes
  FROM api.votes
  WHERE api.votes.proposal_id = $1;
END;
$$;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION internal.audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO internal.audit_log(table_name, record_id, action, old_data, new_data, performed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
