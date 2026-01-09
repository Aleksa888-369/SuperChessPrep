/**
 * Admin Header - FINAL VERSION
 * 
 * - Desktop: Shows all options including Admin Panel
 * - Mobile: Shows only direct links (no Admin Panel)
 * - Hidden for non-admin users
 */
(function() {
  'use strict';

  // All admin options
  const allAdminOptions = [
    { icon: '⚙️', label: 'Admin Panel', path: '/admin', desktopOnly: true },
    { icon: '♟️', label: 'PGN Management', path: '/admin/pgn-exercises' },
    { icon: '🎥', label: 'Video Management', path: '/admin/videos-manager' },
    { icon: '🛠️', label: 'Forum Admin', path: '/admin/forum-manager' },
    { icon: '📝', label: 'News Admin', path: '/admin/news-manager' },
  ];

  let isOpen = false;
  let initialized = false;

  // Detect mobile
  function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Get options based on device
  function getAdminOptions() {
    if (isMobile()) {
      return allAdminOptions.filter(opt => !opt.desktopOnly);
    }
    return allAdminOptions;
  }

  function init() {
    if (initialized) return;
    
    const btn = document.getElementById('adminHeaderBtn');
    if (!btn) return;

    const isAdmin = checkIsAdmin();

    if (isAdmin) {
      btn.style.display = 'flex';
      setupDropdown();
      initialized = true;
    } else {
      btn.style.display = 'none';
    }
  }

  function checkIsAdmin() {
    if (typeof Auth === 'undefined') return false;
    if (!Auth.isLoggedIn || !Auth.isLoggedIn()) return false;
    const user = Auth.getCurrentUser();
    return user && (user.role === 'admin' || user.tier === 'admin');
  }

  function setupDropdown() {
    const btn = document.getElementById('adminHeaderBtn');
    const dropdown = document.getElementById('adminDropdown');
    const overlay = document.getElementById('adminDropdownOverlay');
    const search = document.getElementById('adminSearchInput');
    const list = document.getElementById('adminDropdownList');

    if (!btn || !dropdown) return;

    btn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    };

    if (overlay) {
      overlay.onclick = function(e) {
        e.preventDefault();
        close();
      };
    }

    if (search) {
      search.oninput = function(e) {
        render(e.target.value, list);
      };
      search.onclick = function(e) {
        e.stopPropagation();
      };
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    });

    render('', list);
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function open() {
    const dropdown = document.getElementById('adminDropdown');
    const overlay = document.getElementById('adminDropdownOverlay');
    const btn = document.getElementById('adminHeaderBtn');
    const search = document.getElementById('adminSearchInput');
    const list = document.getElementById('adminDropdownList');

    if (dropdown) dropdown.classList.add('show');
    if (overlay) overlay.classList.add('show');
    if (btn) btn.classList.add('active');
    
    if (search) {
      search.value = '';
      setTimeout(function() { search.focus(); }, 100);
    }
    
    isOpen = true;
    render('', list);
  }

  function close() {
    const dropdown = document.getElementById('adminDropdown');
    const overlay = document.getElementById('adminDropdownOverlay');
    const btn = document.getElementById('adminHeaderBtn');

    if (dropdown) dropdown.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    if (btn) btn.classList.remove('active');
    
    isOpen = false;
  }

  function render(searchTerm, container) {
    if (!container) return;

    const term = (searchTerm || '').toLowerCase();
    const options = getAdminOptions();
    const filtered = options.filter(function(opt) {
      return opt.label.toLowerCase().indexOf(term) !== -1;
    });

    if (filtered.length === 0) {
      SafeHTML.setHTML(container, '<div class="admin-dropdown-empty">No results found</div>');
      return;
    }

    var html = '';
    for (var and = 0; and < filtered.length; i++) {
      var opt = filtered[i];
      html += '<a href="' + opt.path + '" class="admin-dropdown-item" data-path="' + opt.path + '">';
      html += '<span class="admin-dropdown-item-icon">' + opt.icon + '</span>');
      html += '<span>' + opt.label + '</span>');
      html += '</a>';
    }
    SafeHTML.setHTML(container, html);

    var links = container.querySelectorAll('.admin-dropdown-item');
    for (var j = 0; j < links.length; j++) {
      links[j].addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var path = this.getAttribute('data-path');
        close();
        window.location.href = path;
      });
    }
  }

  // Re-render on resize (mobile <-> desktop switch)
  window.addEventListener('resize', function() {
    if (isOpen) {
      render('', document.getElementById('adminDropdownList'));
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('authStateChange', function() {
    initialized = false;
    init();
  });

  setTimeout(init, 500);
  setTimeout(init, 1500);
  setTimeout(init, 3000);

  window.AdminHeader = {
    open: open,
    close: close,
    toggle: toggle,
    init: init
  };
})();
