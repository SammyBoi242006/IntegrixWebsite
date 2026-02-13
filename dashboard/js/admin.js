// Admin Page - Manage users and view all calls
import { formatDate, formatDuration, formatCurrency, showToast } from './utils.js';

let allUsers = [];
let allCalls = [];

export function renderAdmin() {
  // Check admin permission
  if (!window.appState.isAdmin()) {
    document.getElementById('app').innerHTML = `
      <div class="container">
        <h1>Access Denied</h1>
        <p class="text-muted">You do not have permission to view this page.</p>
      </div>
    `;
    return;
  }

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      <h1>Admin Panel</h1>
      <p class="text-muted mb-3">Manage users and view all call data</p>
      
      <!-- Users Section -->
      <div class="card mb-3">
        <h2 style="margin-bottom: 1rem;">Users</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Organization ID</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <tr>
                <td colspan="5" class="text-center">Loading users...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- All Calls Section -->
      <div class="card">
        <h2 style="margin-bottom: 1rem;">All Calls</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>User Email</th>
                <th>Date</th>
                <th>Assistant</th>
                <th>Customer</th>
                <th>Duration</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="all-calls-table-body">
              <tr>
                <td colspan="7" class="text-center">Loading calls...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Edit Org ID Modal -->
    <div id="edit-org-modal" class="modal-overlay hidden" onclick="closeEditOrgModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Edit Organization ID</h2>
          <button class="modal-close" onclick="closeEditOrgModal()">&times;</button>
        </div>
        <form id="edit-org-form">
          <div class="form-group">
            <label for="edit-email">User Email</label>
            <input type="text" id="edit-email" disabled>
          </div>
          <div class="form-group">
            <label for="edit-org-id">Organization ID</label>
            <input type="text" id="edit-org-id" placeholder="Enter VAPI org_id">
          </div>
          <input type="hidden" id="edit-user-id">
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  `;

  // Load data
  loadUsers();
  loadAllCalls();

  // Handle edit form submission
  document.getElementById('edit-org-form').addEventListener('submit', handleOrgIdUpdate);
}

// Load all users
async function loadUsers() {
  const { data: profiles, error } = await window.supabaseClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load users: ' + error.message, 'error');
    return;
  }

  allUsers = profiles || [];
  renderUsersTable();
}

// Render users table
function renderUsersTable() {
  const tbody = document.getElementById('users-table-body');

  if (allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = allUsers.map(user => `
    <tr>
      <td>${user.email || 'N/A'}</td>
      <td>${user.display_name || 'N/A'}</td>
      <td>
        ${user.org_id ? `
          <code style="background: rgba(255, 255, 255, 0.05); padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${user.org_id}
          </code>
        ` : '<span class="text-muted">Not set</span>'}
      </td>
      <td>${formatDate(user.created_at)}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="editOrgId('${user.id}', '${user.email}', '${user.org_id || ''}')">
          Edit Org ID
        </button>
      </td>
    </tr>
  `).join('');
}

// Load all calls
async function loadAllCalls() {
  const { data: calls, error } = await window.supabaseClient
    .from('calls')
    .select(`
      *,
      profiles!inner(email)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    showToast('Failed to load calls: ' + error.message, 'error');
    return;
  }

  allCalls = calls || [];
  renderAllCallsTable();
}

// Render all calls table
function renderAllCallsTable() {
  const tbody = document.getElementById('all-calls-table-body');

  if (allCalls.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No calls found</td></tr>';
    return;
  }

  tbody.innerHTML = allCalls.map(call => `
    <tr>
      <td>${call.profiles?.email || 'N/A'}</td>
      <td>${formatDate(call.start_time || call.created_at)}</td>
      <td>${call.assistant_name || 'N/A'}</td>
      <td>${call.customer_phone_number || 'N/A'}</td>
      <td>${formatDuration(call.duration_seconds)}</td>
      <td>${formatCurrency(call.cost_usd)}</td>
      <td>
        <span style="
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          background: ${call.ended_reason === 'customer-ended-call' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
          color: ${call.ended_reason === 'customer-ended-call' ? 'var(--color-green)' : 'var(--color-orange)'};
        ">
          ${call.ended_reason || 'Unknown'}
        </span>
      </td>
    </tr>
  `).join('');
}

// Edit org ID
window.editOrgId = function (userId, email, currentOrgId) {
  document.getElementById('edit-user-id').value = userId;
  document.getElementById('edit-email').value = email;
  document.getElementById('edit-org-id').value = currentOrgId;
  document.getElementById('edit-org-modal').classList.remove('hidden');
};

// Close edit modal
window.closeEditOrgModal = function (event) {
  if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('modal-close')) {
    document.getElementById('edit-org-modal').classList.add('hidden');
  }
};

// Handle org ID update
async function handleOrgIdUpdate(e) {
  e.preventDefault();

  const userId = document.getElementById('edit-user-id').value;
  const newOrgId = document.getElementById('edit-org-id').value;

  const { error } = await window.supabaseClient
    .from('profiles')
    .update({ org_id: newOrgId || null })
    .eq('id', userId);

  if (error) {
    showToast('Failed to update org ID: ' + error.message, 'error');
    return;
  }

  showToast('Organization ID updated successfully!', 'success');
  closeEditOrgModal();
  loadUsers();
}
