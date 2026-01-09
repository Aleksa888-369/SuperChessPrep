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
      logoutBtn.textContent = '⏳ Logging out...';
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
