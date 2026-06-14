/* =========================================================================
   Automation Hub — Dashboard Page Logic
   ========================================================================= */

async function loadDashboardStats() {
  try {
    const stats = await api.get('/dashboard/stats');

    // API Status
    document.getElementById('stat-api-status').textContent = stats.apiStatus || 'Online';

    // n8n Status
    const n8nStatusEl = document.getElementById('stat-n8n-status');
    const n8nDetailEl = document.getElementById('stat-n8n-detail');
    n8nStatusEl.textContent = stats.n8nStatus || '—';

    if (stats.n8nStatus === 'Online') {
      n8nDetailEl.innerHTML =
        '<span class="status-dot status-dot--active"></span> Connected';
    } else {
      n8nDetailEl.innerHTML =
        '<span class="status-dot status-dot--inactive"></span> Unavailable';
    }

    // Workflows count
    const totalWorkflows = stats.totalWorkflows || 0;
    const activeWorkflows = stats.activeWorkflows || 0;
    document.getElementById('stat-workflows').textContent = totalWorkflows;
    document.getElementById('stat-workflows-detail').textContent =
      `${activeWorkflows} active, ${totalWorkflows - activeWorkflows} disabled`;

    // Uptime
    document.getElementById('stat-uptime').textContent = stats.uptime || '—';
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function loadN8nWorkflows() {
  try {
    const workflows = await api.get('/n8n/workflows');
    const tbody = document.getElementById('n8n-workflows-tbody');
    const table = document.getElementById('n8n-workflows-table');
    const emptyState = document.getElementById('n8n-workflows-empty');

    if (!workflows || workflows.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = workflows
      .map(
        (w) => `
      <tr>
        <td><strong>${escapeHtml(w.name)}</strong></td>
        <td><span class="badge badge--${w.active ? 'success' : 'warning'}">${
          w.active ? 'Active' : 'Inactive'
        }</span></td>
        <td>${w.createdAt ? timeAgo(w.createdAt) : '—'}</td>
        <td>${w.updatedAt ? timeAgo(w.updatedAt) : '—'}</td>
        <td>
          <button onclick="runWorkflow('${w.id}')" class="btn btn--sm btn--primary">▶ Run</button>
          <a href="http://localhost:5678/workflow/${escapeHtml(w.id)}" target="_blank" class="btn btn--sm btn--secondary">Edit ↗</a>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load n8n workflows:', err);
    const table = document.getElementById('n8n-workflows-table');
    const emptyState = document.getElementById('n8n-workflows-empty');
    if (table) table.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
  }
}

async function loadExecutions() {
  try {
    const executions = await api.get('/n8n/executions');
    const tbody = document.getElementById('executions-tbody');
    const table = document.getElementById('executions-table');
    const emptyState = document.getElementById('executions-empty');

    if (!executions || executions.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = executions
      .map(
        (ex) => {
          let badgeClass = 'secondary';
          if (ex.status === 'success') badgeClass = 'success';
          if (ex.status === 'error') badgeClass = 'danger';
          if (ex.status === 'running') badgeClass = 'info';

          const workflowId = ex.workflowData?.id || ex.workflowId || '';
          
          return `
          <tr>
            <td style="font-family: monospace;">#${ex.id}</td>
            <td><strong>${escapeHtml(ex.workflowData?.name || 'Unknown')}</strong></td>
            <td><span class="badge badge--${badgeClass}">${escapeHtml(ex.status)}</span></td>
            <td>${ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}</td>
            <td>${ex.runningTime ? ex.runningTime + 'ms' : '—'}</td>
            <td>
              <a href="http://localhost:5678/workflow/${workflowId}/executions/${ex.id}" target="_blank" class="btn btn--sm btn--secondary">View Logs ↗</a>
            </td>
          </tr>
          `;
        }
      )
      .join('');
  } catch (err) {
    console.error('Failed to load executions:', err);
    const table = document.getElementById('executions-table');
    const emptyState = document.getElementById('executions-empty');
    if (table) table.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
  }
}

async function runWorkflow(id) {
  try {
    showToast('Triggering workflow...', 'info');
    await api.post(`/n8n/workflows/${id}/run`);
    showToast('Workflow triggered successfully!', 'success');
    // Refresh executions table immediately
    setTimeout(loadExecutions, 1000);
  } catch (err) {
    showToast('Failed to trigger workflow', 'error');
  }
}

// ---------------------------------------------------------------------------
// Python Playground
// ---------------------------------------------------------------------------
async function executePythonScript() {
  const btn = document.getElementById('btn-run-python');
  const scriptInput = document.getElementById('python-script');
  const filenameInput = document.getElementById('python-filename');
  const resultsDiv = document.getElementById('python-results');
  const stdoutDiv = document.getElementById('python-stdout');
  const stderrDiv = document.getElementById('python-stderr');
  const downloadBtn = document.getElementById('python-download-btn');

  const script = scriptInput.value.trim();
  const filename = filenameInput.value.trim() || 'postgres_export.csv';

  if (!script) {
    showToast('Please enter a Python script', 'error');
    return;
  }

  btn.textContent = '⏳ Executing...';
  btn.disabled = true;
  resultsDiv.style.display = 'none';

  try {
    const response = await api.post('/n8n/webhook/run-python', {
      script,
      filename
    });

    resultsDiv.style.display = 'block';
    
    if (response.stdout) {
      stdoutDiv.textContent = response.stdout;
      stdoutDiv.style.display = 'block';
    } else {
      stdoutDiv.textContent = 'No standard output';
    }

    if (response.stderr) {
      stderrDiv.textContent = response.stderr;
      stderrDiv.style.display = 'block';
    } else {
      stderrDiv.style.display = 'none';
    }

    if (response.downloadUrl) {
      downloadBtn.href = response.downloadUrl;
      downloadBtn.style.display = 'inline-block';
    } else {
      downloadBtn.style.display = 'none';
    }

    showToast('Script executed successfully!', 'success');
  } catch (err) {
    showToast('Execution failed. Make sure the python_executor workflow is imported and active in n8n!', 'error');
    console.error(err);
  } finally {
    btn.textContent = '🚀 Execute Script';
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Python Backend Data Fetching
// ---------------------------------------------------------------------------

async function seedFakeData() {
  const btn = document.getElementById('btn-seed-data');
  if (!btn) return;
  const originalText = btn.textContent;
  btn.textContent = '⏳ Seeding...';
  btn.disabled = true;

  try {
    const response = await fetch('http://localhost:8000/api/seed', { method: 'POST' });
    if (!response.ok) throw new Error('Seeding failed');
    showToast('Successfully seeded fake data!', 'success');
    loadPythonUsers();
    loadPythonEvents();
  } catch (err) {
    console.error('Failed to seed data:', err);
    showToast('Failed to seed fake data. Ensure Python backend is running.', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function loadPythonUsers() {
  try {
    const response = await fetch('http://localhost:8000/api/users');
    if (!response.ok) throw new Error('Failed to fetch');
    const users = await response.json();
    
    const tbody = document.getElementById('users-tbody');
    const table = document.getElementById('users-table');
    const emptyState = document.getElementById('users-empty');

    if (!users || users.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>#${u.id}</td>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge badge--${u.role === 'admin' ? 'danger' : 'info'}">${escapeHtml(u.role)}</span></td>
        <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load users from python backend:', err);
  }
}

async function loadPythonEvents() {
  try {
    const response = await fetch('http://localhost:8000/api/events');
    if (!response.ok) throw new Error('Failed to fetch');
    const events = await response.json();
    
    const tbody = document.getElementById('events-tbody');
    const table = document.getElementById('events-table');
    const emptyState = document.getElementById('events-empty');

    if (!events || events.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = events
      .map(
        (e) => `
      <tr>
        <td style="font-family: monospace; font-size: 0.8em;">${e._id.substring(0, 8)}...</td>
        <td><strong>${escapeHtml(e.action)}</strong></td>
        <td>${escapeHtml(e.user)}</td>
        <td><span class="badge badge--${e.status === 'success' ? 'success' : 'danger'}">${escapeHtml(e.status)}</span></td>
        <td><span class="badge badge--secondary">${escapeHtml(e.ip_address)}</span></td>
        <td>${e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    console.error('Failed to load events from python backend:', err);
  }
}

function refreshDashboard() {
  loadDashboardStats();
  loadN8nWorkflows();
  loadExecutions();
  loadPythonUsers();
  loadPythonEvents();
  showToast('Dashboard refreshed', 'success');
}

// Simple HTML escaping for XSS prevention
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// n8n API Key Management
// ---------------------------------------------------------------------------
async function checkN8nApiKey() {
  try {
    const status = await api.get('/n8n/status');
    const banner = document.getElementById('n8n-key-banner');
    if (!status.hasApiKey) {
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
    }
  } catch (err) {
    console.error('Failed to check n8n status:', err);
  }
}

async function saveN8nApiKey() {
  const input = document.getElementById('n8n-api-key-input');
  const key = input.value.trim();
  if (!key) {
    showToast('Please enter an API key', 'error');
    return;
  }
  try {
    await api.post('/n8n/api-key', { apiKey: key });
    showToast('n8n API key connected!', 'success');
    input.value = '';
    document.getElementById('n8n-key-banner').style.display = 'none';
    // Reload n8n data immediately
    loadN8nWorkflows();
    loadDashboardStats();
  } catch (err) {
    showToast('Failed to save API key', 'error');
  }
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  checkN8nApiKey();
  loadN8nWorkflows();
  loadExecutions();
  loadPythonUsers();
  loadPythonEvents();

  // Wire up seed button
  const seedBtn = document.getElementById('btn-seed-data');
  if (seedBtn) {
    seedBtn.addEventListener('click', seedFakeData);
  }

  // Wire up refresh button
  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshDashboard);
  }

  // Wire up API key save button
  const saveKeyBtn = document.getElementById('btn-save-api-key');
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', saveN8nApiKey);
  }

  // Wire up Python Execute button
  const runPythonBtn = document.getElementById('btn-run-python');
  if (runPythonBtn) {
    runPythonBtn.addEventListener('click', executePythonScript);
  }

  // Allow Enter key to submit API key
  const apiKeyInput = document.getElementById('n8n-api-key-input');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveN8nApiKey();
    });
  }

  // Auto-refresh every 30 seconds
  setInterval(() => {
    loadDashboardStats();
    loadN8nWorkflows();
    loadExecutions();
    loadPythonUsers();
    loadPythonEvents();
  }, 30_000);
});
