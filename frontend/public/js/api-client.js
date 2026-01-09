/**
 * SuperChessPrep API Client
 * 
 * Robust API client with:
 * - Automatic retry with exponential backoff
 * - Offline detection and queuing
 * - Request timeout handling
 * - Centralized error handling
 * - Token refresh support
 * 
 * @version 1.0.0
 */

const ApiClient = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    baseUrl: window.API_BASE_URL || '',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    retryMultiplier: 2,
    offlineQueueLimit: 50
  };

  // State
  let isOnline = navigator.onLine;
  let offlineQueue = [];
  let authToken = null;

  // ============================================
  // OFFLINE HANDLING
  // ============================================

  /**
   * Initialize online/offline listeners
   */
  function initNetworkListeners() {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    isOnline = navigator.onLine;
  }

  /**
   * Handle coming back online
   */
  async function handleOnline() {
    isOnline = true;
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('api:online'));
    
    // Process queued requests
    await processOfflineQueue();
  }

  /**
   * Handle going offline
   */
  function handleOffline() {
    isOnline = false;
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('api:offline'));
  }

  /**
   * Process queued offline requests
   */
  async function processOfflineQueue() {
    if (offlineQueue.length === 0) return;
    
    const queue = [...offlineQueue];
    offlineQueue = [];
    
    for (const item of queue) {
      try {
        const response = await makeRequest(item.options);
        if (item.resolve) item.resolve(response);
      } catch (error) {
        Logger.error('[ApiClient] Queued request failed:', error);
        if (item.reject) item.reject(error);
      }
    }
    
    window.dispatchEvent(new CustomEvent('api:queue-processed', {
      detail: { count: queue.length }
    }));
  }

  /**
   * Queue request for when back online
   */
  function queueRequest(options) {
    return new Promise((resolve, reject) => {
      if (offlineQueue.length >= CONFIG.offlineQueueLimit) {
        reject(new Error('Offline queue is full'));
        return;
      }
      
      offlineQueue.push({ options, resolve, reject, timestamp: Date.now() });
      
      window.dispatchEvent(new CustomEvent('api:request-queued', {
        detail: { queueLength: offlineQueue.length }
      }));
    });
  }

  // ============================================
  // RETRY LOGIC
  // ============================================

  /**
   * Sleep for specified milliseconds
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  function isRetryableError(error, status) {
    // Network errors
    if (!status) return true;
    
    // Server errors (5xx)
    if (status >= 500) return true;
    
    // Rate limiting
    if (status === 429) return true;
    
    // Request timeout
    if (error.name === 'AbortError') return true;
    
    return false;
  }

  /**
   * Make request with retry logic
   */
  async function requestWithRetry(url, options, retryCount = 0) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      if (!response.ok && isRetryableError(null, response.status)) {
        throw { status: response.status, retryable: true };
      }
      
      return response;
    } catch (error) {
      const canRetry = retryCount < CONFIG.maxRetries && 
                       (error.retryable || isRetryableError(error));
      
      if (canRetry) {
        const delay = CONFIG.retryDelay * Math.pow(CONFIG.retryMultiplier, retryCount);
        await sleep(delay);
        return requestWithRetry(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  // ============================================
  // FETCH WITH TIMEOUT
  // ============================================

  /**
   * Fetch with timeout support
   */
  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = options.timeout || CONFIG.timeout;
    
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ============================================
  // MAIN REQUEST FUNCTION
  // ============================================

  /**
   * Make API request
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async function makeRequest(options) {
    const {
      method = 'GET',
      endpoint,
      data,
      headers = {},
      requiresAuth = true,
      queueIfOffline = false,
      skipRetry = false
    } = options;

    // Check if offline
    if (!isOnline) {
      if (queueIfOffline && method !== 'GET') {
        return queueRequest(options);
      }
      throw new ApiError('You are offline. Please check your connection.', 0, 'OFFLINE');
    }

    // Build URL
    const url = `${CONFIG.baseUrl}${endpoint}`;
    
    // Build headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    // Add auth token
    if (requiresAuth && authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Build request options
    const fetchOptions = {
      method,
      headers: requestHeaders
    };
    
    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }
    
    try {
      // Make request (with or without retry)
      const response = skipRetry 
        ? await fetchWithTimeout(url, fetchOptions)
        : await requestWithRetry(url, fetchOptions);
      
      // Parse response
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      // Handle error responses
      if (!response.ok) {
        throw new ApiError(
          responseData.error || responseData.message || 'Request failed',
          response.status,
          responseData.code || 'API_ERROR'
        );
      }
      
      return responseData;
    } catch (error) {
      // Handle specific errors
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please try again.', 0, 'TIMEOUT');
      }
      
      if (error.message === 'Failed to fetch') {
        throw new ApiError('Unable to connect to server. Please check your connection.', 0, 'NETWORK_ERROR');
      }
      
      throw new ApiError(error.message || 'Unknown error occurred', 0, 'UNKNOWN');
    }
  }

  // ============================================
  // API ERROR CLASS
  // ============================================

  class ApiError extends Error {
    constructor(message, status, code) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    /**
     * Initialize the API client
     */
    init() {
      initNetworkListeners();
      
      // Load token from storage
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        authToken = storedToken;
      }
      
      return this;
    },

    /**
     * Set authentication token
     */
    setToken(token) {
      authToken = token;
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    },

    /**
     * Clear authentication
     */
    clearAuth() {
      authToken = null;
      localStorage.removeItem('auth_token');
    },

    /**
     * Check if online
     */
    isOnline() {
      return isOnline;
    },

    /**
     * Get offline queue length
     */
    getQueueLength() {
      return offlineQueue.length;
    },

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
      return makeRequest({ method: 'GET', endpoint, ...options });
    },

    /**
     * POST request
     */
    async post(endpoint, data, options = {}) {
      return makeRequest({ method: 'POST', endpoint, data, ...options });
    },

    /**
     * PUT request
     */
    async put(endpoint, data, options = {}) {
      return makeRequest({ method: 'PUT', endpoint, data, ...options });
    },

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
      return makeRequest({ method: 'DELETE', endpoint, ...options });
    },

    /**
     * PATCH request
     */
    async patch(endpoint, data, options = {}) {
      return makeRequest({ method: 'PATCH', endpoint, data, ...options });
    },

    // ============================================
    // CONVENIENCE METHODS
    // ============================================

    /**
     * Auth endpoints
     */
    auth: {
      async login(email, password) {
        const response = await makeRequest({
          method: 'POST',
          endpoint: '/api/auth/login',
          data: { email, password },
          requiresAuth: false
        });
        
        if (response.token) {
          ApiClient.setToken(response.token);
        }
        
        return response;
      },

      async register(username, email, password) {
        return makeRequest({
          method: 'POST',
          endpoint: '/api/auth/register',
          data: { username, email, password },
          requiresAuth: false
        });
      },

      async logout() {
        try {
          await makeRequest({
            method: 'POST',
            endpoint: '/api/auth/logout'
          });
        } finally {
          ApiClient.clearAuth();
        }
      }
    },

    /**
     * User endpoints
     */
    users: {
      async getProfile() {
        return makeRequest({ endpoint: '/api/users/profile' });
      },

      async updateProfile(data) {
        return makeRequest({
          method: 'PUT',
          endpoint: '/api/users/profile',
          data
        });
      }
    },

    /**
     * Exercise endpoints
     */
    exercises: {
      async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        return makeRequest({ 
          endpoint: `/api/exercises${query ? '?' + query : ''}` 
        });
      },

      async getById(id) {
        return makeRequest({ endpoint: `/api/exercises/${id}` });
      }
    },

    /**
     * Video endpoints
     */
    videos: {
      async getAll() {
        return makeRequest({ endpoint: '/api/videos' });
      },

      async getById(id) {
        return makeRequest({ endpoint: `/api/videos/${id}` });
      }
    },

    /**
     * Forum endpoints
     */
    forum: {
      async getTopics() {
        return makeRequest({ endpoint: '/api/forum/topics' });
      },

      async getPinnedTopics() {
        return makeRequest({ endpoint: '/api/forum/topics/pinned' });
      },

      async createPost(topicId, content) {
        return makeRequest({
          method: 'POST',
          endpoint: `/api/forum/topics/${topicId}/posts`,
          data: { content },
          queueIfOffline: true
        });
      }
    },

    /**
     * Subscription endpoints
     */
    subscriptions: {
      async getStatus() {
        return makeRequest({ endpoint: '/api/subscriptions/status' });
      },

      async checkout(priceId) {
        return makeRequest({
          method: 'POST',
          endpoint: '/api/subscriptions/checkout',
          data: { priceId }
        });
      }
    },

    // Error class for external use
    ApiError
  };
})();

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ApiClient.init());
  } else {
    ApiClient.init();
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}
