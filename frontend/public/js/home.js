/**
 * SuperChessPrep Homepage JavaScript
 * Extracted from inline script in index.html
 * 
 * @version 2.0.0
 * January 2026 - PATCH 2
 */

(function() {
  'use strict';

  // Use CONFIG.API.MAIN if available, otherwise empty string
  const API_BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.API && CONFIG.API.MAIN) 
    ? CONFIG.API.MAIN 
    : '';

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  function formatDate(dateString) {
    if (!dateString) return 'Date not available';
    
    // Use CONFIG.formatDate if available
    if (typeof CONFIG !== 'undefined' && typeof CONFIG.formatDate === 'function') {
      return CONFIG.formatDate(dateString, 'long');
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date not available';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Check if URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean}
   */
  function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return false;
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  }

  /**
   * Handle course card click
   * @param {string} url - Course URL
   */
  function handleCourseClick(url) {
    if (isValidUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Use custom modal if available, otherwise alert
      if (typeof showNotification === 'function') {
        showNotification('Course link is not available yet.', 'info');
      } else {
        alert('Course link is not available yet.');
      }
    }
  }

  /**
   * Load latest courses from API
   */
  async function loadLatestCourses() {
    const container = document.getElementById('latestCourses');
    if (!container) {
      Logger.warn('[Home] latestCourses container not found');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/latest?limit=3`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && data.courses) {
        displayCourses(data.courses, container);
      } else {
        showError('Failed to load courses', container);
      }
    } catch (error) {
      Logger.error('[Home] Error loading courses:', error);
      showError('Unable to load courses. Please try again later.', container);
    }
  }

  /**
   * Display courses in grid
   * @param {Array} courses - Course data array
   * @param {HTMLElement} container - Container element
   */
  function displayCourses(courses, container) {
    if (!courses || courses.length === 0) {
      container.innerHTML = '<p class="loading">No courses available</p>';
      return;
    }

    SafeHTML.setHTML(container, courses.map(course => {
      // Clean up title - remove number prefix if exists
      const cleanTitle = escapeHtml(course.title.replace(/^\d+[_\-\s]*/, '').trim());
      
      // Check if Pier Luigi Basso is among the authors
      const hasPierLuigi = course.authors && course.authors.some(author => 
        author.includes('Pier Luigi Basso')
      );
      
      // Format authors with special styling for Pier Luigi Basso
      const formatAuthors = () => {
        if (!course.authors || course.authors.length === 0) {
          return '<p class="course-author">Author not specified</p>';
        }
        
        if (hasPierLuigi) {
          const pierLuigi = course.authors.find(a => a.includes('Pier Luigi Basso'));
          const otherAuthors = course.authors.filter(a => !a.includes('Pier Luigi Basso'));
          
          let authorHTML = `<p class="course-author golden-author">${escapeHtml(pierLuigi)}</p>`;
          if (otherAuthors.length > 0) {
            authorHTML += `<p class="course-author">${escapeHtml(otherAuthors.join(', '))}</p>`;
          }
          return authorHTML;
        }
        
        return `<p class="course-author">${escapeHtml(course.authors.join(', '))}</p>`;
      };
      
      const hasValidUrl = isValidUrl(course.website);
      const safeWebsite = hasValidUrl ? encodeURI(course.website) : '';
      
      return `
        <div class="course-card" onclick="window.SCPHome.handleCourseClick('${safeWebsite}')">
          <div class="course-image">
            ${course.image ? 
              `<img loading="lazy" src="${API_BASE_URL}${course.image}" alt="${cleanTitle}" onerror="this.style.display='none'">` : 
              '<span>No Image</span>'
            }
          </div>
          <div class="course-info">
            <h3 class="course-title">${cleanTitle}</h3>
            ${formatAuthors()}
            <p class="course-date">
              <span class="date-icon">📅</span>
              ${formatDate(course.date)}
            </p>
            ${hasValidUrl 
              ? `<a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" class="course-link" onclick="event.stopPropagation()">View Course</a>`
              : `<span class="course-link disabled">Link Coming Soon</span>`
            }
          </div>
        </div>
      `;
    }).join(''));
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @param {HTMLElement} container - Container element
   */
  function showError(message, container) {
    SafeHTML.setHTML(container, `<p class="loading" style="color: #ff6b6b;">${SafeHTML.escapeText(message)}</p>`);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    if (typeof CONFIG !== 'undefined' && typeof CONFIG.escapeHtml === 'function') {
      return CONFIG.escapeHtml(text);
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    loadLatestCourses();
  });

  // Expose functions globally for onclick handlers
  window.SCPHome = {
    handleCourseClick: handleCourseClick,
    loadLatestCourses: loadLatestCourses
  };

})();
