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
// NEWS ADMIN - FRONTEND JAVASCRIPT
// ============================================

let allArticles = [];
let currentFilter = 'all';
let editingArticleId = null;

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth scripts to load
  await new Promise(r => setTimeout(r, 800));
  await new Promise(r => setTimeout(r, 300));
  // Check if Auth is loaded
  if (typeof Auth === 'undefined') {
    Logger.error('[ERROR] Auth system not loaded');
    window.location.href = '/dashboard';
    return;
  }

  // Check if user is logged in
  if (!Auth.isLoggedIn()) {
    Logger.warn('[WARNING] User not logged in');
    window.location.href = '/dashboard';
    return;
  }

  // Check if user is admin
  const user = Auth.getCurrentUser();
  if (!user || user.role !== 'admin') {
    Logger.warn('[WARNING] User is not admin:', user);
    window.location.href = '/dashboard';
    return;
  }

  // Setup user info
  const userNameEl = document.getElementById('userName'); if (userNameEl) userNameEl.textContent = user.username;
  
  // Load data
  loadStats();
  loadArticles();
  setupEventListeners();
});

// ============================================
// GET AUTH TOKEN
// ============================================

function getAuthToken() {
  if (typeof Auth !== 'undefined' && Auth.storage && Auth.storage.getToken) {
    return Auth.storage.getToken();
  }
  return localStorage.getItem('auth_token') || localStorage.getItem('session_token');
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Create article form
  const createForm = document.getElementById('createArticleForm');
  createForm.addEventListener('submit', handleCreateArticle);

  // Media type change
  const mediaType = document.getElementById('mediaType');
  mediaType.addEventListener('change', (e) => {
    const videoDurationGroup = document.getElementById('videoDurationGroup');
    videoDurationGroup.style.display = e.target.value === 'video' ? 'block' : 'none';
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      filterArticles();
    });
  });
}

// ============================================
// LOAD STATISTICS
// ============================================

async function loadStats() {
  try {
    const token = getAuthToken();
    const response = await fetch('/api/news/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (data.success && data.stats) {
      document.getElementById('totalArticles').textContent = data.stats.total_articles || 0;
      document.getElementById('publishedArticles').textContent = data.stats.published_articles || 0;
      document.getElementById('featuredArticles').textContent = data.stats.featured_articles || 0;
      document.getElementById('totalViews').textContent = data.stats.total_views || 0;
    }
  } catch (error) {
    Logger.error('Error loading stats:', error);
  }
}

// ============================================
// LOAD ARTICLES
// ============================================

async function loadArticles() {
  try {
    const token = getAuthToken();
    const response = await fetch('/api/news/articles', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (data.success) {
      allArticles = data.articles;
      filterArticles();
    }
  } catch (error) {
    Logger.error('Error loading articles:', error);
    showNotification('Error loading articles', 'error');
  }
}

// ============================================
// FILTER ARTICLES
// ============================================

function filterArticles() {
  let filtered = allArticles;

  switch (currentFilter) {
    case 'published':
      filtered = allArticles.filter(a => a.published_at !== null);
      break;
    case 'unpublished':
      filtered = allArticles.filter(a => a.published_at === null);
      break;
    case 'featured':
      filtered = allArticles.filter(a => a.is_featured);
      break;
  }

  displayArticles(filtered);
}

// ============================================
// DISPLAY ARTICLES
// ============================================

function displayArticles(articles) {
  const container = document.getElementById('articlesContainer');
  
  if (articles.length === 0) {
    SafeHTML.setHTML(container, '<p style="text-align: center; color: #888; padding: 2rem;">No articles found.</p>');
    return;
  }

  SafeHTML.setHTML(container, articles.map(article => `
    <div class="topic-card">
      <div class="topic-header">
        <div class="topic-info">
          <h3 class="topic-title">${escapeHtml(article.title)}</h3>
          <div class="topic-meta">
            <span class="topic-badge">${escapeHtml(article.category)}</span>
            <span class="topic-badge" style="background: ${article.published_at ? '#28a745' : '#ffc107'};">
              ${article.published_at ? 'Published' : 'Draft'}
            </span>
            ${article.is_featured ? '<span class="topic-badge" style="background: #ff8c00;">Featured</span>' : ''}
            <span class="topic-date">${formatDate(article.created_at)}</span>
            <span class="topic-date">${article.views || 0} views</span>
          </div>
          ${article.excerpt ? `<p style="color: #888; margin-top: 0.5rem;">${escapeHtml(article.excerpt)}</p>` : ''}
        </div>
        
        <div class="topic-actions">
          ${!article.published_at ? `
            <button class="action-btn" onclick="publishArticle(${article.id}, true)" title="Publish">
              Publish
            </button>
          ` : `
            <button class="action-btn" onclick="publishArticle(${article.id}, false)" title="Unpublish">
              Unpublish
            </button>
          `}
          
          ${!article.is_featured ? `
            <button class="action-btn" onclick="featureArticle(${article.id}, true)" title="Set Featured">
              Feature
            </button>
          ` : `
            <button class="action-btn" onclick="featureArticle(${article.id}, false)" title="Unfeature">
              Unfeature
            </button>
          `}
          
          <button class="action-btn" onclick="editArticle(${article.id})" title="Edit">
            Edit
          </button>
          
          <button class="action-btn danger" onclick="deleteArticle(${article.id})" title="Delete">
            Delete
          </button>
          
          <a href="/news-article?id=${article.id}" class="action-btn" target="_blank" title="View">
            View
          </a>
        </div>
      </div>
    </div>
  `).join(''));
}

// ============================================
// CREATE ARTICLE
// ============================================

async function handleCreateArticle(e) {
  e.preventDefault();

  const token = getAuthToken();
  if (!token) {
    showNotification('Not authenticated', 'error');
    return;
  }

  const articleData = {
    title: document.getElementById('articleTitle').value.trim(),
    excerpt: document.getElementById('articleExcerpt').value.trim() || null,
    content: document.getElementById('articleContent').value.trim(),
    category: document.getElementById('articleCategory').value,
    author_name: document.getElementById('authorName').value.trim(),
    author_role: document.getElementById('authorRole').value.trim() || null,
    thumbnail_url: document.getElementById('thumbnailUrl').value.trim() || null,
    media_type: document.getElementById('mediaType').value,
    media_url: document.getElementById('mediaUrl').value.trim() || null,
    video_duration: document.getElementById('videoDuration').value.trim() || null,
    is_featured: document.getElementById('isFeatured').checked,
    publish_now: document.getElementById('publishNow').checked
  };

  try {
    const url = editingArticleId 
      ? `/api/news/articles/${editingArticleId}`
      : '/api/news/articles';
    
    const method = editingArticleId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(articleData)
    });

    const data = await response.json();

    if (data.success) {
      showNotification(
        editingArticleId ? 'Article updated successfully!' : 'Article created successfully!',
        'success'
      );
      
      // Reset form
      const form = document.getElementById('createArticleForm');
      if (form) form.reset();
      
      const publishNowEl = document.getElementById('publishNow');
      if (publishNowEl) publishNowEl.checked = true; // Reset default
      
      editingArticleId = null;
      
      // Reset button text
      const submitBtn = document.querySelector('#createArticleForm .btn-create-article');
      if (submitBtn) {
        SafeHTML.setHTML(submitBtn, '&#128221); Create Article');
      }
      
      // Reload data
      loadStats();
      loadArticles();
      
      // Scroll to articles list
      const topicsSection = document.querySelector('.topics-section');
      if (topicsSection) {
        topicsSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      showNotification(data.error || 'Failed to save article', 'error');
    }
  } catch (error) {
    Logger.error('Error saving article:', error);
    showNotification('Error saving article', 'error');
  }
}

// ============================================
// EDIT ARTICLE
// ============================================

async function editArticle(articleId) {
  const token = getAuthToken();
  
  try {
    // Fetch full article data including content
    const response = await fetch(`/api/news/articles/${articleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success || !data.article) {
      showNotification('Failed to load article for editing', 'error');
      return;
    }
    
    const article = data.article;
    // Check if form exists
    const form = document.getElementById('createArticleForm');
    if (!form) {
      Logger.error('[ERROR] Form not found!');
      showNotification('Form not found. Please refresh the page.', 'error');
      return;
    }

    // Populate form with null checks
    const fields = {
      'articleTitle': article.title || '',
      'articleExcerpt': article.excerpt || '',
      'articleContent': article.content || '',
      'articleCategory': article.category || '',
      'authorName': article.author_name || '',
      'authorRole': article.author_role || '',
      'thumbnailUrl': article.thumbnail_url || '',
      'mediaType': article.media_type || 'image',
      'mediaUrl': article.media_url || '',
      'videoDuration': article.video_duration || ''
    };

    // Set values with null checks
    for (const [id, value] of Object.entries(fields)) {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
      } else {
        Logger.warn(`Element not found: ${id}`);
      }
    }

    // Set checkboxes
    const isFeaturedEl = document.getElementById('isFeatured');
    if (isFeaturedEl) isFeaturedEl.checked = article.is_featured || false;
    
    const publishNowEl = document.getElementById('publishNow');
    if (publishNowEl) publishNowEl.checked = article.published_at !== null;

    // Show/hide video duration
    const videoDurationGroup = document.getElementById('videoDurationGroup');
    if (videoDurationGroup) {
      videoDurationGroup.style.display = article.media_type === 'video' ? 'block' : 'none';
    }

    // Set editing mode
    editingArticleId = articleId;

    // Update button text
    const submitBtn = document.querySelector('#createArticleForm .btn-create-article');
    if (submitBtn) {
      SafeHTML.setHTML(submitBtn, '&#128221); Update Article');
    }

    // Scroll to form
    const formSection = document.querySelector('.create-topic-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
    
  } catch (error) {
    Logger.error('Error loading article for edit:', error);
    showNotification('Error loading article', 'error');
  }
}

// ============================================
// PUBLISH/UNPUBLISH ARTICLE
// ============================================

async function publishArticle(articleId, publish) {
  const token = getAuthToken();
  if (!token) {
    showNotification('Not authenticated', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/news/articles/${articleId}/publish`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ publish })
    });

    const data = await response.json();

    if (data.success) {
      showNotification(
        publish ? 'Article published!' : 'Article unpublished!',
        'success'
      );
      loadStats();
      loadArticles();
    } else {
      showNotification(data.error || 'Failed to update publish status', 'error');
    }
  } catch (error) {
    Logger.error('Error updating publish status:', error);
    showNotification('Error updating publish status', 'error');
  }
}

// ============================================
// FEATURE/UNFEATURE ARTICLE
// ============================================

async function featureArticle(articleId, feature) {
  const token = getAuthToken();
  if (!token) {
    showNotification('Not authenticated', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/news/articles/${articleId}/featured`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_featured: feature })
    });

    const data = await response.json();

    if (data.success) {
      showNotification(
        feature ? 'Article set as featured!' : 'Article unfeatured!',
        'success'
      );
      loadStats();
      loadArticles();
    } else {
      showNotification(data.error || 'Failed to update featured status', 'error');
    }
  } catch (error) {
    Logger.error('Error updating featured status:', error);
    showNotification('Error updating featured status', 'error');
  }
}

// ============================================
// DELETE ARTICLE
// ============================================

async function deleteArticle(articleId) {
  const confirmed = await customConfirm(
    'Are you sure you want to delete this article? This action cannot be undone.',
    'Delete Article',
    {
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }
  );
  
  if (!confirmed) {
    return;
  }

  const token = getAuthToken();
  if (!token) {
    showNotification('Not authenticated', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/news/articles/${articleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      showNotification('Article deleted successfully!', 'success');
      loadStats();
      loadArticles();
    } else {
      showNotification(data.error || 'Failed to delete article', 'error');
    }
  } catch (error) {
    Logger.error('Error deleting article:', error);
    showNotification('Error deleting article', 'error');
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  if (type === 'success') {
    showSuccess(message);
  } else if (type === 'error') {
    showError(message);
  } else if (type === 'warning') {
    showWarning(message);
  } else {
    customAlert(message, 'Information', 'info');
  }

  
}