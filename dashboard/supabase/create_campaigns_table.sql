-- Table to store outbound campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, running, completed, scheduled, failed
    total_contacts INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own campaigns"
    ON campaigns FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
    ON campaigns FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
    ON campaigns FOR UPDATE
    USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
