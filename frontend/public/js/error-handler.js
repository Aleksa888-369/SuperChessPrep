/**
 * SuperChessPrep Global Error Handler
 * 
 * Catches unhandled errors and provides user-friendly feedback.
 * Also reports errors to console for debugging.
 * 
 * @version 1.0.0
 * January 2026 - PATCH 3
 */

(function() {
  'use strict';

  // Configuration
  const ERROR_CONFIG = {
    showNotifications: true,
    logToConsole: true,
    maxErrors: 10,           // Max errors to track per session
    ignoredMessages: [
      'ResizeObserver loop',  // Common benign error
      'Script error.',        // Cross-origin script errors
      'Network request failed'
    ]
  };

  // Error tracking
  let errorCount = 0;
  const errorLog = [];

  /**
   * Check if error should be ignored
   */
  function shouldIgnore(message) {
    if (!message) return false;
    return ERROR_CONFIG.ignoredMessages.some(ignored => 
      message.toLowerCase().includes(ignored.toLowerCase())
    );
  }

  /**
   * Log error for debugging
   */
  function logError(type, error, extra = {}) {
    if (!ERROR_CONFIG.logToConsole) return;

    const entry = {
      type,
      message: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...extra
    };

    errorLog.push(entry);
    
    // Keep only last N errors
    if (errorLog.length > ERROR_CONFIG.maxErrors) {
      errorLog.shift();
    }

    Logger.error(`[SCP Error] ${type}:`, entry);
  }

  /**
   * Show user-friendly error notification
   */
  function showErrorNotification(message) {
    if (!ERROR_CONFIG.showNotifications) return;
    
    // Use custom notification if available
    if (typeof showNotification === 'function') {
      showNotification(message, 'error');
      return;
    }
    
    // Use popup notification if available
    if (typeof showPopupNotification === 'function') {
      showPopupNotification(message, '❌', 5000);
      return;
    }

    // Fallback: Create simple toast
    const toast = document.createElement('div');
    toast.className = 'scp-error-toast';
    SafeHTML.setHTML(toast, `
      <span class="scp-error-icon">⚠️</span>
      <span class="scp-error-message">${SafeHTML.escapeText(message)}</span>
    `);
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(239, 68, 68, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  /**
   * Escape HTML for safe display
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get user-friendly error message
   */
  function getUserFriendlyMessage(error) {
    const message = error.message || String(error);
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
      return 'Connection error. Please check your internet.';
    }
    
    // Auth errors
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Session expired. Please log in again.';
    }
    
    // Permission errors
    if (message.includes('403') || message.includes('forbidden')) {
      return 'You don\'t have permission to do this.';
    }
    
    // Not found
    if (message.includes('404') || message.includes('not found')) {
      return 'The requested resource was not found.';
    }
    
    // Server errors
    if (message.includes('500') || message.includes('server')) {
      return 'Server error. Please try again later.';
    }
    
    // Generic
    return 'Something went wrong. Please try again.';
  }

  // ============================================
  // GLOBAL ERROR HANDLERS
  // ============================================

  /**
   * Handle uncaught errors
   */
  window.onerror = function(message, source, lineno, colno, error) {
    if (shouldIgnore(message)) return false;
    
    errorCount++;
    logError('uncaught', error || message, { source, lineno, colno });
    
    // Don't spam user with errors
    if (errorCount <= 3) {
      showErrorNotification(getUserFriendlyMessage(error || { message }));
    }
    
    return false; // Don't prevent default handling
  };

  /**
   * Handle unhandled promise rejections
   */
  window.onunhandledrejection = function(event) {
    const error = event.reason;
    const message = error?.message || String(error);
    
    if (shouldIgnore(message)) return;
    
    errorCount++;
    logError('unhandledRejection', error);
    
    if (errorCount <= 3) {
      showErrorNotification(getUserFriendlyMessage(error || { message }));
    }
  };

  // ============================================
  // CSS for toast animation
  // ============================================
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(0); opacity: 1; }
      to { transform: translateX(-50%) translateY(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // ============================================
  // PUBLIC API
  // ============================================
  window.SCPErrorHandler = {
    /**
     * Manually report an error
     */
    report: function(error, context = {}) {
      logError('manual', error, context);
      showErrorNotification(getUserFriendlyMessage(error));
    },
    
    /**
     * Get error log for debugging
     */
    getLog: function() {
      return [...errorLog];
    },
    
    /**
     * Clear error log
     */
    clearLog: function() {
      errorLog.length = 0;
      errorCount = 0;
    },
    
    /**
     * Configure error handler
     */
    configure: function(options) {
      Object.assign(ERROR_CONFIG, options);
    }
  };

})();
