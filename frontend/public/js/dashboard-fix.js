/**
 * Dashboard Button Fix
 * Changes "Back to Dashboard" to "Back to Homepage" on dashboard page
 * ONLY modifies the header button, NOT dropdown menu items
 */

(function() {
  // Only run on dashboard
  const path = window.location.pathname.toLowerCase();
  if (!path.includes('/dashboard')) {
    return;
  }
  
  function fixDashboardButton() {
    // ONLY target the header dashboard button, NOT dropdown items
    // Use more specific selector that excludes dropdown
    const headerButtons = document.querySelectorAll('.nav-right > .dashboard-button, .nav-container > .dashboard-button, header .dashboard-button');
    
    headerButtons.forEach(btn => {
      // Skip if it's inside a dropdown
      if (btn.closest('.scp-dropdown-menu') || btn.closest('.user-dropdown') || btn.closest('.scp-user-dropdown')) {
        return;
      }
      
      const text = btn.textContent || btn.innerText;
      
      // If it says "Back to Dashboard" or just "Dashboard", change it
      if (text.includes('Back to Dashboard') || (text.includes('Dashboard') && !text.includes('Your overview'))) {
        btn.href = '/';
        SafeHTML.setHTML(btn, '<span class="dashboard-icon">🏠</span><span>Back to Homepage</span>');
      }
    });
  }
  
  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixDashboardButton);
  } else {
    fixDashboardButton();
  }
  
  // Run again after a short delay (in case other scripts add buttons)
  setTimeout(fixDashboardButton, 500);
  setTimeout(fixDashboardButton, 1000);
})();

// Hide Dashboard link in dropdown when on dashboard page
(function() {
  if (!window.location.pathname.includes('/dashboard')) return;
  
  function hideDashboardInDropdown() {
    const dropdownItems = document.querySelectorAll('.scp-dropdown-item');
    dropdownItems.forEach(item => {
      if (item.href && item.href.includes('/dashboard') && !item.href.includes('/admin')) {
        item.style.display = 'none';
      }
    });
  }
  
  // Run after dropdown is created
  setTimeout(hideDashboardInDropdown, 500);
  setTimeout(hideDashboardInDropdown, 1000);
  setTimeout(hideDashboardInDropdown, 2000);
})();
