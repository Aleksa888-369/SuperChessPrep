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
