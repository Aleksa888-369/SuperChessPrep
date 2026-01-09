// Logger fallback (if not loaded from bundle)
if (typeof Logger === 'undefined') {
  window.Logger = {
    debug: function() {},
    info: console.info.bind(console, '[INFO]'),
    warn: console.warn.bind(console, '[WARN]'),
    error: console.error.bind(console, '[ERROR]'),
    log: function() {}
  };
}

// ============================================
// ADMIN PGN MANAGEMENT - JavaScript Logic
// Version: 7.1 - December 2025  
// UPDATED: Removed Page field from Edit Modal (Page cannot be changed after creation)
// ============================================

const getPgnApiUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'superchessprep.com' || hostname === 'www.superchessprep.com') {
    return 'https://pgn.superchessprep.com';
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3005';
  }
  
  if (hostname.includes('152.53.186.105')) {
    return `http://${hostname}:3005`;
  }
  
  return 'http://localhost:3005';
};

const PGN_API_URL = getPgnApiUrl();
let allExercises = [];
let deleteExerciseId = null;
let currentEditingExercise = null;

// Pagination state
let currentPage = 1;
const pageSize = 10;  // Fixed at 10
let totalExercises = 0;
let totalPages = 1;

// Tier counts from API (for accurate stats display)
let tierCounts = { basic: 0, premium: 0, elite: 0 };

const TIER_LIMITS = {
  basic: 5,
  premium: 15,
  elite: 30
};

// ============================================
// CUSTOM ALERT MODAL
// ============================================

function showCustomAlert(message, title = 'Alert', icon = '⚠️') {
  const modal = document.getElementById('customAlertModal');
  const iconEl = document.getElementById('alertIcon');
  const titleEl = document.getElementById('alertTitle');
  const messageEl = document.getElementById('alertMessage');
  
  if (iconEl) iconEl.textContent = icon;
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  
  if (modal) modal.style.display = 'flex';
}

function closeCustomAlert() {
  const modal = document.getElementById('customAlertModal');
  if (modal) modal.style.display = 'none';
}

// ============================================
// CUSTOM DELETE CONFIRMATION MODAL
// ============================================

function showDeleteModal(id) {
  deleteExerciseId = id;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.style.display = 'flex';
}

function closeDeleteModal() {
  deleteExerciseId = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.style.display = 'none';
}

async function confirmDelete() {
  if (!deleteExerciseId) return;
  
  const id = deleteExerciseId;
  closeDeleteModal();
  
  try {
    const token = Auth.storage.getToken();
    
    const response = await fetch(`${PGN_API_URL}/api/admin/exercises/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Delete failed');
    }
    
    showCustomAlert('Exercise deleted successfully!', 'Deleted', '🗑️');
    
    await fetchAllExercises();
    
  } catch (error) {
    Logger.error('Delete error:', error);
    showCustomAlert(`Delete failed: ${SafeHTML.escapeText(error.message)}`, 'Error', '⚠️');
  }
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth scripts to load
  await new Promise(r => setTimeout(r, 300));
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }
  
  const user = Auth.getCurrentUser();
  
  if (user.role !== 'admin') {
    showCustomAlert('You need admin privileges to access this page.', 'Access Denied', '🚫');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
    return;
  }
  
  setupFormHandlers();
  await fetchAllExercises();
});

// ============================================
// SETUP FORM HANDLERS
// ============================================

function setupFormHandlers() {
  const fileInput = document.getElementById('pgnFiles');
  fileInput.addEventListener('change', handleFileSelect);
  
  const uploadForm = document.getElementById('uploadForm');
  uploadForm.addEventListener('submit', handleUpload);
  
  const editForm = document.getElementById('editForm');
  editForm.addEventListener('submit', handleEditSubmit);
  
  // Tier checkboxes listener
  const tierCheckboxes = document.querySelectorAll('.tier-checkbox');
  tierCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateTierLimitInfo);
  });
  
  // PGN textarea change listener for preview
  const pgnTextarea = document.getElementById('editPgnContent');
  if (pgnTextarea) {
    pgnTextarea.addEventListener('input', updatePgnPreview);
  }
}

// ============================================
// EDITOR TAB SWITCHING
// ============================================

function switchEditorTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });
  
  // Update tab content
  document.querySelectorAll('.editor-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const targetContent = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (targetContent) {
    targetContent.classList.add('active');
  }
  
  // Update preview when switching to preview tab
  if (tabName === 'preview') {
    updatePgnPreview();
  }
}

// ============================================
// UPDATE PGN PREVIEW
// ============================================

function updatePgnPreview() {
  const pgnTextarea = document.getElementById('editPgnContent');
  const previewContainer = document.getElementById('pgnPreviewContent');
  
  if (!pgnTextarea || !previewContainer) return;
  
  const pgnContent = pgnTextarea.value;
  
  if (!pgnContent.trim()) {
    SafeHTML.setHTML(previewContainer, '<p style="color: #666; text-align: center;">No PGN content to preview</p>');
    return;
  }
  
  // Parse and render PGN with highlighted comments
  const html = renderPgnWithComments(pgnContent);
  SafeHTML.setHTML(previewContainer, html);
}

// ============================================
// RENDER PGN WITH COMMENTS (FOR PREVIEW)
// ============================================

function renderPgnWithComments(pgnContent) {
  const lines = pgnContent.split('\n');
  let html = '';
  let inMoves = false;
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Headers
    if (trimmedLine.startsWith('[')) {
      html += `<div class="preview-header">${escapeHtml(trimmedLine)}</div>`;
      return;
    }
    
    // Empty line
    if (!trimmedLine) {
      if (inMoves) {
        html += '<br>';
      }
      inMoves = true;
      return;
    }
    
    // Moves section
    if (inMoves || /^\d+\./.test(trimmedLine)) {
      inMoves = true;
      
      // Parse moves and comments
      const parts = trimmedLine.split(/(\{[^}]+\})/g);
      
      parts.forEach(part => {
        if (part.startsWith('{') && part.endsWith('}')) {
          // Comment
          const commentText = part.slice(1, -1).trim();
          html += `<span class="preview-comment">{${escapeHtml(commentText)}}</span> `;
        } else if (part.trim()) {
          // Moves
          const moveParts = part.split(/(\d+\.+)/g);
          moveParts.forEach(movePart => {
            if (/^\d+\.+$/.test(movePart)) {
              html += `<span class="preview-move-number">${movePart}</span>`;
            } else if (movePart.trim()) {
              html += `<span class="preview-move">${escapeHtml(movePart)}</span>`;
            }
          });
        }
      });
    }
  });
  
  return html;
}

// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// HANDLE FILE SELECT
// ============================================

function handleFileSelect(e) {
  const files = e.target.files;
  const fileInfo = document.getElementById('fileInfo');
  
  if (files.length === 0) {
    fileInfo.textContent = 'No files selected';
    fileInfo.style.color = '#aaa';
  } else if (files.length === 1) {
    fileInfo.textContent = `Selected: ${files[0].name}`;
    fileInfo.style.color = '#4caf50';
  } else {
    fileInfo.textContent = `Selected ${files.length} files`;
    fileInfo.style.color = '#4caf50';
  }
  
  updateTierLimitInfo();
}

// ============================================
// UPDATE TIER LIMIT INFO
// ============================================

function updateTierLimitInfo() {
  const tierCheckboxes = document.querySelectorAll('.tier-checkbox:checked');
  const fileInput = document.getElementById('pgnFiles');
  const tierLimitInfo = document.getElementById('tierLimitInfo');
  
  if (tierCheckboxes.length === 0) {
    tierLimitInfo.textContent = 'Please select at least one tier';
    tierLimitInfo.style.color = '#ff6347';
    return;
  }
  
  const fileCount = fileInput.files.length;
  let infoText = '';
  
  tierCheckboxes.forEach((checkbox, index) => {
    const tier = checkbox.value;
    const currentCount = getTierCount(tier);
    const limit = TIER_LIMITS[tier];
    const remaining = limit - currentCount;
    
    if (fileCount > remaining) {
      infoText += `${tier}: ${currentCount}/${limit} (need ${fileCount - remaining} less)`;
    } else {
      infoText += `${tier}: ${currentCount}/${limit} (${remaining - fileCount} remaining after upload)`;
    }
    
    if (index < tierCheckboxes.length - 1) {
      infoText += ' | ';
    }
  });
  
  tierLimitInfo.textContent = infoText;
  tierLimitInfo.style.color = infoText.includes('need') ? '#ff6347' : '#4caf50';
}

// ============================================
// GET TIER COUNT
// ============================================

function getTierCount(tier) {
  // Use tier counts from API (accurate totals, not just current page)
  return tierCounts[tier] || 0;
}

// ============================================
// UPDATE TIER STATS WITH PROGRESS BARS
// ============================================

function updateTierStats() {
  const basicCount = getTierCount('basic');
  const premiumCount = getTierCount('premium');
  const eliteCount = getTierCount('elite');
  
  // Update counts
  const basicEl = document.getElementById('basicCount');
  const premiumEl = document.getElementById('premiumCount');
  const eliteEl = document.getElementById('eliteCount');
  
  if (basicEl) basicEl.textContent = basicCount;
  if (premiumEl) premiumEl.textContent = premiumCount;
  if (eliteEl) eliteEl.textContent = eliteCount;
  
  // Update progress bars
  const basicProgress = document.getElementById('basicProgress');
  const premiumProgress = document.getElementById('premiumProgress');
  const eliteProgress = document.getElementById('eliteProgress');
  
  if (basicProgress) {
    const basicPercent = (basicCount / TIER_LIMITS.basic) * 100;
    basicProgress.style.width = `${Math.min(basicPercent, 100)}%`;
  }
  
  if (premiumProgress) {
    const premiumPercent = (premiumCount / TIER_LIMITS.premium) * 100;
    premiumProgress.style.width = `${Math.min(premiumPercent, 100)}%`;
  }
  
  if (eliteProgress) {
    const elitePercent = (eliteCount / TIER_LIMITS.elite) * 100;
    eliteProgress.style.width = `${Math.min(elitePercent, 100)}%`;
  }
  
  // Color coding
  if (basicEl) basicEl.style.color = basicCount >= TIER_LIMITS.basic ? '#ff6347' : '#4caf50';
  if (premiumEl) premiumEl.style.color = premiumCount >= TIER_LIMITS.premium ? '#ff6347' : '#4caf50';
  if (eliteEl) eliteEl.style.color = eliteCount >= TIER_LIMITS.elite ? '#ff6347' : '#4caf50';
}

// ============================================
// HANDLE UPLOAD
// ============================================

async function handleUpload(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData();
  const files = document.getElementById('pgnFiles').files;
  
  if (files.length === 0) {
    showCustomAlert('Please select at least one PGN file to upload.', 'No Files Selected', '⚠️');
    return;
  }
  
  // Get selected tiers from checkboxes
  const tierCheckboxes = document.querySelectorAll('.tier-checkbox:checked');
  
  if (tierCheckboxes.length === 0) {
    showCustomAlert('Please select at least one tier for the exercises.', 'No Tier Selected', '⚠️');
    return;
  }
  
  const selectedTiers = Array.from(tierCheckboxes).map(cb => cb.value);
  
  // Validate tier limits for each selected tier
  for (const tier of selectedTiers) {
    const currentCount = getTierCount(tier);
    const limit = TIER_LIMITS[tier];
    const remaining = limit - currentCount;
    
    if (files.length > remaining) {
      const message = `Current ${tier} exercises: ${currentCount}/${limit}\nRemaining slots: ${remaining}\nYou selected: ${files.length} files\n\nPlease remove ${files.length - remaining} file(s) or deactivate some existing ${tier} exercises.`;
      showCustomAlert(message, 'Too many files for ' + tier + '!', '❌');
      return;
    }
  }
  
  for (let file of files) {
    formData.append('pgnFiles', file);
  }
  
  const pageValue = 'daily-exercises'; // Hardcoded since we only have one page
  formData.append('page', pageValue);
  formData.append('requiredTier', selectedTiers[0]); // Primary tier
  formData.append('tiers', JSON.stringify(selectedTiers)); // All selected tiers
  
  const progressDiv = document.getElementById('uploadProgress');
  const resultsDiv = document.getElementById('uploadResults');
  const submitBtn = document.getElementById('uploadBtn');
  
  if (progressDiv) progressDiv.style.display = 'block';
  if (resultsDiv) resultsDiv.innerHTML = '';
  if (submitBtn) submitBtn.disabled = true;
  
  try {
    const token = Auth.storage.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${PGN_API_URL}/api/admin/exercises/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (progressDiv) progressDiv.style.display = 'none';
    
    if (response.ok && data.success) {
      displayUploadResults(data.data, data.message);
      form.reset();
      document.getElementById('fileInfo').textContent = 'No files selected';
      document.getElementById('fileInfo').style.color = '#aaa';
      await fetchAllExercises();
    } else {
      throw new Error(data.error || 'Upload failed');
    }
    
  } catch (error) {
    Logger.error('Upload error:', error.message);
    if (progressDiv) progressDiv.style.display = 'none';
    showCustomAlert(`Upload failed: ${SafeHTML.escapeText(error.message)}`, 'Error', '⚠️');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ============================================
// DISPLAY UPLOAD RESULTS
// ============================================

function displayUploadResults(results, message) {
  const resultsDiv = document.getElementById('uploadResults');
  
  if (!resultsDiv) return;
  
  let html = '';
  
  // Success section
  if (results.success && results.success.length > 0) {
    html += `
      <div class="result-success">
        <div class="result-title">✅ Successfully Uploaded (${results.success.length})</div>
        <ul class="result-list">
          ${results.success.map(item => `
            <li>
              <span>✔</span>
              <span>${item.title}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }
  
  // Duplicates section
  if (results.duplicates && results.duplicates.length > 0) {
    html += `
      <div class="result-warning">
        <div class="result-title">⚠️ Duplicates Skipped (${results.duplicates.length})</div>
        <ul class="result-list">
          ${results.duplicates.map(item => `
            <li>
              <span>⚠</span>
              <span><strong>${item.filename}:</strong> ${item.message}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }
  
  // Failed section
  if (results.failed && results.failed.length > 0) {
    html += `
      <div class="result-error">
        <div class="result-title">❌ Failed to Upload (${results.failed.length})</div>
        <ul class="result-list">
          ${results.failed.map(item => `
            <li>
              <span>✗</span>
              <span><strong>${item.filename}:</strong> ${item.error}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }
  
  SafeHTML.setHTML(resultsDiv, html);
}

// ============================================
// FETCH ALL EXERCISES (WITH PAGINATION)
// ============================================

async function fetchAllExercises(page = currentPage) {
  const tableLoading = document.getElementById('tableLoading');
  const tableContainer = document.getElementById('tableContainer');
  
  if (tableLoading) tableLoading.style.display = 'flex';
  if (tableContainer) tableContainer.style.display = 'none';
  
  try {
    const token = Auth.storage.getToken();
    
    const pageFilter = document.getElementById('filterPage')?.value || '';
    const tierFilter = document.getElementById('filterTier')?.value || '';
    
    // Calculate offset for backend pagination
    const offset = (page - 1) * pageSize;
    
    let url = `${PGN_API_URL}/api/admin/exercises?limit=${pageSize}&offset=${offset}`;
    if (pageFilter) url += `&page=${pageFilter}`;
    if (tierFilter) url += `&tier=${tierFilter}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch exercises');
    }
    
    allExercises = data.data.exercises || [];
    totalExercises = data.data.total || allExercises.length;
    totalPages = Math.ceil(totalExercises / pageSize);
    currentPage = page;
    
    // Store tier counts from API for accurate stats
    if (data.data.tierCounts) {
      tierCounts = data.data.tierCounts;
    }
    
    // Display exercises with correct numbering
    displayExercisesTable(allExercises, offset);
    renderPagination();
    updateTierStats();
    
  } catch (error) {
    Logger.error('Fetch error:', error.message);
    showCustomAlert(`Failed to load exercises: ${SafeHTML.escapeText(error.message)}`, 'Error', '⚠️');
  } finally {
    if (tableLoading) tableLoading.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
  }
}

// ============================================
// DISPLAY EXERCISES TABLE
// ============================================

function displayExercisesTable(exercises, startIndex = 0) {
  const tbody = document.getElementById('exercisesTableBody');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (exercises.length === 0) {
    SafeHTML.setHTML(tbody, `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px;">
          No exercises found
        </td>
      </tr>
    `);
    return;
  }
  
  exercises.forEach((exercise, index) => {
    const row = document.createElement('tr');
    
    const numberCell = document.createElement('td');
    numberCell.textContent = startIndex + index + 1;  // Correct numbering with offset
    
    const titleCell = document.createElement('td');
    titleCell.textContent = exercise.title || 'Untitled';
    titleCell.style.fontWeight = '600';
    
    const playersCell = document.createElement('td');
    const white = exercise.white_player || '-';
    const black = exercise.black_player || '-';
    playersCell.textContent = `${white} vs ${black}`;
    
    const statusText = exercise.is_active ? 'Active' : 'Inactive';
    const statusClass = exercise.is_active ? 'status-active' : 'status-inactive';
    
    const pageCell = document.createElement('td');
    pageCell.textContent = exercise.page || '-';
    
    const tierCell = document.createElement('td');
    const tierBadge = document.createElement('span');
    tierBadge.className = `tier-badge tier-${exercise.required_tier}`;
    tierBadge.textContent = exercise.required_tier;
    tierCell.appendChild(tierBadge);
    
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${statusClass}`;
    statusBadge.textContent = statusText;
    statusCell.appendChild(statusBadge);
    
    const actionsCell = document.createElement('td');
    
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn action-edit';
    editBtn.title = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.onclick = () => editExercise(exercise.id);
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'action-btn action-toggle';
    toggleBtn.title = exercise.is_active ? 'Deactivate' : 'Activate';
    toggleBtn.textContent = exercise.is_active ? '🚫' : '✅';
    toggleBtn.onclick = () => toggleExerciseStatus(exercise.id, exercise.is_active, exercise.required_tier);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn action-delete';
    deleteBtn.title = 'Delete Permanently';
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = () => showDeleteModal(exercise.id);
    
    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(toggleBtn);
    actionsCell.appendChild(deleteBtn);
    
    row.appendChild(numberCell);
    row.appendChild(titleCell);
    row.appendChild(playersCell);
    row.appendChild(pageCell);
    row.appendChild(tierCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
}

// ============================================
// FILTER EXERCISES
// ============================================

function filterExercises() {
  currentPage = 1;  // Reset to first page when filtering
  fetchAllExercises(1);
}

// ============================================
// PAGINATION FUNCTIONS
// ============================================

function renderPagination() {
  const container = document.getElementById('paginationContainer');
  if (!container) return;
  
  // Clear existing pagination
  container.innerHTML = '';
  
  if (totalPages <= 1) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  
  // Info text
  const info = document.createElement('span');
  info.className = 'pagination-info';
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalExercises);
  info.textContent = `Showing ${startItem}-${endItem} of ${totalExercises}`;
  container.appendChild(info);
  
  // Pagination buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'pagination-buttons';
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  SafeHTML.setHTML(prevBtn, '◀ Prev');
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => goToPage(currentPage - 1);
  buttonsContainer.appendChild(prevBtn);
  
  // Page numbers
  const pageNumbers = getPageNumbers();
  pageNumbers.forEach(pageNum => {
    if (pageNum === '...') {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      buttonsContainer.appendChild(ellipsis);
    } else {
      const pageBtn = document.createElement('button');
      pageBtn.className = `pagination-btn ${pageNum === currentPage ? 'active' : ''}`;
      pageBtn.textContent = pageNum;
      pageBtn.onclick = () => goToPage(pageNum);
      buttonsContainer.appendChild(pageBtn);
    }
  });
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  SafeHTML.setHTML(nextBtn, 'Next ▶');
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => goToPage(currentPage + 1);
  buttonsContainer.appendChild(nextBtn);
  
  container.appendChild(buttonsContainer);
  
  // Page size is fixed at 10 - no selector needed
}

function getPageNumbers() {
  const pages = [];
  const maxVisible = 5;
  
  if (totalPages <= maxVisible + 2) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Show pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Always show last page
    pages.push(totalPages);
  }
  
  return pages;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  fetchAllExercises(page);
}

// ============================================
// EDIT EXERCISE
// ✅ UPDATED: Removed Page field handling - Page cannot be changed after creation
// ============================================

async function editExercise(id) {
  try {
    const token = Auth.storage.getToken();
    
    const response = await fetch(`${PGN_API_URL}/api/admin/exercises/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch exercise');
    }
    
    const exercise = data.data.exercise;
    currentEditingExercise = exercise;
    
    // Populate basic info (Page field removed - cannot be changed)
    document.getElementById('editExerciseId').value = exercise.id;
    document.getElementById('editTitle').value = exercise.title || '';
    document.getElementById('editTier').value = exercise.required_tier || 'basic';
    document.getElementById('editActive').checked = exercise.is_active;
    
    // Populate PGN content
    const pgnTextarea = document.getElementById('editPgnContent');
    if (pgnTextarea) {
      pgnTextarea.value = exercise.pgn_content || '';
    }
    
    // Store original tier for validation
    document.getElementById('editTier').dataset.originalTier = exercise.required_tier || 'basic';
    
    // Reset to basic tab
    switchEditorTab('basic');
    
    // Show modal
    document.getElementById('editModal').style.display = 'flex';
    
  } catch (error) {
    Logger.error('Error loading exercise:', error.message);
    showCustomAlert(`Failed to load exercise: ${SafeHTML.escapeText(error.message)}`, 'Error', '⚠️');
  }
}

// ============================================
// CLOSE EDIT MODAL
// ============================================

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  currentEditingExercise = null;
  
  // Reset to basic tab
  switchEditorTab('basic');
}

// ============================================
// HANDLE EDIT SUBMIT
// ✅ UPDATED: Removed Page from updateData - Page cannot be changed after creation
// ============================================

async function handleEditSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('editExerciseId').value;
  const title = document.getElementById('editTitle').value;
  // Page field REMOVED - cannot be changed after creation
  const tier = document.getElementById('editTier').value;
  const is_active = document.getElementById('editActive').checked;
  
  // Get PGN content from editor
  const pgnTextarea = document.getElementById('editPgnContent');
  const pgnContent = pgnTextarea ? pgnTextarea.value : null;
  
  // Get original tier for better error messages
  const originalTier = document.getElementById('editTier').dataset.originalTier;
  
  try {
    const token = Auth.storage.getToken();
    
    // ✅ UPDATED: Removed 'page' from updateData - Page cannot be changed
    const updateData = {
      title,
      requiredTier: tier,
      is_active
    };
    
    // Include PGN content if available
    if (pgnContent !== null) {
      updateData.pgnContent = pgnContent;
    }
    
    const response = await fetch(`${PGN_API_URL}/api/admin/exercises/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      // Enhanced error message for tier conflicts
      if (response.status === 409 || (data.error && data.error.includes('already exists'))) {
        const message = `🚫 Cannot change tier from "${originalTier}" to "${tier}"!\n\n` +
                        `An exercise with the same title already exists on the "${tier}" tier.\n\n` +
                        `Please either:\n` +
                        `• Delete the existing "${tier}" exercise first, or\n` +
                        `• Keep this exercise on "${originalTier}" tier`;
        showCustomAlert(message, '⚠️ Duplicate Tier Conflict', '🚫');
        return;
      }
      throw new Error(data.error || 'Update failed');
    }
    
    showCustomAlert('Exercise updated successfully!', '✅ Success', '✔️');
    
    closeEditModal();
    await fetchAllExercises();
    
  } catch (error) {
    Logger.error('Update error:', error.message);
    showCustomAlert(`Update failed: ${SafeHTML.escapeText(error.message)}`, '❌ Error', '⚠️');
  }
}

// ============================================
// TOGGLE EXERCISE STATUS WITH VALIDATION
// ============================================

async function toggleExerciseStatus(id, currentStatus, tier) {
  const newStatus = !currentStatus;
  const action = newStatus ? 'activate' : 'deactivate';
  
  // Validate tier limit when activating
  if (newStatus) {
    const currentCount = getTierCount(tier);
    const limit = TIER_LIMITS[tier];
    
    if (currentCount >= limit) {
      const message = `Cannot activate this exercise!\n\nCurrent ${tier} exercises: ${currentCount}/${limit}\nLimit reached!\n\nPlease deactivate another ${tier} exercise first.`;
      showCustomAlert(message, '⚠️ Limit Reached', '🚫');
      return;
    }
  }
  
  try {
    const token = Auth.storage.getToken();
    
    const response = await fetch(`${PGN_API_URL}/api/admin/exercises/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_active: newStatus
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Status update failed');
    }
    
    await fetchAllExercises();
    
  } catch (error) {
    Logger.error('Status update error:', error.message);
    showCustomAlert(`Failed to ${action} exercise: ${SafeHTML.escapeText(error.message)}`, '❌ Error', '⚠️');
  }
}
