# Quick Start Guide

Get your VAPI call tracking dashboard running in 10 minutes.

## 1. Setup Supabase (5 minutes)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor → Run `supabase/schema.sql`
4. Go to Authentication → Settings → Disable "Enable email confirmations"

## 2. Get Your Credentials (1 minute)

In Supabase Dashboard → Settings → API:
- Copy **Project URL**
- Copy **anon public** key

## 3. Configure Dashboard (1 minute)

Edit `dashboard/js/config.js`:
```javascript
export const SUPABASE_CONFIG = {
  url: 'YOUR_PROJECT_URL_HERE',
  anonKey: 'YOUR_ANON_KEY_HERE'
};
```

## 4. Deploy Edge Function (2 minutes)

### Option A: Supabase CLI
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy call-report
```

### Option B: Dashboard
1. Go to Edge Functions → Create Function
2. Name: `call-report`
3. Copy/paste `supabase/functions/call-report/index.ts`
4. Deploy

## 5. Test Locally (1 minute)

```bash
cd dashboard
python -m http.server 8000
```

Open `http://localhost:8000`

## 6. Create Account & Set org_id

1. Click "Sign up"
2. Enter email/password
3. Go to Profile
4. Enter your VAPI org_id (find in VAPI dashboard)
5. Save

## 7. Configure VAPI Webhook

In VAPI dashboard:
1. Go to Phone Numbers/Assistants
2. Add webhook URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/call-report`
3. Enable "End of Call Report"

## 8. Test It!

Send a test webhook:
```bash
# Edit test-webhook.json with your org_id first
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/call-report \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

Check your dashboard - the call should appear! 🎉

## Need Help?

See full documentation in [README.md](README.md)
