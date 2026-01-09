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
// ADMIN VIDEO MANAGEMENT - JavaScript Logic  
// Version: 2.3 - November 2025 (PROCESSING STATUS SUPPORT)
// ============================================

const getVideoApiUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'superchessprep.com' || hostname === 'www.superchessprep.com') {
    // ✅ Use direct upload endpoint (bypass Cloudflare)
    return 'https://upload.superchessprep.com';  // or videos-direct
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3007';
  }
  
  return 'http://localhost:3007';
};

const VIDEO_API_URL = getVideoApiUrl();
let allVideos = [];
let filteredVideos = [];
let deleteVideoId = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatFileSize(bytes) {
  // Handle invalid inputs
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Ensure and is within valid range
  if (i < 0 || i >= sizes.length) return '0 Bytes';
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTierClass(tier) {
  return `tier-${tier}`;
}

function getTierBadge(tier) {
  const badges = {
    basic: '♙ Basic',
    premium: '♘ Premium',
    elite: '♔ Elite'
  };
  return badges[tier] || tier;
}

// ============================================
//  NEW: PROCESS STATUS BADGE
// ============================================

function getProcessStatusBadge(status) {
  const badges = {
    processing: { text: '⏳ Processing', class: 'status-processing' },
    ready: { text: '✅ Ready', class: 'status-ready' },
    failed: { text: '❌ Failed', class: 'status-failed' }
  };
  return badges[status] || badges.ready;
}

// ============================================
// CUSTOM ALERT MODAL
// ============================================

function showCustomAlert(message, title = 'Alert', icon = '') {
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
// DELETE MODAL
// ============================================

function showDeleteModal(id) {
  deleteVideoId = id;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.style.display = 'flex';
}

function closeDeleteModal() {
  deleteVideoId = null;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.style.display = 'none';
}

async function confirmDelete() {
  if (!deleteVideoId) return;
  
  try {
    const token = Auth.storage.getToken();
    
    // PERMANENT DELETE: Add ?hard=true to permanently delete from database
    const response = await fetch(`${VIDEO_API_URL}/api/videos/${deleteVideoId}?hard=true`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showCustomAlert('Video permanently deleted!', 'Success', '✅');
      closeDeleteModal();
      await fetchVideos();
    } else {
      throw new Error(data.message || 'Failed to delete video');
    }
    
  } catch (error) {
    Logger.error('Delete error:', error);
    showCustomAlert(`Failed to delete video: ${SafeHTML.escapeText(error.message)}`, 'Error', '❌');
  }
}

// ============================================
// EDIT MODAL
// ============================================

function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.style.display = 'none';
}

async function editVideo(id) {
  try {
    const token = Auth.storage.getToken();
    
    // CORRECTED ROUTE: /api/videos/:id instead of /api/admin/videos/:id
    const response = await fetch(`${VIDEO_API_URL}/api/videos/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch video details');
    }
    
    const video = data.video;
    
    document.getElementById('editVideoId').value = video.id;
    document.getElementById('editTitle').value = video.title;
    document.getElementById('editDescription').value = video.description || '';
    document.getElementById('editTier').value = video.required_tier;
    document.getElementById('editActive').checked = video.is_active;
    
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'flex';
    
  } catch (error) {
    Logger.error('Edit video error:', error);
    showCustomAlert(`Failed to load video: ${SafeHTML.escapeText(error.message)}`, 'Error', '❌');
  }
}

// ============================================
// TOGGLE VIDEO STATUS
// ============================================

async function toggleVideoStatus(id, currentStatus) {
  try {
    const token = Auth.storage.getToken();
    const newStatus = !currentStatus;
    
    // CORRECTED ROUTE: /api/videos/:id instead of /api/admin/videos/:id
    const response = await fetch(`${VIDEO_API_URL}/api/videos/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isActive: newStatus
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      const statusText = newStatus ? 'activated' : 'deactivated';
      showCustomAlert(`Video ${statusText} successfully!`, 'Success', '✅');
      await fetchVideos();
    } else {
      throw new Error(data.message || 'Failed to update video status');
    }
    
  } catch (error) {
    Logger.error('Toggle status error:', error);
    showCustomAlert(`Failed to update status: ${SafeHTML.escapeText(error.message)}`, 'Error', '❌');
  }
}

// ============================================
//  NEW: RETRY FAILED COMPRESSION
// ============================================

async function retryCompression(id) {
  try {
    const token = Auth.storage.getToken();
    
    // First, reset status to processing
    const response = await fetch(`${VIDEO_API_URL}/api/videos/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'processing'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Trigger re-compression via a dedicated endpoint (if available)
      // For now, just show message
      showCustomAlert('Video queued for re-compression. Please wait...', 'Processing', '⏳');
      await fetchVideos();
    } else {
      throw new Error(data.message || 'Failed to retry compression');
    }
    
  } catch (error) {
    Logger.error('Retry compression error:', error);
    showCustomAlert(`Failed to retry: ${SafeHTML.escapeText(error.message)}`, 'Error', '❌');
  }
}

// ============================================
// FORM HANDLERS
// ============================================

// Character counter for description
const descriptionInput = document.getElementById('videoDescription');
if (descriptionInput) {
  descriptionInput.addEventListener('input', () => {
    const charCount = document.getElementById('charCount');
    if (charCount) {
      const length = descriptionInput.value.length;
      charCount.textContent = `${length} / 2000 characters`;
    }
  });
}

// File input handler
const fileInput = document.getElementById('videoFile');
if (fileInput) {
  fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    const fileInfo = document.getElementById('fileInfo');
    const fileSize = document.getElementById('fileSize');
    
    if (files && files.length > 0) {
      const file = files[0];
      SafeHTML.setHTML(fileInfo, `<span>${SafeHTML.escapeText(file.name)}</span>`);
      if (fileSize) {
        fileSize.textContent = formatFileSize(file.size);
      }
    } else {
      SafeHTML.setHTML(fileInfo, '<span>No file selected</span>');
      if (fileSize) {
        fileSize.textContent = '';
      }
    }
  });
}

// Upload form submission
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
  uploadForm.addEventListener('submit', handleUpload);
}

// Edit form submission
const editForm = document.getElementById('editForm');
if (editForm) {
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editVideoId').value;
    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const requiredTier = document.getElementById('editTier').value;
    const isActive = document.getElementById('editActive').checked;
    
    try {
      const token = Auth.storage.getToken();
      
      // CORRECTED ROUTE: /api/videos/:id instead of /api/admin/videos/:id
      const response = await fetch(`${VIDEO_API_URL}/api/videos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          required_tier: requiredTier,
          is_active: isActive
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showCustomAlert('Video updated successfully!', 'Success', '✅');
        closeEditModal();
        await fetchVideos();
      } else {
        throw new Error(data.message || 'Failed to update video');
      }
      
    } catch (error) {
      Logger.error('Update error:', error);
      showCustomAlert(`Failed to update video: ${SafeHTML.escapeText(error.message)}`, 'Error', '❌');
    }
  });
}

// ============================================
// UPLOAD HANDLER
// ============================================

async function handleUpload(e) {
  e.preventDefault();
  
  //  CRITICAL: Disable button IMMEDIATELY to prevent double submissions
  const submitBtn = document.getElementById('uploadBtn');
  if (submitBtn) submitBtn.disabled = true;
  
  const form = e.target;
  const fileInput = form.querySelector('#videoFile');
  const titleInput = form.querySelector('#videoTitle');
  const descriptionInput = form.querySelector('#videoDescription');
  const tierSelect = form.querySelector('#requiredTier');
  
  const file = fileInput.files[0];
  if (!file) {
    showCustomAlert('Please select a video file', 'Error', '❌');
    if (submitBtn) submitBtn.disabled = false;
    return;
  }
  
  const title = titleInput.value.trim();
  if (!title) {
    showCustomAlert('Please enter a video title', 'Error', '❌');
    if (submitBtn) submitBtn.disabled = false;
    return;
  }
  
  // Check if video with same title already exists
  const existingVideo = allVideos.find(v => v.title.toLowerCase() === title.toLowerCase());
  if (existingVideo) {
    showCustomAlert(`A video with the title "${title}" already exists. Please use a different title.`, 'Duplicate Title', '⚠️');
    if (submitBtn) submitBtn.disabled = false;
    return;
  }
  
  // File size validation (5GB max)
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  if (file.size > maxSize) {
    showCustomAlert('File size exceeds 5GB limit', 'Error', '❌');
    if (submitBtn) submitBtn.disabled = false;
    return;
  }
  
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', title);
  formData.append('description', descriptionInput.value.trim());
  formData.append('requiredTier', tierSelect.value);
  
  const progressDiv = document.getElementById('uploadProgress');
  const resultsDiv = document.getElementById('uploadResults');
  const progressFill = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressStatus = document.getElementById('progressStatus');
  
  if (progressDiv) progressDiv.style.display = 'block';
  if (resultsDiv) resultsDiv.innerHTML = '';
  
  try {
    const token = Auth.storage.getToken();
    
    const xhr = new XMLHttpRequest();
    
    // Progress tracking
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        if (progressFill) progressFill.style.width = percentComplete + '%';
        if (progressPercent) progressPercent.textContent = Math.round(percentComplete) + '%';
      }
    });
    
    // Completion handler
    xhr.addEventListener('load', async () => {
      if (progressDiv) progressDiv.style.display = 'none';
      
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        
        if (data.success) {
          //  UPDATED: Show message about compression
          showCustomAlert('Video uploaded! Compression in progress...', 'Success', '✅');
          form.reset();
          const fileInfo = document.getElementById('fileInfo');
          if (fileInfo) {
            SafeHTML.setHTML(fileInfo, '<span>No file selected</span>');
          }
          await fetchVideos();
          if (submitBtn) submitBtn.disabled = false;
        } else {
          showCustomAlert(data.message || 'Upload failed', 'Error', '❌');
          if (submitBtn) submitBtn.disabled = false;
        }
      } else {
        const data = JSON.parse(xhr.responseText);
        showCustomAlert(data.message || 'Upload failed', 'Error', '❌');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
    
    // Error handler
    xhr.addEventListener('error', () => {
      if (progressDiv) progressDiv.style.display = 'none';
      showCustomAlert('Upload failed due to network error', 'Error', '❌');
      if (submitBtn) submitBtn.disabled = false;
    });
    
    // CORRECTED ROUTE: /api/videos/upload instead of /api/admin/videos/upload
    xhr.open('POST', `${VIDEO_API_URL}/api/videos/upload`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
    
  } catch (error) {
    Logger.error('Upload error:', error);
    if (progressDiv) progressDiv.style.display = 'none';
    showCustomAlert(`Upload failed: ${SafeHTML.escapeText(error.message)}`, 'Error', '❌');
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ============================================
// FETCH VIDEOS
// ============================================

async function fetchVideos() {
  const loadingContainer = document.getElementById('tableLoading');
  const tableContainer = document.getElementById('tableContainer');
  const noResults = document.getElementById('noResults');
  
  try {
    if (loadingContainer) loadingContainer.style.display = 'flex';
    if (tableContainer) tableContainer.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
    
    const token = Auth.storage.getToken();
    
    // CORRECTED ROUTE: /api/videos instead of /api/admin/videos
    const response = await fetch(`${VIDEO_API_URL}/api/videos?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch videos');
    }
    
    allVideos = data.videos || [];
    filteredVideos = [...allVideos];
    
    updateStats();
    renderVideos(filteredVideos);
    
  } catch (error) {
    Logger.error('Fetch videos error:', error);
    showCustomAlert(`Failed to load videos: ${SafeHTML.escapeText(error.message)}`, 'Error', '❌');
    if (noResults) noResults.style.display = 'block';
  } finally {
    if (loadingContainer) loadingContainer.style.display = 'none';
  }
}

// ============================================
// UPDATE STATISTICS
// ============================================

function updateStats() {
  const totalVideos = allVideos.length;
  const activeVideos = allVideos.filter(v => v.is_active).length;
  
  //  NEW: Count by process status
  const processingVideos = allVideos.filter(v => v.status === 'processing').length;
  const readyVideos = allVideos.filter(v => v.status === 'ready').length;
  const failedVideos = allVideos.filter(v => v.status === 'failed').length;
  
  // Calculate total size and ensure it's a number
  const totalSize = allVideos.reduce((sum, v) => {
    const size = parseInt(v.filesize) || 0;
    return sum + size;
  }, 0);
  
  // Debug stats (using Logger)
  Logger.debug('Video stats:', {
    totalVideos,
    activeVideos,
    processingVideos,
    readyVideos,
    failedVideos,
    totalSize
  });
  
  const totalVideosEl = document.getElementById('totalVideos');
  const totalSizeEl = document.getElementById('totalSize');
  const activeVideosEl = document.getElementById('activeVideos');
  
  //  NEW: Processing stats elements (optional - add to HTML if needed)
  const processingVideosEl = document.getElementById('processingVideos');
  const failedVideosEl = document.getElementById('failedVideos');
  
  if (totalVideosEl) totalVideosEl.textContent = totalVideos;
  if (totalSizeEl) totalSizeEl.textContent = formatFileSize(totalSize);
  if (activeVideosEl) activeVideosEl.textContent = activeVideos;
  
  //  NEW: Update processing stats if elements exist
  if (processingVideosEl) processingVideosEl.textContent = processingVideos;
  if (failedVideosEl) failedVideosEl.textContent = failedVideos;
}

// ============================================
// RENDER VIDEOS (Table/List View)
// ============================================

function renderVideos(videos) {
  const tbody = document.getElementById('videosTableBody');
  const tableContainer = document.getElementById('tableContainer');
  const noResults = document.getElementById('noResults');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (videos.length === 0) {
    if (tableContainer) tableContainer.style.display = 'none';
    if (noResults) noResults.style.display = 'block';
    return;
  }
  
  if (tableContainer) tableContainer.style.display = 'block';
  if (noResults) noResults.style.display = 'none';
  
  videos.forEach((video, index) => {
    const row = document.createElement('tr');
    
    //  NEW: Add row class based on status
    if (video.status === 'processing') {
      row.classList.add('row-processing');
    } else if (video.status === 'failed') {
      row.classList.add('row-failed');
    }
    
    // Number
    const numberCell = document.createElement('td');
    numberCell.textContent = index + 1;
    
    // Title
    const titleCell = document.createElement('td');
    titleCell.textContent = video.title || 'Untitled';
    titleCell.style.fontWeight = '600';
    
    // Description
    const descCell = document.createElement('td');
    const desc = video.description || 'No description';
    descCell.textContent = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
    descCell.style.maxWidth = '300px';
    
    // Tier
    const tierCell = document.createElement('td');
    const tierBadge = document.createElement('span');
    tierBadge.className = `tier-badge tier-${video.required_tier}`;
    tierBadge.textContent = getTierBadge(video.required_tier);
    tierCell.appendChild(tierBadge);
    
    // Size
    const sizeCell = document.createElement('td');
    sizeCell.textContent = formatFileSize(video.filesize || 0);
    
    //  NEW: Process Status (processing/ready/failed)
    const processCell = document.createElement('td');
    const processBadge = document.createElement('span');
    const processInfo = getProcessStatusBadge(video.status || 'ready');
    processBadge.className = `status-badge ${processInfo.class}`;
    processBadge.textContent = processInfo.text;
    processCell.appendChild(processBadge);
    
    // Active Status
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${video.is_active ? 'status-active' : 'status-inactive'}`;
    statusBadge.textContent = video.is_active ? 'Active' : 'Inactive';
    statusCell.appendChild(statusBadge);
    
    // Actions
    const actionsCell = document.createElement('td');
    
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn action-edit';
    editBtn.title = 'Edit';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editVideo(video.id);
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'action-btn action-toggle';
    toggleBtn.title = video.is_active ? 'Deactivate' : 'Activate';
    toggleBtn.textContent = video.is_active ? 'Disable' : 'Enable';
    toggleBtn.onclick = () => toggleVideoStatus(video.id, video.is_active);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn action-delete';
    deleteBtn.title = 'Delete Permanently';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => showDeleteModal(video.id);
    
    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(toggleBtn);
    actionsCell.appendChild(deleteBtn);
    
    //  NEW: Add retry button for failed videos
    if (video.status === 'failed') {
      const retryBtn = document.createElement('button');
      retryBtn.className = 'action-btn action-retry';
      retryBtn.title = 'Retry Compression';
      retryBtn.textContent = 'Retry';
      retryBtn.onclick = () => retryCompression(video.id);
      actionsCell.appendChild(retryBtn);
    }
    
    row.appendChild(numberCell);
    row.appendChild(titleCell);
    row.appendChild(descCell);
    row.appendChild(tierCell);
    row.appendChild(sizeCell);
    row.appendChild(processCell);  //  NEW: Process status column
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
}

// ============================================
// FILTER VIDEOS
// ============================================

function filterVideos() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const filterTier = document.getElementById('filterTier').value;
  const filterStatus = document.getElementById('filterStatus').value;
  //  NEW: Process status filter
  const filterProcess = document.getElementById('filterProcess')?.value || '';
  
  filteredVideos = allVideos.filter(video => {
    const matchesSearch = !searchInput || 
      video.title.toLowerCase().includes(searchInput) ||
      (video.description && video.description.toLowerCase().includes(searchInput));
    
    const matchesTier = !filterTier || video.required_tier === filterTier;
    
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && video.is_active) ||
      (filterStatus === 'inactive' && !video.is_active);
    
    //  NEW: Process status filter
    const matchesProcess = !filterProcess || video.status === filterProcess;
    
    return matchesSearch && matchesTier && matchesStatus && matchesProcess;
  });
  
  renderVideos(filteredVideos);
}

// ============================================
// REFRESH VIDEOS
// ============================================

async function refreshVideos() {
  await fetchVideos();
  showCustomAlert('Videos refreshed!', 'Success', '🔄');
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth scripts to load
  await new Promise(r => setTimeout(r, 1000));
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }
  
  const currentUser = Auth.getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'admin') {
    showCustomAlert('Admin access required', 'Access Denied', '');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
    return;
  }
  
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) {
    adminNameEl.textContent = currentUser.username;
  }
  
  await fetchVideos();
  
  //  NEW: Auto-refresh every 30 seconds to check compression status
  setInterval(async () => {
    const hasProcessing = allVideos.some(v => v.status === 'processing');
    if (hasProcessing) {
      await fetchVideos();
    }
  }, 30000);
  
  // Modal click-outside handlers
  window.onclick = (event) => {
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteModal');
    const alertModal = document.getElementById('customAlertModal');
    
    if (event.target === editModal) closeEditModal();
    if (event.target === deleteModal) closeDeleteModal();
    if (event.target === alertModal) closeCustomAlert();
  };
});