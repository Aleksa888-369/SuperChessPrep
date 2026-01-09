/**
 * SuperChessPrep State Manager
 * 
 * Centralized state management for the frontend.
 * Provides reactive state updates with event-based subscriptions.
 * 
 * @version 1.0.0
 * 
 * Usage:
 *   // Subscribe to state changes
 *   StateManager.subscribe('user', (user) => {
 *     updateUserUI(user);
 *   });
 *   
 *   // Update state
 *   StateManager.setState('user', { name: 'John' });
 *   
 *   // Get current state
 *   const user = StateManager.getState('user');
 */

const StateManager = (function() {
  'use strict';

  // Private state storage
  const state = {
    // Authentication
    user: null,
    token: null,
    isAuthenticated: false,
    
    // Subscription
    subscription: {
      tier: 'free',
      status: 'inactive',
      expiresAt: null
    },
    
    // UI State
    loading: {},
    errors: {},
    modals: {},
    
    // Data Cache
    cache: {
      exercises: null,
      videos: null,
      topics: null,
      lastFetch: {}
    }
  };

  // Subscribers by key
  const subscribers = {};

  // Local storage keys
  const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'user_data',
    PREFERENCES: 'user_preferences'
  };

  /**
   * Notify all subscribers of a state change
   */
  function notifySubscribers(key, value) {
    if (subscribers[key]) {
      subscribers[key].forEach(callback => {
        try {
          callback(value, state);
        } catch (error) {
          Logger.error(`[StateManager] Subscriber error for ${key}:`, error);
        }
      });
    }
    
    // Also notify wildcard subscribers
    if (subscribers['*']) {
      subscribers['*'].forEach(callback => {
        try {
          callback(key, value, state);
        } catch (error) {
          Logger.error('[StateManager] Wildcard subscriber error:', error);
        }
      });
    }
  }

  /**
   * Deep clone an object
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(deepClone);
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  /**
   * Save to local storage
   */
  function saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      Logger.error('[StateManager] Storage error:', error);
    }
  }

  /**
   * Load from local storage
   */
  function loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null; try { return JSON.parse(data); } catch(e) { return data; }
    } catch (error) {
      Logger.error('[StateManager] Storage read error:', error);
      return null;
    }
  }

  // Public API
  return {
    /**
     * Get current state value
     * @param {string} key - State key (supports dot notation: 'user.name')
     * @returns {*} State value (cloned to prevent mutations)
     */
    getState(key) {
      if (!key) return deepClone(state);
      
      const keys = key.split('.');
      let value = state;
      
      for (const k of keys) {
        if (value === null || value === undefined) return undefined;
        value = value[k];
      }
      
      return deepClone(value);
    },

    /**
     * Set state value
     * @param {string} key - State key
     * @param {*} value - New value
     * @param {Object} options - Options
     * @param {boolean} options.persist - Save to localStorage
     * @param {boolean} options.silent - Don't notify subscribers
     */
    setState(key, value, options = {}) {
      const { persist = false, silent = false } = options;
      
      const keys = key.split('.');
      const lastKey = keys.pop();
      
      let target = state;
      for (const k of keys) {
        if (target[k] === undefined) target[k] = {};
        target = target[k];
      }
      
      const oldValue = target[lastKey];
      target[lastKey] = value;
      
      // Persist to localStorage if requested
      if (persist) {
        saveToStorage(`scp_${key}`, value);
      }
      
      // Notify subscribers
      if (!silent && oldValue !== value) {
        notifySubscribers(key, value);
        
        // Also notify parent keys
        for (let and = keys.length - 1; and >= 0; i--) {
          const parentKey = keys.slice(0, and + 1).join('.');
          notifySubscribers(parentKey, this.getState(parentKey));
        }
      }
      
      return value;
    },

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch (or '*' for all)
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      if (!subscribers[key]) {
        subscribers[key] = [];
      }
      
      subscribers[key].push(callback);
      
      // Return unsubscribe function
      return () => {
        const index = subscribers[key].indexOf(callback);
        if (index > -1) {
          subscribers[key].splice(index, 1);
        }
      };
    },

    /**
     * Initialize state from localStorage
     */
    init() {
      // Load token
      const token = loadFromStorage(STORAGE_KEYS.TOKEN);
      if (token) {
        this.setState('token', token);
        this.setState('isAuthenticated', true);
      }
      
      // Load user
      const user = loadFromStorage(STORAGE_KEYS.USER);
      if (user) {
        this.setState('user', user);
        this.setState('subscription.tier', user.subscription_tier || 'free');
      }
      
      Logger.debug('[StateManager] Initialized', {
        isAuthenticated: state.isAuthenticated,
        tier: state.subscription.tier
      });
      
      return this;
    },

    /**
     * Login - set auth state
     */
    login(token, user) {
      saveToStorage(STORAGE_KEYS.TOKEN, token);
      saveToStorage(STORAGE_KEYS.USER, user);
      
      this.setState('token', token);
      this.setState('user', user);
      this.setState('isAuthenticated', true);
      this.setState('subscription.tier', user.subscription_tier || 'free');
      
      notifySubscribers('auth', { token, user, isAuthenticated: true });
    },

    /**
     * Logout - clear auth state
     */
    logout() {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      this.setState('token', null);
      this.setState('user', null);
      this.setState('isAuthenticated', false);
      this.setState('subscription', { tier: 'free', status: 'inactive' });
      
      // Clear cache
      this.setState('cache', {
        exercises: null,
        videos: null,
        topics: null,
        lastFetch: {}
      });
      
      notifySubscribers('auth', { token: null, user: null, isAuthenticated: false });
    },

    /**
     * Set loading state for a key
     */
    setLoading(key, isLoading) {
      this.setState(`loading.${key}`, isLoading);
    },

    /**
     * Check if something is loading
     */
    isLoading(key) {
      return state.loading[key] === true;
    },

    /**
     * Set error for a key
     */
    setError(key, error) {
      this.setState(`errors.${key}`, error);
    },

    /**
     * Clear error for a key
     */
    clearError(key) {
      this.setState(`errors.${key}`, null);
    },

    /**
     * Get error for a key
     */
    getError(key) {
      return state.errors[key];
    },

    /**
     * Modal management
     */
    openModal(modalId, data = {}) {
      this.setState(`modals.${modalId}`, { isOpen: true, data });
    },

    closeModal(modalId) {
      this.setState(`modals.${modalId}`, { isOpen: false, data: null });
    },

    isModalOpen(modalId) {
      return state.modals[modalId]?.isOpen === true;
    },

    /**
     * Cache management with TTL
     */
    setCache(key, data, ttlSeconds = 300) {
      this.setState(`cache.${key}`, data);
      this.setState(`cache.lastFetch.${key}`, Date.now() + (ttlSeconds * 1000));
    },

    getCache(key) {
      const expiry = state.cache.lastFetch[key];
      if (expiry && Date.now() > expiry) {
        this.setState(`cache.${key}`, null);
        return null;
      }
      return state.cache[key];
    },

    isCacheValid(key) {
      const expiry = state.cache.lastFetch[key];
      return expiry && Date.now() < expiry;
    },

    /**
     * Debug - get full state (for development)
     */
    debug() {
      if (process.env.NODE_ENV === 'development' || window.DEBUG) {
      }
    }
  };
})();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    StateManager.init();
  });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateManager;
}
