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

