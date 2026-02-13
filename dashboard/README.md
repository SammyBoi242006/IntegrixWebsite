# VAPI Call Tracking Dashboard - Setup Guide

Complete setup instructions for deploying and configuring the VAPI call tracking system.

## Prerequisites

- Supabase account ([sign up here](https://supabase.com))
- VAPI account with organization ID
- Basic knowledge of SQL and JavaScript

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `vapi-call-tracking`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## Step 2: Configure Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the schema
6. Verify tables were created:
   - Go to **Table Editor**
   - You should see: `profiles`, `calls`, `user_roles`

## Step 3: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Auth Providers**, ensure **Email** is enabled
3. **IMPORTANT**: For development, disable email confirmation:
   - Scroll to **Email Auth**
   - Toggle OFF "Enable email confirmations"
   - This allows users to sign up without email verification
4. Save changes

## Step 4: Deploy Edge Function

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the edge function
supabase functions deploy call-report
```

### Option B: Manual Deployment

1. Go to **Edge Functions** in Supabase dashboard
2. Click "Create a new function"
3. Name: `call-report`
4. Copy contents of `supabase/functions/call-report/index.ts`
5. Paste into the editor
6. Click "Deploy"

## Step 5: Configure Frontend

1. Open `dashboard/js/config.js`
2. Replace placeholder values with your Supabase credentials:

```javascript
export const SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_ANON_KEY'
};
```

**Where to find these:**
- **Project URL**: Supabase Dashboard → Settings → API → Project URL
- **Anon Key**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

## Step 6: Configure VAPI Webhook

1. Log into your VAPI dashboard
2. Go to **Phone Numbers** or **Assistants**
3. Select the phone number/assistant you want to track
4. Find **Webhooks** or **Server URL** settings
5. Add your edge function URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/call-report
   ```
6. Ensure "End of Call Report" webhook is enabled
7. Save changes

## Step 7: Deploy Frontend

### Option A: Local Development

```bash
# Navigate to dashboard folder
cd dashboard

# Start a local server (Python)
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

Open browser to `http://localhost:8000`

### Option B: Deploy to Hosting

Deploy the `dashboard` folder to any static hosting service:
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect GitHub repo
- **GitHub Pages**: Push to `gh-pages` branch
- **Supabase Storage**: Upload as public bucket

## Step 8: Create First User

1. Open your deployed dashboard
2. Click "Sign up"
3. Enter email and password
4. You'll be automatically logged in (since email confirmation is disabled)
5. Go to **Profile** page
6. Enter your VAPI Organization ID
   - Find this in VAPI dashboard under **Settings** → **Organization**
7. Click "Save Changes"

## Step 9: Create Admin User (Optional)

To give a user admin access:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query (replace with actual user email):

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM profiles
WHERE email = 'admin@example.com';
```

3. The user will now see the "Admin" link in navigation

## Step 10: Test Webhook

### Test with Sample Data

1. Create a file `test-webhook.json`:

```json
{
  "message": {
    "timestamp": 1709232465976,
    "type": "end-of-call-report",
    "cost": 0.0352,
    "durationSeconds": 15,
    "endedReason": "customer-ended-call",
    "startedAt": "2025-02-12T11:53:35.265Z",
    "transcript": "AI: Hello, how can I help you today?\nUser: Hi, I'm calling about my order.\nAI: I'd be happy to help with that.",
    "artifact": {
      "variables": {
        "phoneNumber": {
          "orgId": "YOUR_ORG_ID_HERE",
          "name": "Test Assistant",
          "number": "+16126423441"
        },
        "customer": {
          "number": "+19342034111"
        }
      }
    }
  }
}
```

2. Send test webhook:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/call-report \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

3. Check your dashboard - the call should appear!

## Troubleshooting

### Calls Not Appearing

1. **Check org_id matches**: Ensure the org_id in your profile matches the one in VAPI webhooks
2. **Check edge function logs**: Supabase Dashboard → Edge Functions → call-report → Logs
3. **Verify RLS policies**: Ensure user can view their own calls
4. **Check VAPI webhook**: Verify webhook is configured and firing

### Authentication Issues

1. **Email confirmation**: Ensure it's disabled in Auth settings
2. **Check credentials**: Verify `config.js` has correct Supabase URL and anon key
3. **Browser console**: Check for errors in browser developer tools

### Real-time Updates Not Working

1. **Check Supabase Realtime**: Ensure Realtime is enabled for `calls` table
2. **Browser support**: Ensure browser supports WebSockets
3. **Check subscription**: Look for errors in browser console

## Security Notes

⚠️ **Production Deployment**:
- Enable email confirmations
- Use environment variables for sensitive keys
- Set up proper CORS policies
- Enable RLS on all tables
- Use service role key only in edge functions
- Never expose service role key in frontend

## Next Steps

- Customize the design to match your brand
- Add more metrics and charts
- Set up email notifications for important calls
- Export call data to CSV
- Integrate with your CRM

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Check VAPI documentation: https://docs.vapi.ai
- Review edge function logs for webhook errors
