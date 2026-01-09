// ============================================
// VIDEO LESSONS - ULTRA OPTIMIZED VERSION
// Version: 4.5 - ADMIN ACCESS FIX
// ============================================
// KEY CHANGES:
// Switched to signed URLs for video streaming
// Enables Cloudflare edge caching (no Authorization header)
// Better security with time-limited access
// FIX: Admin role now bypasses free tier restriction
// ============================================
// PERFORMANCE IMPROVEMENTS:
// Thumbnail lazy loading
// Aggressive cleanup every 5 videos (fixes HTTP/3 stalling)
// Video abort on modal close (stops loading immediately)
// Debounced search (500ms)
// ROLE & TIER separation
// NO PREFETCH = No cache conflicts = Instant play!
// ============================================
const getVideoApiUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'superchessprep.com' || hostname === 'www.superchessprep.com') {
    return 'https://videos.superchessprep.com';
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3007';
  }
  
  if (hostname.includes('152.53.186.105')) {
    return `http://${hostname}:3007`;
  }
  
  return 'http://localhost:3007';
};
// ============================================
// SERVICE WORKER REGISTRATION
// ============================================
(function() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          // Check for updates every 5 minutes
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                // Optionally show notification to user
                showServiceWorkerUpdate();
              }
            });
          });
        })
        .catch(error => {
          Logger.error('[SW] Registration failed:', error);
        });
    });
  } else {
    Logger.warn('[SW] Service Workers not supported in this browser');
  }
})();
// Show update notification (optional)
function showServiceWorkerUpdate() {
  // You can show a custom alert here if you want
}
const VIDEO_API_URL = getVideoApiUrl();
let allVideos = [];
let filteredVideos = [];
let currentUser = null;
// Pagination variables
let currentPage = 1;
const VIDEOS_PER_PAGE = 6;
let totalPages = 1;
// Abort controller for cleaning up unfinished requests
let currentVideoAbortController = null;
// Debounce timer for search/filter
let searchDebounceTimer = null;
// ============================================
// TIER HIERARCHY
// ============================================
const TIER_HIERARCHY = {
  free: 0,
  basic: 1,
  premium: 2,
  elite: 3,
  admin: 999
};
function canAccessVideo(userRole, userTier, requiredTier) {
  if (userRole === 'admin') return true;
  const userLevel = TIER_HIERARCHY[userTier] || 0;
  const requiredLevel = TIER_HIERARCHY[requiredTier] || 0;
  return userLevel >= requiredLevel;
}
// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
function getTierClass(tier) {
  return `tier-${tier}`;
}
function getTierBadge(tier) {
  const badges = {
    basic: 'BASIC',
    premium: 'PREMIUM',
    elite: 'ELITE'
  };
  return badges[tier] || tier;
}
function getTierInfo(tier) {
  const info = {
    free: {
      name: 'Free',
      description: 'Upgrade to access premium video content',
      class: 'free',
      showUpgrade: true
    },
    basic: {
      name: 'Basic',
      description: 'You have access to Basic tier videos',
      class: 'basic',
      showUpgrade: true
    },
    premium: {
      name: 'Premium',
      description: 'You have access to Basic and Premium videos',
      class: 'premium',
      showUpgrade: true
    },
    elite: {
      name: 'Elite',
      description: 'You have full access to all videos',
      class: 'elite',
      showUpgrade: false
    },
    admin: {
      name: 'Admin',
      description: 'You have access to all videos',
      class: 'elite',
      showUpgrade: false,
      isAdmin: true
    }
  };
  return info[tier] || info.free;
}
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
// ============================================
// THUMBNAIL LOADING SYSTEM
// ============================================
// ============================================
// CUSTOM ALERT MODAL
// ============================================
function showCustomAlert(message, title = 'Alert', icon = 'i') {
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
// FREE USER MESSAGE
// ============================================
function showFreeUserMessage() {
  const upgradeMessage = document.createElement('div');
  upgradeMessage.id = 'freeUserMessage';
  upgradeMessage.style.cssText = `
    position: fixed;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%);
    color: white;
    padding: 2rem;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(59, 130, 246, 0.4);
    z-index: 1000;
    text-align: center;
    max-width: 500px;
    animation: slideDown 0.5s ease;
  `;
  SafeHTML.setHTML(upgradeMessage, `
    <div style="font-size: 3rem; margin-bottom: 1rem;">&#127916;</div>
    <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">Premium Content</h2>
    <p style="margin: 0 0 1.5rem 0; opacity: 0.95; line-height: 1.6;">
      Video Lessons are available exclusively for Premium, Elite, and Basic tier members.
      Upgrade your subscription to unlock our comprehensive chess video library.
    </p>
    <a href="/subscription" class="upgrade-btn-inline">Upgrade Now →</a>
  `);
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { opacity: 0; transform: translate(-50%, -30px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    .upgrade-btn-inline {
      display: inline-block;
      background: white;
      color: #3b82f6;
      padding: 1rem 2.5rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.1rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
    }
    .upgrade-btn-inline:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(upgradeMessage);
  
  const loadingContainer = document.getElementById('loadingContainer');
  const emptyState = document.getElementById('emptyState');
  if (loadingContainer) loadingContainer.style.display = 'none';
  if (emptyState) {
    SafeHTML.setHTML(emptyState, '<p style="color: #94a3b8;">Subscribe to unlock premium video content</p>');
    emptyState.style.display = 'block';
  }
}
// ============================================
// UPGRADE MODAL
// ============================================
function showUpgradeModal(requiredTier) {
  const modal = document.getElementById('upgradeModal');
  const messageEl = document.getElementById('upgradeMessage');
  
  const tierNames = {
    basic: 'Basic',
    premium: 'Premium',
    elite: 'Elite'
  };
  
  const tierName = tierNames[requiredTier] || requiredTier;
  
  if (messageEl) {
    messageEl.textContent = `This video requires a ${tierName} subscription or higher to access.`;
  }
  
  if (modal) {
    modal.style.display = 'flex';
  }
}
function closeUpgradeModal() {
  const modal = document.getElementById('upgradeModal');
  if (modal) modal.style.display = 'none';
}
// ============================================
// FETCH VIDEOS
// ============================================
async function fetchVideos() {
  const loadingContainer = document.getElementById('loadingContainer');
  const videosGrid = document.getElementById('videosGrid');
  const emptyState = document.getElementById('emptyState');
  
  try {
    const token = Auth.storage.getToken();
    
    const response = await fetch(`${VIDEO_API_URL}/api/videos/user/available`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch videos');
    }
    
    allVideos = data.videos || [];
    filteredVideos = [...allVideos];
    
    if (allVideos.length === 0) {
      loadingContainer.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    loadingContainer.style.display = 'none';
    renderVideos(filteredVideos);
    
  } catch (error) {
    Logger.error('[ERROR] Failed to fetch videos:', error);
    loadingContainer.style.display = 'none';
    showCustomAlert(
      'Failed to load videos. Please try again later.',
      'Error',
      'X'
    );
  }
}
// ============================================
// PLAY VIDEO - WITH SIGNED URLS
// ============================================
async function playVideo(videoId) {
  const userRole = currentUser?.role || 'free';
  const userTier = currentUser?.tier || 'free';
  const video = allVideos.find(v => v.id === videoId);
  
  if (!video) {
    showCustomAlert('Video not found', 'Error', 'X');
    return;
  }
  
  if (!canAccessVideo(userRole, userTier, video.required_tier)) {
    showUpgradeModal(video.required_tier);
    return;
  }
  
  // Aggressively clear previous video FIRST
  const videoPlayer = document.getElementById('videoPlayer');
  const videoSource = document.getElementById('videoSource');
  
  if (videoPlayer && videoPlayer.src) {
    videoPlayer.pause();
    videoPlayer.src = '';
    videoPlayer.removeAttribute('src');
    if (videoSource) {
      videoSource.src = '';
      videoSource.removeAttribute('src');
    }
    videoPlayer.load();
    
    // Wait for cleanup
    await new Promise(r => setTimeout(r, 50));
  }
  
  // Abort any previous video loading
  if (currentVideoAbortController) {
    currentVideoAbortController.abort();
  }
  
  currentVideoAbortController = new AbortController();
  
  // Populate modal
  const modal = document.getElementById('videoModal');
  const titleEl = document.getElementById('videoModalTitle');
  const descEl = document.getElementById('videoModalDescription');
  const tierBadgeEl = document.getElementById('videoModalTier');
  const dateEl = document.getElementById('videoModalDate');
  
  if (titleEl) titleEl.textContent = video.title;
  if (descEl) descEl.textContent = video.description || 'No description available';
  if (tierBadgeEl) {
    tierBadgeEl.textContent = getTierBadge(video.required_tier);
    tierBadgeEl.className = `video-tier-badge ${getTierClass(video.required_tier)}`;
  }
  if (dateEl) dateEl.textContent = formatDate(video.created_at);
  
  // Show modal first
  if (modal) modal.style.display = 'flex';
  
  try {
    // NEW: Get signed URL first
    const token = Auth.storage.getToken();
    
    const urlResponse = await fetch(`${VIDEO_API_URL}/api/videos/${videoId}/url`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: currentVideoAbortController.signal
    });
    
    if (!urlResponse.ok) {
      throw new Error('Failed to get stream URL');
    }
    
    const urlData = await urlResponse.json();
    
    if (!urlData.success || !urlData.streamUrl) {
      throw new Error('Invalid stream URL response');
    }
    
    const streamUrl = urlData.streamUrl;
    // SAVE for cache-on-close
    const url = new URL(streamUrl);
    lastPlayedVideo = {
      videoId: videoId,
      streamUrl: streamUrl,
      userId: url.searchParams.get('uid'),
      quality: url.searchParams.get('quality') || 'medium'
    };
    
    // Set video source with signed URL
    if (videoSource) {
      videoSource.src = streamUrl;
    }
    
    // Load video
    if (videoPlayer) {
      videoPlayer.load();
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    
    Logger.error('[ERROR] Failed to load video:', error);
    showCustomAlert(
      'Failed to load video. Please try again.',
      'Error',
      'X'
    );
    closeVideoPlayer();
  }
}
// ============================================
// CLOSE VIDEO PLAYER - WITH AGGRESSIVE ABORT
// ============================================
// Global variable to track last played video
let lastPlayedVideo = null;
function closeVideoPlayer() {
  const modal = document.getElementById('videoModal');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoSource = document.getElementById('videoSource');
  
  if (videoPlayer) {
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    videoPlayer.removeAttribute('src');
    if (videoSource) {
      videoSource.removeAttribute('src');
    }
    videoPlayer.load();
  }
  
  if (currentVideoAbortController) {
    currentVideoAbortController.abort();
    currentVideoAbortController = null;
  }
  
  if (modal) modal.style.display = 'none';
  
  // ============================================
  // TRIGGER BACKGROUND CACHING AFTER CLOSE
  // ============================================
  if (lastPlayedVideo && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const { videoId, streamUrl, userId, quality } = lastPlayedVideo;
    
    // Send message to Service Worker to cache this video
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_VIDEO',
      videoId: videoId,
      streamUrl: streamUrl,
      userId: userId,
      quality: quality || 'medium'
    });
    
    // Clear last played video
    lastPlayedVideo = null;
  }
  // ============================================
  
}
// ============================================
// RENDER VIDEOS
// ============================================
function renderVideos(videos) {
  const videosGrid = document.getElementById('videosGrid');
  const noResults = document.getElementById('noResults');
  const emptyState = document.getElementById('emptyState');
  const paginationContainer = document.getElementById('paginationContainer');
  
  if (!videos || videos.length === 0) {
    videosGrid.style.display = 'none';
    emptyState.style.display = 'none';
    noResults.style.display = 'block';
    if (paginationContainer) paginationContainer.style.display = 'none';
    return;
  }
  
  const userRole = currentUser?.role || 'free';
  const userTier = currentUser?.tier || 'free';
  
  // Get paginated videos (only 6 per page)
  const paginatedVideos = getPaginatedVideos(videos);
  
  SafeHTML.setHTML(videosGrid, paginatedVideos.map(video => {
    const hasAccess = canAccessVideo(userRole, userTier, video.required_tier);
    const lockIcon = hasAccess ? '' : '<div class="video-lock-overlay">🔒</div>';
    
    return `
      <div class="video-card ${hasAccess ? '' : 'locked'}" data-video-id="${video.id}" data-has-access="${hasAccess}" data-required-tier="${video.required_tier}">
        <div class="video-thumbnail-container">
          ${lockIcon}
          <img 
            class="video-thumbnail" 
            src="/images/banner.webp"
            alt="SuperChessPrep"
            loading="lazy"
          />
          ${video.duration ? `<div class="video-duration">${formatDuration(video.duration)}</div>` : ''}
        </div>
        <div class="video-info">
          <h3 class="video-title">${escapeHtml(video.title)}</h3>
          <p class="video-description">${escapeHtml(video.description || 'No description')}</p>
          <div class="video-meta">
            <span class="video-tier-badge ${getTierClass(video.required_tier)}">
              ${getTierBadge(video.required_tier)}
            </span>
            <span class="video-date">${formatDate(video.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }).join(''));
  
  // Add click handlers after render
  videosGrid.querySelectorAll('.video-card[data-video-id]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const videoId = parseInt(card.dataset.videoId);
      const hasAccess = card.dataset.hasAccess === 'true';
      const requiredTier = card.dataset.requiredTier;
      if (hasAccess) {
        playVideo(videoId);
      } else {
        showUpgradeModal(requiredTier);
      }
    });
  });
  
  videosGrid.style.display = 'grid';
  noResults.style.display = 'none';
  
  // Update pagination controls
  updatePagination();
  
}
// ============================================
// DEBOUNCED FILTER
// ============================================
function debouncedFilterVideos() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  searchDebounceTimer = setTimeout(() => {
    filterVideos();
  }, 500);
}
function filterVideos() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const filterTierSelect = document.getElementById('filterTier');
  
  const userRole = currentUser?.role || 'free';
  
  const filterTier = (userRole === 'admin' && filterTierSelect) ? filterTierSelect.value : '';
  
  filteredVideos = allVideos.filter(video => {
    const matchesSearch = !searchInput || 
      video.title.toLowerCase().includes(searchInput) ||
      (video.description && video.description.toLowerCase().includes(searchInput));
    
    const matchesTier = !filterTier || video.required_tier === filterTier;
    
    return matchesSearch && matchesTier;
  });
  
  currentPage = 1; // Reset to first page after filtering
  sortVideos();
}
// ============================================
// SORT VIDEOS
// ============================================
function sortVideos() {
  const sortBy = document.getElementById('sortBy').value;
  
  switch (sortBy) {
    case 'newest':
      filteredVideos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'oldest':
      filteredVideos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case 'title':
      filteredVideos.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  
  // Render with current page (set by filterVideos or user navigation)
  renderVideos(filteredVideos);
}
// ============================================
// RESET FILTERS
// ============================================
function resetFilters() {
  document.getElementById('searchInput').value = '';
  const filterTierSelect = document.getElementById('filterTier');
  if (filterTierSelect) {
    filterTierSelect.value = '';
  }
  document.getElementById('sortBy').value = 'newest';
  
  filteredVideos = [...allVideos];
  currentPage = 1; // Reset to first page
  sortVideos();
  
  showCustomAlert('Filters reset!', 'Success', 'OK');
}
// ============================================
// UPDATE TIER INFO BANNER
// ============================================
function updateTierInfo() {
  const userRole = currentUser?.role || 'free';
  const userTier = currentUser?.tier || 'free';
  const displayTier = userRole === 'admin' ? 'admin' : userTier;
  const tierInfo = getTierInfo(displayTier);
  
  const tierTitleEl = document.getElementById('tierTitle');
  const currentTierEl = document.getElementById('currentTier');
  const tierDescriptionEl = document.getElementById('tierDescription');
  const userTierBadgeEl = document.getElementById('userTierBadge');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const tierInfoIcon = document.getElementById('tierInfoIcon');
  const filterTierSelect = document.getElementById('filterTier');
  
  if (tierInfo.isAdmin) {
    if (tierTitleEl) SafeHTML.setHTML(tierTitleEl, '<h3>Admin Access</h3>');
    if (currentTierEl) currentTierEl.style.display = 'none';
    if (tierDescriptionEl) tierDescriptionEl.textContent = tierInfo.description;
    if (tierInfoIcon) tierInfoIcon.textContent = '🛡️';
    
    if (filterTierSelect && filterTierSelect.parentElement) {
      filterTierSelect.parentElement.style.display = 'block';
    }
  } else {
    if (tierTitleEl) SafeHTML.setHTML(tierTitleEl, 'Subscription Tier: <span id="currentTier">' + tierInfo.name + '</span>');
    if (tierDescriptionEl) tierDescriptionEl.textContent = tierInfo.description;
    
    if (filterTierSelect && filterTierSelect.parentElement) {
      filterTierSelect.parentElement.style.display = 'none';
    }
  }
  
  if (userTierBadgeEl) {
    userTierBadgeEl.textContent = tierInfo.name;
    userTierBadgeEl.className = `user-tier-badge ${tierInfo.class}`;
  }
  
  if (upgradeBtn && !tierInfo.showUpgrade) {
    upgradeBtn.style.display = 'none';
  }
}
// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeVideoPlayer();
    closeUpgradeModal();
    closeCustomAlert();
  }
  
  if (e.key === ' ' && document.getElementById('videoModal').style.display === 'flex') {
    e.preventDefault();
    const player = document.getElementById('videoPlayer');
    if (player) {
      if (player.paused) {
        player.play();
      } else {
        player.pause();
      }
    }
  }
});
// ============================================
// CLEANUP ON PAGE UNLOAD
// ============================================
window.addEventListener('beforeunload', () => {
});
// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }
  
  currentUser = Auth.getCurrentUser();
  
  if (!currentUser) {
    window.location.href = '/';
    return;
  }
  
  const token = Auth.storage.getToken();
  const decoded = JSON.parse(atob(token.split('.')[1]));
  
  const userRole = decoded.role || 'free';
  const userTier = decoded.subscription_tier || decoded.role || 'free';
  
  currentUser.role = userRole;
  currentUser.tier = userTier;
  
  const userNameEl = document.getElementById('userName');
  if (userNameEl) {
    userNameEl.textContent = currentUser.username;
  }
  
  updateTierInfo();
  
  // ============================================
  // FIX: Admin role bypasses free tier restriction
  // ============================================
  if (userTier === 'free' && userRole !== 'admin') {
    showFreeUserMessage();
    return;
  }
  
  await fetchVideos();
  
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debouncedFilterVideos);
  }
  
  window.onclick = (event) => {
    const videoModal = document.getElementById('videoModal');
    const upgradeModal = document.getElementById('upgradeModal');
    const alertModal = document.getElementById('customAlertModal');
    
    if (event.target === videoModal) closeVideoPlayer();
    if (event.target === upgradeModal) closeUpgradeModal();
    if (event.target === alertModal) closeCustomAlert();
  };
// ============================================
// SERVICE WORKER CACHE MANAGEMENT
// ============================================
// Toggle cache status panel
function toggleCachePanel() {
  const panel = document.getElementById('cacheStatusPanel');
  const btn = document.getElementById('cacheToggleBtn');
  
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    btn.style.display = 'none';
    updateCacheStats();
  } else {
    panel.style.display = 'none';
    btn.style.display = 'block';
  }
}
// Update cache statistics
async function updateCacheStats() {
  try {
    // Get Service Worker cache stats
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const stats = event.data;
        document.getElementById('videosCached').textContent = stats.videosCached || 0;
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CACHE_STATUS' },
        [messageChannel.port2]
      );
    }
    
    // Get storage quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / 1024 / 1024).toFixed(1);
      const quotaMB = (estimate.quota / 1024 / 1024).toFixed(0);
      
      document.getElementById('storageUsed').textContent = 
        `${usedMB} MB / ${quotaMB} MB`;
    }
    
  } catch (error) {
    Logger.error('[CACHE] Failed to update stats:', error);
  }
}
// Clear Service Worker cache
async function clearServiceWorkerCache() {
  // Use styled confirm modal
  let confirmed = false;
  if (typeof customConfirm === 'function') {
    confirmed = await customConfirm(
      'Clear all cached videos?<br><br>This will free up storage but videos will need to be downloaded again.',
      'Clear Cache',
      {
        confirmText: 'Clear Cache',
        cancelText: 'Cancel',
        type: 'warning'
      }
    );
  } else {
    confirmed = confirm('Clear all cached videos? This will free up storage but videos will need to be downloaded again.');
  }
  
  if (!confirmed) {
    return;
  }
  
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = async (event) => {
        if (event.data.success) {
          if (typeof showSuccess === 'function') {
            await showSuccess('Cache cleared successfully!');
          } else {
            alert('Cache cleared successfully!');
          }
          updateCacheStats();
        }
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    }
  } catch (error) {
    Logger.error('[CACHE] Failed to clear cache:', error);
    if (typeof showError === 'function') {
      showError('Failed to clear cache: ' + error.message);
    } else {
      alert('Failed to clear cache: ' + error.message);
    }
  }
}
// Auto-update cache stats every 30 seconds if panel is visible
// Store interval ID for cleanup
let cacheStatsIntervalId = setInterval(() => {
  const panel = document.getElementById('cacheStatusPanel');
  if (panel && panel.style.display !== 'none') {
    updateCacheStats();
  }
}, 30000);

// Cleanup on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
  if (cacheStatsIntervalId) {
    clearInterval(cacheStatsIntervalId);
    cacheStatsIntervalId = null;
  }
});
});
// ============================================
// PAGINATION FUNCTIONS
// ============================================
function updatePagination() {
  totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  
  const paginationContainer = document.getElementById('paginationContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const currentPageDisplay = document.getElementById('currentPageDisplay');
  const totalPagesDisplay = document.getElementById('totalPagesDisplay');
  
  if (totalPages <= 1) {
    if (paginationContainer) paginationContainer.style.display = 'none';
    return;
  }
  
  if (paginationContainer) paginationContainer.style.display = 'flex';
  if (currentPageDisplay) currentPageDisplay.textContent = currentPage;
  if (totalPagesDisplay) totalPagesDisplay.textContent = totalPages;
  
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}
function goToNextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    renderVideos(filteredVideos);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
function goToPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderVideos(filteredVideos);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
function goToPage(pageNumber) {
  if (pageNumber >= 1 && pageNumber <= totalPages) {
    currentPage = pageNumber;
    renderVideos(filteredVideos);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
function getPaginatedVideos(videos) {
  const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
  const endIndex = startIndex + VIDEOS_PER_PAGE;
  return videos.slice(startIndex, endIndex);
}