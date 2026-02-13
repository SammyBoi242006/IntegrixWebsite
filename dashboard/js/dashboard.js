// Dashboard Page - Main call tracking interface with metrics and calls table
import { formatDate, formatDuration, formatCurrency, formatNumber, showToast, getDateRange } from './utils.js';

let callsSubscription = null;
let currentCalls = [];
let dateRangeDays = 30;
let charts = {};

export function renderDashboard() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1 style="margin-bottom: 0.5rem; letter-spacing: -1px; font-weight: 800;">Analytics Dashboard</h1>
          <p class="text-muted">Real-time performance metrics</p>
        </div>
        
        <div class="filters">
          <div class="filter-group">
            <label for="date-range">Timeframe</label>
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
        <div class="metric-card">
          <div class="metric-label">Call Minutes</div>
          <div class="metric-value" id="metric-minutes">-</div>
          <div class="sparkline-container">
            <canvas id="chart-minutes"></canvas>
          </div>
          <div class="metric-trend">
            <span>Volume</span>
            <span id="trend-minutes-sub">Loading...</span>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Calls count</div>
          <div class="metric-value" id="metric-count">-</div>
          <div class="sparkline-container">
            <canvas id="chart-count"></canvas>
          </div>
          <div class="metric-trend">
            <span>Activity</span>
            <span id="trend-count-sub">Loading...</span>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Total Spent</div>
          <div class="metric-value" id="metric-spent">-</div>
          <div class="sparkline-container">
            <canvas id="chart-spent"></canvas>
          </div>
          <div class="metric-trend">
            <span>Investment</span>
            <span id="trend-spent-sub">Loading...</span>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-label">Efficiency (Avg)</div>
          <div class="metric-value" id="metric-avg">-</div>
          <div class="sparkline-container">
            <canvas id="chart-avg"></canvas>
          </div>
          <div class="metric-trend">
            <span>Cost Efficiency</span>
            <span id="trend-avg-sub">Loading...</span>
          </div>
        </div>
      </div>
      
      <!-- Calls Table -->
      <h2 style="margin-bottom: 1rem; font-size: 20px; font-weight: 700;">Recent Call Logs</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Assistant</th>
              <th>Customer</th>
              <th>Duration</th>
              <th>Cost</th>
              <th>Outcome</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody id="calls-table-body">
            <tr>
              <td colspan="7" class="text-center">Loading call records...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Transcript Modal -->
    <div id="transcript-modal" class="modal-overlay hidden" onclick="closeTranscriptModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Interaction Record</h2>
          <button class="modal-close" onclick="closeTranscriptModal()">&times;</button>
        </div>
        
        <!-- Audio Player Section -->
        <div id="audio-player-container" style="margin-bottom: 24px; padding: 20px; background: var(--bg-hover); border-radius: var(--radius-lg); border: 1px solid var(--border-color);" class="hidden">
          <div style="font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            Interaction Recording
          </div>
          
          <!-- Waveform Container -->
          <div id="waveform" style="margin-bottom: 16px;"></div>
          
          <div style="display: flex; align-items: center; gap: 16px;">
            <button id="play-pause" class="btn-secondary" style="width: 36px; height: 36px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center;">
              <svg id="play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
              <svg id="pause-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="hidden"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
            </button>
            <div id="audio-time" style="font-size: 12px; font-family: monospace; color: var(--text-secondary);">0:00 / 0:00</div>
          </div>

          <audio id="modal-audio-player" class="hidden">
            Your browser does not support the audio element.
          </audio>
        </div>

        <div id="transcript-content" style="white-space: pre-wrap; line-height: 1.8; color: var(--text-secondary); font-size: 15px;"></div>
      </div>
    </div>
  `;

  // Load calls
  loadCalls();

  // Subscribe to real-time updates
  subscribeToCallUpdates();

  // Listen for theme changes to update charts
  window.addEventListener('themechanged', handleThemeChange);
}

function handleThemeChange() {
  // Redraw all charts with new theme colors
  updateMetrics();
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

// Update metrics and charts
function updateMetrics() {
  const totalMinutes = currentCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / 60;
  const totalCost = currentCalls.reduce((sum, call) => sum + parseFloat(call.cost_usd || 0), 0);
  const avgCost = currentCalls.length > 0 ? totalCost / currentCalls.length : 0;

  document.getElementById('metric-minutes').textContent = formatNumber(totalMinutes);
  document.getElementById('metric-count').textContent = formatNumber(currentCalls.length);
  document.getElementById('metric-spent').textContent = formatCurrency(totalCost);
  document.getElementById('metric-avg').textContent = formatCurrency(avgCost);

  // Update trend labels
  const timeframeLabel = `Last ${dateRangeDays}D`;
  document.getElementById('trend-minutes-sub').textContent = timeframeLabel;
  document.getElementById('trend-count-sub').textContent = timeframeLabel;
  document.getElementById('trend-spent-sub').textContent = timeframeLabel;
  document.getElementById('trend-avg-sub').textContent = timeframeLabel;

  // Process data for charts
  renderSparklines();
}

function renderSparklines() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-coral').trim();

  // Group calls by date for charts
  const historyData = processHistoryData();

  const chartConfigs = [
    { id: 'chart-minutes', data: historyData.map(d => d.minutes), color: '#10b981' },
    { id: 'chart-count', data: historyData.map(d => d.count), color: '#3b82f6' },
    { id: 'chart-spent', data: historyData.map(d => d.spent), color: '#8b5cf6' },
    { id: 'chart-avg', data: historyData.map(d => d.avg), color: '#f59e0b' }
  ];

  chartConfigs.forEach(config => {
    const ctx = document.getElementById(config.id);
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (charts[config.id]) {
      charts[config.id].destroy();
    }

    charts[config.id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: historyData.map(d => d.date),
        datasets: [{
          data: config.data,
          borderColor: config.color,
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          backgroundColor: hexToRgbA(config.color, 0.1),
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });
  });
}

function processHistoryData() {
  const dataMap = {};
  const { start } = getDateRange(dateRangeDays);

  // Initialize map with all dates in range
  for (let i = 0; i <= dateRangeDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    dataMap[dateStr] = { minutes: 0, count: 0, spent: 0, avg: 0 };
  }

  // Fill with actual data
  currentCalls.forEach(call => {
    const dateStr = new Date(call.start_time || call.created_at).toISOString().split('T')[0];
    if (dataMap[dateStr]) {
      dataMap[dateStr].count += 1;
      dataMap[dateStr].minutes += (call.duration_seconds || 0) / 60;
      dataMap[dateStr].spent += parseFloat(call.cost_usd || 0);
    }
  });

  return Object.keys(dataMap).sort().map(date => {
    const day = dataMap[date];
    return {
      date,
      count: day.count,
      minutes: day.minutes,
      spent: day.spent,
      avg: day.count > 0 ? day.spent / day.count : 0
    };
  });
}

function hexToRgbA(hex, alpha) {
  let c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
  }
  return hex;
}

// Render calls table
export function renderCallsTable() {
  const tbody = document.getElementById('calls-table-body');
  if (!tbody) return;

  if (currentCalls.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding: 4rem;">No call records found for this period</td></tr>';
    return;
  }

  tbody.innerHTML = currentCalls.map(call => `
    <tr>
      <td style="font-weight: 500;">${formatDate(call.start_time || call.created_at)}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-coral);"></div>
          ${call.assistant_name || 'System Assistant'}
        </div>
      </td>
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
        <button class="btn-secondary" style="padding: 6px 14px; font-size: 11px; border-radius: 100px; font-weight: 700;" onclick="viewTranscript('${call.call_id}')">
          ${call.transcript ? 'ANALYZE' : 'NO LOGS'}
        </button>
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
      showToast('New call record processed', 'success');
      loadCalls(); // Reload calls
    })
    .subscribe();
}

// Global window functions for event handlers
window.handleDateRangeChange = function (days) {
  dateRangeDays = parseInt(days);
  loadCalls();
};

let wavesurfer = null;

window.viewTranscript = function (callId) {
  const call = currentCalls.find(c => c.call_id === callId);
  if (!call) return;

  // Handle Transcript
  document.getElementById('transcript-content').textContent = call.transcript || 'No transcript available for this call.';

  // Handle Audio Player & Waveform
  const audioContainer = document.getElementById('audio-player-container');
  const audioPlayer = document.getElementById('modal-audio-player');
  const timeDisplay = document.getElementById('audio-time');
  const playBtn = document.getElementById('play-pause');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');

  if (call.recording_url) {
    audioContainer.classList.remove('hidden');

    // Destroy existing wavesurfer if any
    if (wavesurfer) {
      wavesurfer.destroy();
    }

    // Initialize Wavesurfer
    wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'rgba(255, 107, 107, 0.2)',
      progressColor: '#ff6b6b',
      cursorColor: '#ff6b6b',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 60,
      normalize: true,
      url: call.recording_url,
    });

    wavesurfer.on('play', () => {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    });

    wavesurfer.on('pause', () => {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    });

    wavesurfer.on('timeupdate', (currentTime) => {
      const duration = wavesurfer.getDuration();
      timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    });

    wavesurfer.on('ready', () => {
      const duration = wavesurfer.getDuration();
      timeDisplay.textContent = `0:00 / ${formatTime(duration)}`;
    });

    playBtn.onclick = () => wavesurfer.playPause();

  } else {
    audioContainer.classList.add('hidden');
  }

  document.getElementById('transcript-modal').classList.remove('hidden');
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

window.closeTranscriptModal = function (event) {
  if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('modal-close')) {
    const modal = document.getElementById('transcript-modal');

    // Stop and destroy wavesurfer
    if (wavesurfer) {
      wavesurfer.destroy();
      wavesurfer = null;
    }

    modal.classList.add('hidden');
  }
};

// Cleanup on route change
export function cleanupDashboard() {
  window.removeEventListener('themechanged', handleThemeChange);
  if (callsSubscription) {
    callsSubscription.unsubscribe();
    callsSubscription = null;
  }
  // Cleanup charts
  Object.values(charts).forEach(chart => chart.destroy());
  charts = {};
}

