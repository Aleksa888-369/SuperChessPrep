/**
 * Service Worker Registration
 * SuperChessPrep PWA v2.0.0
 * 
 * Registers the unified service worker for PWA functionality.
 */

(function() {
  'use strict';
  
  // Only register SW in production or if explicitly enabled
  if (!('serviceWorker' in navigator)) {
    return;
  }
  
  window.addEventListener('load', function() {
    // Register the unified service worker
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function(registration) {
        // Check for updates periodically (every 5 minutes)
        setInterval(function() {
          registration.update();
        }, 5 * 60 * 1000);
        
        // Handle updates
        registration.addEventListener('updatefound', function() {
          var newWorker = registration.installing;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available
                // Optional: Show update notification
                if (typeof showUpdateNotification === 'function') {
                  showUpdateNotification();
                }
              } else {
                // First install
              }
            }
          });
        });
      })
      .catch(function(error) {
        Logger.error('[PWA] Service Worker registration failed:', error);
      });
    
    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', function() {
    });
  });
  
  // Utility function to manually trigger SW update
  window.checkForSWUpdate = function() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(function(registration) {
        registration.update();
      });
    }
  };
  
  // Utility function to clear all caches
  window.clearSWCache = function() {
    if (navigator.serviceWorker.controller) {
      var messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = function(event) {
        if (event.data.success) {
        }
      };
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    }
  };
  
})();
