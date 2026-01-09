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