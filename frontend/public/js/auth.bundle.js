// ========== auth-client.js ==========
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

// ========== auth-integration.js ==========
/**
 * Auth Integration for SuperChessPrep v15
 * - Login/Register buttons for logged-out users
 * - User menu ONLY on homepage/dashboard
 * - Fixed: No duplicate ModernChess logo
 * - PATCH 2: Uses CONFIG.ICONS.TIERS instead of local duplicate
 * January 2026
 */

let authInitialized = false;

// Use CONFIG.ICONS.TIERS if available, fallback to local definition
const TIER_ICONS = (typeof CONFIG !== 'undefined' && CONFIG.ICONS && CONFIG.ICONS.TIERS) 
  ? CONFIG.ICONS.TIERS 
  : {
      free: '♟',      // U+265F
      basic: '♙',     // U+2659
      premium: '♘',   // U+2658
      elite: '♔',     // U+2654
      admin: '👑'     // Crown emoji
    };

// Determine page context
function getPageContext() {
  const path = window.location.pathname;
  const isHomepage = path === '/' || path === '/index.html' || path === '';
  const isDashboard = path.includes('/dashboard');
  
  const isProtectedPage = isHomepage || isDashboard;
  
  return {
    isHomepage,
    isDashboard,
    isProtectedPage,
    showModernChess: isProtectedPage,
    showUserMenu: isProtectedPage,
    backButton: {
      href: '/dashboard',
      text: isHomepage ? 'Dashboard' : 'Back to Dashboard',
      icon: isHomepage ? '\uD83D\uDCCA' : '\u2190'
    }
  };
}

// Ensure nav-right exists
function ensureNavRight() {
  const navContainer = document.querySelector('.nav-container');
  if (!navContainer) return null;
  
  let navRight = navContainer.querySelector('.nav-right');
  if (!navRight) {
    navRight = document.createElement('div');
    navRight.className = 'nav-right';
    navRight.style.cssText = 'display: flex; align-items: center; gap: 12px;';
    navContainer.appendChild(navRight);
  }
  
  return navRight;
}

// Move orphan elements to nav-right
function moveOrphanElements(navRight) {
  const navContainer = document.querySelector('.nav-container');
  if (!navContainer || !navRight) return;
  
  const orphanButtons = navContainer.querySelectorAll(':scope > .back-button, :scope > .dashboard-button, :scope > a[href="/dashboard"]:not(.logo-container)');
  
  orphanButtons.forEach(btn => {
    if (!btn.classList.contains('logo-container') && !btn.classList.contains('logo-section')) {
      navRight.appendChild(btn);
    }
  });
}

// Ensure Back/Dashboard button (on ALL pages for logged-in users)
function ensureBackButton(navRight) {
  const ctx = getPageContext();
  
  let btn = navRight.querySelector('.back-button, .dashboard-button, .scp-back-button');
  
  if (!btn) {
    btn = document.createElement('a');
    btn.className = 'dashboard-button scp-back-button';
  }
  
  btn.href = ctx.backButton.href;
  btn.innerHTML = `<span class="dashboard-icon">${SafeHTML.escapeText(ctx.backButton.icon)}</span><span>${SafeHTML.escapeText(ctx.backButton.text)}</span>`;
  
  const userMenu = navRight.querySelector('.user-menu-button');
  
  if (userMenu) {
    navRight.insertBefore(btn, userMenu);
  } else if (!navRight.contains(btn)) {
    navRight.insertBefore(btn, navRight.firstChild);
  }
  
  return btn;
}

// Ensure User Menu - ONLY on homepage/dashboard
function ensureUserMenu(navRight) {
  const ctx = getPageContext();
  let userMenu = navRight.querySelector('.user-menu-button');
  
  if (!ctx.showUserMenu) {
    if (userMenu) {
      userMenu.remove();
    }
    return null;
  }
  
  if (!userMenu) {
    userMenu = document.createElement('div');
    userMenu.className = 'user-menu-button';
    SafeHTML.setHTML(userMenu, `
      <div class="user-avatar">\uD83D\uDC64</div>
      <span class="user-name" id="userName">User</span>
      <span class="menu-arrow">\u25BC</span>
    `);
    navRight.appendChild(userMenu);
  }
  
  if (navRight.lastChild !== userMenu) {
    navRight.appendChild(userMenu);
  }
  
  if (!userMenu.dataset.scpHooked) {
    userMenu.dataset.scpHooked = 'true';
    userMenu.removeAttribute('onclick');
    userMenu.style.cursor = 'pointer';
    
    userMenu.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleScpDropdown(userMenu);
    });
    
    const inlineDropdown = userMenu.querySelector('.user-dropdown');
    if (inlineDropdown) inlineDropdown.style.display = 'none';
  }
  
  return userMenu;
}

// Ensure Auth Buttons for logged-out users
function ensureAuthButtons(navRight) {
  // Remove existing auth buttons first
  const existingAuthBtns = navRight.querySelector('.auth-buttons');
  if (existingAuthBtns) existingAuthBtns.remove();
  
  // Create auth buttons container
  const authBtns = document.createElement('div');
  authBtns.className = 'auth-buttons';
  authBtns.style.cssText = 'display: flex; gap: 12px; align-items: center;';
  
  SafeHTML.setHTML(authBtns, `
    <a href="/login" class="auth-btn login-btn" style="
      color: #ff8c00;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border: 2px solid #ff8c00;
      border-radius: 25px;
      transition: all 0.3s;
      background: transparent;
    ">Login</a>
    <a href="/register" class="auth-btn register-btn" style="
      background: linear-gradient(45deg, #ff8c00, #ff6347);
      color: #000;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 10px 20px;
      border: none;
      border-radius: 25px;
      transition: all 0.3s;
    ">Sign Up</a>
  `);
  
  // Add hover effects
  const loginBtn = authBtns.querySelector('.login-btn');
  const registerBtn = authBtns.querySelector('.register-btn');
  
  if (loginBtn) {
    loginBtn.addEventListener('mouseenter', () => {
      loginBtn.style.background = 'rgba(255, 140, 0, 0.1)';
      loginBtn.style.transform = 'scale(1.05)';
    });
    loginBtn.addEventListener('mouseleave', () => {
      loginBtn.style.background = 'transparent';
      loginBtn.style.transform = 'scale(1)';
    });
  }
  
  if (registerBtn) {
    registerBtn.addEventListener('mouseenter', () => {
      registerBtn.style.transform = 'translateY(-2px)';
      registerBtn.style.boxShadow = '0 10px 25px rgba(255, 140, 0, 0.4)';
    });
    registerBtn.addEventListener('mouseleave', () => {
      registerBtn.style.transform = 'translateY(0)';
      registerBtn.style.boxShadow = 'none';
    });
  }
  
  navRight.appendChild(authBtns);
  return authBtns;
}

// Build header
function buildHeader() {
  const navRight = ensureNavRight();
  if (!navRight) return;
  
  const ctx = getPageContext();
  
  // For logged-out users: show Login/Register buttons
  if (!Auth.isLoggedIn()) {
    // Remove user menu if exists
    const userMenu = navRight.querySelector('.user-menu-button');
    if (userMenu) userMenu.remove();
    
    // Remove dashboard button for logged-out users
    const dashBtn = navRight.querySelector('.dashboard-button, .scp-back-button');
    if (dashBtn) dashBtn.remove();
    
    // Add auth buttons (DO NOT add ModernChess - it already exists in HTML!)
    ensureAuthButtons(navRight);
    
    return;
  }
  
  // For logged-in users
  // Remove auth buttons if they exist
  const authBtns = navRight.querySelector('.auth-buttons');
  if (authBtns) authBtns.remove();
  
  moveOrphanElements(navRight);
  ensureBackButton(navRight);
  ensureUserMenu(navRight);
  
  // Update username only if user menu exists
  const user = Auth.getCurrentUser();
  if (user && ctx.showUserMenu) {
    document.querySelectorAll('.user-name, #userName').forEach(el => {
      el.textContent = user.username;
    });
  }
  
}

// Create SCP Dropdown (only used on homepage/dashboard)
function createScpDropdown() {
  const ctx = getPageContext();
  if (!ctx.showUserMenu) return;
  
  if (document.getElementById('scpUserDropdown')) return;
  
  const html = `
    <div id="scpUserDropdown" class="scp-user-dropdown">
      <div class="scp-dropdown-header">
        <div class="scp-dropdown-avatar">\uD83D\uDC64</div>
        <div class="scp-dropdown-info">
          <div class="scp-dropdown-name" id="scpUsernameDisplay">Username</div>
          <div class="scp-dropdown-email" id="scpEmailDisplay">email@example.com</div>
        </div>
      </div>
      <div class="scp-subscription-box">
        <div class="scp-subscription-header">
          <div class="scp-subscription-tier">
            <span class="scp-tier-icon" id="scpSubTierIcon">\u265F</span>
            <span class="scp-tier-name" id="scpSubTierName">Free</span>
          </div>
          <span class="scp-subscription-status" id="scpSubStatus">ACTIVE</span>
        </div>
        <div class="scp-subscription-days" id="scpSubDaysContainer">
          <span class="scp-days-label">Days remaining</span>
          <span class="scp-days-value" id="scpSubDaysValue">-</span>
        </div>
        <div class="scp-subscription-progress" id="scpSubProgressContainer">
          <div class="scp-subscription-progress-bar" id="scpSubProgressBar" style="width: 0%;"></div>
        </div>
        <button class="scp-btn-manage-subscription" onclick="window.location.href='/subscription'">Manage Subscription</button>
      </div>
      <div class="scp-dropdown-divider"></div>
      <div class="scp-dropdown-menu">
        <a href="/dashboard" class="scp-dropdown-item">
          <span class="scp-dropdown-icon">\uD83D\uDCCA</span>
          <div class="scp-dropdown-item-text">
            <span class="scp-dropdown-item-label">Dashboard</span>
            <span class="scp-dropdown-item-desc">Your overview</span>
          </div>
        </a>
        <a href="/admin" class="scp-dropdown-item" id="scpAdminPanelLink" style="display: none;">
          <span class="scp-dropdown-icon">\u2699\uFE0F</span>
          <div class="scp-dropdown-item-text">
            <span class="scp-dropdown-item-label">Admin Panel</span>
            <span class="scp-dropdown-item-desc">Manage content</span>
          </div>
        </a>
        <a href="/subscription" class="scp-dropdown-item">
          <span class="scp-dropdown-icon">\uD83D\uDC8E</span>
          <div class="scp-dropdown-item-text">
            <span class="scp-dropdown-item-label">Upgrade Plan</span>
            <span class="scp-dropdown-item-desc">Get more features</span>
          </div>
        </a>
      </div>
      <div class="scp-dropdown-divider"></div>
      <div class="scp-logout-item">
        <a href="#" onclick="handleLogout(); return false;" class="scp-dropdown-item scp-logout-link">
          <span class="scp-dropdown-icon">\uD83D\uDEAA</span>
          <span class="scp-dropdown-item-label">Logout</span>
        </a>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', html);
}

// Toggle dropdown
function toggleScpDropdown(btn) {
  const dropdown = document.getElementById('scpUserDropdown');
  if (!dropdown) return;
  
  if (dropdown.classList.contains('open')) {
    dropdown.classList.remove('open');
  } else {
    const rect = btn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 10) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    dropdown.classList.add('open');
  }
}

window.toggleScpDropdown = toggleScpDropdown;

document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('scpUserDropdown');
  if (dropdown && !e.target.closest('.user-menu-button') && !e.target.closest('.scp-user-dropdown')) {
    dropdown.classList.remove('open');
  }
});

// Create auth modals
function createAuthModals() {
  if (document.getElementById('authModalOverlay')) return;
  
  const html = `
    <div id="authModalOverlay" class="auth-modal-overlay">
      <div id="loginModal" class="auth-modal">
        <div class="modal-header">
          <h2 class="modal-title">Welcome Back</h2>
          <button class="modal-close" onclick="closeAuthModal()">&times;</button>
        </div>
        <div class="error-message" id="loginError"></div>
        <div class="success-message" id="loginSuccess"></div>
        <form id="modalLoginForm" class="modal-form">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="loginEmail" required placeholder="Enter your email">
          </div>
          <button type="submit" class="form-button" id="loginSubmitBtn">\uD83D\uDCE7 Send Login Code</button>
          <div class="form-link">Don't have an account? <a href="#" onclick="switchToRegister()">Create one</a></div>
        </form>
        <div id="loginCodeContainer" class="code-container" style="display: none;">
          <p style="text-align: center; color: #ffbfaa; margin-bottom: 10px;">Enter the 5-digit code sent to your email</p>
          <p style="text-align: center; color: #ff8c00; font-weight: 600; margin-bottom: 20px;" id="loginEmailDisplay"></p>
          <form id="loginVerifyForm">
            <div class="code-inputs">
              <input type="text" class="code-input" maxlength="1" id="loginCode1">
              <input type="text" class="code-input" maxlength="1" id="loginCode2">
              <input type="text" class="code-input" maxlength="1" id="loginCode3">
              <input type="text" class="code-input" maxlength="1" id="loginCode4">
              <input type="text" class="code-input" maxlength="1" id="loginCode5">
            </div>
            <div class="form-checkbox" style="margin: 20px 0;">
              <input type="checkbox" id="loginRememberMe">
              <label for="loginRememberMe">Remember me</label>
            </div>
            <button type="submit" class="form-button" id="loginVerifyBtn">Verify & Login</button>
            <div class="resend-link">Didn't receive code? <a href="#" onclick="resendLoginCode(); return false;">Resend</a></div>
          </form>
        </div>
      </div>
      <div id="registerModal" class="auth-modal" style="display: none;">
        <div class="modal-header">
          <h2 class="modal-title">Create Account</h2>
          <button class="modal-close" onclick="closeAuthModal()">&times;</button>
        </div>
        <div class="error-message" id="registerError"></div>
        <div class="success-message" id="registerSuccess"></div>
        <form id="modalRegisterForm" class="modal-form">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-input" id="registerUsername" required minlength="4" maxlength="20" placeholder="Choose a username">
            <p class="password-hint">4-20 characters, letters and numbers only</p>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="registerEmail" required placeholder="Enter your email">
          </div>
          <button type="submit" class="form-button" id="registerSubmitBtn">\uD83C\uDF89 Create Account</button>
          <div class="form-link">Already have an account? <a href="#" onclick="switchToLogin()">Login</a></div>
        </form>
        <div id="registerCodeContainer" class="code-container" style="display: none;">
          <p style="text-align: center; color: #ffbfaa; margin-bottom: 10px;">Enter the 5-digit code sent to your email</p>
          <p style="text-align: center; color: #ff8c00; font-weight: 600; margin-bottom: 10px;" id="registerEmailDisplay"></p>
          <p class="expiry-notice">Code expires in 3 minutes</p>
          <form id="registerVerifyForm">
            <div class="code-inputs">
              <input type="text" class="code-input" maxlength="1" id="registerCode1">
              <input type="text" class="code-input" maxlength="1" id="registerCode2">
              <input type="text" class="code-input" maxlength="1" id="registerCode3">
              <input type="text" class="code-input" maxlength="1" id="registerCode4">
              <input type="text" class="code-input" maxlength="1" id="registerCode5">
            </div>
            <button type="submit" class="form-button" id="registerVerifyBtn">Verify & Continue</button>
            <div class="resend-link">Didn't receive code? <a href="#" onclick="resendRegisterCode(); return false;">Resend</a></div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', html);
}

// Setup event listeners
function setupEventListeners() {
  const f1 = document.getElementById('modalLoginForm');
  if (f1) f1.addEventListener('submit', handleLogin);
  
  const f2 = document.getElementById('loginVerifyForm');
  if (f2) f2.addEventListener('submit', handleLoginVerify);
  
  const f3 = document.getElementById('modalRegisterForm');
  if (f3) f3.addEventListener('submit', handleRegister);
  
  const f4 = document.getElementById('registerVerifyForm');
  if (f4) f4.addEventListener('submit', handleRegisterVerify);
}

// Main init
async function initializeAuth() {
  if (authInitialized) return;
  
  if (typeof Auth === 'undefined' || typeof AuthAPI === 'undefined') {
    setTimeout(initializeAuth, 100);
    return;
  }
  
  createAuthModals();
  createScpDropdown();
  setupEventListeners();
  buildHeader();
  await updateAuthUI();
  
  authInitialized = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
  initializeAuth();
}

// Modal controls
function openLoginModal() {
  document.getElementById('authModalOverlay').style.display = 'flex';
  document.getElementById('loginModal').style.display = 'block';
  document.getElementById('registerModal').style.display = 'none';
  document.getElementById('modalLoginForm').style.display = 'block';
  document.getElementById('loginCodeContainer').style.display = 'none';
  clearMessages();
}

function openRegisterModal() {
  document.getElementById('authModalOverlay').style.display = 'flex';
  document.getElementById('registerModal').style.display = 'block';
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('modalRegisterForm').style.display = 'block';
  document.getElementById('registerCodeContainer').style.display = 'none';
  clearMessages();
}

function closeAuthModal() {
  document.getElementById('authModalOverlay').style.display = 'none';
  document.getElementById('modalLoginForm')?.reset();
  document.getElementById('modalRegisterForm')?.reset();
  document.getElementById('modalLoginForm').style.display = 'block';
  document.getElementById('loginCodeContainer').style.display = 'none';
  document.getElementById('modalRegisterForm').style.display = 'block';
  document.getElementById('registerCodeContainer').style.display = 'none';
  clearMessages();
}

function switchToRegister() {
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('registerModal').style.display = 'block';
  clearMessages();
}

function switchToLogin() {
  document.getElementById('registerModal').style.display = 'none';
  document.getElementById('loginModal').style.display = 'block';
  clearMessages();
}

document.addEventListener('click', (e) => {
  const overlay = document.getElementById('authModalOverlay');
  if (e.target === overlay) closeAuthModal();
});

function showPopupNotification(msg, type = 'success') {
  const popup = document.getElementById('popupNotification');
  if (!popup) return;
  document.getElementById('popupIcon').textContent = type === 'success' ? '\u2705' : '\u274C';
  popup.className = `popup-notification popup-${type}`;
  document.getElementById('popupMessage').textContent = msg;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 4000);
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 7000); }
}

function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 5000); }
}

function clearMessages() {
  ['loginError', 'loginSuccess', 'registerError', 'registerSuccess'].forEach(id => {
    document.getElementById(id)?.classList.remove('show');
  });
}

function clearInlineErrors() {
  document.querySelectorAll('.inline-error').forEach(el => el.remove());
}

async function fetchSubscriptionStatus() {
  try {
    const url = (typeof CONFIG !== 'undefined') ? CONFIG.API.PAYMENT : 'https://payments.superchessprep.com';
    const token = Auth.storage.getToken();
    if (!token) return null;
    
    const res = await fetch(`${url}/api/subscription/status`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    return data.success && data.subscription ? data.subscription : null;
  } catch (e) { return null; }
}

function updateSubscriptionUI(sub) {
  const ctx = getPageContext();
  if (!ctx.showUserMenu) return;
  
  const tierIcon = document.getElementById('scpSubTierIcon');
  const tierName = document.getElementById('scpSubTierName');
  const status = document.getElementById('scpSubStatus');
  const daysC = document.getElementById('scpSubDaysContainer');
  const daysV = document.getElementById('scpSubDaysValue');
  const progC = document.getElementById('scpSubProgressContainer');
  const progB = document.getElementById('scpSubProgressBar');
  
  if (!sub) {
    if (tierIcon) tierIcon.textContent = TIER_ICONS.free;
    if (tierName) tierName.textContent = 'Free';
    if (status) { status.textContent = 'FREE'; status.className = 'scp-subscription-status free'; }
    if (daysC) daysC.style.display = 'none';
    if (progC) progC.style.display = 'none';
    return;
  }
  
  const tier = sub.tier || 'free';
  if (tierIcon) tierIcon.textContent = TIER_ICONS[tier] || TIER_ICONS.free;
  if (tierName) tierName.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
  
  if (status) {
    if (tier === 'free') { status.textContent = 'FREE'; status.className = 'scp-subscription-status free'; }
    else if (sub.status === 'canceling') { status.textContent = 'CANCELING'; status.className = 'scp-subscription-status canceling'; }
    else { status.textContent = 'ACTIVE'; status.className = 'scp-subscription-status'; }
  }
  
  if (tier !== 'free' && sub.expiresAt) {
    const days = Math.max(0, Math.ceil((new Date(sub.expiresAt) - new Date()) / 86400000));
    if (daysC) daysC.style.display = 'flex';
    if (daysV) daysV.textContent = `${days} days`;
    if (progC) progC.style.display = 'block';
    if (progB) progB.style.width = `${Math.min(100, (days / 30) * 100)}%`;
  } else {
    if (daysC) daysC.style.display = 'none';
    if (progC) progC.style.display = 'none';
  }
}

async function updateAuthUI() {
  const ctx = getPageContext();
  if (!Auth.isLoggedIn()) return;
  
  const user = Auth.getCurrentUser();
  if (user && ctx.showUserMenu) {
    const nameEl = document.getElementById('scpUsernameDisplay');
    const emailEl = document.getElementById('scpEmailDisplay');
    if (nameEl) nameEl.textContent = user.username;
    if (emailEl) emailEl.textContent = user.email;
    
    document.querySelectorAll('.user-name, #userName').forEach(el => el.textContent = user.username);
    
    if (user.role === 'admin' || user.tier === 'admin') {
      const admin = document.getElementById('scpAdminPanelLink');
      if (admin) admin.style.display = 'flex';
    }
  }
  
  const sub = await fetchSubscriptionStatus();
  updateSubscriptionUI(sub);
}

function setupCodeInputs(prefix) {
  for (let and = 1; and <= 5; i++) {
    const inp = document.getElementById(`${prefix}Code${i}`);
    if (inp) {
      inp.addEventListener('input', function() { if (this.value.length === 1 && and < 5) document.getElementById(`${prefix}Code${i+1}`).focus(); });
      inp.addEventListener('keydown', function(e) { if (e.key === 'Backspace' && this.value === '' && and > 1) document.getElementById(`${prefix}Code${i-1}`).focus(); });
    }
  }
}

let tempLoginEmail = '';
async function handleLogin(e) {
  e.preventDefault(); clearMessages(); clearInlineErrors();
  const email = document.getElementById('loginEmail').value.trim();
  tempLoginEmail = email;
  const btn = document.getElementById('loginSubmitBtn');
  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    const r = await AuthAPI.login(email);
    if (r.success && r.tempToken) {
      document.getElementById('modalLoginForm').style.display = 'none';
      document.getElementById('loginCodeContainer').style.display = 'block';
      document.getElementById('loginEmailDisplay').textContent = email;
      document.getElementById('loginCode1').focus();
      showSuccess('loginSuccess', 'Code sent!');
      setupCodeInputs('login');
    }
  } catch (err) { showPopupNotification(err.message || 'Failed', 'error'); showError('loginError', err.message); }
  finally { btn.disabled = false; btn.textContent = '\uD83D\uDCE7 Send Login Code'; }
}

async function handleLoginVerify(e) {
  e.preventDefault(); clearMessages();
  const code = [1,2,3,4,5].map(i => document.getElementById(`loginCode${i}`).value).join('');
  if (code.length !== 5) { showError('loginError', 'Enter all 5 digits'); return; }
  const remember = document.getElementById('loginRememberMe').checked;
  const btn = document.getElementById('loginVerifyBtn');
  btn.disabled = true; btn.textContent = 'Verifying...';
  try {
    const r = await AuthAPI.verifyLoginCode(code, remember);
    if (r.success) { closeAuthModal(); showPopupNotification('Logged in!', 'success'); await updateAuthUI(); setTimeout(() => location.href = '/dashboard', 1000); }
  } catch (err) {
    showPopupNotification(err.message || 'Failed', 'error'); showError('loginError', err.message);
    [1,2,3,4,5].forEach(i => document.getElementById(`loginCode${i}`).value = '');
    document.getElementById('loginCode1').focus();
    btn.disabled = false; btn.textContent = 'Verify & Login';
  }
}

async function resendLoginCode() {
  try { const email = Auth.storage.getTempEmail(); if (!email) { showError('loginError', 'Session expired'); return; } await Auth.resendVerification(email, 'login'); showSuccess('loginSuccess', 'New code sent!'); }
  catch (err) { showError('loginError', err.message); }
}

let tempRegisterEmail = '';
async function handleRegister(e) {
  e.preventDefault(); clearMessages(); clearInlineErrors();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  if (!/^[a-zA-Z0-9]+$/.test(username)) { showError('registerError', 'Letters and numbers only'); return; }
  tempRegisterEmail = email;
  const btn = document.getElementById('registerSubmitBtn');
  btn.disabled = true; btn.textContent = 'Creating...';
  try {
    const r = await AuthAPI.register(username, email);
    if (r.success && r.tempToken) {
      document.getElementById('modalRegisterForm').style.display = 'none';
      document.getElementById('registerCodeContainer').style.display = 'block';
      document.getElementById('registerEmailDisplay').textContent = email;
      document.getElementById('registerCode1').focus();
      showSuccess('registerSuccess', 'Code sent!');
      setupCodeInputs('register');
    }
  } catch (err) { showPopupNotification(err.message || 'Failed', 'error'); showError('registerError', err.message); }
  finally { btn.disabled = false; btn.textContent = '\uD83C\uDF89 Create Account'; }
}

async function handleRegisterVerify(e) {
  e.preventDefault(); clearMessages();
  const code = [1,2,3,4,5].map(i => document.getElementById(`registerCode${i}`).value).join('');
  if (code.length !== 5) { showError('registerError', 'Enter all 5 digits'); return; }
  const btn = document.getElementById('registerVerifyBtn');
  btn.disabled = true; btn.textContent = 'Verifying...';
  try {
    const r = await AuthAPI.verifyEmail(tempRegisterEmail, code);
    if (r.success) { closeAuthModal(); showPopupNotification('Welcome!', 'success'); await updateAuthUI(); setTimeout(() => location.href = '/dashboard', 1000); }
  } catch (err) {
    showPopupNotification(err.message || 'Failed', 'error'); showError('registerError', err.message);
    [1,2,3,4,5].forEach(i => document.getElementById(`registerCode${i}`).value = '');
    document.getElementById('registerCode1').focus();
    btn.disabled = false; btn.textContent = 'Verify & Continue';
  }
}

async function resendRegisterCode() {
  try { await AuthAPI.resendVerification(tempRegisterEmail); showSuccess('registerSuccess', 'New code sent!'); }
  catch (err) { showError('registerError', err.message); }
}

async function handleLogout() {
  document.getElementById('scpUserDropdown')?.classList.remove('open');
  try { await AuthAPI.logout(); showPopupNotification('Logged out!', 'success'); setTimeout(() => location.href = '/', 1000); }
  catch (err) { showPopupNotification('Failed', 'error'); }
}
// Fix nav-right border
(function() {
  var style = document.createElement('style');
  style.textContent = '.nav-right, .nav-right::before, .nav-right::after { border:none!important; outline:none!important; box-shadow:none!important; }';
  document.head.appendChild(style);
})();


// ========== auth-helper.js ==========
(function() {
  function hasValidToken() {
    var token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return false;
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      var now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) return false;
      return true;
    } catch (e) { return false; }
  }

  function getUserFromToken() {
    var token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return null;
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.userId, username: payload.username, email: payload.email, role: payload.role || 'free', subscription_tier: payload.subscription_tier || 'free' };
    } catch (e) { return null; }
  }

  async function waitForAuth(ms) {
    var start = Date.now();
    while (Date.now() - start < ms) {
      if (typeof Auth !== 'undefined' && Auth.isLoggedIn) return true;
      await new Promise(function(r) { setTimeout(r, 50); });
    }
    return false;
  }

  async function isLoggedIn() {
    if (await waitForAuth(1500)) return Auth.isLoggedIn();
    return hasValidToken();
  }

  async function getCurrentUser() {
    if (await waitForAuth(1500) && Auth.getCurrentUser) return Auth.getCurrentUser();
    return getUserFromToken();
  }

  async function requireLogin(redirectTo) {
    if (!(await isLoggedIn())) { window.location.href = redirectTo || '/login'; return null; }
    return await getCurrentUser();
  }

  async function requireAdmin(redirectTo) {
    var user = await requireLogin('/login');
    if (!user) return null;
    if (user.role !== 'admin') { window.location.href = redirectTo || '/dashboard'; return null; }
    return user;
  }

  window.AuthHelper = { isLoggedIn: isLoggedIn, getCurrentUser: getCurrentUser, requireLogin: requireLogin, requireAdmin: requireAdmin, hasValidToken: hasValidToken, getUserFromToken: getUserFromToken };
})();

