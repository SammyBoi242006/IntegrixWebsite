// Profile Page - User can view and update their account info and VAPI credentials
import { showToast } from './utils.js';
import { SUPABASE_CONFIG } from './config.js';

export function renderProfile() {
  const profile = window.appState.getUserProfile();
  const app = document.getElementById('app');

  // Webhook URL for the user to copy
  const webhookUrl = `${SUPABASE_CONFIG.url}/functions/v1/call-report`;

  app.innerHTML = `
    <div class="container" style="max-width: 800px; padding-top: 1rem;">
      <div class="dashboard-header" style="margin-bottom: 2rem;">
        <h1 style="margin-bottom: 0.5rem; letter-spacing: -1px; font-weight: 800;">Profile Settings</h1>
        <p class="text-muted">Manage your account information and VAPI configuration</p>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <!-- Account Information Card -->
        <div class="card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem;">
            <div style="padding: 10px; background: rgba(255, 107, 107, 0.1); border-radius: 12px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-coral)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2 style="font-size: 18px; font-weight: 700; margin: 0;">Account Information</h2>
          </div>
          
          <div class="form-group">
            <label>Email Address</label>
            <input type="text" value="${profile?.email || ''}" disabled style="opacity: 0.7; cursor: not-allowed; background: var(--bg-primary);">
            <small class="text-muted">Your email address cannot be changed.</small>
          </div>
          
          <div class="form-group">
            <label for="display_name">Display Name</label>
            <input type="text" id="display_name" value="${profile?.display_name || ''}" placeholder="e.g. John Doe">
          </div>
        </div>

        <!-- VAPI Configuration Card -->
        <div class="card">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem;">
            <div style="padding: 10px; background: rgba(59, 130, 246, 0.1); border-radius: 12px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6" y2="6"></line>
                <line x1="6" y1="18" x2="6" y2="18"></line>
              </svg>
            </div>
            <h2 style="font-size: 18px; font-weight: 700; margin: 0;">VAPI Configuration</h2>
          </div>

          <div style="background: var(--bg-primary); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px; border: 1px solid var(--border-color);">
            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              Your Webhook URL
            </label>
            <div style="display: flex; gap: 8px;">
              <input type="text" value="${webhookUrl}" readonly id="webhook-url" style="font-family: monospace; font-size: 12px; background: var(--bg-secondary);">
              <button class="btn btn-secondary" style="padding: 8px 12px; white-space: nowrap;" onclick="copyWebhookUrl()">Copy URL</button>
            </div>
            <p class="text-muted" style="font-size: 12px; margin-top: 8px;">Paste this URL into your VAPI Dashboard under <strong>Phone Numbers → [Number] → Server URL</strong></p>
          </div>
          
          <div class="form-group">
            <label for="org_id">VAPI Organization ID</label>
            <input type="text" id="org_id" value="${profile?.org_id || ''}" placeholder="Enter your VAPI Org ID">
            <small class="text-muted">Found in VAPI Dashboard → Settings → Account.</small>
          </div>

          <div class="form-group" style="position: relative;">
            <label for="vapi_api_key">VAPI API Key</label>
            <input type="password" id="vapi_api_key" value="${profile?.vapi_api_key || ''}" placeholder="Enter your VAPI API Private Key">
            <button onclick="togglePasswordVisibility('vapi_api_key')" style="position: absolute; right: 12px; top: 38px; background: none; border: none; color: var(--text-muted); cursor: pointer;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <small class="text-muted">Required to initiate outbound calls and campaigns.</small>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label for="vapi_assistant_id">Default Assistant ID</label>
              <input type="text" id="vapi_assistant_id" value="${profile?.vapi_assistant_id || ''}" placeholder="Enter Assistant ID">
            </div>

            <div class="form-group">
              <label for="vapi_phone_number_id">Default Phone ID</label>
              <input type="text" id="vapi_phone_number_id" value="${profile?.vapi_phone_number_id || ''}" placeholder="Enter Phone ID">
            </div>
          </div>
          
          ${profile?.vapi_api_key && profile?.vapi_assistant_id ? `
            <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 14px; margin-bottom: 1.5rem; display: flex; gap: 12px; align-items: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-green); box-shadow: 0 0 8px var(--color-green);"></div>
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: var(--color-green);">VAPI integration is active and ready for campaigns.</p>
            </div>
          ` : `
            <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 14px; margin-bottom: 1.5rem; display: flex; gap: 12px; align-items: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-orange); box-shadow: 0 0 8px var(--color-orange);"></div>
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: var(--color-orange);">Please fill in your API Key and Assistant ID to enable campaigns.</p>
            </div>
          `}
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem;">
          <button class="btn btn-primary" onclick="handleProfileUpdate()" style="padding: 14px 32px; font-size: 16px;">Save All Changes</button>
        </div>
      </div>
    </div>
  `;
}

// Helper to copy Webhook URL
window.copyWebhookUrl = function () {
  const urlEl = document.getElementById('webhook-url');
  urlEl.select();
  document.execCommand('copy');
  showToast('Webhook URL copied to clipboard!', 'success');
};

// Toggle password visibility
window.togglePasswordVisibility = function (id) {
  const el = document.getElementById(id);
  if (el.type === 'password') {
    el.type = 'text';
  } else {
    el.type = 'password';
  }
};

// Handle profile update
window.handleProfileUpdate = async function () {
  const displayName = document.getElementById('display_name').value;
  const orgId = document.getElementById('org_id').value;
  const vapiApiKey = document.getElementById('vapi_api_key').value;
  const vapiAssistantId = document.getElementById('vapi_assistant_id').value;
  const vapiPhoneNumberId = document.getElementById('vapi_phone_number_id').value;
  const user = window.appState.getCurrentUser();

  if (!user) {
    showToast('You must be logged in to update your profile.', 'error');
    return;
  }

  showToast('Saving changes...', 'info');

  const { error } = await window.supabaseClient
    .from('profiles')
    .update({
      display_name: displayName,
      org_id: orgId || null,
      vapi_api_key: vapiApiKey || null,
      vapi_assistant_id: vapiAssistantId || null,
      vapi_phone_number_id: vapiPhoneNumberId || null
    })
    .eq('id', user.id);

  if (error) {
    showToast('Failed to update profile: ' + error.message, 'error');
    console.error('Profile Update Error:', error);
    return;
  }

  showToast('Profile updated successfully!', 'success');

  // Refresh auth state to ensure global userProfile is updated
  await window.appState.refreshAuth();

  // Re-render profile to show updated values and status
  renderProfile();
};
