// ========== config.js ==========
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

// ========== safe-html.js ==========
/**
 * SafeHTML - XSS Protection Utility for SuperChessPrep
 * =====================================================
 * Uses DOMPurify for HTML content sanitization.
 * 
 * INSTALACIJA:
 * 1. Add DOMPurify CDN to <head> of ALL HTML files:
 *    <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>
 * 
 * 2. Include this file AFTER DOMPurify:
 *    <script src="/js/safe-html.js"></script>
 * 
 * UPOTREBA:
 *    // Instead of: element.innerHTML = userContent;
 *    SafeHTML.setHTML(element, userContent);
 *    
 *    // For plain text (no HTML):
 *    SafeHTML.setText(element, userContent);
 *    
 *    // To sanitize a string:
 *    const clean = SafeHTML.sanitize(dirtyHTML);
 * 
 * @version 1.0.0
 * @author Claude AI for SuperChessPrep
 * @date January 2026
 */

(function(window) {
  'use strict';

  // ============================================
  // DEPENDENCY CHECK
  // ============================================
  
  if (typeof DOMPurify === 'undefined') {
    Logger.error('[SafeHTML] CRITICAL: DOMPurify is not loaded!');
    Logger.error('[SafeHTML] Add: <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>');
    
    // Fallback - samo escape, NE sanitizacija
    window.SafeHTML = {
      sanitize: function(html) {
        Logger.warn('[SafeHTML] Using fallback escape - DOMPurify not available!');
        var div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
      },
      setHTML: function(element, html) {
        if (!element) return;
        element.textContent = html; // Samo tekst kao fallback
      },
      setText: function(element, text) {
        if (!element) return;
        element.textContent = text;
      },
      escapeText: function(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
    };
    return;
  }

  // ============================================
  // DOMPURIFY CONFIGURATION
  // ============================================
  
  /**
   * Default configuration for sanitization.
   * Allows safe HTML but blocks dangerous elements and attributes.
   */
  var DEFAULT_CONFIG = {
    // Allowed HTML tags
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'hr', 'span', 'div',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'sub', 'sup', 'mark', 'small', 'del', 'ins',
      
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      
      // Lists
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      
      // Tables
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      
      // Links and media (no script/iframe!)
      'a', 'img',
      
      // Block elements
      'blockquote', 'pre', 'code',
      
      // Forms (display only, not for submit)
      'label',
      
      // Semantic elements
      'article', 'section', 'aside', 'header', 'footer', 'nav', 'main',
      'figure', 'figcaption', 'time', 'address'
    ],
    
    // Allowed attributes
    ALLOWED_ATTR: [
      // Global
      'id', 'class', 'style', 'title', 'lang', 'dir',
      'data-*', // Data attributes
      
      // Linkovi
      'href', 'target', 'rel',
      
      // Images
      'src', 'alt', 'width', 'height', 'loading',
      
      // Tables
      'colspan', 'rowspan', 'scope',
      
      // Accessibility
      'role', 'aria-*', 'tabindex',
      
      // Other
      'datetime', 'cite', 'onclick'
    ],
    
    // Protocols allowed in href/src
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    
    // Additional options
    ALLOW_DATA_ATTR: true,           // Allow data-* attributes
    ALLOW_ARIA_ATTR: true,           // Allow aria-* attributes
    KEEP_CONTENT: true,              // Keep content of removed tags
    RETURN_DOM: false,               // Return string, not DOM
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    WHOLE_DOCUMENT: false,
    FORCE_BODY: false,
    
    // Security options
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'style', 'link', 'meta', 'base', 'noscript'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup', 'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave', 'ontouchstart', 'ontouchend', 'ontouchmove', 'ondrag', 'ondrop', 'onpaste', 'oncopy', 'oncut', 'onanimationstart', 'onanimationend', 'onscroll', 'onresize', 'onwheel', 'formaction', 'xlink:href', 'xmlns'],
    
    // Hook for additional processing
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true
  };

  /**
   * Configuration for strict mode (text only + basic formatting)
   */
  var STRICT_CONFIG = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true
  };

  /**
   * Configuration for forum posts
   */
  var FORUM_CONFIG = {
    ALLOWED_TAGS: [
      'p', 'br', 'hr', 'span', 'div',
      'strong', 'b', 'em', 'i', 'u', 's',
      'h3', 'h4',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img'
    ],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'src', 'alt', 'title'],
    ADD_ATTR: ['target'],
    FORCE_BODY: true
  };

  /**
   * Configuration for PGN/Chess notation
   * Uses data attributes for event delegation (no inline onclick needed)
   */
  var CHESS_CONFIG = {
    ALLOWED_TAGS: ['span', 'div', 'br', 'strong', 'em'],
    ALLOWED_ATTR: ['class', 'data-move', 'data-fen', 'data-piece', 'data-index', 'data-parent-fen'],
    KEEP_CONTENT: true
  };

  // ============================================
  // SANITIZATION FUNCTIONS
  // ============================================

  /**
   * Sanitizes HTML string.
   * @param {string} dirty - Potentially dangerous HTML
   * @param {Object} customConfig - Optional custom configuration
   * @returns {string} - Safe HTML
   */
  function sanitize(dirty, customConfig) {
    if (dirty === null || dirty === undefined) {
      return '';
    }
    
    // Convert to string if not already
    if (typeof dirty !== 'string') {
      dirty = String(dirty);
    }
    
    // Apply configuration
    var config = customConfig ? Object.assign({}, DEFAULT_CONFIG, customConfig) : DEFAULT_CONFIG;
    
    return DOMPurify.sanitize(dirty, config);
  }

  /**
   * Sanitizes and sets element innerHTML.
   * @param {Element} element - DOM element
   * @param {string} html - HTML to set
   * @param {Object} customConfig - Optional configuration
   */
  function setHTML(element, html, customConfig) {
    if (!element) {
      Logger.warn('[SafeHTML] setHTML: Element is null/undefined');
      return;
    }
    
    element.innerHTML = sanitize(html, customConfig);
  }

  /**
   * Sets plain text (no HTML parsing).
   * @param {Element} element - DOM element
   * @param {string} text - Text to set
   */
  function setText(element, text) {
    if (!element) {
      Logger.warn('[SafeHTML] setText: Element is null/undefined');
      return;
    }
    
    element.textContent = text !== null && text !== undefined ? String(text) : '';
  }

  /**
   * Escapes text for safe HTML display.
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  function escapeText(text) {
    if (text === null || text === undefined) {
      return '';
    }
    
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  /**
   * Sanitizes for forum posts.
   * @param {string} html - HTML content
   * @returns {string} - Safe HTML
   */
  function sanitizeForum(html) {
    var clean = sanitize(html, FORUM_CONFIG);
    
    // Additional processing: add rel="noopener noreferrer" and target="_blank" to links
    var temp = document.createElement('div');
    temp.innerHTML = clean;
    
    temp.querySelectorAll('a').forEach(function(link) {
      var href = link.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
    
    return temp.innerHTML;
  }

  /**
   * Sanitizes for chess/PGN display.
   * @param {string} html - HTML content
   * @returns {string} - Safe HTML
   */
  function sanitizeChess(html) {
    return sanitize(html, CHESS_CONFIG);
  }

  /**
   * Sanitizes in strict mode (minimal HTML).
   * @param {string} html - HTML content
   * @returns {string} - Safe HTML
   */
  function sanitizeStrict(html) {
    return sanitize(html, STRICT_CONFIG);
  }

  /**
   * Creates safe HTML element from template string.
   * @param {string} html - HTML template
   * @param {Object} customConfig - Optional configuration
   * @returns {DocumentFragment} - DOM fragment
   */
  function createFragment(html, customConfig) {
    var clean = sanitize(html, customConfig);
    var template = document.createElement('template');
    template.innerHTML = clean.trim();
    return template.content.cloneNode(true);
  }

  /**
   * Adds hook for custom processing.
   * @param {string} hookName - Hook name (npr. 'afterSanitizeAttributes')
   * @param {Function} callback - Callback function
   */
  function addHook(hookName, callback) {
    DOMPurify.addHook(hookName, callback);
  }

  /**
   * Removes all hooks.
   */
  function removeAllHooks() {
    DOMPurify.removeAllHooks();
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Checks if string contains potentially dangerous content.
   * @param {string} str - String to check
   * @returns {boolean} - true if potentially dangerous
   */
  function containsDangerousContent(str) {
    if (!str || typeof str !== 'string') return false;
    
    var dangerous = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /data:text\/html/i,
      /vbscript:/i,
      /expression\s*\(/i
    ];
    
    return dangerous.some(function(pattern) {
      return pattern.test(str);
    });
  }

  /**
   * Logs warning if content was sanitized.
   * @param {string} original - Original content
   * @param {string} sanitized - Sanitized content
   * @param {string} context - Context (e.g. function name)
   */
  function logIfSanitized(original, sanitized, context) {
    if (original !== sanitized) {
      Logger.warn('[SafeHTML] Content was sanitized in:', context);
      
      // In development mode, show details
      if (typeof CONFIG !== 'undefined' && !CONFIG.isProduction) {
        Logger.warn('[SafeHTML] Original:', original.substring(0, 200));
        Logger.warn('[SafeHTML] Sanitized:', sanitized.substring(0, 200));
      }
    }
  }

  // ============================================
  // EXPORT
  // ============================================

  window.SafeHTML = {
    // Main functions
    sanitize: sanitize,
    setHTML: setHTML,
    setText: setText,
    escapeText: escapeText,
    
    // Specialized functions
    sanitizeForum: sanitizeForum,
    sanitizeChess: sanitizeChess,
    sanitizeStrict: sanitizeStrict,
    
    // Helper functions
    createFragment: createFragment,
    containsDangerousContent: containsDangerousContent,
    
    // DOMPurify access
    addHook: addHook,
    removeAllHooks: removeAllHooks,
    
    // Configurations (for custom use)
    configs: {
      DEFAULT: DEFAULT_CONFIG,
      STRICT: STRICT_CONFIG,
      FORUM: FORUM_CONFIG,
      CHESS: CHESS_CONFIG
    },
    
    // Version
    version: '1.0.0'
  };

  // Log successful initialization
})(window);
// ========== event-manager.js ==========
/**
 * Enhanced EventManager - Automatic event listener cleanup
 * Generated by mega_patch.py
 * 
 * Usage:
 *   EventManager.on(element, 'click', handler)
 *   EventManager.off(element, 'click', handler)
 *   EventManager.cleanup() - Remove all listeners
 *   EventManager.cleanupElement(element) - Remove listeners for specific element
 */
(function() {
    'use strict';
    
    const listeners = new Map();
    let globalId = 0;
    
    const EventManager = {
        /**
         * Add event listener with automatic tracking
         * @param {Element|Window|Document} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object|boolean} options - Event options
         * @returns {number} Listener ID for manual removal
         */
        on: function(element, event, handler, options = false) {
            if (!element || typeof handler !== 'function') {
                Logger.warn('[EventManager] Invalid element or handler');
                return -1;
            }
            
            const id = ++globalId;
            const wrappedHandler = function(e) {
                try {
                    handler.call(this, e);
                } catch (err) {
                    Logger.error('[EventManager] Handler error:', err);
                }
            };
            
            element.addEventListener(event, wrappedHandler, options);
            
            listeners.set(id, {
                element,
                event,
                handler: wrappedHandler,
                originalHandler: handler,
                options
            });
            
            return id;
        },
        
        /**
         * Remove event listener by ID
         * @param {number} id - Listener ID
         */
        offById: function(id) {
            const listener = listeners.get(id);
            if (listener) {
                listener.element.removeEventListener(
                    listener.event, 
                    listener.handler, 
                    listener.options
                );
                listeners.delete(id);
            }
        },
        
        /**
         * Remove event listener by element, event, and handler
         * @param {Element} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Original handler
         */
        off: function(element, event, handler) {
            listeners.forEach((listener, id) => {
                if (listener.element === element && 
                    listener.event === event && 
                    listener.originalHandler === handler) {
                    this.offById(id);
                }
            });
        },
        
        /**
         * Remove all listeners for a specific element
         * @param {Element} element - Target element
         */
        cleanupElement: function(element) {
            const toRemove = [];
            listeners.forEach((listener, id) => {
                if (listener.element === element) {
                    toRemove.push(id);
                }
            });
            toRemove.forEach(id => this.offById(id));
            Logger.debug(`[EventManager] Cleaned up ${toRemove.length} listeners for element`);
        },
        
        /**
         * Remove all tracked listeners
         */
        cleanup: function() {
            const count = listeners.size;
            listeners.forEach((listener, id) => {
                listener.element.removeEventListener(
                    listener.event,
                    listener.handler,
                    listener.options
                );
            });
            listeners.clear();
            Logger.debug(`[EventManager] Cleaned up ${count} listeners`);
        },
        
        /**
         * Get count of active listeners
         * @returns {number}
         */
        getCount: function() {
            return listeners.size;
        },
        
        /**
         * Add one-time event listener
         * @param {Element} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object|boolean} options - Event options
         */
        once: function(element, event, handler, options = false) {
            const self = this;
            const id = this.on(element, event, function onceHandler(e) {
                self.offById(id);
                handler.call(this, e);
            }, options);
            return id;
        },
        
        /**
         * Add throttled event listener
         * @param {Element} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {number} limit - Throttle limit in ms
         */
        throttled: function(element, event, handler, limit = 100) {
            if (typeof throttle === 'function') {
                return this.on(element, event, throttle(handler, limit));
            }
            return this.on(element, event, handler);
        },
        
        /**
         * Add debounced event listener
         * @param {Element} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {number} delay - Debounce delay in ms
         */
        debounced: function(element, event, handler, delay = 300) {
            if (typeof debounce === 'function') {
                return this.on(element, event, debounce(handler, delay));
            }
            return this.on(element, event, handler);
        }
    };
    
    // Auto-cleanup on page unload
    window.addEventListener('beforeunload', function() {
        EventManager.cleanup();
    });
    
    // Cleanup on visibility change (tab close)
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            // Optional: Log stats before potential close
            Logger.debug(`[EventManager] Page hidden, ${EventManager.getCount()} active listeners`);
        }
    });
    
    // Expose globally
    window.EventManager = EventManager;
    
    Logger.debug('[EventManager] Enhanced EventManager loaded');
})();

// ========== perf-utils.js ==========
/**
 * Performance Utilities - Throttle, Debounce, RAF
 * ================================================
 */
const PerformanceUtils = (function() {
    'use strict';
    
    return {
        /**
         * Throttle - limit calls to once per N ms
         * Use for: scroll, resize, mousemove
         */
        throttle(func, limit = 100) {
            let inThrottle = false;
            let lastArgs = null;
            
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => {
                        inThrottle = false;
                        if (lastArgs) {
                            func.apply(this, lastArgs);
                            lastArgs = null;
                        }
                    }, limit);
                } else {
                    lastArgs = args;
                }
            };
        },
        
        /**
         * Debounce - wait N ms after last call
         * Use for: input, search, resize completion
         */
        debounce(func, wait = 250, immediate = false) {
            let timeout = null;
            
            return function(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func.apply(this, args);
                };
                
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                
                if (callNow) func.apply(this, args);
            };
        },
        
        /**
         * RequestAnimationFrame throttle - for animations
         */
        rafThrottle(func) {
            let ticking = false;
            
            return function(...args) {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        func.apply(this, args);
                        ticking = false;
                    });
                    ticking = true;
                }
            };
        },
        
        /**
         * Lazy load images with IntersectionObserver
         */
        lazyLoadImages(selector = 'img[data-src]', options = {}) {
            const defaultOptions = {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                            img.removeAttribute('data-srcset');
                        }
                        observer.unobserve(img);
                    }
                });
            }, { ...defaultOptions, ...options });
            
            document.querySelectorAll(selector).forEach(img => observer.observe(img));
            
            return observer;
        },
        
        /**
         * Batch DOM updates - group DOM operations
         */
        batchDOMUpdates(updates) {
            return new Promise(resolve => {
                requestAnimationFrame(() => {
                    const fragment = document.createDocumentFragment();
                    updates(fragment);
                    resolve(fragment);
                });
            });
        }
    };
})();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceUtils;
}

// ========== mobile-navigation.js ==========
/**
 * SuperChessPrep - Mobile Navigation System
 * Version 2.1
 * 
 * Features:
 * - Drawer shows ONLY login/register when not authenticated
 * - Full navigation when logged in
 * - Bottom nav hidden when not logged in
 * - Swipe gestures, ripple effects
 */

(function() {
  'use strict';

  const CONFIG = {
    drawerAnimationDuration: 300,
    touchThreshold: 50,
    swipeThreshold: 100,
  };

  let isDrawerOpen = false;
  let touchStartX = 0;
  let touchEndX = 0;
  let hamburgerBtn, mobileDrawer, drawerOverlay, bottomNav;

  // ============================================
  // INITIALIZATION
  // ============================================
  function initMobileNavigation() {
    hamburgerBtn = document.getElementById('hamburgerBtn');
    mobileDrawer = document.getElementById('mobileDrawer');
    drawerOverlay = document.getElementById('drawerOverlay');
    bottomNav = document.getElementById('bottomNav');

    if (!hamburgerBtn && !mobileDrawer && !bottomNav) {
      return;
    }

    setupHamburgerMenu();
    setupDrawerGestures();
    setupBottomNavigation();
    updateActiveNavItem();
    updateAuthState();

  }

  // ============================================
  // HAMBURGER MENU
  // ============================================
  function setupHamburgerMenu() {
    if (!hamburgerBtn || !mobileDrawer) return;

    hamburgerBtn.addEventListener('click', toggleDrawer);
    
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', closeDrawer);
    }

    const navItems = mobileDrawer.querySelectorAll('.drawer-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => setTimeout(closeDrawer, 150));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isDrawerOpen) closeDrawer();
    });
  }

  function toggleDrawer() {
    isDrawerOpen ? closeDrawer() : openDrawer();
  }

  function openDrawer() {
    if (!mobileDrawer) return;
    isDrawerOpen = true;
    mobileDrawer.classList.add('open');
    if (drawerOverlay) drawerOverlay.classList.add('open');
    if (hamburgerBtn) {
      hamburgerBtn.classList.add('open');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    isDrawerOpen = false;
    mobileDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.remove('open');
    if (hamburgerBtn) {
      hamburgerBtn.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  // ============================================
  // SWIPE GESTURES
  // ============================================
  function setupDrawerGestures() {
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;
      if (!isDrawerOpen && touchStartX < CONFIG.touchThreshold && swipeDistance > CONFIG.swipeThreshold) {
        openDrawer();
      }
    }, { passive: true });

    if (mobileDrawer) {
      mobileDrawer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      mobileDrawer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        if (isDrawerOpen && (touchStartX - touchEndX) > CONFIG.swipeThreshold) {
          closeDrawer();
        }
      }, { passive: true });
    }
  }

  // ============================================
  // BOTTOM NAVIGATION
  // ============================================
  function setupBottomNavigation() {
    if (!bottomNav) return;
    bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', (e) => addRippleEffect(item, e));
    });
  }

  function updateActiveNavItem() {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    
    const pathMap = {
      '/': 'home', '/index': 'home', '/index.html': 'home',
      '/dashboard': 'dashboard', '/dashboard.html': 'dashboard',
      '/all-courses': 'courses', '/all-courses.html': 'courses',
      '/videos': 'videos', '/videos.html': 'videos',
      '/daily-exercises': 'exercises', '/daily-exercises.html': 'exercises',
      '/community-discussions': 'forum', '/community-discussions.html': 'forum',
      '/news': 'news', '/news.html': 'news',
      '/shop': 'shop', '/shop.html': 'shop',
      '/login': 'login', '/login.html': 'login',
      '/register': 'register', '/register.html': 'register',
      '/admin': 'admin-panel',
      '/admin/pgn': 'admin-pgn',
      '/admin/videos': 'admin-videos',
      '/admin/forum': 'admin-forum',
      '/admin/news': 'admin-news',
    };
    
    const currentPageId = pathMap[currentPath] || '';

    // Update bottom nav
    if (bottomNav) {
      bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
        const pageId = item.getAttribute('data-page');
        item.classList.toggle('active', pageId === currentPageId);
      });
    }

    // Update drawer nav
    if (mobileDrawer) {
      mobileDrawer.querySelectorAll('.drawer-nav-item').forEach(item => {
        const pageId = item.getAttribute('data-page');
        item.classList.toggle('active', pageId === currentPageId);
      });
    }
  }

  function addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px; height: ${size}px;
      left: ${event.clientX - rect.left - size/2}px;
      top: ${event.clientY - rect.top - size/2}px;
      background: rgba(255, 140, 0, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  // ============================================
  // AUTH STATE - SHOW/HIDE BASED ON LOGIN
  // ============================================
  function updateAuthState() {
    const isLoggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn && Auth.isLoggedIn();
    
    // Drawer elements
    const drawerUserSection = document.getElementById('drawerUserSection');
    const drawerNavSection = document.getElementById('drawerNavSection');
    const drawerAdminSection = document.getElementById('drawerAdminSection');
    const drawerLoginSection = document.getElementById('drawerLoginSection');
    const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');

    // Bottom nav
    const bottomNav = document.getElementById('bottomNav');

    if (!isLoggedIn) {
      // NOT LOGGED IN: Show only login section
      if (drawerUserSection) drawerUserSection.style.display = 'none';
      if (drawerNavSection) drawerNavSection.style.display = 'none';
      if (drawerAdminSection) drawerAdminSection.style.display = 'none';
      if (drawerLoginSection) drawerLoginSection.style.display = 'flex';
      if (drawerLogoutBtn) drawerLogoutBtn.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
      
    } else {
      // LOGGED IN: Show everything
      const user = Auth.getCurrentUser();
      
      if (drawerUserSection) drawerUserSection.style.display = 'block';
      if (drawerNavSection) drawerNavSection.style.display = 'block';
      if (drawerLoginSection) drawerLoginSection.style.display = 'none';
      if (drawerLogoutBtn) drawerLogoutBtn.style.display = 'flex';
      if (bottomNav) bottomNav.style.display = '';
      
      // Update user info
      const drawerUsername = document.getElementById('drawerUsername');
      const drawerEmail = document.getElementById('drawerEmail');
      const drawerTierBadge = document.getElementById('drawerTierBadge');
      const drawerTierIcon = document.getElementById('drawerTierIcon');
      const drawerTierText = document.getElementById('drawerTierText');
      
      if (drawerUsername && user) drawerUsername.textContent = user.username || 'User';
      if (drawerEmail && user) drawerEmail.textContent = user.email || '';
      
      const tier = user?.tier || user?.subscription_tier || 'free';
      const tierConfig = {
        free: { icon: '⭐', name: 'Free' },
        basic: { icon: '♟️', name: 'Basic' },
        premium: { icon: '♞', name: 'Premium' },
        elite: { icon: '♛', name: 'Elite' },
        admin: { icon: '🔐', name: 'Admin' }
      };
      
      const t = tierConfig[tier] || tierConfig.free;
      if (drawerTierIcon) drawerTierIcon.textContent = t.icon;
      if (drawerTierText) drawerTierText.textContent = t.name;
      if (drawerTierBadge) drawerTierBadge.className = 'drawer-tier-badge ' + tier;
      
      // Admin section
      const isAdmin = user?.role === 'admin' || tier === 'admin';
      if (drawerAdminSection) {
        drawerAdminSection.style.display = isAdmin ? 'block' : 'none';
      }
    }
  }

  // ============================================
  // LOGOUT
  // ============================================
  window.handleMobileLogout = function() {
    closeDrawer();
    
    const logoutBtn = document.getElementById('drawerLogoutBtn');
    if (logoutBtn) {
      logoutBtn.innerHTML = '<span>⏳</span> Logging out...';
      logoutBtn.disabled = true;
    }

    if (typeof AuthAPI !== 'undefined' && AuthAPI.logout) {
      AuthAPI.logout()
        .then(() => window.location.href = '/')
        .catch(() => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        });
    } else {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  // ============================================
  // VIEWPORT FIX
  // ============================================
  function fixViewportHeight() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }
  window.addEventListener('resize', typeof throttle === 'function' ? throttle(fixViewportHeight, 150) : fixViewportHeight);
  window.addEventListener('orientationchange', () => setTimeout(fixViewportHeight, 100));
  fixViewportHeight();

  // Ripple animation
  const style = document.createElement('style');
  style.textContent = '@keyframes ripple { to { transform: scale(4); opacity: 0; } }';
  document.head.appendChild(style);

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNavigation);
  } else {
    initMobileNavigation();
  }

  // Re-check auth periodically
  window.addEventListener('authStateChange', updateAuthState);
  setTimeout(updateAuthState, 500);
  setTimeout(updateAuthState, 1500);

  // Export
  window.MobileNav = { openDrawer, closeDrawer, toggleDrawer, updateAuthState, updateActiveNavItem };
})();

// ========== header-component.js ==========
(function() {
  'use strict';

  function ensureNavRight() {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return null;
    let navRight = navContainer.querySelector('.nav-right');
    if (!navRight) {
      navRight = document.createElement('div');
      navRight.className = 'nav-right';
      navContainer.appendChild(navRight);
    }
    return navRight;
  }

  function ensureCorrectOrder(navRight) {
    if (!navRight) return;
    const partnerLogo = navRight.querySelector('.partner-logo');
    const dashboardBtn = navRight.querySelector('.dashboard-button, .scp-back-button, .back-button');
    const userMenu = navRight.querySelector('.user-menu-button');
    const authButtons = navRight.querySelector('.auth-buttons');
    const elements = [partnerLogo, dashboardBtn, userMenu || authButtons].filter(Boolean);
    elements.forEach(el => el.remove());
    elements.forEach(el => navRight.appendChild(el));
  }

  function fixPartnerLogoPosition() {
    const navRight = ensureNavRight();
    const partnerLogo = document.querySelector('.partner-logo');
    if (!navRight || !partnerLogo) return;
    if (!navRight.contains(partnerLogo)) {
      navRight.insertBefore(partnerLogo, navRight.firstChild);
    }
    ensureCorrectOrder(navRight);
  }

  function init() {
    ensureNavRight();
    fixPartnerLogoPosition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      // Single delayed call instead of multiple
      setTimeout(fixPartnerLogoPosition, 500);
    });
  } else {
    init();
    // Single delayed call instead of multiple
    setTimeout(fixPartnerLogoPosition, 500);
  }

  window.HeaderComponent = { init, fixOrder: fixPartnerLogoPosition };
})();
// ADD THIS TO THE END OF header-component.js

// Fix for logged-in users - ensures correct order
function fixLoggedInHeader() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;
  
  // Collect all elements
  const partnerLogo = navRight.querySelector('.partner-logo') || document.querySelector('.nav-container > .partner-logo');
  const dashboardBtn = navRight.querySelector('.dashboard-button, .scp-back-button');
  const userMenu = navRight.querySelector('.user-menu-button');
  const authButtons = navRight.querySelector('.auth-buttons');
  
  // If partner-logo is outside nav-right, move it
  if (partnerLogo && !navRight.contains(partnerLogo)) {
    navRight.insertBefore(partnerLogo, navRight.firstChild);
  }
  
  // Clear nav-right and add in correct order
  const elements = [];
  if (partnerLogo) elements.push(partnerLogo);
  if (dashboardBtn) elements.push(dashboardBtn);
  if (userMenu) elements.push(userMenu);
  if (authButtons) elements.push(authButtons);
  
  // Remove all
  elements.forEach(el => { if (el && el.parentNode) el.remove(); });
  
  // Add back in correct order
  elements.forEach(el => { if (el) navRight.appendChild(el); });
  
}

// Call after auth-integration completes (single call with adequate delay)
setTimeout(fixLoggedInHeader, 800);
// Additional call after full page load for edge cases
window.addEventListener('load', () => setTimeout(fixLoggedInHeader, 200));

