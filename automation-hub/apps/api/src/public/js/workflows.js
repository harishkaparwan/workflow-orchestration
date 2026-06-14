/* =========================================================================
   Automation Hub — Workflow Configuration Logic
   ========================================================================= */

let workflows = [];
let editingId = null;
let deleteId = null;

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------
async function loadWorkflows() {
  try {
    workflows = await api.get('/workflows');
    renderWorkflows();
  } catch (err) {
    showToast('Failed to load workflows', 'error');
    console.error('Failed to load workflows:', err);
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderWorkflows() {
  const grid = document.getElementById('workflows-grid');
  const empty = document.getElementById('workflows-empty');
  const searchInput = document.getElementById('search-input');
  const searchTerm = (searchInput?.value || '').toLowerCase();

  const filtered = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm) ||
      (w.description || '').toLowerCase().includes(searchTerm)
  );

  if (filtered.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';

  grid.innerHTML = filtered
    .map(
      (w) => `
    <div class="workflow-card card" data-id="${escapeAttr(w.id)}">
      <div class="workflow-header">
        <div class="workflow-info">
          <h3 class="workflow-name">${escapeHtml(w.name)}</h3>
          <p class="workflow-desc text-muted">${escapeHtml(w.description || 'No description')}</p>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${w.enabled ? 'checked' : ''} data-toggle-id="${escapeAttr(w.id)}">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="workflow-meta">
        <span class="badge badge--info">${escapeHtml(w.type)}</span>
        ${
          w.type === 'webhook'
            ? `<span class="text-muted text-sm">${escapeHtml(w.webhookUrl || '/webhook/' + w.id)}</span>`
            : ''
        }
        ${
          w.type === 'schedule'
            ? `<span class="text-muted text-sm">${escapeHtml(w.schedule || 'Not set')}</span>`
            : ''
        }
      </div>
      <div class="workflow-footer">
        <span class="text-muted text-sm">${
          w.lastRun ? 'Last run: ' + timeAgo(w.lastRun) : 'Never run'
        }</span>
        <div class="workflow-actions">
          <button class="btn btn--sm btn--secondary" data-edit-id="${escapeAttr(w.id)}">Edit</button>
          <button class="btn btn--sm btn--danger" data-delete-id="${escapeAttr(w.id)}">Delete</button>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

// ---------------------------------------------------------------------------
// Create / Edit Modal
// ---------------------------------------------------------------------------
function openCreateModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Create Workflow';
  document.getElementById('workflow-form').reset();
  // Reset enabled toggle to checked for new workflows
  document.getElementById('wf-enabled').checked = true;
  updateTypeFields();
  openModal('workflow-modal');
}

function editWorkflow(id) {
  const w = workflows.find((wf) => wf.id === id);
  if (!w) return;

  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Workflow';
  document.getElementById('wf-name').value = w.name;
  document.getElementById('wf-description').value = w.description || '';
  document.getElementById('wf-type').value = w.type;
  document.getElementById('wf-webhook-url').value = w.webhookUrl || '';
  document.getElementById('wf-schedule').value = w.schedule || '';
  document.getElementById('wf-enabled').checked = w.enabled;
  updateTypeFields();
  openModal('workflow-modal');
}

function updateTypeFields() {
  const type = document.getElementById('wf-type').value;
  document.getElementById('webhook-fields').style.display =
    type === 'webhook' ? 'block' : 'none';
  document.getElementById('schedule-fields').style.display =
    type === 'schedule' ? 'block' : 'none';
}

async function saveWorkflow(e) {
  e.preventDefault();

  const nameInput = document.getElementById('wf-name');
  if (!nameInput.value.trim()) {
    nameInput.focus();
    showToast('Workflow name is required', 'error');
    return;
  }

  const data = {
    name: nameInput.value.trim(),
    description: document.getElementById('wf-description').value.trim(),
    type: document.getElementById('wf-type').value,
    webhookUrl: document.getElementById('wf-webhook-url').value.trim(),
    schedule: document.getElementById('wf-schedule').value.trim(),
    enabled: document.getElementById('wf-enabled').checked,
  };

  try {
    if (editingId) {
      await api.put(`/workflows/${editingId}`, data);
      showToast('Workflow updated', 'success');
    } else {
      await api.post('/workflows', data);
      showToast('Workflow created', 'success');
    }
    closeModal('workflow-modal');
    loadWorkflows();
  } catch (err) {
    showToast('Failed to save workflow', 'error');
    console.error('Save error:', err);
  }
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------
async function toggleWorkflow(id, enabled) {
  try {
    await api.put(`/workflows/${id}`, { enabled });
    showToast(`Workflow ${enabled ? 'enabled' : 'disabled'}`, 'success');
    loadWorkflows();
  } catch (err) {
    showToast('Failed to update workflow', 'error');
    console.error('Toggle error:', err);
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
function confirmDelete(id) {
  deleteId = id;
  openModal('delete-modal');
}

async function deleteWorkflow() {
  if (!deleteId) return;
  try {
    await api.delete(`/workflows/${deleteId}`);
    showToast('Workflow deleted', 'success');
    closeModal('delete-modal');
    deleteId = null;
    loadWorkflows();
  } catch (err) {
    showToast('Failed to delete workflow', 'error');
    console.error('Delete error:', err);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Event Delegation & Initialisation
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadWorkflows();

  // Form submission
  document.getElementById('workflow-form').addEventListener('submit', saveWorkflow);

  // Type field toggle
  document.getElementById('wf-type').addEventListener('change', updateTypeFields);

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', renderWorkflows);
  }

  // Create workflow buttons
  document.getElementById('btn-create-workflow')?.addEventListener('click', openCreateModal);
  document.getElementById('btn-empty-create')?.addEventListener('click', openCreateModal);

  // Modal close buttons
  document.getElementById('btn-modal-close')?.addEventListener('click', () => closeModal('workflow-modal'));
  document.getElementById('btn-cancel')?.addEventListener('click', () => closeModal('workflow-modal'));
  document.getElementById('btn-delete-close')?.addEventListener('click', () => closeModal('delete-modal'));
  document.getElementById('btn-delete-cancel')?.addEventListener('click', () => closeModal('delete-modal'));

  // Delete confirm
  document.getElementById('btn-delete-confirm')?.addEventListener('click', deleteWorkflow);

  // Event delegation for dynamically rendered workflow cards
  document.getElementById('workflows-grid')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-id]');
    if (editBtn) {
      editWorkflow(editBtn.dataset.editId);
      return;
    }

    const deleteBtn = e.target.closest('[data-delete-id]');
    if (deleteBtn) {
      confirmDelete(deleteBtn.dataset.deleteId);
      return;
    }
  });

  document.getElementById('workflows-grid')?.addEventListener('change', (e) => {
    const toggle = e.target.closest('[data-toggle-id]');
    if (toggle) {
      toggleWorkflow(toggle.dataset.toggleId, toggle.checked);
    }
  });
});
