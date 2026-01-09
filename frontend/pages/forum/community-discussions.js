// ============================================
// COMMUNITY DISCUSSIONS - FRONTEND LOGIC
// ============================================

// Global state
let currentFilter = 'all';
let currentUser = null;
let isAdmin = false;
let currentPage = 1;
let totalPages = 1;
const TOPICS_PER_PAGE = 9; // 3x3 grid

// API Base URL
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://www.superchessprep.com';

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

function showToast(title, message, type = 'success') {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  
  const icon = type === 'success' ? '✅' : '❌';
  
  SafeHTML.setHTML(toast, `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `);
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  await checkAuth();
  
  // Load topics
  await loadTopics();
  
  // Setup event listeners
  setupEventListeners();
});

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuth() {
  // Wait for auth scripts to load
  await new Promise(r => setTimeout(r, 800));
  // Use AuthHelper for robust auth checking
  var user = null;
  
  if (typeof AuthHelper !== 'undefined') {
    user = await AuthHelper.requireLogin('/login');
    if (!user) return;
  } else {
    // Fallback
    var token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    try { user = JSON.parse(atob(token.split('.')[1])); } 
    catch (e) { window.location.href = '/login'; return; }
  }
  
  currentUser = user;
  isAdmin = user.role === 'admin';
  
  var el = document.getElementById('userName');
  if (el) el.textContent = user.username || 'User';
  
  var badge = document.getElementById('userTierBadge');
  if (badge) {
    var tier = user.subscription_tier || 'free';
    badge.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
    badge.className = 'user-tier-badge ' + tier;
  }
  
  if (isAdmin) {
    var btn = document.getElementById('createTopicBtn');
    if (btn) btn.style.display = 'flex';
  }
}
// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadTopics();
    });
  });
  
  // Create topic button (admin only)
  const createBtn = document.getElementById('createTopicBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      openCreateModal();
    });
  }
  
  // Modal controls
  document.getElementById('closeModalBtn').addEventListener('click', closeCreateModal);
  document.getElementById('cancelCreateBtn').addEventListener('click', closeCreateModal);
  document.getElementById('createTopicForm').addEventListener('submit', handleCreateTopic);
  
  // Close modal on outside click
  document.getElementById('createTopicModal').addEventListener('click', (e) => {
    if (e.target.id === 'createTopicModal') {
      closeCreateModal();
    }
  });
}

// ============================================
// LOAD TOPICS
// ============================================

async function loadTopics() {
  const container = document.getElementById('topicsContainer');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  
  // Show loading
  loadingState.style.display = 'block';
  container.style.display = 'none';
  emptyState.style.display = 'none';
  
  try {
    const filterParam = currentFilter !== 'all' ? `?filter=${currentFilter}` : '';
    const response = await fetch(`${API_BASE}/api/forum/topics${filterParam}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch topics');
    }
    
    const data = await response.json();
    
    // Hide loading
    loadingState.style.display = 'none';
    
    if (data.topics && data.topics.length > 0) {
      container.style.display = 'grid';
      renderTopics(data.topics);
    } else {
      emptyState.style.display = 'block';
    }
    
  } catch (error) {
    Logger.error('Error loading topics:', error);
    loadingState.style.display = 'none';
    SafeHTML.setHTML(container, `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
        <p>⚠️ Failed to load topics. Please try again later.</p>
      </div>
    `);
    container.style.display = 'grid';
  }
}

// ============================================
// RENDER TOPICS
// ============================================

function renderTopics(topics) {
  const container = document.getElementById('topicsContainer');
  
  SafeHTML.setHTML(container, topics.map(topic => {
    const statusClass = topic.is_closed ? 'closed' : 'open';
    const statusText = topic.is_closed ? '🔒 Closed' : '🔓 Open';
    const createdDate = new Date(topic.created_at).toLocaleDateString();
    
    return `
      <div class="topic-card" data-topic-id="${topic.id}">
        <div class="topic-header">
          <div style="flex: 1;">
            <h3 class="topic-title">${escapeHtml(topic.title)}</h3>
          </div>
          <div class="topic-status ${statusClass}">${statusText}</div>
        </div>
        
        ${topic.description ? `
          <p class="topic-description">${escapeHtml(topic.description)}</p>
        ` : ''}
        
        <div class="topic-meta">
          <div class="topic-stats">
            <div class="stat-item">
              <span>💬</span>
              <span>${topic.post_count || 0} posts</span>
            </div>
            <div class="stat-item">
              <span>📅</span>
              <span>${createdDate}</span>
            </div>
          </div>
          <div class="topic-author">
            by ${topic.created_by_username || 'Admin'}
          </div>
        </div>
      </div>
    `;
  }).join(''));
  
  // Add click handlers after render
  container.querySelectorAll('.topic-card[data-topic-id]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      viewTopic(card.dataset.topicId);
    });
  });
}

// ============================================
// VIEW TOPIC
// ============================================

function viewTopic(topicId) {
  window.location.href = `/forum-topic?id=${topicId}`;
}

// ============================================
// CREATE TOPIC MODAL
// ============================================

function openCreateModal() {
  document.getElementById('createTopicModal').classList.add('active');
  document.getElementById('topicTitle').focus();
}

function closeCreateModal() {
  document.getElementById('createTopicModal').classList.remove('active');
  document.getElementById('createTopicForm').reset();
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
  
  const token = localStorage.getItem('auth_token')
    || localStorage.getItem('accessToken')
    || localStorage.getItem('session_token')
    || localStorage.getItem('token');
  
  // Prevent double submit
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn.disabled) return;
  
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Creating...';
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create topic');
    }
    
    // Success
    closeCreateModal();
    await showSuccess('Topic created successfully!');
    loadTopics(); // Reload topics
    
  } catch (error) {
    Logger.error('Error creating topic:', error);
    await showError(error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
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
