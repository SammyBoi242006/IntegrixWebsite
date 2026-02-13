// Dashboard Page - Main call tracking interface with metrics and calls table
import { formatDate, formatDuration, formatCurrency, formatNumber, showToast, getDateRange } from './utils.js';

let callsSubscription = null;
let currentCalls = [];
let dateRangeDays = 30;

export function renderDashboard() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1 style="margin-bottom: 0.5rem;">Call Dashboard</h1>
          <p class="text-muted">Track and analyze your VAPI call data</p>
        </div>
        
        <div class="filters">
          <div class="filter-group">
            <label for="date-range">Date Range</label>
            <select id="date-range" onchange="handleDateRangeChange(this.value)">
              <option value="7">Last 7 days</option>
              <option value="30" selected>Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Metrics Cards -->
      <div class="metrics-grid" id="metrics-grid">
        <div class="metric-card green">
          <div class="metric-label">Total Call Minutes</div>
          <div class="metric-value" id="metric-minutes">-</div>
          <div class="metric-trend">Loading...</div>
        </div>
        
        <div class="metric-card orange">
          <div class="metric-label">Number of Calls</div>
          <div class="metric-value" id="metric-count">-</div>
          <div class="metric-trend">Loading...</div>
        </div>
        
        <div class="metric-card purple">
          <div class="metric-label">Total Spent</div>
          <div class="metric-value" id="metric-spent">-</div>
          <div class="metric-trend">Loading...</div>
        </div>
        
        <div class="metric-card blue">
          <div class="metric-label">Average Cost per Call</div>
          <div class="metric-value" id="metric-avg">-</div>
          <div class="metric-trend">Loading...</div>
        </div>
      </div>
      
      <!-- Calls Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Assistant</th>
              <th>Customer Number</th>
              <th>Duration</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="calls-table-body">
            <tr>
              <td colspan="7" class="text-center">Loading calls...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Transcript Modal -->
    <div id="transcript-modal" class="modal-overlay hidden" onclick="closeTranscriptModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Call Transcript</h2>
          <button class="modal-close" onclick="closeTranscriptModal()">&times;</button>
        </div>
        <div id="transcript-content" style="white-space: pre-wrap; line-height: 1.8; color: var(--color-text-secondary);"></div>
      </div>
    </div>
  `;

  // Load calls
  loadCalls();

  // Subscribe to real-time updates
  subscribeToCallUpdates();
}

// Load calls from database
async function loadCalls() {
  const user = window.appState.getCurrentUser();
  const { start, end } = getDateRange(dateRangeDays);

  const { data: calls, error } = await window.supabaseClient
    .from('calls')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load calls: ' + error.message, 'error');
    return;
  }

  currentCalls = calls || [];
  updateMetrics();
  renderCallsTable();
}

// Update metrics
function updateMetrics() {
  const totalMinutes = currentCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / 60;
  const totalCost = currentCalls.reduce((sum, call) => sum + parseFloat(call.cost_usd || 0), 0);
  const avgCost = currentCalls.length > 0 ? totalCost / currentCalls.length : 0;

  document.getElementById('metric-minutes').textContent = formatNumber(totalMinutes);
  document.getElementById('metric-count').textContent = formatNumber(currentCalls.length);
  document.getElementById('metric-spent').textContent = formatCurrency(totalCost);
  document.getElementById('metric-avg').textContent = formatCurrency(avgCost);

  // Update trends
  document.querySelectorAll('.metric-trend').forEach(el => {
    el.textContent = `Last ${dateRangeDays} days`;
  });
}

// Render calls table
function renderCallsTable() {
  const tbody = document.getElementById('calls-table-body');

  if (currentCalls.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No calls found for this period</td></tr>';
    return;
  }

  tbody.innerHTML = currentCalls.map(call => `
    <tr>
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
      <td>
        ${call.transcript ? `<button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="viewTranscript('${call.call_id}')">View Transcript</button>` : '<span class="text-muted">No transcript</span>'}
      </td>
    </tr>
  `).join('');
}

// Subscribe to real-time call updates
function subscribeToCallUpdates() {
  const user = window.appState.getCurrentUser();

  // Unsubscribe from previous subscription if exists
  if (callsSubscription) {
    callsSubscription.unsubscribe();
  }

  // Subscribe to new calls
  callsSubscription = window.supabaseClient
    .channel('calls-channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'calls',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      showToast('New call received!', 'success');
      loadCalls(); // Reload calls
    })
    .subscribe();
}

// Handle date range change
window.handleDateRangeChange = function (days) {
  dateRangeDays = parseInt(days);
  loadCalls();
};

// View transcript
window.viewTranscript = function (callId) {
  const call = currentCalls.find(c => c.call_id === callId);
  if (!call || !call.transcript) return;

  document.getElementById('transcript-content').textContent = call.transcript;
  document.getElementById('transcript-modal').classList.remove('hidden');
};

// Close transcript modal
window.closeTranscriptModal = function (event) {
  if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('modal-close')) {
    document.getElementById('transcript-modal').classList.add('hidden');
  }
};

// Cleanup on route change
export function cleanupDashboard() {
  if (callsSubscription) {
    callsSubscription.unsubscribe();
    callsSubscription = null;
  }
}
