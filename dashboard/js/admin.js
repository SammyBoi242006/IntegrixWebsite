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
    <div class="container" style="padding-top: 1rem;">
      <div class="dashboard-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1 style="margin-bottom: 0.5rem; letter-spacing: -1px; font-weight: 800;">Admin Panel</h1>
          <p class="text-muted">Manage users and view all call data</p>
        </div>
      </div>
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
                <th>Minutes Limit</th>
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <h2 style="margin-bottom: 0;">All Calls</h2>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <select id="admin-filter-org" style="padding: 10px 16px; border-radius: 100px; width: 180px; font-size: 13px; background: var(--bg-secondary); border: 1px solid var(--text-muted); color: var(--text-primary); cursor: pointer; outline: none;">
              <option value="">All Organizations</option>
            </select>
            <select id="admin-filter-assistant" style="padding: 10px 16px; border-radius: 100px; width: 180px; font-size: 13px; background: var(--bg-secondary); border: 1px solid var(--text-muted); color: var(--text-primary); cursor: pointer; outline: none;">
              <option value="">All Assistants</option>
            </select>
            <div style="position: relative; width: 260px;">
              <input type="text" id="admin-search-calls" placeholder="Search calls..." style="padding: 10px 16px; border-radius: 100px; padding-left: 36px;">
              <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
        </div>
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
    
    <!-- Edit User Modal -->
    <div id="edit-user-modal" class="modal-overlay hidden" onclick="closeEditUserModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Edit User Details</h2>
          <button class="modal-close" onclick="closeEditUserModal()">&times;</button>
        </div>
        <form id="edit-user-form">
          <div class="form-group">
            <label for="edit-email">User Email</label>
            <input type="text" id="edit-email" disabled>
          </div>
          <div class="form-group">
            <label for="edit-org-id">Organization ID</label>
            <input type="text" id="edit-org-id" placeholder="Enter VAPI org_id">
          </div>
          <div class="form-group">
            <label for="edit-minutes-limit">Total Minutes Limit</label>
            <input type="number" id="edit-minutes-limit" placeholder="100">
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
  document.getElementById('edit-user-form').addEventListener('submit', handleUserUpdate);

  // Handle filtering
  const searchInput = document.getElementById('admin-search-calls');
  const orgFilter = document.getElementById('admin-filter-org');
  const assistantFilter = document.getElementById('admin-filter-assistant');

  const updateFilters = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const orgId = orgFilter.value;
    const assistantName = assistantFilter.value;
    renderAllCallsTable(searchTerm, orgId, assistantName);
  };

  if (searchInput) searchInput.addEventListener('input', updateFilters);
  if (orgFilter) orgFilter.addEventListener('change', updateFilters);
  if (assistantFilter) assistantFilter.addEventListener('change', updateFilters);
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
      <td style="font-weight: 600;">${user.total_minutes_limit || 100} min</td>
      <td>${formatDate(user.created_at)}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="editUser('${user.id}', '${user.email}', '${user.org_id || ''}', ${user.total_minutes_limit || 100})">
          Edit
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
  populateFilters();
  renderAllCallsTable();
}

function populateFilters() {
  const orgFilter = document.getElementById('admin-filter-org');
  const assistantFilter = document.getElementById('admin-filter-assistant');

  if (orgFilter) {
    const orgs = [...new Set(allCalls.map(c => c.org_id))].filter(Boolean).sort();
    orgFilter.innerHTML = '<option value="">All Organizations</option>' +
      orgs.map(org => `<option value="${org}">${org}</option>`).join('');
  }

  if (assistantFilter) {
    const assistants = [...new Set(allCalls.map(c => c.assistant_name))].filter(Boolean).sort();
    assistantFilter.innerHTML = '<option value="">All Assistants</option>' +
      assistants.map(name => `<option value="${name}">${name}</option>`).join('');
  }
}

// Render all calls table
function renderAllCallsTable(searchTerm = '', orgId = '', assistantName = '') {
  const tbody = document.getElementById('all-calls-table-body');

  if (allCalls.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No calls found</td></tr>';
    return;
  }

  const filteredCalls = allCalls.filter(call => {
    // Search term match
    const searchMatch = !searchTerm || (
      (call.profiles?.email || '').toLowerCase().includes(searchTerm) ||
      (call.assistant_name || '').toLowerCase().includes(searchTerm) ||
      (call.customer_phone_number || '').toLowerCase().includes(searchTerm) ||
      (call.ended_reason || '').toLowerCase().includes(searchTerm) ||
      (call.org_id || '').toLowerCase().includes(searchTerm)
    );

    // Org ID filter match
    const orgMatch = !orgId || call.org_id === orgId;

    // Assistant Name filter match
    const assistantMatch = !assistantName || call.assistant_name === assistantName;

    return searchMatch && orgMatch && assistantMatch;
  });

  if (filteredCalls.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">No matches found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredCalls.map(call => `
    <tr>
      <td style="font-weight: 500;">${call.profiles?.email || 'N/A'}</td>
      <td style="color: var(--text-secondary);">${formatDate(call.start_time || call.created_at)}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-coral);"></div>
          ${call.assistant_name || 'N/A'}
        </div>
      </td>
      <td style="font-family: monospace;">${call.customer_phone_number || 'N/A'}</td>
      <td><span class="badge" style="background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-color);">${formatDuration(call.duration_seconds)}</span></td>
      <td style="font-weight: 600;">${formatCurrency(call.cost_usd)}</td>
      <td>
        <span class="badge" style="
          background: ${call.ended_reason === 'customer-ended-call' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
          color: ${call.ended_reason === 'customer-ended-call' ? 'var(--color-green)' : 'var(--color-orange)'};
          border: 1px solid ${call.ended_reason === 'customer-ended-call' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'};
        ">
          ${(call.ended_reason || 'Success').replace(/-/g, ' ')}
        </span>
      </td>
    </tr>
  `).join('');
}

// Edit User
window.editUser = function (userId, email, currentOrgId, minutesLimit) {
  document.getElementById('edit-user-id').value = userId;
  document.getElementById('edit-email').value = email;
  document.getElementById('edit-org-id').value = currentOrgId;
  document.getElementById('edit-minutes-limit').value = minutesLimit || 100;
  document.getElementById('edit-user-modal').classList.remove('hidden');
};

// Close edit modal
window.closeEditUserModal = function (event) {
  if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('modal-close')) {
    document.getElementById('edit-user-modal').classList.add('hidden');
  }
};

// Handle user update
async function handleUserUpdate(e) {
  e.preventDefault();

  const userId = document.getElementById('edit-user-id').value;
  const newOrgId = document.getElementById('edit-org-id').value;
  const newMinutesLimit = parseInt(document.getElementById('edit-minutes-limit').value);

  const { error } = await window.supabaseClient
    .from('profiles')
    .update({
      org_id: newOrgId || null,
      total_minutes_limit: newMinutesLimit
    })
    .eq('id', userId);

  if (error) {
    showToast('Failed to update user: ' + error.message, 'error');
    return;
  }

  showToast('User details updated successfully!', 'success');
  closeEditUserModal();
  loadUsers();
}
