/**
 * PASSWORDLESS Auth Client Library for SuperChessPrep
 * v2.1 - Added Session-Based Token Refresh for Remember Me
 * December 2024
 */

const getAuthApiUrl = () => {
  const hostname = window.location.hostname;
  
  // PRODUCTION
  if (hostname === 'superchessprep.com' || hostname === 'www.superchessprep.com') {
    return 'https://api.superchessprep.com/api';
  }
  
  // DEVELOPMENT
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3003/api';
  }
  
  // TESTING
  if (hostname.includes('152.53.186.105')) {
    return `http://${hostname}:3003/api`;
  }
  
  // Default fallback
  return `https://api.${hostname}/api`;
};

const AUTH_API_URL = getAuthApiUrl();
// ============================================
// JWT DECODE HELPER
// ============================================

/**
 * Decode JWT token without verification (client-side only)
 * @param {string} token 
 * @returns {object|null} Decoded payload or null
 */
function decodeJWT(token) {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    Logger.error('[ERROR] JWT decode error:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired or about to expire
 * @param {string} token - JWT token
 * @param {number} bufferSeconds - Seconds before expiry to consider "expired" (default: 60)
 * @returns {boolean} true if expired or about to expire
 */
function isTokenExpired(token, bufferSeconds = 60) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < (now + bufferSeconds);
}

/**
 * Get time until token expires (in seconds)
 * @param {string} token 
 * @returns {number} Seconds until expiry, or 0 if expired
 */
function getTokenTimeRemaining(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - now);
}

// ============================================
// STORAGE HELPERS
// ============================================

const storage = {
  setToken: (token) => localStorage.setItem('auth_token', token),
  getToken: () => localStorage.getItem('auth_token'),
  removeToken: () => localStorage.removeItem('auth_token'),
  
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem('user'),
  
  setSessionToken: (token) => localStorage.setItem('session_token', token),
  getSessionToken: () => localStorage.getItem('session_token'),
  removeSessionToken: () => localStorage.removeItem('session_token'),
  
  setTempToken: (token) => sessionStorage.setItem('temp_token', token),
  getTempToken: () => sessionStorage.getItem('temp_token'),
  removeTempToken: () => sessionStorage.removeItem('temp_token'),
  
  setTempEmail: (email) => sessionStorage.setItem('temp_email', email),
  getTempEmail: () => sessionStorage.getItem('temp_email'),
  removeTempEmail: () => sessionStorage.removeItem('temp_email'),
  
  clearAll: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('session_token');
    sessionStorage.removeItem('temp_token');
    sessionStorage.removeItem('temp_email');
  }
};

// ============================================
// Token REFRESH LOGIC
// ============================================

let isRefreshing = false;
let refreshPromise = null;

/**
 * Refresh JWT token using SESSION token (for Remember Me)
 * @returns {Promise<string|null>} New token or null if refresh failed
 */
async function refreshTokenWithSession() {
  const sessionToken = storage.getSessionToken();
  
  if (!sessionToken) {
    return null;
  }
  
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${AUTH_API_URL}/auth/refresh-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionToken })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.token) {
        // Save new token
        storage.setToken(data.token);
        
        // Update user data
        if (data.user) {
          storage.setUser(data.user);
        }
        
        return data.token;
      } else {
        // If session is invalid/expired, clear everything
        if (data.code === 'SESSION_EXPIRED' || data.code === 'SESSION_NOT_FOUND') {
          storage.clearAll();
        }
        
        return null;
      }
    } catch (error) {
      Logger.error('[ERROR] Token refresh error:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

/**
 * Refresh JWT token using current JWT (requires valid token)
 * Use this after subscription purchase when JWT is still valid
 * @returns {Promise<string|null>} New token or null if refresh failed
 */
async function refreshTokenWithJWT() {
  const token = storage.getToken();
  
  if (!token) {
    return null;
  }
  
  try {
    const response = await fetch(`${AUTH_API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.token) {
      // Save new token
      storage.setToken(data.token);
      
      // Update user data
      if (data.user) {
        storage.setUser(data.user);
      }
      
      return data.token;
    } else {
      return null;
    }
  } catch (error) {
    Logger.error('[ERROR] JWT refresh error:', error);
    return null;
  }
}

// ============================================
// API REQUEST WITH AUTO-REFRESH
// ============================================

/**
 * Make API request with automatic token refresh
 * @param {string} endpoint 
 * @param {object} options 
 * @param {boolean} retryAfterRefresh - Internal flag, don't set manually
 */
async function apiRequest(endpoint, options = {}, retryAfterRefresh = true) {
  let token = storage.getToken();
  
  // Check if token is expired or about to expire (5 min buffer)
  if (token && isTokenExpired(token, 300)) {
    const newToken = await refreshTokenWithSession();
    if (newToken) {
      token = newToken;
    } else {
    }
  }
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(`${AUTH_API_URL}${endpoint}`, config);
    const data = await response.json();
    
    // Handle token expiration from server response
    if (!response.ok) {
      // Check if it's a token expiration error
      if ((response.status === 401 || response.status === 403) && 
          retryAfterRefresh && 
          storage.getSessionToken()) {
        
        const errorMsg = (data.error || '').toLowerCase();
        if (errorMsg.includes('expired') || errorMsg.includes('invalid token')) {
          const newToken = await refreshTokenWithSession();
          if (newToken) {
            // Retry the original request with new token
            return apiRequest(endpoint, options, false);
          }
        }
      }
      
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    Logger.error('API Request Error:', error);
    throw error;
  }
}

// ============================================
// AUTH API METHODS
// ============================================

const AuthAPI = {
  // PASSWORDLESS - Register with username and email only
  register: async (username, email) => {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email })
    });
    
    if (result.tempToken) {
      storage.setTempToken(result.tempToken);
      storage.setTempEmail(email);
    }
    
    return result;
  },

  // Verify email sa 5-digit code
  verifyEmail: async (email, code) => {
    const result = await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });
    
    if (result.token) {
      storage.setToken(result.token);
      storage.setUser(result.user);
      if (result.sessionToken) {
        storage.setSessionToken(result.sessionToken);
      }
      storage.removeTempToken();
      storage.removeTempEmail();
    }
    
    return result;
  },

  // PASSWORDLESS LOGIN - email only
  login: async (email) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    if (result.tempToken) {
      storage.setTempToken(result.tempToken);
      storage.setTempEmail(email);
    }
    
    return result;
  },

  // Verify login code
  verifyLoginCode: async (code, rememberMe = false) => {
    const tempToken = storage.getTempToken();
    
    if (!tempToken) {
      throw new Error('No verification session found');
    }
    
    const result = await apiRequest('/auth/verify-login', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code, rememberMe })
    });
    
    if (result.token) {
      storage.setToken(result.token);
      storage.setUser(result.user);
      if (result.sessionToken) {
        storage.setSessionToken(result.sessionToken);
      }
      storage.removeTempToken();
      storage.removeTempEmail();
    }
    
    return result;
  },

  // Alias for verifyLoginCode (some code uses verifyLogin)
  verifyLogin: async (code, rememberMe = false) => {
    return AuthAPI.verifyLoginCode(code, rememberMe);
  },

  // Resend verification code
  resendVerification: async (email, type = 'registration') => {
    return await apiRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email, type })
    });
  },
  
  // Logout
  logout: async () => {
    try {
      const sessionToken = storage.getSessionToken();
      await apiRequest('/auth/logout', { 
        method: 'POST',
        body: JSON.stringify({ sessionToken })
      });
    } catch (error) {
      Logger.error('Logout error:', error);
    } finally {
      storage.clearAll();
    }
  },

  // Check auth status
  checkAuth: async () => {
    try {
      const result = await apiRequest('/auth/me');
      if (result.user) {
        storage.setUser(result.user);
      }
      return result;
    } catch (error) {
      // Don't clear storage here - let isLoggedIn handle it
      throw error;
    }
  },

  // Check email availability
  checkEmail: async (email) => {
    const result = await apiRequest(`/auth/check-email?email=${encodeURIComponent(email)}`);
    return result.available;
  },

  // Check username availability
  checkUsername: async (username) => {
    const result = await apiRequest(`/auth/check-username?username=${encodeURIComponent(username)}`);
    return result.available;
  },

  // ============================================
  // Get current user WITH role from JWT
  // ============================================
  
  getCurrentUser: () => {
    const token = storage.getToken();
    
    if (!token) {
      Logger.warn('[WARN] No auth token found');
      return null;
    }
    
    // Decode JWT to get full user data including role
    const decoded = decodeJWT(token);
    
    if (!decoded) {
      Logger.warn('[WARN] Invalid JWT token format');
      return storage.getUser(); // Fallback to localStorage
    }
    
    // Get user from localStorage
    const storedUser = storage.getUser();
    
    // Return merged user object with data from JWT token (priority) and localStorage
    const user = {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role || 'free',
      subscription_tier: decoded.subscription_tier || 'free',
      // Add any other fields from localStorage user object
      ...(storedUser || {})
    };
    
    return user;
  },

  // Check if logged in with auto-refresh capability
  isLoggedIn: () => {
    const token = storage.getToken();
    
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    if (isTokenExpired(token, 0)) {
      // Check if we have session token for refresh
      const sessionToken = storage.getSessionToken();
      if (sessionToken) {
        // Return true - we'll refresh on next API call
        // This prevents flash of login screen
        return true;
      }
      
      // No session token, user is truly logged out
      storage.clearAll();
      return false;
    }
    
    return true;
  },

  // Force token refresh - tries JWT first, then session
  forceRefresh: async () => {
    // First try JWT refresh (works if token is still valid)
    const jwtResult = await refreshTokenWithJWT();
    if (jwtResult) {
      return jwtResult;
    }
    
    // If JWT refresh failed, try session refresh
    return await refreshTokenWithSession();
  },

  // Refresh using JWT only (for after subscription purchase)
  refreshWithJWT: async () => {
    return await refreshTokenWithJWT();
  },

  // Refresh using session only (for expired JWT with valid session)
  refreshWithSession: async () => {
    return await refreshTokenWithSession();
  },

  // Get token expiry info
  getTokenInfo: () => {
    const token = storage.getToken();
    if (!token) return null;
    
    const decoded = decodeJWT(token);
    if (!decoded) return null;
    
    const remaining = getTokenTimeRemaining(token);
    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
    
    return {
      expiresAt,
      remainingSeconds: remaining,
      remainingMinutes: Math.floor(remaining / 60),
      remainingHours: Math.floor(remaining / 3600),
      isExpired: remaining <= 0,
      hasSessionToken: !!storage.getSessionToken()
    };
  }
};

// ============================================
// BACKGROUND TOKEN REFRESH
// ============================================

let backgroundRefreshInterval = null;

/**
 * Setup background token refresh
 * Refreshes token 5 minutes before expiry
 */
function setupBackgroundRefresh() {
  // Clear any existing interval
  if (backgroundRefreshInterval) {
    clearInterval(backgroundRefreshInterval);
  }
  
  // Check every minute
  backgroundRefreshInterval = setInterval(async () => {
    const token = storage.getToken();
    const sessionToken = storage.getSessionToken();
    
    if (!token || !sessionToken) return;
    
    const remaining = getTokenTimeRemaining(token);
    
    // Refresh if less than 5 minutes remaining
    if (remaining > 0 && remaining < 300) {
      await refreshTokenWithSession();
    }
  }, 60000); // Check every minute
  
}

/**
 * Stop background refresh (e.g., on logout)
 */
function stopBackgroundRefresh() {
  if (backgroundRefreshInterval) {
    clearInterval(backgroundRefreshInterval);
    backgroundRefreshInterval = null;
  }
}

// Start background refresh when page loads
if (typeof window !== 'undefined') {
  // Only setup if user appears to be logged in
  if (storage.getToken() && storage.getSessionToken()) {
    setupBackgroundRefresh();
  }
  
  // Also setup on storage change (e.g., login in another tab)
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth_token' || e.key === 'session_token') {
      if (storage.getToken() && storage.getSessionToken()) {
        setupBackgroundRefresh();
      } else {
        stopBackgroundRefresh();
      }
    }
  });
}

// ============================================
// EXPORTS
// ============================================

const Auth = {
  ...AuthAPI,
  storage,
  // Expose utility functions
  isTokenExpired,
  getTokenTimeRemaining,
  refreshTokenWithSession,
  refreshTokenWithJWT,
  setupBackgroundRefresh,
  stopBackgroundRefresh
};

// Make globally available
if (typeof window !== 'undefined') {
  window.Auth = Auth;
  window.AuthAPI = AuthAPI;
}
