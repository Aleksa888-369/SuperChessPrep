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
// ADMIN FORUM - FRONTEND LOGIC (FIXED UTF-8)
// ============================================

// Global state
let currentUser = null;
let isAdmin = false;
let currentFilter = 'all';
let authToken = null;

// API Base URL
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://www.superchessprep.com';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth scripts to load
  await new Promise(r => setTimeout(r, 800));
  await new Promise(r => setTimeout(r, 300));
  // Check authentication and admin status
  await checkAuth();
  
  // Load statistics
  await loadStatistics();
  
  // Load topics table
  await loadTopicsTable();
  
  // Setup event listeners
  setupEventListeners();
});

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuth() {
  try {
    // 1️⃣ Check Auth object (from auth-client.js)
    if (typeof Auth === 'undefined' || !Auth.isLoggedIn()) {
      Logger.error('❌ Not authenticated');
      await showError('You must be logged in to access this page');
      window.location.href = '/login';
      return;
    }

    // 2️⃣ Get current user
    currentUser = Auth.getCurrentUser();
    
    if (!currentUser) {
      Logger.error('❌ No current user');
      await showError('Session expired. Please login again.');
      window.location.href = '/login';
      return;
    }

    // 3️⃣ Check if admin
    isAdmin = currentUser.role === 'admin';
    
    if (!isAdmin) {
      Logger.error('❌ User is not admin:', currentUser.role);
      await showError('Access denied. Admin privileges required.');
      window.location.href = '/dashboard';
      return;
    }

    // 4️⃣ Get token from all possible places (FIRST 'auth_token'!)
    authToken = localStorage.getItem('auth_token')
      || localStorage.getItem('accessToken')
      || localStorage.getItem('session_token')
      || localStorage.getItem('token') 
      || sessionStorage.getItem('token')
      || localStorage.getItem('jwt')
      || sessionStorage.getItem('jwt');

    if (!authToken && typeof Auth.getToken === 'function') {
      authToken = Auth.getToken();
    }

    if (!authToken && currentUser.token) {
      authToken = currentUser.token;
    }

    // Update UI
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      userNameElement.textContent = currentUser.username || 'Admin';
    }
    
  } catch (error) {
    Logger.error('Error in checkAuth:', error);
    await showError('Authentication error. Please login again.');
    window.location.href = '/login';
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Create topic form
  const createTopicForm = document.getElementById('createTopicForm');
  if (createTopicForm) {
    createTopicForm.addEventListener('submit', handleCreateTopic);
  }
  
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadTopicsTable();
    });
  });
}

// ============================================
// API HELPER - with Authorization header
// ============================================

async function apiCall(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add token if exists (Bearer format)
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else {
    Logger.warn('⚠️ Request WITHOUT token:', url);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      Logger.error('API Error:', {
        status: response.status,
        error: data.error,
        message: data.message
      });
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    Logger.error('API Call Error:', error);
    throw error;
  }
}

// ============================================
// LOAD STATISTICS
// ============================================

async function loadStatistics() {
  try {
    const data = await apiCall(`${API_BASE}/api/forum/topics`);
    const topics = data.topics || [];
    
    // Calculate statistics
    const totalTopics = topics.length;
    const openTopics = topics.filter(t => !t.is_closed).length;
    const closedTopics = topics.filter(t => t.is_closed).length;
    const totalPosts = topics.reduce((sum, t) => sum + (t.post_count || 0), 0);
    
    // Update UI
    const totalTopicsEl = document.getElementById('totalTopics');
    const openTopicsEl = document.getElementById('openTopics');
    const closedTopicsEl = document.getElementById('closedTopics');
    const totalPostsEl = document.getElementById('totalPosts');

    if (totalTopicsEl) totalTopicsEl.textContent = totalTopics;
    if (openTopicsEl) openTopicsEl.textContent = openTopics;
    if (closedTopicsEl) closedTopicsEl.textContent = closedTopics;
    if (totalPostsEl) totalPostsEl.textContent = totalPosts;
    
  } catch (error) {
    Logger.error('Error loading statistics:', error);
  }
}

// ============================================
// CREATE TOPIC
// ============================================

async function handleCreateTopic(e) {
  e.preventDefault();
  
  const title = document.getElementById('topicTitle').value.trim();
  const description = document.getElementById('topicDescription').value.trim();
  
  if (title.length < 5) {
    await showWarning('Topic title must be at least 5 characters');
    return;
  }
  
  // Prevent double submit
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn.disabled) return;
  
  submitBtn.disabled = true;
  const originalText = submitBtn.innerHTML;
  SafeHTML.setHTML(submitBtn, '<span>⏳</span><span>Creating...</span>');
  
  try {
    const data = await apiCall(`${API_BASE}/api/forum/topics`, {
      method: 'POST',
      body: JSON.stringify({ title, description })
    });
    
    await showSuccess('Topic created successfully!');
    document.getElementById('createTopicForm').reset();
    
    await loadStatistics();
    await loadTopicsTable();
    
  } catch (error) {
    Logger.error('Error creating topic:', error);
    await showError(error.message);
  } finally {
    submitBtn.disabled = false;
    SafeHTML.setHTML(submitBtn, originalText);
  }
}

// ============================================
// LOAD TOPICS TABLE
// ============================================

async function loadTopicsTable() {
  const tbody = document.getElementById('topicsTableBody');
  const loading = document.getElementById('tableLoading');
  const empty = document.getElementById('tableEmpty');
  
  if (!tbody) return;
  
  loading.style.display = 'block';
  tbody.innerHTML = '';
  empty.style.display = 'none';
  
  try {
    const filterParam = currentFilter !== 'all' ? `?filter=${currentFilter}` : '';
    const data = await apiCall(`${API_BASE}/api/forum/topics${filterParam}`);
    
    loading.style.display = 'none';
    
    if (data.topics && data.topics.length > 0) {
      renderTopicsTable(data.topics);
    } else {
      empty.style.display = 'block';
    }
    
  } catch (error) {
    Logger.error('Error loading topics:', error);
    loading.style.display = 'none';
    SafeHTML.setHTML(tbody, `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
          ⚠️ Failed to load topics: ${SafeHTML.escapeText(error.message)}
        </td>
      </tr>
    `);
  }
}

// ============================================
// RENDER TOPICS TABLE
// ============================================

function renderTopicsTable(topics) {
  const tbody = document.getElementById('topicsTableBody');
  
  SafeHTML.setHTML(tbody, topics.map(topic => {
    const statusClass = topic.is_closed ? 'closed' : 'open';
    const statusText = topic.is_closed ? '🔒 Closed' : '🔓 Open';
    const createdDate = new Date(topic.created_at).toLocaleDateString();
    
    const toggleButton = topic.is_closed 
      ? `<button class="btn-open" onclick="toggleTopicStatus('${topic.id}', false)">🔓 Open</button>`
      : `<button class="btn-close" onclick="toggleTopicStatus('${topic.id}', true)">🔒 Close</button>`;
    
    return `
      <tr>
        <td class="topic-title-cell">${escapeHtml(topic.title)}</td>
        <td>${topic.post_count || 0}</td>
        <td><span class="topic-status-badge ${statusClass}">${statusText}</span></td>
        <td>${createdDate}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-view" onclick="viewTopic('${topic.id}')">
              👁️ View
            </button>
            ${toggleButton}
            <button class="btn-delete" onclick="handleDeleteTopic('${topic.id}')">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join(''));
}

// ============================================
// VIEW TOPIC
// ============================================

function viewTopic(topicId) {
  window.location.href = `/forum-topic?id=${topicId}`;
}

// ============================================
// TOGGLE TOPIC STATUS
// ============================================

async function toggleTopicStatus(topicId, isClosed) {
  const action = isClosed ? 'close' : 'open';
  const actionTitle = isClosed ? 'Close Topic' : 'Reopen Topic';
  
  const confirmed = await customConfirm(
    `Are you sure you want to ${action} this topic?`,
    actionTitle,
    {
      confirmText: isClosed ? 'Close' : 'Reopen',
      cancelText: 'Cancel'
    }
  );
  
  if (!confirmed) return;
  
  try {
    const data = await apiCall(`${API_BASE}/api/forum/topics/${topicId}/${action}`, {
      method: 'PUT'
    });
    
    await loadStatistics();
    await loadTopicsTable();
    
  } catch (error) {
    Logger.error(`Error ${action}ing topic:`, error);
    await showError(error.message);
  }
}

// ============================================
// DELETE TOPIC
// ============================================

async function handleDeleteTopic(topicId) {
  const confirmed = await confirmDelete('this topic (including all posts and comments)');
  
  if (!confirmed) return;
  
  // Double confirmation for destructive action
  const doubleConfirm = await customConfirm(
    '<strong>This action cannot be undone!</strong><br><br>All posts and comments in this topic will be permanently deleted.',
    'Final Confirmation',
    {
      confirmText: 'Yes, Delete Forever',
      cancelText: 'Cancel',
      type: 'warning'
    }
  );
  
  if (!doubleConfirm) return;
  
  try {
    const data = await apiCall(`${API_BASE}/api/forum/topics/${topicId}`, {
      method: 'DELETE'
    });
    
    await showSuccess('Topic deleted successfully');
    await loadStatistics();
    await loadTopicsTable();
    
  } catch (error) {
    Logger.error('Error deleting topic:', error);
    await showError(error.message);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// ERROR HANDLING
// ============================================

window.addEventListener('error', (e) => {
  Logger.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  Logger.error('Unhandled promise rejection:', e.reason);
});