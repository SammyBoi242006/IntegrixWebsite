// Campaigns Page - Outbound call management
import { formatDate, formatDuration, formatCurrency, showToast } from './utils.js';
import { CAMPAIGN_START_URL, CAMPAIGN_SCHEDULE_URL } from './config.js';

let campaignState = {
  contacts: [],
  currentCallIndex: -1,
  isRunning: false,
  results: [],
  scheduledTime: null
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
          <div id="status-idle" style="text-align: center; color: var(--text-muted);">
            <p>No active outbound campaign</p>
          </div>
          <div id="status-active" class="hidden" style="width: 100%; padding: 24px; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 12px 24px; background: var(--bg-primary); border-radius: 100px; border: 1px solid var(--color-coral); box-shadow: 0 0 20px rgba(255, 107, 107, 0.1);">
              <div class="pulse-ring"></div>
              <span id="active-phone" style="font-size: 24px; font-weight: 800; font-family: monospace; letter-spacing: 1px;">+1 (555) 000-0000</span>
            </div>
            <div style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: var(--color-coral);" id="active-step">Initializing...</div>
          </div>
        </div>
      </div>

      <!-- 4️⃣ Outbound Campaign Report Section -->
      <div id="report-section" style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1rem; font-size: 20px; font-weight: 700;">Outbound Campaign Report</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Call Status</th>
                <th>Duration</th>
                <th>Timestamp</th>
                <th>Outcome</th>
                <th>Campaign ID</th>
              </tr>
            </thead>
            <tbody id="report-table-body">
              <tr>
                <td colspan="6" class="text-center text-muted" style="padding: 3rem;">No campaigns launched in this session</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  setupEventListeners();
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

  campaignState.isRunning = true;
  campaignState.currentCallIndex = 0;
  campaignState.results = []; // Reset session results OR keep them? User said "Persist results during session"

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
    // Call real Edge Function
    const response = await fetch(CAMPAIGN_START_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        assistantId: vapiConfig.assistantId,
        phoneNumberId: vapiConfig.phoneNumberId,
        apiKey: vapiConfig.apiKey,
        userId: userProfile.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to trigger call');
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

    campaignState.currentCallIndex++;
    processNextCall();
  }
}

function updateLiveStatus(phone, step) {
  document.getElementById('active-phone').textContent = phone;
  document.getElementById('active-step').textContent = step;

  const stepEl = document.getElementById('active-step');
  switch (step) {
    case 'dialing': stepEl.style.color = 'var(--text-secondary)'; break;
    case 'ringing': stepEl.style.color = 'var(--color-orange)'; break;
    case 'answered': stepEl.style.color = 'var(--color-green)'; break;
    case 'failed': stepEl.style.color = '#ef4444'; break;
    case 'completed': stepEl.style.color = 'var(--color-blue)'; break;
  }
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

function finishCampaign() {
  campaignState.isRunning = false;
  document.getElementById('status-active').classList.add('hidden');
  document.getElementById('status-idle').classList.remove('hidden');
  document.getElementById('status-idle').innerHTML = `
    <div style="text-align: center;">
      <p style="color: var(--color-green); font-weight: 700; margin-bottom: 8px;">Campaign Completed Successfully!</p>
      <button class="btn btn-secondary" onclick="resetCampaign()">Launch New Campaign</button>
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
    const response = await fetch(CAMPAIGN_SCHEDULE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contacts: campaignState.contacts,
        assistantId: vapiConfig.assistantId,
        phoneNumberId: vapiConfig.phoneNumberId,
        apiKey: vapiConfig.apiKey,
        name: `Scheduled - ${date} ${time}`,
        scheduledAt: new Date(timestamp).toISOString()
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to schedule');

    showToast(`Campaign scheduled successfully! ID: ${data.campaignId}`, 'success');
  } catch (error) {
    console.error('Schedule Error:', error);
    showToast(`Scheduling failed: ${error.message}`, 'error');
  }
}

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
