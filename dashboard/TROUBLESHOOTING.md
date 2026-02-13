# Troubleshooting: Calls Not Appearing

If calls aren't showing up in your dashboard after answering a VAPI call, follow these steps:

## Step 1: Verify Edge Function is Deployed

Check that your edge function is deployed and accessible:

```bash
# Test the edge function URL
curl https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report
```

You should get a response (even if it's an error about missing data).

## Step 2: Check Edge Function Logs

1. Go to **Supabase Dashboard**
2. Navigate to **Edge Functions** → **call-report**
3. Click on **Logs** tab
4. Look for recent requests

**What to look for:**
- ✅ 200 status = Success
- ❌ 404 status = User not found for org_id (mismatch!)
- ❌ 400 status = Missing org_id in webhook
- ❌ 500 status = Database error

## Step 3: Verify org_id Match

The org_id in your profile MUST match the org_id in the VAPI webhook.

### Check your profile org_id:
1. Go to your dashboard
2. Click **Profile**
3. Copy the org_id you entered

### Check VAPI org_id:
1. Go to VAPI Dashboard
2. Navigate to **Settings** → **Organization**
3. Copy your Organization ID

**These MUST be identical!**

## Step 4: Run Database Debugging Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the file: `supabase/debug-calls.sql`
3. Check the results:

**Scenario A: No calls in database**
- Webhook isn't reaching the edge function
- Check VAPI webhook configuration
- Verify edge function URL is correct

**Scenario B: Calls exist but with different org_id**
- org_id mismatch between profile and VAPI
- Update your profile with the correct org_id from VAPI

**Scenario C: Calls exist with correct org_id but you can't see them**
- RLS policy issue
- Run the fix-recursion.sql script

**Scenario D: Calls exist and belong to you**
- Frontend issue
- Check browser console for errors
- Verify real-time subscription is working

## Step 5: Test with Manual Webhook

Create a test file `test-call.json`:

```json
{
  "message": {
    "timestamp": 1709232465976,
    "type": "end-of-call-report",
    "cost": 0.0352,
    "durationSeconds": 15,
    "endedReason": "customer-ended-call",
    "startedAt": "2025-02-13T00:00:00.000Z",
    "transcript": "AI: Hello!\\nUser: Hi there!",
    "artifact": {
      "variables": {
        "phoneNumber": {
          "orgId": "YOUR_ORG_ID_FROM_PROFILE",
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

Send it:
```bash
curl -X POST https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report \
  -H "Content-Type: application/json" \
  -d @test-call.json
```

Check the response:
- ✅ `{"success": true, "call_id": "..."}` = Working!
- ❌ `{"error": "User not found for org_id"}` = org_id mismatch
- ❌ Other error = Check edge function logs

## Step 6: Check Browser Console

1. Open your dashboard
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Look for errors

Common errors:
- `Failed to load calls` = Database/RLS issue
- `Subscription error` = Real-time not working
- `Network error` = Supabase connection issue

## Step 7: Verify Real-time is Enabled

1. Go to **Supabase Dashboard**
2. Navigate to **Database** → **Replication**
3. Ensure `calls` table has replication enabled
4. If not, enable it

## Step 8: Check VAPI Webhook Configuration

In VAPI Dashboard:

1. Go to your **Phone Number** or **Assistant**
2. Find **Server URL** or **Webhooks** section
3. Verify:
   - ✅ URL is: `https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report`
   - ✅ "End of Call Report" is enabled
   - ✅ No typos in the URL

## Quick Checklist

- [ ] Edge function deployed
- [ ] Edge function URL correct in VAPI
- [ ] org_id in profile matches VAPI org_id exactly
- [ ] "End of Call Report" enabled in VAPI
- [ ] Database has calls table
- [ ] RLS policies allow viewing own calls
- [ ] Real-time replication enabled on calls table
- [ ] No errors in browser console
- [ ] No errors in edge function logs

## Common Issues & Solutions

### Issue: "User not found for org_id"
**Solution:** Your profile org_id doesn't match VAPI's org_id. Update your profile with the exact org_id from VAPI Settings → Organization.

### Issue: Calls in database but not visible
**Solution:** RLS policy issue. Run `fix-recursion.sql` in SQL Editor.

### Issue: No calls in database at all
**Solution:** Webhook not reaching edge function. Check VAPI webhook URL and edge function logs.

### Issue: Real-time updates not working
**Solution:** Enable replication on calls table in Database → Replication.

## Still Not Working?

If you've tried everything above:

1. **Check edge function logs** for the exact error
2. **Run debug-calls.sql** to see what's in the database
3. **Send a manual test webhook** to isolate the issue
4. **Check browser console** for frontend errors

The most common issue is **org_id mismatch** - make sure they're identical!
