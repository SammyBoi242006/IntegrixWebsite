// Campaigns Page - Outbound call management
import { formatDate, formatDuration, formatCurrency, showToast } from './utils.js';
import { CAMPAIGN_START_URL, CAMPAIGN_SCHEDULE_URL } from './config.js';

let campaignState = {
  contacts: [],
  currentCallIndex: -1,
  isRunning: false,
  results: [],
  scheduledTime: null,
  campaignId: null,
  campaignName: ''
};

export function renderCampaigns() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container" style="padding-top: 1rem;">
      <div class="dashboard-header" style="margin-bottom: 2rem;">
        <h1 style="margin-bottom: 0.5rem; letter-spacing: -1px; font-weight: 800;">Outbound Campaigns</h1>
        <p class="text-muted">Upload contacts and launch automated calling sequences</p>
      </div>

      <div class="metrics-grid">
        <!-- 1️⃣ CSV Upload Section -->
        <div class="card">
          <h2 style="margin-bottom: 1.5rem; font-size: 18px; font-weight: 700;">1. Upload Contacts</h2>
          <div id="drop-zone" class="upload-area" style="
            border: 2px dashed var(--border-color);
            border-radius: var(--radius-lg);
            padding: 40px 20px;
            text-align: center;
            cursor: pointer;
            transition: all var(--transition-normal);
            background: var(--bg-hover);
          ">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-coral); margin-bottom: 16px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p style="font-weight: 600; margin-bottom: 4px;">Drag & drop CSV or click to browse</p>
            <p class="text-muted" style="font-size: 13px;">Must contain a "phone" column</p>
            <input type="file" id="csv-input" accept=".csv" style="display: none;">
          </div>
          <div id="file-info" class="hidden" style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md); border: 1px solid rgba(16, 185, 129, 0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span id="file-name" style="font-weight: 600; font-size: 14px; color: var(--color-green);"></span>
              <span id="contact-count" class="badge" style="background: var(--color-green); color: white;">0 contacts</span>
            </div>
          </div>
        </div>

        <!-- 2️⃣ Campaign Control Section -->
        <div class="card">
          <h2 style="margin-bottom: 1.5rem; font-size: 18px; font-weight: 700;">2. Campaign Controls</h2>
          
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Start Now -->
            <div style="padding: 16px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); background: var(--bg-primary);">
              <h3 style="font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-coral);"></span>
                Immediate Launch
              </h3>
              <button id="start-btn" class="btn btn-primary" style="width: 100%;" disabled>Start Campaign Now</button>
            </div>

            <div style="text-align: center; font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">OR</div>

            <!-- Schedule -->
            <div style="padding: 16px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); background: var(--bg-primary);">
              <h3 style="font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-blue);"></span>
                Schedule for later
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div>
                  <label style="font-size: 11px;">Date</label>
                  <input type="date" id="schedule-date" style="padding: 8px;">
                </div>
                <div>
                  <label style="font-size: 11px;">Time</label>
                  <input type="time" id="schedule-time" style="padding: 8px;">
                </div>
              </div>
              <button id="schedule-btn" class="btn btn-secondary" style="width: 100%;" disabled>Schedule Campaign</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3️⃣ Live Call Status Display -->
      <div class="card" style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1.5rem; font-size: 18px; font-weight: 700;">3. Live Call Status</h2>
        <div id="live-status-container" style="
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-hover);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
        ">
          <div id="status-idle">
            <p>No active outbound campaign</p>
          </div>
          <div id="status-active" class="hidden" style="width: 100%; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <p class="text-muted" style="font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Currently Dialing</p>
                <h3 id="active-phone" style="font-size: 24px; font-family: monospace;">-</h3>
              </div>
              <div style="text-align: right;">
                <p class="text-muted" style="font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Status</p>
                <div id="active-step" style="font-weight: 800; color: var(--color-coral); display: flex; align-items: center; gap: 8px; justify-content: flex-end;">
                  <span class="pulse-dot"></span>
                  DIALING...
                </div>
              </div>
            </div>
            
            <div class="progress-bar-container" style="height: 8px; background: var(--bg-primary); border-radius: 4px; overflow: hidden;">
              <div id="campaign-progress" style="width: 0%; height: 100%; background: var(--color-coral); transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4️⃣ Campaign Results -->
      <div class="card" style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1.5rem; font-size: 18px; font-weight: 700;">4. Campaign Session Results</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Time</th>
                <th>Outcome</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody id="report-table-body">
              <tr>
                <td colspan="6" class="text-center text-muted" style="padding: 2rem;">No results in this session</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 5️⃣ Campaign History -->
      <div class="card" style="margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 18px; font-weight: 700;">Campaign History</h2>
          <button class="btn-secondary" onclick="loadCampaignHistory()" style="padding: 4px 12px; font-size: 12px;">Refresh</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Contacts</th>
                <th>Success/Fail</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="history-table-body">
              <tr>
                <td colspan="6" class="text-center text-muted" style="padding: 2rem;">Loading history...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Campaign Details Modal -->
    <div id="campaign-details-modal" class="modal-overlay hidden" onclick="closeCampaignDetailsModal(event)">
      <div class="modal" onclick="event.stopPropagation()" style="max-width: 900px;">
        <div class="modal-header" style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
          <div>
             <h2 class="modal-title" id="campaign-modal-title">Campaign Details</h2>
             <p class="text-muted" id="campaign-modal-subtitle" style="font-size: 13px;"></p>
          </div>
          <button class="modal-close" onclick="closeCampaignDetailsModal()">&times;</button>
        </div>
        
        <div class="table-container" style="max-height: 60vh; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Duration</th>
                <th>Cost</th>
                <th>Outcome</th>
                <th>Details</th>
                 <th>Actions</th>
              </tr>
            </thead>
            <tbody id="campaign-calls-body">
              <tr>
                <td colspan="7" class="text-center">Loading calls...</td>
              </tr>
            </tbody>
          </table>
        </div>
    <!-- Delete Confirmation Modal -->
    <div id="confirm-modal" class="modal-overlay hidden" onclick="closeConfirmModal(event)">
      <div class="modal modal-confirm" onclick="event.stopPropagation()">
        <div style="margin-bottom: 1.5rem;">
          <div style="width: 48px; height: 48px; background: rgba(220, 38, 38, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3 style="margin-bottom: 0.5rem; font-size: 18px; font-weight: 700;">Confirm Deletion</h3>
          <p class="text-muted" id="confirm-message">Are you sure you want to delete this item?</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-cancel" onclick="closeConfirmModal()">Cancel</button>
          <button id="confirm-btn" class="btn btn-danger">Delete Record</button>
        </div>
      </div>
    </div>
  `;

  setupEventListeners();
  loadCampaignHistory();
  // Restore results if any from current session
  if (campaignState.results.length > 0) {
    updateReportTable();
  }
}

function setupEventListeners() {
  const dropZone = document.getElementById('drop-zone');
  const csvInput = document.getElementById('csv-input');
  const startBtn = document.getElementById('start-btn');
  const scheduleBtn = document.getElementById('schedule-btn');

  dropZone.onclick = () => csvInput.click();

  dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--color-coral)';
    dropZone.style.background = 'rgba(255, 107, 107, 0.05)';
  };

  dropZone.ondragleave = () => {
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = 'var(--bg-hover)';
  };

  dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = 'var(--bg-hover)';
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  csvInput.onchange = (e) => {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  };

  startBtn.onclick = startCampaign;
  scheduleBtn.onclick = scheduleCampaign;
}

function handleFile(file) {
  if (!file.name.endsWith('.csv')) {
    showToast('Please upload a .csv file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseCSV(text, file.name);
  };
  reader.readAsText(file);
}

function parseCSV(text, filename) {
  // Split by any newline character (\r\n or \n)
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
  if (lines.length < 2) {
    showToast('CSV is empty or missing data', 'error');
    return;
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const phoneIndex = headers.indexOf('phone');

  if (phoneIndex === -1) {
    showToast('Missing "phone" column in CSV', 'error');
    return;
  }

  const contacts = lines.slice(1).map(line => {
    const cols = line.split(',');
    return cols[phoneIndex]?.trim();
  }).filter(p => p);

  if (contacts.length === 0) {
    showToast('No valid phone numbers found', 'error');
    return;
  }

  campaignState.contacts = contacts;
  campaignState.campaignName = filename.replace('.csv', '');

  // Update UI
  document.getElementById('file-info').classList.remove('hidden');
  document.getElementById('file-name').textContent = filename;
  document.getElementById('contact-count').textContent = `${contacts.length} contacts`;
  document.getElementById('start-btn').disabled = false;
  document.getElementById('schedule-btn').disabled = false;

  showToast(`Successfully parsed ${contacts.length} contacts`, 'success');
}

async function startCampaign() {
  if (campaignState.isRunning) return;

  const user = window.appState.getCurrentUser();
  if (!user) return;

  // Save campaign to database first
  try {
    const { data, error } = await window.supabaseClient
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: campaignState.campaignName || `Campaign - ${new Date().toLocaleString()}`,
        status: 'running',
        total_contacts: campaignState.contacts.length
      })
      .select()
      .single();

    if (error) throw error;
    campaignState.campaignId = data.id;
  } catch (error) {
    console.error('Failed to save campaign:', error);
    showToast('Failed to initialize campaign in database', 'error');
    // We continue anyway, but history won't work
  }

  campaignState.isRunning = true;
  campaignState.currentCallIndex = 0;
  campaignState.results = [];

  document.getElementById('start-btn').disabled = true;
  document.getElementById('schedule-btn').disabled = true;
  document.getElementById('status-idle').classList.add('hidden');
  document.getElementById('status-active').classList.remove('hidden');

  processNextCall();
}

async function processNextCall() {
  if (campaignState.currentCallIndex >= campaignState.contacts.length) {
    finishCampaign();
    return;
  }

  const phoneNumber = campaignState.contacts[campaignState.currentCallIndex];
  const userProfile = window.appState.getUserProfile();

  if (!userProfile?.vapi_api_key || !userProfile?.vapi_assistant_id) {
    showToast('Please configure your VAPI API Key and Assistant ID in your Profile first.', 'error');
    campaignState.isRunning = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('schedule-btn').disabled = false;
    return;
  }

  const vapiConfig = {
    apiKey: userProfile.vapi_api_key,
    assistantId: userProfile.vapi_assistant_id,
    phoneNumberId: userProfile.vapi_phone_number_id
  };

  updateLiveStatus(phoneNumber, 'dialing');

  try {
    // Get session for auth headers
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) throw new Error('No active session');

    // Call real Edge Function with Auth headers via official invoke method
    const { data, error: invokeError } = await window.supabaseClient.functions.invoke('campaign-start', {
      body: {
        phoneNumber,
        assistantId: vapiConfig.assistantId,
        phoneNumberId: vapiConfig.phoneNumberId,
        apiKey: vapiConfig.apiKey,
        userId: userProfile.id,
        orgId: userProfile.org_id,
        campaignId: campaignState.campaignId // Pass campaignId
      }
    });

    if (invokeError) {
      throw new Error(invokeError.message || 'Failed to trigger call');
    }

    // Call triggered successfully, updating UI to ringing
    updateLiveStatus(phoneNumber, 'ringing');
    await new Promise(r => setTimeout(r, 2000));

    updateLiveStatus(phoneNumber, 'answered');
    await new Promise(r => setTimeout(r, 3000));

    const result = {
      phone: phoneNumber,
      status: 'completed',
      duration: 'Pending...',
      timestamp: new Date().toISOString(),
      outcome: 'Success',
      campaignId: data.callId ? 'VAPI-' + data.callId.slice(-6) : 'N/A'
    };

    campaignState.results.unshift(result);
    updateReportTable();
    updateCampaignProgress();

    updateLiveStatus(phoneNumber, 'completed');
    await new Promise(r => setTimeout(r, 1000));

    campaignState.currentCallIndex++;
    processNextCall();

  } catch (error) {
    console.error('Campaign Error:', error);
    showToast(`Call to ${phoneNumber} failed: ${error.message}`, 'error');

    campaignState.results.unshift({
      phone: phoneNumber,
      status: 'failed',
      duration: '0s',
      timestamp: new Date().toISOString(),
      outcome: 'Error',
      campaignId: 'FAIL'
    });
    updateReportTable();
    updateCampaignProgress();

    campaignState.currentCallIndex++;
    processNextCall();
  }
}

function updateLiveStatus(phone, step) {
  document.getElementById('active-phone').textContent = phone;

  const stepEl = document.getElementById('active-step');
  stepEl.innerHTML = `<span class="pulse-dot"></span> ${step.toUpperCase()}...`;

  switch (step) {
    case 'dialing': stepEl.style.color = 'var(--text-secondary)'; break;
    case 'ringing': stepEl.style.color = 'var(--color-orange)'; break;
    case 'answered': stepEl.style.color = 'var(--color-green)'; break;
    case 'failed': stepEl.style.color = '#ef4444'; break;
    case 'completed': stepEl.style.color = 'var(--color-blue)'; break;
  }
}

function updateCampaignProgress() {
  const total = campaignState.contacts.length;
  if (total === 0) return;

  const current = campaignState.currentCallIndex + 1;
  const percent = Math.round((current / total) * 100);

  const progressEl = document.getElementById('campaign-progress');
  if (progressEl) progressEl.style.width = `${percent}%`;
}

function updateReportTable() {
  const tbody = document.getElementById('report-table-body');
  if (campaignState.results.length === 0) return;

  tbody.innerHTML = campaignState.results.map(res => `
    <tr>
      <td style="font-family: monospace; font-weight: 600;">${res.phone}</td>
      <td>
        <span class="badge" style="background: var(--bg-hover); color: var(--text-primary);">
          ${res.status}
        </span>
      </td>
      <td>${res.duration}</td>
      <td style="font-size: 13px; color: var(--text-secondary);">${formatDate(res.timestamp)}</td>
      <td>
        <span class="badge" style="
          background: ${res.outcome === 'Success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
          color: ${res.outcome === 'Success' ? 'var(--color-green)' : '#ef4444'};
        ">
          ${res.outcome}
        </span>
      </td>
      <td style="font-size: 12px; font-weight: 700; color: var(--text-muted);">${res.campaignId}</td>
    </tr>
  `).join('');
}

async function finishCampaign() {
  campaignState.isRunning = false;

  // Update campaign status in database
  if (campaignState.campaignId) {
    const successCount = campaignState.results.filter(r => r.outcome === 'Success').length;
    const failCount = campaignState.results.filter(r => r.outcome !== 'Success').length;

    await window.supabaseClient
      .from('campaigns')
      .update({
        status: 'completed',
        success_count: successCount,
        fail_count: failCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignState.campaignId);

    loadCampaignHistory(); // Refresh history
  }

  document.getElementById('status-active').classList.add('hidden');
  document.getElementById('status-idle').classList.remove('hidden');
  document.getElementById('status-idle').innerHTML = `
    <div style="text-align: center;">
      <p style="color: var(--color-green); font-weight: 700; margin-bottom: 12px; font-size: 18px;">Campaign Completed!</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="btn btn-secondary" onclick="resetCampaign()">Clear Session</button>
      </div>
    </div>
  `;
  showToast('Outbound campaign completed', 'success');
}

window.resetCampaign = () => {
  campaignState.contacts = [];
  campaignState.currentCallIndex = -1;
  document.getElementById('file-info').classList.add('hidden');
  document.getElementById('start-btn').disabled = true;
  document.getElementById('schedule-btn').disabled = true;
  document.getElementById('status-idle').innerHTML = '<p>No active outbound campaign</p>';
};

async function scheduleCampaign() {
  const date = document.getElementById('schedule-date').value;
  const time = document.getElementById('schedule-time').value;

  if (!date || !time) {
    showToast('Please select date and time', 'warning');
    return;
  }

  const timestamp = new Date(`${date}T${time}`).getTime();
  if (timestamp < Date.now()) {
    showToast('Scheduled time must be in the future', 'error');
    return;
  }

  const userProfile = window.appState.getUserProfile();

  if (!userProfile?.vapi_api_key || !userProfile?.vapi_assistant_id) {
    showToast('Please configure your VAPI credentials in your Profile first.', 'error');
    return;
  }

  const vapiConfig = {
    apiKey: userProfile.vapi_api_key,
    assistantId: userProfile.vapi_assistant_id,
    phoneNumberId: userProfile.vapi_phone_number_id
  };

  showToast('Scheduling campaign...', 'info');

  try {
    // Save to database as scheduled
    const user = window.appState.getCurrentUser();
    const { data: insertedCampaign, error } = await window.supabaseClient
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: campaignState.campaignName || `Scheduled Campaign - ${new Date(timestamp).toLocaleString()}`,
        status: 'scheduled',
        total_contacts: campaignState.contacts.length,
        scheduled_at: new Date(timestamp).toISOString()
      })
      .select().single();

    if (error) throw error;

    // Call real Edge Function with Auth headers via official invoke method
    const { data, error: invokeError } = await window.supabaseClient.functions.invoke('campaign-schedule', {
      body: {
        contacts: campaignState.contacts,
        assistantId: vapiConfig.assistantId,
        phoneNumberId: vapiConfig.phoneNumberId,
        apiKey: vapiConfig.apiKey,
        orgId: userProfile.org_id,
        name: campaignState.campaignName || `Scheduled - ${date} ${time}`,
        scheduledAt: new Date(timestamp).toISOString(),
        campaignId: insertedCampaign.id
      }
    });

    if (invokeError) throw new Error(invokeError.message || 'Failed to schedule');

    showToast(`Campaign scheduled successfully! ID: ${data.campaignId}`, 'success');
    loadCampaignHistory(); // Refresh history
  } catch (error) {
    console.error('Schedule Error:', error);
    showToast(`Scheduling failed: ${error.message}`, 'error');
  }
}

// Load Campaign History from Database
async function loadCampaignHistory() {
  const user = window.appState.getCurrentUser();
  if (!user) return;

  const { data: history, error } = await window.supabaseClient
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-error">Error loading history: ${error.message}</td></tr>`;
    return;
  }

  if (history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No campaign history found</td></tr>';
    return;
  }

  tbody.innerHTML = history.map(camp => `
    <tr>
      <td style="font-weight: 600;">
        <div style="display: flex; align-items: center; gap: 8px;">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-orange);"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
           ${camp.name}
        </div>
      </td>
      <td>
        <span class="badge" style="
          background: ${camp.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : camp.status === 'running' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
          color: ${camp.status === 'completed' ? 'var(--color-green)' : camp.status === 'running' ? 'var(--color-blue)' : 'var(--color-orange)'};
        ">
          ${camp.status.toUpperCase()}
        </span>
      </td>
      <td>${camp.total_contacts}</td>
      <td>
        <span style="color: var(--color-green);">${camp.success_count}</span> / 
        <span style="color: #ef4444;">${camp.fail_count}</span>
      </td>
      <td style="font-size: 13px; color: var(--text-secondary);">${formatDate(camp.created_at)}</td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; border-radius: 6px;" onclick="viewCampaignDetails('${camp.id}', '${camp.name}')">
            OPEN
          </button>
          ${window.appState.isAdmin() ? `
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; border-radius: 6px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="deleteCampaign('${camp.id}')">
            DELETE
          </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

window.loadCampaignHistory = loadCampaignHistory;

window.viewCampaignDetails = async function (campaignId, campaignName) {
  const modal = document.getElementById('campaign-details-modal');
  const tbody = document.getElementById('campaign-calls-body');
  document.getElementById('campaign-modal-title').textContent = campaignName;
  document.getElementById('campaign-modal-subtitle').textContent = 'Loading call records...';

  modal.classList.remove('hidden');

  const { data: calls, error } = await window.supabaseClient
    .from('calls')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load campaign calls: ' + error.message, 'error');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-error">Error loading calls</td></tr>';
    return;
  }

  document.getElementById('campaign-modal-subtitle').textContent = `Showing ${calls.length} calls related to this campaign`;

  if (calls.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">No calls recorded for this campaign yet.</td></tr>';
    return;
  }

  tbody.innerHTML = calls.map(call => `
    <tr>
      <td style="font-weight: 500;">${formatDate(call.start_time || call.created_at)}</td>
      <td style="color: var(--text-secondary); font-family: monospace;">${call.customer_phone_number || 'Restricted'}</td>
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
      <td>
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; border-radius: 100px; font-weight: 700;" onclick="viewTranscript('${call.call_id}')">
          ANALYZE
        </button>
      </td>
      <td>
        ${window.appState.isAdmin() ? `
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; border-radius: 100px; font-weight: 700; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="deleteCallFromCampaign('${call.call_id}', '${campaignId}', '${campaignName}')">
          DELETE
        </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
};

window.closeCampaignDetailsModal = function (event) {
  if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('modal-close')) {
    document.getElementById('campaign-details-modal').classList.add('hidden');
  }
};

// Helper to close confirm modal
window.closeConfirmModal = function (event) {
  if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('btn-cancel')) {
    document.getElementById('confirm-modal').classList.add('hidden');
  }
};

window.deleteCampaign = function (campaignId) {
  const modal = document.getElementById('confirm-modal');
  const confirmBtn = document.getElementById('confirm-btn');
  const message = document.getElementById('confirm-message');

  message.textContent = 'Are you sure you want to delete this campaign? This action cannot be undone.';

  confirmBtn.onclick = async function () {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
      const { error } = await window.supabaseClient
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      showToast('Campaign deleted', 'success');
      loadCampaignHistory();
      closeConfirmModal();
    } catch (error) {
      showToast('Failed to delete campaign: ' + error.message, 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Record';
    }
  };

  modal.classList.remove('hidden');
};

window.deleteCallFromCampaign = function (callId, campaignId, campaignName) {
  const modal = document.getElementById('confirm-modal');
  const confirmBtn = document.getElementById('confirm-btn');
  const message = document.getElementById('confirm-message');

  message.textContent = 'Are you sure you want to delete this call record?';

  confirmBtn.onclick = async function () {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
      const { error } = await window.supabaseClient
        .from('calls')
        .delete()
        .eq('call_id', callId);

      if (error) throw error;

      showToast('Call deleted', 'success');
      // Refresh the modal view
      viewCampaignDetails(campaignId, campaignName);
      closeConfirmModal();
    } catch (error) {
      showToast('Failed to delete call type: ' + error.message, 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Record';
    }
  };

  modal.classList.remove('hidden');
};

// Utility to simulate call for demonstration (Optional, logic now uses real API)
async function simulateCall(phone) {
  await new Promise(r => setTimeout(r, 2000));
  return {
    success: true,
    duration: Math.floor(Math.random() * 60 + 10) + 's'
  };
}

export function cleanupCampaigns() {
  campaignState.isRunning = false;
}
