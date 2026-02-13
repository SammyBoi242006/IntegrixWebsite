# VAPI Call Tracking System - Testing Checklist

Use this checklist to verify all functionality is working correctly.

## ✅ Database Setup

- [ ] All tables created successfully
  - [ ] `profiles` table exists
  - [ ] `calls` table exists
  - [ ] `user_roles` table exists
  - [ ] `app_role` enum type exists
- [ ] RLS policies are active
  - [ ] Users can only view their own profiles
  - [ ] Users can only view their own calls
  - [ ] Admins can view all data
- [ ] Triggers are working
  - [ ] `handle_new_user()` trigger creates profile on signup
  - [ ] Default 'user' role is assigned on signup

## ✅ Edge Function

- [ ] Edge function deployed successfully
- [ ] Function accessible at correct URL
- [ ] JWT verification is disabled (`verify_jwt = false`)
- [ ] CORS headers working correctly

### Test Webhook Processing

- [ ] Send test webhook with valid org_id
  - [ ] Function returns 200 status
  - [ ] Call record created in database
  - [ ] All fields populated correctly:
    - [ ] `org_id` matches webhook
    - [ ] `assistant_name` extracted correctly
    - [ ] `assistant_phone_number` extracted correctly
    - [ ] `customer_phone_number` extracted correctly
    - [ ] `transcript` extracted correctly
    - [ ] `call_type` = "end-of-call-report"
    - [ ] `ended_reason` extracted correctly
    - [ ] `start_time` parsed correctly
    - [ ] `duration_seconds` rounded to integer
    - [ ] `cost_usd` stored correctly

- [ ] Send webhook with invalid org_id
  - [ ] Function returns 404 status
  - [ ] Error message indicates user not found

- [ ] Send webhook with missing org_id
  - [ ] Function returns 400 status
  - [ ] Error message indicates missing org_id

## ✅ Authentication

### Signup Flow

- [ ] Navigate to signup page
- [ ] Enter email and password
- [ ] Submit form
- [ ] Account created successfully
- [ ] Profile created automatically
- [ ] Default 'user' role assigned
- [ ] Redirected to login page
- [ ] Toast notification shows success

### Login Flow

- [ ] Navigate to login page
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] Successfully logged in
- [ ] Redirected to dashboard
- [ ] Navigation bar appears
- [ ] Toast notification shows success

### Logout Flow

- [ ] Click logout button
- [ ] Successfully logged out
- [ ] Redirected to login page
- [ ] Navigation bar disappears
- [ ] Toast notification shows success

### Protected Routes

- [ ] Accessing `/` without auth redirects to login
- [ ] Accessing `/profile` without auth redirects to login
- [ ] Accessing `/admin` without auth redirects to login
- [ ] Accessing `/login` while authenticated redirects to dashboard
- [ ] Accessing `/signup` while authenticated redirects to dashboard

## ✅ Profile Page

- [ ] Profile page loads correctly
- [ ] Email displayed (read-only)
- [ ] Display name editable
- [ ] org_id field editable
- [ ] Warning shown when org_id not set
- [ ] Success indicator shown when org_id is set
- [ ] Save button updates profile
- [ ] Toast notification on successful save
- [ ] Error handling for failed updates
- [ ] Page re-renders with updated data

## ✅ Dashboard Page

### Metrics Cards

- [ ] All 4 metric cards display
- [ ] Total Call Minutes calculated correctly
- [ ] Number of Calls shows correct count
- [ ] Total Spent sums costs correctly
- [ ] Average Cost per Call calculated correctly
- [ ] Metrics update when date range changes
- [ ] Trend text shows selected date range
- [ ] Color coding matches design (green, orange, purple, blue)

### Date Range Filter

- [ ] Date range selector displays
- [ ] Default is "Last 30 days"
- [ ] Changing range reloads calls
- [ ] Metrics update accordingly
- [ ] Options: 7, 30, 90, 365 days

### Calls Table

- [ ] Table displays all user's calls
- [ ] Columns show correct data:
  - [ ] Date formatted correctly
  - [ ] Assistant name displayed
  - [ ] Customer phone number displayed
  - [ ] Duration formatted (Xm Ys)
  - [ ] Cost formatted ($X.XX)
  - [ ] Status badge with color coding
  - [ ] View Transcript button (when available)
- [ ] Empty state shows when no calls
- [ ] Table scrolls horizontally on mobile
- [ ] Hover effects work on rows

### Transcript Viewer

- [ ] Click "View Transcript" opens modal
- [ ] Transcript content displays correctly
- [ ] Modal can be closed by:
  - [ ] Clicking X button
  - [ ] Clicking outside modal
- [ ] Modal prevents body scroll when open

### Real-time Updates

- [ ] Dashboard subscribes to call updates
- [ ] Send test webhook while dashboard is open
- [ ] New call appears automatically (no refresh needed)
- [ ] Toast notification shows "New call received!"
- [ ] Metrics update automatically
- [ ] Table updates automatically

## ✅ Admin Page

### Access Control

- [ ] Non-admin users cannot access admin page
- [ ] Access denied message shown to non-admins
- [ ] Admin users can access admin page
- [ ] Admin link appears in navigation for admins only

### Users Table

- [ ] All users displayed
- [ ] Email column shows user emails
- [ ] Display name column shows names
- [ ] Organization ID shown (or "Not set")
- [ ] Created date formatted correctly
- [ ] Edit Org ID button works for each user

### Edit Organization ID

- [ ] Click "Edit Org ID" opens modal
- [ ] User email displayed (read-only)
- [ ] Current org_id pre-filled
- [ ] Can update org_id
- [ ] Save button updates database
- [ ] Toast notification on success
- [ ] Modal closes after save
- [ ] Users table refreshes with new data

### All Calls Table

- [ ] All calls from all users displayed
- [ ] User email column shows call owner
- [ ] All call data displayed correctly
- [ ] Limited to 100 most recent calls
- [ ] Sorted by date (newest first)

## ✅ Design & UX

### Integrix Design System

- [ ] Dark mode theme applied
- [ ] Coral accent color used correctly
- [ ] Ultra-minimal borders (low opacity)
- [ ] Rounded corners on cards (12-16px)
- [ ] Hover effects work:
  - [ ] Cards lift on hover (-2px)
  - [ ] Buttons lift on hover (-1px)
  - [ ] Smooth transitions (300ms)
- [ ] Radial gradient overlays on card hover
- [ ] Typography hierarchy clear
- [ ] Color contrast meets accessibility standards

### Responsive Design

- [ ] Desktop (1440px+):
  - [ ] 4-column metrics grid
  - [ ] Full navigation visible
  - [ ] Tables display all columns
- [ ] Tablet (768px-1439px):
  - [ ] 2-column metrics grid
  - [ ] Navigation adapts
  - [ ] Tables scroll horizontally
- [ ] Mobile (< 768px):
  - [ ] 1-column metrics grid
  - [ ] Compact navigation
  - [ ] Tables scroll horizontally
  - [ ] Forms full width
  - [ ] Modals adapt to screen

### Micro-interactions

- [ ] Button hover states smooth
- [ ] Card hover effects work
- [ ] Input focus states visible
- [ ] Toast notifications slide in/out
- [ ] Loading spinners animate
- [ ] Transitions feel polished

## ✅ Error Handling

- [ ] Invalid login shows error toast
- [ ] Invalid signup shows error toast
- [ ] Failed profile update shows error
- [ ] Failed webhook shows appropriate status code
- [ ] Network errors handled gracefully
- [ ] Database errors logged and displayed
- [ ] Missing data shows "N/A" or placeholder

## ✅ Performance

- [ ] Initial page load < 2 seconds
- [ ] Dashboard loads calls quickly
- [ ] Real-time updates don't cause lag
- [ ] No console errors in browser
- [ ] No memory leaks from subscriptions
- [ ] Tables render smoothly with 100+ calls

## ✅ Security

- [ ] RLS policies prevent unauthorized access
- [ ] Service role key not exposed in frontend
- [ ] Anon key used correctly in frontend
- [ ] Edge function validates org_id
- [ ] Admin routes check permissions
- [ ] SQL injection prevented by parameterized queries
- [ ] XSS prevented by proper escaping

## 🎯 End-to-End Test Scenario

Complete this full workflow to verify everything works together:

1. [ ] Create new user account via signup
2. [ ] Login with new credentials
3. [ ] Navigate to profile page
4. [ ] Set org_id to your VAPI organization ID
5. [ ] Save profile
6. [ ] Navigate to dashboard
7. [ ] Verify empty state (no calls yet)
8. [ ] Send test webhook from VAPI or curl
9. [ ] Verify call appears in dashboard automatically
10. [ ] Check all metrics updated correctly
11. [ ] Click "View Transcript" to see call details
12. [ ] Change date range filter
13. [ ] Verify calls filter correctly
14. [ ] (If admin) Navigate to admin page
15. [ ] (If admin) Verify all users visible
16. [ ] (If admin) Edit another user's org_id
17. [ ] Logout
18. [ ] Verify redirected to login page

## 📝 Notes

- Mark items as you test them
- Document any issues found
- Take screenshots of errors
- Check browser console for errors
- Test in multiple browsers (Chrome, Firefox, Safari)
- Test on multiple devices (desktop, tablet, mobile)

## 🐛 Common Issues

If tests fail, check:
- Supabase credentials in `config.js`
- Database schema deployed correctly
- Edge function deployed and accessible
- RLS policies enabled
- Auth settings configured (email confirmation disabled)
- VAPI webhook URL correct
- org_id matches between profile and webhook
