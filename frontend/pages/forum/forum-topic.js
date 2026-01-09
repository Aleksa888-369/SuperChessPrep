// ============================================
// FORUM TOPIC - FRONTEND LOGIC (STYLED MODALS)
// ============================================

// Global state
let currentUser = null;
let isAdmin = false;
let topicId = null;
let currentTopic = null;
let editingPostId = null;
let editingCommentId = null;
let authToken = null;

// API Base URL
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : 'https://www.superchessprep.com';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Get topic ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  topicId = urlParams.get('id');
  
  if (!topicId) {
    // ✅ Styled modal
    if (typeof showError === 'function') {
      await showError('Invalid topic ID');
    } else {
      alert('Invalid topic ID');
    }
    window.location.href = '/community';
    return;
  }
  
  // Check authentication
  await checkAuth();
  
  // Load topic and posts
  await loadTopic();
  await loadPosts();
  
  // Setup event listeners
  setupEventListeners();
});

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuth() {
  // ✅ Check all possible tokens
  authToken = localStorage.getItem('auth_token')
    || localStorage.getItem('accessToken')
    || localStorage.getItem('session_token')
    || localStorage.getItem('token');
  
  if (!authToken) {
    window.location.href = '/login';
    return;
  }
  
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    currentUser = payload;
    isAdmin = payload.role === 'admin';
    
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = payload.username || 'User';
    }
    
    const tierBadge = document.getElementById('userTierBadge');
    if (tierBadge) {
      const tier = payload.subscription_tier || 'free';
      tierBadge.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
      tierBadge.className = `user-tier-badge ${tier}`;
    }
    
  } catch (error) {
    Logger.error('Error decoding token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // New post form
  const postForm = document.getElementById('newPostForm');
  if (postForm) {
    postForm.addEventListener('submit', handleNewPost);
  }
  
  // Character counter
  const postContent = document.getElementById('postContent');
  if (postContent) {
    postContent.addEventListener('input', updateCharCount);
  }
  
  // Edit post form
  const editPostForm = document.getElementById('editPostForm');
  if (editPostForm) {
    editPostForm.addEventListener('submit', handleEditPost);
  }
  
  // Edit comment form
  const editCommentForm = document.getElementById('editCommentForm');
  if (editCommentForm) {
    editCommentForm.addEventListener('submit', handleEditComment);
  }
}

// ============================================
// LOAD TOPIC
// ============================================

async function loadTopic() {
  try {
    const response = await fetch(`${API_BASE}/api/forum/topics/${topicId}`);
    
    if (!response.ok) {
      throw new Error('Topic not found');
    }
    
    const data = await response.json();
    currentTopic = data.topic;
    
    // Update breadcrumb
    const breadcrumbEl = document.getElementById('breadcrumbTopic');
    if (breadcrumbEl) {
      breadcrumbEl.textContent = currentTopic.title;
    }
    
    // Render topic header
    renderTopicHeader();
    
  } catch (error) {
    Logger.error('Error loading topic:', error);
    // ✅ Styled modal
    if (typeof showError === 'function') {
      await showError('Failed to load topic');
    } else {
      alert('Failed to load topic');
    }
    window.location.href = '/community';
  }
}

// ============================================
// RENDER TOPIC HEADER
// ============================================

function renderTopicHeader() {
  const headerContainer = document.getElementById('topicHeader');
  if (!headerContainer) return;
  
  const statusClass = currentTopic.is_closed ? 'closed' : 'open';
  const statusText = currentTopic.is_closed ? '🔒 Closed' : '🔓 Open';
  
  // Admin actions
  const adminButtons = isAdmin ? `
    <div class="admin-actions">
      ${currentTopic.is_closed 
        ? `<button class="btn-open-topic" onclick="toggleTopicStatus(false)">🔓 Open Topic</button>`
        : `<button class="btn-close-topic" onclick="toggleTopicStatus(true)">🔒 Close Topic</button>`
      }
      <button class="btn-delete-topic" onclick="handleDeleteTopic()">🗑️ Delete Topic</button>
    </div>
  ` : '';
  
  SafeHTML.setHTML(headerContainer, `
    <div class="topic-title-row">
      <h1 class="topic-title">${escapeHtml(currentTopic.title)}</h1>
      <div class="topic-status ${statusClass}">${statusText}</div>
    </div>
    
    ${currentTopic.description ? `
      <p class="topic-description">${escapeHtml(currentTopic.description)}</p>
    ` : ''}
    
    <div class="topic-meta">
      <div class="topic-info">
        <div class="topic-info-item">
          <span>💬</span>
          <span>${currentTopic.post_count || 0} posts</span>
        </div>
        <div class="topic-info-item">
          <span>👤</span>
          <span>Created by ${currentTopic.created_by_username || 'Admin'}</span>
        </div>
        <div class="topic-info-item">
          <span>📅</span>
          <span>${new Date(currentTopic.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      ${adminButtons}
    </div>
  `);
  
  // Hide new post form if topic is closed
  const newPostSection = document.getElementById('newPostSection');
  if (newPostSection) {
    if (currentTopic.is_closed) {
      newPostSection.style.display = 'none';
    } else {
      newPostSection.style.display = 'block';
    }
  }
}

// ============================================
// LOAD POSTS
// ============================================

async function loadPosts() {
  const container = document.getElementById('postsContainer');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  
  if (!container) return;
  
  if (loadingState) loadingState.style.display = 'block';
  container.style.display = 'none';
  if (emptyState) emptyState.style.display = 'none';
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/topics/${topicId}/posts`);
    
    if (!response.ok) {
      throw new Error('Failed to load posts');
    }
    
    const data = await response.json();
    
    if (loadingState) loadingState.style.display = 'none';
    
    if (data.posts && data.posts.length > 0) {
      container.style.display = 'flex';
      await renderPosts(data.posts);
    } else {
      if (emptyState) emptyState.style.display = 'block';
    }
    
  } catch (error) {
    Logger.error('Error loading posts:', error);
    if (loadingState) loadingState.style.display = 'none';
    SafeHTML.setHTML(container, '<p style="color: #ef4444);">Failed to load posts. Please try again.</p>';
    container.style.display = 'block';
  }
}

// ============================================
// RENDER POSTS
// ============================================

async function renderPosts(posts) {
  const container = document.getElementById('postsContainer');
  if (!container) return;
  
  const postsHtml = await Promise.all(posts.map(async post => {
    const username = post.current_username || post.username || 'User';
    const canEdit = isAdmin || post.user_id === currentUser.id;
    
    const editButtons = canEdit ? `
      <div class="post-actions">
        <button class="btn-edit" onclick="openEditPostModal('${post.id}', \`${escapeBackticks(post.content)}\`)">
          ✏️ Edit
        </button>
        <button class="btn-delete" onclick="handleDeletePost('${post.id}')">
          🗑️ Delete
        </button>
      </div>
    ` : '';
    
    // Load comments for this post
    const comments = await loadCommentsForPost(post.id);
    const commentsHtml = renderComments(comments, post.id);
    
    return `
      <div class="post-card">
        <div class="post-header">
          <div class="post-author-info">
            <div class="post-avatar">${username.charAt(0).toUpperCase()}</div>
            <div class="post-author-details">
              <span class="post-author-name">${username}</span>
              <span class="post-date">${formatDate(post.created_at)}</span>
            </div>
          </div>
          ${editButtons}
        </div>
        
        <div class="post-content">${escapeHtml(post.content)}</div>
        
        <div class="post-footer">
          <div class="comment-toggle" onclick="toggleComments('${post.id}')">
            <span>💬</span>
            <span>${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}</span>
          </div>
        </div>
        
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
          ${!currentTopic.is_closed ? `
            <div class="new-comment-form">
              <textarea id="comment-input-${post.id}" placeholder="Add a comment..." rows="2" maxlength="2000"></textarea>
              <button onclick="handleNewComment('${post.id}')">Post Comment</button>
            </div>
          ` : ''}
          
          <div id="comments-list-${post.id}">
            ${commentsHtml}
          </div>
        </div>
      </div>
    `;
  }));
  
  SafeHTML.setHTML(container, postsHtml.join(''), SafeHTML.configs.FORUM);
}

// ============================================
// LOAD COMMENTS
// ============================================

async function loadCommentsForPost(postId) {
  try {
    const response = await fetch(`${API_BASE}/api/forum/posts/${postId}/comments`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.comments || [];
    
  } catch (error) {
    Logger.error('Error loading comments:', error);
    return [];
  }
}

// ============================================
// RENDER COMMENTS
// ============================================

function renderComments(comments, postId) {
  if (!comments || comments.length === 0) {
    return '<p style="color: #999; font-size: 13px; text-align: center; padding: 10px;">No comments yet</p>';
  }
  
  return comments.map(comment => {
    const username = comment.current_username || comment.username || 'User';
    const canEdit = isAdmin || comment.user_id === currentUser.id;
    
    const editButtons = canEdit ? `
      <div class="post-actions" style="margin-top: 8px;">
        <button class="btn-edit" onclick="openEditCommentModal('${comment.id}', \`${escapeBackticks(comment.content)}\`)">
          ✏️ Edit
        </button>
        <button class="btn-delete" onclick="handleDeleteComment('${comment.id}', '${postId}')">
          🗑️ Delete
        </button>
      </div>
    ` : '';
    
    return `
      <div class="comment-card">
        <div class="comment-header">
          <span class="comment-author">${username}</span>
          <span class="comment-date">${formatDate(comment.created_at)}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content)}</div>
        ${editButtons}
      </div>
    `;
  }).join('');
}

// ============================================
// TOGGLE COMMENTS
// ============================================

function toggleComments(postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  if (commentsSection) {
    if (commentsSection.style.display === 'none') {
      commentsSection.style.display = 'block';
    } else {
      commentsSection.style.display = 'none';
    }
  }
}

// ============================================
// NEW POST
// ============================================

async function handleNewPost(e) {
  e.preventDefault();
  
  const content = document.getElementById('postContent').value.trim();
  
  if (content.length < 10) {
    // ✅ Styled modal
    if (typeof showWarning === 'function') {
      await showWarning('Post must be at least 10 characters');
    } else {
      alert('Post must be at least 10 characters');
    }
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/topics/${topicId}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create post');
    }
    
    document.getElementById('postContent').value = '';
    const charCount = document.querySelector('.char-count');
    if (charCount) charCount.textContent = '0 / 5000';
    
    // ✅ Styled success modal
    if (typeof showSuccess === 'function') {
      await showSuccess('Post created successfully!');
    }
    
    await loadTopic();
    await loadPosts();
    
  } catch (error) {
    Logger.error('Error creating post:', error);
    // ✅ Styled error modal
    if (typeof showError === 'function') {
      await showError(error.message);
    } else {
      alert(`Error: ${SafeHTML.escapeText(error.message)}`);
    }
  }
}

// ============================================
// NEW COMMENT
// ============================================

async function handleNewComment(postId) {
  const textarea = document.getElementById(`comment-input-${postId}`);
  const content = textarea.value.trim();
  
  if (content.length < 5) {
    // ✅ Styled modal
    if (typeof showWarning === 'function') {
      await showWarning('Comment must be at least 5 characters');
    } else {
      alert('Comment must be at least 5 characters');
    }
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create comment');
    }
    
    textarea.value = '';
    
    // ✅ Styled success modal
    if (typeof showSuccess === 'function') {
      await showSuccess('Comment posted successfully!');
    }
    
    await loadPosts();
    
  } catch (error) {
    Logger.error('Error creating comment:', error);
    // ✅ Styled error modal
    if (typeof showError === 'function') {
      await showError(error.message);
    } else {
      alert(`Error: ${SafeHTML.escapeText(error.message)}`);
    }
  }
}

// ============================================
// EDIT POST
// ============================================

function openEditPostModal(postId, content) {
  editingPostId = postId;
  const editPostContent = document.getElementById('editPostContent');
  if (editPostContent) {
    editPostContent.value = content;
  }
  const editPostModal = document.getElementById('editPostModal');
  if (editPostModal) {
    editPostModal.classList.add('active');
  }
}

function closeEditPostModal() {
  editingPostId = null;
  const editPostModal = document.getElementById('editPostModal');
  if (editPostModal) {
    editPostModal.classList.remove('active');
  }
  const editPostForm = document.getElementById('editPostForm');
  if (editPostForm) {
    editPostForm.reset();
  }
}

async function handleEditPost(e) {
  e.preventDefault();
  
  const content = document.getElementById('editPostContent').value.trim();
  
  if (!editingPostId) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/posts/${editingPostId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update post');
    }
    
    closeEditPostModal();
    
    // ✅ Styled success modal
    if (typeof showSuccess === 'function') {
      await showSuccess('Post updated successfully!');
    }
    
    await loadPosts();
    
  } catch (error) {
    Logger.error('Error updating post:', error);
    // ✅ Styled error modal
    if (typeof showError === 'function') {
      await showError(error.message);
    } else {
      alert(`Error: ${SafeHTML.escapeText(error.message)}`);
    }
  }
}

// ============================================
// DELETE POST
// ============================================

async function handleDeletePost(postId) {
  // ✅ Styled confirm modal
  let confirmed = false;
  
  if (typeof customConfirm === 'function') {
    confirmed = await customConfirm(
      'Are you sure you want to delete this post?<br><br><strong>All comments will also be deleted!</strong>',
      'Delete Post',
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'warning'
      }
    );
  } else {
    confirmed = confirm('Are you sure you want to delete this post?');
  }
  
  if (!confirmed) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete post');
    }
    
    // ✅ Styled success modal
    if (typeof showSuccess === 'function') {
      await showSuccess('Post deleted successfully!');
    }
    
    await loadTopic();
    await loadPosts();
    
  } catch (error) {
    Logger.error('Error deleting post:', error);
    // ✅ Styled error modal
    if (typeof showError === 'function') {
      await showError(error.message);
    } else {
      alert(`Error: ${SafeHTML.escapeText(error.message)}`);
    }
  }
}

// ============================================
// EDIT COMMENT
// ============================================

function openEditCommentModal(commentId, content) {
  editingCommentId = commentId;
  const editCommentContent = document.getElementById('editCommentContent');
  if (editCommentContent) {
    editCommentContent.value = content;
  }
  const editCommentModal = document.getElementById('editCommentModal');
  if (editCommentModal) {
    editCommentModal.classList.add('active');
  }
}

function closeEditCommentModal() {
  editingCommentId = null;
  const editCommentModal = document.getElementById('editCommentModal');
  if (editCommentModal) {
    editCommentModal.classList.remove('active');
  }
  const editCommentForm = document.getElementById('editCommentForm');
  if (editCommentForm) {
    editCommentForm.reset();
  }
}

async function handleEditComment(e) {
  e.preventDefault();
  
  const content = document.getElementById('editCommentContent').value.trim();
  
  if (!editingCommentId) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/comments/${editingCommentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update comment');
    }
    
    closeEditCommentModal();
    
    // ✅ Styled success modal
    if (typeof showSuccess === 'function') {
      await showSuccess('Comment updated successfully!');
    }
    
    await loadPosts();
    
  } catch (error) {
    Logger.error('Error updating comment:', error);
    // ✅ Styled error modal
    if (typeof showError === 'function') {
      await showError(error.message);
    } else {
      alert(`Error: ${SafeHTML.escapeText(error.message)}`);
    }
  }
}

// ============================================
// DELETE COMMENT
// ============================================

async function handleDeleteComment(commentId, postId) {
  // ✅ Styled confirm modal
  let confirmed = false;
  
  if (typeof customConfirm === 'function') {
    confirmed = await customConfirm(
      'Are you sure you want to delete this comment?',
      'Delete Comment',
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'warning'
      }
    );
  } else {
    confirmed = confirm('Are you sure you want to delete this comment?');
  }
  
  if (!confirmed) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete comment');
    }
    
    // ✅ Styled success modal
    if (typeof showSuccess === 'function') {
      await showSuccess('Comment deleted successfully!');
    }
    
    await loadPosts();
    
  } catch (error) {
    Logger.error('Error deleting comment:', error);
    // ✅ Styled error modal
    if (typeof showError === 'function') {
      await showError(error.message);
    } else {
      alert(`Error: ${SafeHTML.escapeText(error.message)}`);
    }
  }
}

// ============================================
// TOPIC MANAGEMENT (Admin Only)
// ============================================

async function toggleTopicStatus(isClosed) {
  const action = isClosed ? 'close' : 'open';
  const actionTitle = isClosed ? 'Close Topic' : 'Reopen Topic';
  
  // ✅ Styled confirm modal
  let confirmed = false;
  
  if (typeof customConfirm === 'function') {
    confirmed = await customConfirm(
      `Are you sure you want to ${action} this topic?`,
      actionTitle,
      {
        confirmText: isClosed ? 'Close' : 'Reopen',
        cancelText: 'Cancel',
        type: 'warning'
      }
    );
  } else {
    confirmed = confirm(`Are you sure you want to ${action} this topic?`);
  }
  
  if (!confirmed) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/topics/${topicId}/${action}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Failed to ${action} topic`);
    }
    
    // ✅ Styled success modal
    if (typeof showSuccess === 'function') {
      await showSuccess(`Topic ${action === 'close' ? 'closed' : 'reopened'} successfully!`);
    }
    
    await loadTopic();
    await loadPosts();
    
  } catch (error) {
    Logger.error(`Error ${action}ing topic:`, error);
    // ✅ Styled error modal
    if (typeof showError === 'function') {
      await showError(error.message);
    } else {
      alert(`Error: ${SafeHTML.escapeText(error.message)}`);
    }
  }
}

async function handleDeleteTopic() {
  // ✅ Styled confirm modal
  let confirmed = false;
  
  if (typeof customConfirm === 'function') {
    confirmed = await customConfirm(
      'Are you sure you want to delete this topic?<br><br><strong>This will delete ALL posts and comments!</strong>',
      'Delete Topic',
      {
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'warning'
      }
    );
  } else {
    confirmed = confirm('Are you sure you want to delete this topic? This will delete all posts and comments!');
  }
  
  if (!confirmed) return;
  
  // Double confirmation for destructive action
  let doubleConfirm = false;
  
  if (typeof customConfirm === 'function') {
    doubleConfirm = await customConfirm(
      '<strong>This action cannot be undone!</strong><br><br>All posts and comments will be permanently deleted.',
      'Final Confirmation',
      {
        confirmText: 'Yes, Delete Forever',
        cancelText: 'Cancel',
        type: 'warning'
      }
    );
  } else {
    doubleConfirm = confirm('FINAL WARNING: This action cannot be undone! Continue?');
  }
  
  if (!doubleConfirm) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/forum/topics/${topicId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete topic');
    }
    
    // ✅ Styled success modal
    if (typeof showSuccess === 'function') {
      await showSuccess('Topic deleted successfully!');
    } else {
      alert('Topic deleted successfully');
    }
    
    window.location.href = '/community';
    
  } catch (error) {
    Logger.error('Error deleting topic:', error);
    // ✅ Styled error modal
    if (typeof showError === 'function') {
      await showError(error.message);
    } else {
      alert(`Error: ${SafeHTML.escapeText(error.message)}`);
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function updateCharCount() {
  const textarea = document.getElementById('postContent');
  const charCount = document.querySelector('.char-count');
  if (textarea && charCount) {
    charCount.textContent = `${textarea.value.length} / 5000`;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeBackticks(text) {
  return text.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}
