// Supabase Configuration
// Replace these with your actual Supabase project credentials

export const SUPABASE_CONFIG = {
  url: 'https://jlhrtipmazwousefzjqe.supabase.co', // e.g., https://xxxxx.supabase.co
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsaHJ0aXBtYXp3b3VzZWZ6anFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTI2NzcsImV4cCI6MjA4NjQ4ODY3N30.VUsWqRPuVfgvwa4E4C4Ddt2rVeS2aaViBCMzXch1SGE'
};

// Edge function URLs
export const EDGE_FUNCTION_URL = `${SUPABASE_CONFIG.url}/functions/v1/call-report`;
export const CAMPAIGN_START_URL = `${SUPABASE_CONFIG.url}/functions/v1/campaign-start`;
export const CAMPAIGN_SCHEDULE_URL = `${SUPABASE_CONFIG.url}/functions/v1/campaign-schedule`;

// VAPI Configuration
// These are now handled per-user in the Profile settings.
// This object remains as a reference for keys but values are pulled from the user profile.
export const VAPI_CONFIG = {
  apiKey: 'MANAGED_IN_PROFILE',
  assistantId: 'MANAGED_IN_PROFILE',
  phoneNumberId: 'MANAGED_IN_PROFILE'
};
