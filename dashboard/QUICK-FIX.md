# Quick VAPI Webhook Checklist

## The Issue
✅ Manual webhook test works (edge function is fine)
❌ Real VAPI calls don't appear in database
**Conclusion:** VAPI is not sending webhooks to your edge function

## What to Do

### 1. Configure Webhook in VAPI
Go to VAPI Dashboard → Phone Numbers → [Your Number] → Server URL

**Enter this exact URL:**
```
https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report
```

### 2. Enable End-of-Call Report
Make sure the checkbox for "End of Call Report" is checked/enabled

### 3. Save Changes
Click Save/Update in VAPI

### 4. Test
1. Make a call to your VAPI number
2. Talk for 10 seconds
3. Hang up
4. Wait 10 seconds
5. Check: Supabase Dashboard → Edge Functions → call-report → Logs

### 5. Verify
**In Edge Function Logs, you should see:**
- New request with timestamp matching your call
- Status 200 = Success!

**If you see nothing:**
- VAPI webhook is not configured correctly
- Double-check the URL in VAPI
- Verify "End of Call Report" is enabled

## Your Webhook URL
```
https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report
```

Copy this exactly - no typos!

## Where to Check in VAPI
Look for one of these sections:
- "Server URL"
- "Webhook URL"  
- "Server Settings"
- "Webhooks"
- "Integration"

It's usually in the Phone Number or Assistant settings.

## After Configuration
Make a test call and check edge function logs. If you see a request, it's working!
