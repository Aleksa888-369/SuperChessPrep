/**
 * SuperChessPrep Frontend Configuration
 * SINGLE SOURCE OF TRUTH for all API URLs, Icons, Tiers, etc.
 * 
 * @version 3.0.0
 * @updated January 2026
 * 
 * Usage:
 *   CONFIG.API.PGN        → 'https://pgn.superchessprep.com'
 *   CONFIG.API.VIDEO      → 'https://videos.superchessprep.com'
 *   CONFIG.API.FORUM      → 'https://www.superchessprep.com'
 *   CONFIG.ICONS.TIERS.elite → '♔'
 *   CONFIG.TIERS.getIcon('premium') → '♘'
 */

(function(window) {
  'use strict';

  // ============================================
  // ENVIRONMENT DETECTION
  // ============================================
  
  var hostname = window.location.hostname;
  var isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  var isProduction = hostname === 'superchessprep.com' || hostname === 'www.superchessprep.com';
  var isServerIP = hostname.indexOf('152.53.186.105') !== -1;

  var ENV = isLocalhost ? 'development' : (isProduction ? 'production' : 'staging');
  var SERVER_IP = '152.53.186.105';
  var DOMAIN = 'superchessprep.com';

  // ============================================
  // API URLS - Auto-detect based on environment
  // ============================================
  
  var API = {
    // Main backend server (port 3000) - serves frontend, forum, news
    MAIN: (function() {
      if (isLocalhost) return 'http://localhost:3000';
      if (isProduction) return 'https://www.superchessprep.com';
      if (isServerIP) return 'http://' + SERVER_IP + ':3000';
      return 'http://localhost:3000';
    })(),
    
    // Auth/User Management API (port 3003)
    AUTH: (function() {
      if (isLocalhost) return 'http://localhost:3003';
      if (isProduction) return 'https://api.superchessprep.com';
      if (isServerIP) return 'http://' + SERVER_IP + ':3003';
      return 'http://localhost:3003';
    })(),
    
    // Payment API (port 3004)
    PAYMENT: (function() {
      if (isLocalhost) return 'http://localhost:3004';
      if (isProduction) return 'https://payments.superchessprep.com';
      if (isServerIP) return 'http://' + SERVER_IP + ':3004';
      return 'http://localhost:3004';
    })(),
    
    // PGN/Exercises API (port 3005)
    PGN: (function() {
      if (isLocalhost) return 'http://localhost:3005';
      if (isProduction) return 'https://pgn.superchessprep.com';
      if (isServerIP) return 'http://' + SERVER_IP + ':3005';
      return 'http://localhost:3005';
    })(),
    
    // Video API (port 3007)
    VIDEO: (function() {
      if (isLocalhost) return 'http://localhost:3007';
      if (isProduction) return 'https://videos.superchessprep.com';
      if (isServerIP) return 'http://' + SERVER_IP + ':3007';
      return 'http://localhost:3007';
    })(),
    
    // Forum API (same as MAIN - port 3000)
    FORUM: (function() {
      if (isLocalhost) return 'http://localhost:3000';
      if (isProduction) return 'https://www.superchessprep.com';
      if (isServerIP) return 'http://' + SERVER_IP + ':3000';
      return 'http://localhost:3000';
    })(),
    
    // News API (same as MAIN - port 3000)
    NEWS: (function() {
      if (isLocalhost) return 'http://localhost:3000';
      if (isProduction) return 'https://www.superchessprep.com';
      if (isServerIP) return 'http://' + SERVER_IP + ':3000';
      return 'http://localhost:3000';
    })(),
    
    // Upload API (same as VIDEO - port 3007)
    UPLOAD: (function() {
      if (isLocalhost) return 'http://localhost:3007';
      if (isProduction) return 'https://videos.superchessprep.com';
      if (isServerIP) return 'http://' + SERVER_IP + ':3007';
      return 'http://localhost:3007';
    })(),
    
    // Legacy BACKEND (AUTH + /api suffix)
    BACKEND: (function() {
      if (isLocalhost) return 'http://localhost:3003/api';
      if (isProduction) return 'https://api.superchessprep.com/api';
      if (isServerIP) return 'http://' + SERVER_IP + ':3003/api';
      return 'http://localhost:3003/api';
    })()
  };

  // ============================================
  // ICONS - Correct UTF-8 Chess Symbols
  // Single source of truth for all icons
  // ============================================
  
  var ICONS = {
    // Tier icons (used in headers, badges, etc.)
    TIERS: {
      free: '♟',      // Black pawn U+265F
      basic: '♙',     // White pawn U+2659
      premium: '♘',   // White knight U+2658
      elite: '♔',     // White king U+2654
      admin: '👑'     // Crown emoji
    },
    
    // Chess pieces - White
    CHESS_WHITE: {
      king: '♔',      // U+2654
      queen: '♕',     // U+2655
      rook: '♖',      // U+2656
      bishop: '♗',    // U+2657
      knight: '♘',    // U+2658
      pawn: '♙'       // U+2659
    },
    
    // Chess pieces - Black
    CHESS_BLACK: {
      king: '♚',      // U+265A
      queen: '♛',     // U+265B
      rook: '♜',      // U+265C
      bishop: '♝',    // U+265D
      knight: '♞',    // U+265E
      pawn: '♟'       // U+265F
    },
    
    // Navigation icons
    NAV: {
      home: '🏠',
      dashboard: '📊',
      courses: '📚',
      exercises: '♟️',
      videos: '🎬',
      forum: '💬',
      news: '📰',
      shop: '🛒',
      settings: '⚙️',
      logout: '🚪',
      admin: '🔐',
      profile: '👤',
      back: '←',
      menu: '☰'
    },
    
    // Status icons
    STATUS: {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      loading: '⏳',
      locked: '🔒',
      unlocked: '🔓',
      star: '⭐',
      fire: '🔥',
      check: '✓',
      cross: '✕',
      edit: '✏️',
      delete: '🗑️',
      save: '💾',
      cancel: '✖️'
    },
    
    // Forum/Topic status
    TOPIC: {
      open: '🔓',
      closed: '🔒',
      pinned: '📌',
      announcement: '📢',
      hot: '🔥',
      solved: '✅'
    },
    
    // Arrows
    ARROWS: {
      left: '←',
      right: '→',
      up: '↑',
      down: '↓',
      expand: '▼',
      collapse: '▲'
    }
  };

  // ============================================
  // TIMING CONSTANTS (milliseconds)
  // ============================================
  
  var TIMING = {
    NOTIFICATION: 3000,
    NOTIFICATION_ERROR: 5000,
    NOTIFICATION_SUCCESS: 3000,
    AUTO_REFRESH: 30000,
    DEBOUNCE: 300,
    DEBOUNCE_SEARCH: 500,
    API_TIMEOUT: 30000,
    HEALTH_CHECK: 60000,
    REDIRECT_DELAY: 1500,
    TOAST_DURATION: 4000,
    MODAL_ANIMATION: 300,
    SW_UPDATE_CHECK: 300000  // 5 minutes
  };

  // ============================================
  // CACHE DURATIONS (seconds)
  // ============================================
  
  var CACHE = {
    NONE: 0,
    SHORT: 60,          // 1 minute
    MEDIUM: 300,        // 5 minutes
    LONG: 3600,         // 1 hour
    DAY: 86400,         // 24 hours
    WEEK: 604800,       // 7 days
    MONTH: 2592000,     // 30 days
    YEAR: 31536000      // 365 days
  };

  // ============================================
  // TIER DEFINITIONS
  // Single source of truth - matches backend TierPolicy.js
  // ============================================
  
  var TIERS = {
    // Numeric levels for comparison
    LEVELS: { 
      free: 0, 
      basic: 1, 
      premium: 2, 
      elite: 3, 
      admin: 999 
    },
    
    // Daily exercise limits per tier
    LIMITS: { 
      free: 0, 
      basic: 5, 
      premium: 15, 
      elite: 30,
      admin: 999 
    },
    
    // Display names
    NAMES: { 
      free: 'Free', 
      basic: 'Basic', 
      premium: 'Premium', 
      elite: 'Elite',
      admin: 'Administrator'
    },
    
    // Brand colors per tier
    COLORS: {
      free: '#888888',
      basic: '#4CAF50',
      premium: '#ff8c00',
      elite: '#ffd700',
      admin: '#ef4444'
    },
    
    // Background colors (lighter)
    BG_COLORS: {
      free: '#f5f5f5',
      basic: '#e8f5e9',
      premium: '#fff3e0',
      elite: '#fffde7',
      admin: '#ffebee'
    },
    
    // ---- Helper Functions ----
    
    hasAccess: function(userTier, requiredTier) {
      var userLevel = this.LEVELS[userTier] || 0;
      var requiredLevel = this.LEVELS[requiredTier] || 0;
      return userLevel >= requiredLevel;
    },
    
    getLimit: function(tier) {
      return this.LIMITS[tier] || 0;
    },
    
    getName: function(tier) {
      return this.NAMES[tier] || 'Unknown';
    },
    
    getIcon: function(tier) {
      return ICONS.TIERS[tier] || ICONS.TIERS.free;
    },
    
    getColor: function(tier) {
      return this.COLORS[tier] || this.COLORS.free;
    },
    
    getBgColor: function(tier) {
      return this.BG_COLORS[tier] || this.BG_COLORS.free;
    },
    
    isAdmin: function(tier) {
      return (this.LEVELS[tier] || 0) >= 999;
    },
    
    isPaid: function(tier) {
      var level = this.LEVELS[tier] || 0;
      return level > 0 && level < 999;
    },
    
    isFree: function(tier) {
      return (this.LEVELS[tier] || 0) === 0;
    },
    
    // Get tier badge HTML
    getBadge: function(tier) {
      var icon = this.getIcon(tier);
      var name = this.getName(tier);
      var color = this.getColor(tier);
      return '<span class="tier-badge" style="color:' + color + '">' + icon + ' ' + name + '</span>';
    }
  };

  // ============================================
  // FILE LIMITS
  // ============================================
  
  var FILE_LIMITS = {
    VIDEO_MAX: 5 * 1024 * 1024 * 1024,    // 5GB
    VIDEO_MAX_MB: 5120,
    IMAGE_MAX: 10 * 1024 * 1024,           // 10MB
    IMAGE_MAX_MB: 10,
    PGN_MAX: 5 * 1024 * 1024,              // 5MB
    PGN_MAX_MB: 5,
    AVATAR_MAX: 2 * 1024 * 1024,           // 2MB
    AVATAR_MAX_MB: 2
  };

  // ============================================
  // ALLOWED FILE TYPES
  // ============================================
  
  var FILE_TYPES = {
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    PGN: ['.pgn', 'application/x-chess-pgn', 'text/plain'],
    DOCUMENT: ['application/pdf', 'application/msword']
  };

  // ============================================
  // VALIDATION PATTERNS
  // ============================================
  
  var PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
    PASSWORD_MIN_LENGTH: 8,
    PHONE: /^\+?[\d\s-]{10,}$/
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    var and = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getCorrelationId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  function getApiUrl(service) {
    var serviceUpper = (service || 'main').toUpperCase();
    return API[serviceUpper] || API.MAIN;
  }
  
  function buildApiUrl(service, path) {
    var base = getApiUrl(service);
    var cleanPath = path.startsWith('/') ? path : '/' + path;
    return base + cleanPath;
  }
  
  function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait || TIMING.DEBOUNCE);
    };
  }
  
  function formatDate(date, format) {
    var d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    format = format || 'short';
    
    if (format === 'short') {
      return d.toLocaleDateString();
    } else if (format === 'long') {
      return d.toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
    } else if (format === 'time') {
      return d.toLocaleTimeString();
    } else if (format === 'full') {
      return d.toLocaleString();
    } else if (format === 'relative') {
      var now = new Date();
      var diff = now - d;
      var seconds = Math.floor(diff / 1000);
      var minutes = Math.floor(seconds / 60);
      var hours = Math.floor(minutes / 60);
      var days = Math.floor(hours / 24);
      
      if (days > 7) return d.toLocaleDateString();
      if (days > 0) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
      if (hours > 0) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
      if (minutes > 0) return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago';
      return 'Just now';
    }
    
    return d.toLocaleString();
  }
  
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function truncate(str, length) {
    length = length || 100;
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  }

  // ============================================
  // EXPORT TO WINDOW
  // ============================================
  
  window.CONFIG = {
    // Version
    VERSION: '3.0.0',
    
    // Environment
    ENV: ENV,
    isLocalhost: isLocalhost,
    isProduction: isProduction,
    isServerIP: isServerIP,
    hostname: hostname,
    SERVER_IP: SERVER_IP,
    DOMAIN: DOMAIN,
    
    // Core
    API: API,
    ICONS: ICONS,
    TIMING: TIMING,
    CACHE: CACHE,
    TIERS: TIERS,
    
    // File handling
    FILE_LIMITS: FILE_LIMITS,
    FILE_TYPES: FILE_TYPES,
    
    // Validation
    PATTERNS: PATTERNS,
    
    // Utility functions
    formatFileSize: formatFileSize,
    getCorrelationId: getCorrelationId,
    getApiUrl: getApiUrl,
    buildApiUrl: buildApiUrl,
    debounce: debounce,
    formatDate: formatDate,
    escapeHtml: escapeHtml,
    truncate: truncate
  };

  // Development logging
  if (ENV === 'development') {
  }

})(window);
