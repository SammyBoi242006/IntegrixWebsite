// Profile Page - User can view and update their org_id
import { showToast } from './utils.js';

export function renderProfile() {
  const profile = window.appState.getUserProfile();

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      <h1>Profile Settings</h1>
      <p class="text-muted mb-3">Manage your account information and VAPI organization ID</p>
      
      <div class="card" style="max-width: 600px;">
        <h2 style="margin-bottom: 1rem;">Account Information</h2>
        
        <div class="form-group">
          <label>Email</label>
          <input type="text" value="${profile?.email || ''}" disabled>
        </div>
        
        <div class="form-group">
          <label>Display Name</label>
          <input type="text" id="display_name" value="${profile?.display_name || ''}" placeholder="Your Name">
        </div>
        
        <div class="form-group">
          <label for="org_id">VAPI Organization ID</label>
          <input type="text" id="org_id" value="${profile?.org_id || ''}" placeholder="Enter your VAPI org_id">
          <small class="text-muted">This ID links your account to VAPI webhook data. Find it in your VAPI dashboard.</small>
        </div>
        
        ${profile?.org_id ? `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 1rem;">
            <strong style="color: var(--color-green);">✓ Organization ID Set</strong>
            <p style="margin: 0.5rem 0 0 0; font-size: 13px; color: var(--color-text-secondary);">Your account is linked to VAPI. Call data will be tracked automatically.</p>
          </div>
        ` : `
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 1rem;">
            <strong style="color: var(--color-orange);">⚠ No Organization ID</strong>
            <p style="margin: 0.5rem 0 0 0; font-size: 13px; color: var(--color-text-secondary);">Set your VAPI org_id to start tracking calls.</p>
          </div>
        `}
        
        <button class="btn btn-primary" onclick="handleProfileUpdate()">Save Changes</button>
      </div>
    </div>
  `;
}

// Handle profile update
window.handleProfileUpdate = async function () {
  const displayName = document.getElementById('display_name').value;
  const orgId = document.getElementById('org_id').value;
  const user = window.appState.getCurrentUser();

  const { error } = await window.supabaseClient
    .from('profiles')
    .update({
      display_name: displayName,
      org_id: orgId || null
    })
    .eq('id', user.id);

  if (error) {
    showToast('Failed to update profile: ' + error.message, 'error');
    return;
  }

  showToast('Profile updated successfully!', 'success');

  // Refresh auth state
  await window.appState.refreshAuth();

  // Re-render profile
  renderProfile();
};
