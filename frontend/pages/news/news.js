// ============================================
// NEWS & NOVELTIES - FRONTEND JAVASCRIPT
// Enhanced version with better error handling
// ============================================

let allArticles = [];
let displayedArticles = [];
let currentCategory = 'all';
let currentSearch = '';
const ARTICLES_PER_PAGE = 6;
let currentPage = 1;
let isLoading = false;

// ============================================
// DEFAULT IMAGES - Using local fallbacks
// ============================================

const DEFAULT_IMAGES = {
  featured: '/images/chess-default.avif',
  card: '/images/chess-default.avif',
  // Fallback to data URI if local images fail (chess pattern SVG)
  fallback: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect fill="#1a1a2e" width="600" height="400"/>
      <text x="300" y="200" font-family="Arial" font-size="24" fill="#ff8c00" text-anchor="middle" dominant-baseline="middle">♔ SuperChessPrep</text>
      <text x="300" y="240" font-family="Arial" font-size="14" fill="#888" text-anchor="middle">Image unavailable</text>
    </svg>
  `)
};

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadArticles();
  setupEventListeners();
});

// ============================================
// SETUP EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Category pills - using passive where possible
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.category;
      currentPage = 1;
      filterArticles();
    }, { passive: true });
  });

  // Search - with debounce to prevent rapid firing
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.toLowerCase();
        currentPage = 1;
        filterArticles();
      }, 300);
    });
  }

  // Load more
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      displayArticles();
    }, { passive: true });
  }
}

// ============================================
// IMAGE ERROR HANDLER - Prevents infinite loops
// ============================================

function handleImageError(img) {
  // Prevent infinite loop by checking if already tried fallback
  if (img.dataset.fallbackAttempted) {
    img.src = DEFAULT_IMAGES.fallback;
    return;
  }
  
  img.dataset.fallbackAttempted = 'true';
  
  // Try local default first, then SVG fallback
  const isFeatured = img.classList.contains('featured-image');
  img.src = isFeatured ? DEFAULT_IMAGES.featured : DEFAULT_IMAGES.card;
  
  // If local default also fails, use SVG
  img.onerror = () => {
    img.src = DEFAULT_IMAGES.fallback;
    img.onerror = null; // Remove handler to prevent any further errors
  };
}

// ============================================
// CONVERT YOUTUBE URL TO EMBED FORMAT
// ============================================

function getYouTubeVideoId(url) {
  if (!url) return null;
  
  // Handle youtu.be/VIDEO_ID format
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  
  // Handle youtube.com/watch?v=VIDEO_ID format
  const longMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  
  // Handle embed format
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  
  // Handle youtube.com/v/VIDEO_ID format
  const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];
  
  return null;
}

function getYouTubeEmbedUrl(url) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getYouTubeThumbnail(url) {
  const videoId = getYouTubeVideoId(url);
  // Use maxresdefault for best quality, fallback handled by onerror
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
}

// ============================================
// LOAD ARTICLES FROM API
// ============================================

async function loadArticles() {
  if (isLoading) return;
  isLoading = true;
  
  try {
    const response = await fetch('/api/news/articles');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      allArticles = data.articles || [];
      
      if (allArticles.length === 0) {
        showWarning('No articles available', 'Empty');
      }
      
      filterArticles();
      
      const loadingState = document.getElementById('loadingState');
      if (loadingState) {
        loadingState.style.display = 'none';
      }
    } else {
      showError(data.error || 'Failed to load articles', 'Error');
    }
  } catch (error) {
    Logger.error('Error loading articles:', error);
    showError('Unable to connect to server. Please check your connection.', 'Connection Error');
  } finally {
    isLoading = false;
  }
}

// ============================================
// FILTER ARTICLES
// ============================================

function filterArticles() {
  let filtered = [...allArticles];

  if (currentCategory !== 'all') {
    filtered = filtered.filter(article => article.category === currentCategory);
  }

  if (currentSearch) {
    filtered = filtered.filter(article => 
      (article.title && article.title.toLowerCase().includes(currentSearch)) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(currentSearch)) ||
      (article.category && article.category.toLowerCase().includes(currentSearch))
    );
  }

  displayedArticles = filtered;
  currentPage = 1;
  displayArticles();
}

// ============================================
// DISPLAY ARTICLES
// ============================================

function displayArticles() {
  const featuredSection = document.getElementById('featuredSection');
  const articlesGrid = document.getElementById('articlesGrid');
  const loadMoreSection = document.getElementById('loadMoreSection');
  const emptyState = document.getElementById('emptyState');

  if (!articlesGrid) {
    Logger.error('Articles grid not found');
    return;
  }

  articlesGrid.innerHTML = '';
  if (featuredSection) featuredSection.innerHTML = '';

  if (displayedArticles.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (loadMoreSection) loadMoreSection.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  let articlesToProcess = [...displayedArticles];

  // Display featured article (only on first page and "all" category)
  if (currentPage === 1 && currentCategory === 'all' && !currentSearch && featuredSection) {
    const featuredIndex = articlesToProcess.findIndex(a => a.is_featured);
    if (featuredIndex !== -1) {
      const featured = articlesToProcess[featuredIndex];
      SafeHTML.setHTML(featuredSection, createFeaturedCard(featured));
      articlesToProcess = articlesToProcess.filter((_, i) => and !== featuredIndex);
    }
  }

  const endIndex = currentPage * ARTICLES_PER_PAGE;
  const articlesToShow = articlesToProcess.slice(0, endIndex);

  articlesToShow.forEach(article => {
    articlesGrid.innerHTML += createArticleCard(article);
  });

  if (loadMoreSection) {
    loadMoreSection.style.display = articlesToProcess.length > endIndex ? 'block' : 'none';
  }

  setupCardClickHandlers();
  setupLazyYouTube();
}

// ============================================
// CREATE FEATURED CARD HTML
// ============================================

function createFeaturedCard(article) {
  const imageUrl = article.thumbnail_url || DEFAULT_IMAGES.featured;
  
  // Check if it's a video article
  const isVideo = article.media_type === 'video' && article.media_url;
  const videoId = isVideo ? getYouTubeVideoId(article.media_url) : null;
  
  let mediaHtml;
  
  if (videoId) {
    // Lazy-load YouTube: show thumbnail first, load iframe on click
    const thumbnailUrl = getYouTubeThumbnail(article.media_url);
    mediaHtml = `
      <div class="youtube-lazy featured-video-container" data-video-id="${videoId}">
        <img src="${thumbnailUrl}" alt="${article.title || 'Video'}" class="featured-image youtube-thumbnail" loading="lazy" onerror="handleImageError(this)">
        <div class="youtube-play-btn">
          <svg viewBox="0 0 68 48" width="68" height="48">
            <path class="youtube-play-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
            <path d="M 45,24 27,14 27,34" fill="#fff"/>
          </svg>
        </div>
      </div>
    `;
  } else {
    mediaHtml = `<img src="${imageUrl}" alt="${article.title || 'Article'}" class="featured-image" loading="lazy" onerror="handleImageError(this)">`;
  }

  return `
    <div class="featured-content" data-article-id="${article.id}">
      ${mediaHtml}
      <div class="featured-info">
        <span class="featured-category">${article.category || 'General'}</span>
        <h2 class="featured-title">${article.title || 'Untitled'}</h2>
        <p class="featured-excerpt">${article.excerpt || ''}</p>
        <div class="featured-meta">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(article.author_name || 'Author')}&background=ff8c00&color=fff" alt="${article.author_name || 'Author'}" class="author-pic">
          <div class="author-details">
            <span class="author-name">${article.author_name || 'Unknown'}</span>
            <span class="author-role">${article.author_role || 'Chess Expert'}</span>
          </div>
        </div>
        <a href="/news-article?id=${article.id}" class="read-btn">Read Full Analysis &#8594;</a>
      </div>
    </div>
  `;
}

// ============================================
// CREATE ARTICLE CARD HTML
// ============================================

function createArticleCard(article) {
  const imageUrl = article.thumbnail_url || DEFAULT_IMAGES.card;
  
  // Check if it's a video article
  const isVideo = article.media_type === 'video' && article.media_url;
  const videoId = isVideo ? getYouTubeVideoId(article.media_url) : null;
  
  let mediaHtml;
  
  if (videoId) {
    // Lazy-load YouTube: show thumbnail first, load iframe on click
    const thumbnailUrl = getYouTubeThumbnail(article.media_url);
    mediaHtml = `
      <div class="card-image-container youtube-lazy" data-video-id="${videoId}">
        <img src="${thumbnailUrl}" alt="${article.title || 'Video'}" class="card-image youtube-thumbnail" loading="lazy" onerror="handleImageError(this)">
        <div class="youtube-play-btn">
          <svg viewBox="0 0 68 48" width="48" height="34">
            <path class="youtube-play-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
            <path d="M 45,24 27,14 27,34" fill="#fff"/>
          </svg>
        </div>
        ${article.video_duration ? `<span class="video-badge">${article.video_duration}</span>` : ''}
      </div>
    `;
  } else {
    mediaHtml = `
      <div class="card-image-container">
        <img src="${imageUrl}" alt="${article.title || 'Article'}" class="card-image" loading="lazy" onerror="handleImageError(this)">
      </div>
    `;
  }

  return `
    <div class="card" data-article-id="${article.id}">
      ${mediaHtml}
      <div class="card-content">
        <span class="card-category">${article.category || 'General'}</span>
        <h3 class="card-title">${article.title || 'Untitled'}</h3>
        <p class="card-excerpt">${article.excerpt || ''}</p>
        <div class="card-footer">
          <span class="card-author">${article.author_name || 'Unknown'}</span>
          <div class="card-stats">
            <span>${article.views || 0} views</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// SETUP LAZY YOUTUBE - Load iframe only on click
// ============================================

function setupLazyYouTube() {
  document.querySelectorAll('.youtube-lazy').forEach(container => {
    // Skip if already has click handler
    if (container.dataset.initialized) return;
    container.dataset.initialized = 'true';
    
    container.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card navigation
      
      const videoId = container.dataset.videoId;
      if (!videoId) return;
      
      // Replace thumbnail with iframe
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      iframe.className = container.classList.contains('featured-video-container') ? 'featured-video' : 'card-video';
      iframe.allowFullscreen = true;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.frameBorder = '0';
      
      // Keep video badge if exists
      const badge = container.querySelector('.video-badge');
      
      container.innerHTML = '';
      container.appendChild(iframe);
      if (badge) container.appendChild(badge);
      
      // Remove lazy class
      container.classList.remove('youtube-lazy');
    }, { passive: false }); // Need non-passive for stopPropagation
  });
}

// ============================================
// SETUP CARD CLICK HANDLERS
// ============================================

function setupCardClickHandlers() {
  document.querySelectorAll('.card, .featured-content').forEach(card => {
    // Skip if already has click handler
    if (card.dataset.clickInitialized) return;
    card.dataset.clickInitialized = 'true';
    
    card.addEventListener('click', (e) => {
      // Don't navigate if clicking on a link, video, or YouTube container
      if (e.target.tagName === 'A' || 
          e.target.tagName === 'IFRAME' || 
          e.target.closest('.youtube-lazy')) {
        return;
      }
      const articleId = card.dataset.articleId;
      if (articleId) {
        window.location.href = `/news-article?id=${articleId}`;
      }
    }, { passive: true });
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return 'Unknown';
  }
}
