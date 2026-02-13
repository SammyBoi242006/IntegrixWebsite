# VAPI Webhook Configuration Guide

Since the manual test worked but real calls don't appear, the issue is with VAPI's webhook configuration.

## Problem: VAPI Not Sending Webhooks

Your edge function works (proven by manual test), but VAPI isn't sending webhooks to it.

## Solution: Verify VAPI Webhook Setup

### Step 1: Find Where to Configure Webhooks in VAPI

VAPI has **two places** where you can configure webhooks:

#### Option A: Phone Number Level (Recommended)
1. Go to VAPI Dashboard
2. Click **Phone Numbers** in sidebar
3. Click on your phone number
4. Scroll to **Server URL** or **Webhook URL** section
5. Enter: `https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report`
6. **IMPORTANT**: Make sure "End of Call Report" is checked/enabled
7. Save

#### Option B: Assistant Level
1. Go to VAPI Dashboard
2. Click **Assistants** in sidebar
3. Click on your assistant
4. Find **Server Settings** or **Webhook** section
5. Enter: `https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report`
6. Enable "End of Call Report"
7. Save

### Step 2: Verify the URL is Correct

**Exact URL to use:**
```
https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report
```

**Common mistakes:**
- ❌ Missing `/functions/v1/`
- ❌ Wrong function name
- ❌ Extra spaces
- ❌ HTTP instead of HTTPS
- ❌ Typos in project ID

### Step 3: Check VAPI Webhook Logs

1. In VAPI Dashboard, look for **Logs** or **Call History**
2. Click on a recent call
3. Look for webhook delivery status
4. Check if there are any error messages

**What to look for:**
- ✅ "Webhook delivered successfully" = Good!
- ❌ "Webhook failed" = Check URL
- ❌ "No webhook configured" = Not set up
- ❌ "Timeout" = Edge function issue

### Step 4: Test with a New Call

After configuring the webhook:

1. Make a test call to your VAPI number
2. Have a short conversation (10-15 seconds)
3. Hang up
4. Wait 5-10 seconds
5. Check Supabase Edge Function logs:
   - Go to: Supabase Dashboard → Edge Functions → call-report → Logs
   - Look for a new request
6. Refresh your dashboard

### Step 5: Check Edge Function Logs

In **Supabase Dashboard → Edge Functions → call-report → Logs**:

**If you see requests:**
- ✅ 200 status = Success! Call should be in database
- ❌ 404 status = org_id mismatch
- ❌ 400 status = Missing data in webhook
- ❌ 500 status = Database error

**If you see NO requests:**
- VAPI is not sending webhooks
- Double-check webhook URL in VAPI
- Verify "End of Call Report" is enabled

## Common VAPI Webhook Issues

### Issue 1: Webhook Not Configured at All
**Symptoms:** No logs in edge function, no calls in database
**Solution:** Configure webhook URL in VAPI phone number or assistant settings

### Issue 2: Wrong Webhook Event Type
**Symptoms:** Other events work but not end-of-call
**Solution:** Enable "End of Call Report" event in VAPI webhook settings

### Issue 3: Webhook URL Typo
**Symptoms:** VAPI shows "webhook failed" in logs
**Solution:** Copy-paste the exact URL, don't type it manually

### Issue 4: Server URL vs Webhook URL Confusion
**Symptoms:** Some VAPI features work but not webhooks
**Solution:** VAPI has different fields for different purposes. Make sure you're setting the webhook/server URL field, not other fields

## VAPI Webhook Configuration Checklist

- [ ] Webhook URL is set in VAPI (Phone Number or Assistant)
- [ ] URL is exactly: `https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report`
- [ ] "End of Call Report" event is enabled
- [ ] Changes are saved in VAPI
- [ ] Made a test call after configuring
- [ ] Checked edge function logs for incoming requests
- [ ] Verified org_id in profile matches VAPI org_id

## Quick Test After Configuration

1. **Make a test call** to your VAPI number
2. **Talk for 10 seconds** then hang up
3. **Wait 10 seconds** for webhook to fire
4. **Check edge function logs** in Supabase
5. **Refresh your dashboard**

If you see a request in edge function logs with status 200, the call should appear in your dashboard!

## Still Not Working?

If webhooks still aren't being sent:

1. **Contact VAPI Support** - They can verify webhook configuration on their end
2. **Check VAPI Documentation** - Webhook setup may have changed
3. **Try a different event** - Test with other webhook events to verify connectivity
4. **Check VAPI account status** - Ensure webhooks are enabled for your plan

## Alternative: Check VAPI Call Logs

VAPI should show webhook delivery status in their call logs:

1. Go to VAPI Dashboard
2. Find **Calls** or **Call History**
3. Click on your recent test call
4. Look for webhook delivery information
5. Check for any error messages

This will tell you if VAPI is even attempting to send webhooks.
