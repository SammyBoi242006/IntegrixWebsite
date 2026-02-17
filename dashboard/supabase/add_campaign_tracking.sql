-- Add campaign_id to calls table
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON calls(campaign_id);

-- Enable RLS for DELETE operations on calls
DROP POLICY IF EXISTS "Users can delete their own calls" ON calls;
CREATE POLICY "Users can delete their own calls"
    ON calls FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS for DELETE operations on campaigns
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;
CREATE POLICY "Users can delete their own campaigns"
    ON campaigns FOR DELETE
    USING (auth.uid() = user_id);

-- Verify
SELECT 'Migration complete' as status;
