/**
 * Performance Utilities - Throttle, Debounce, RAF
 * ================================================
 */
const PerformanceUtils = (function() {
    'use strict';
    
    return {
        /**
         * Throttle - limit calls to once per N ms
         * Use for: scroll, resize, mousemove
         */
        throttle(func, limit = 100) {
            let inThrottle = false;
            let lastArgs = null;
            
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => {
                        inThrottle = false;
                        if (lastArgs) {
                            func.apply(this, lastArgs);
                            lastArgs = null;
                        }
                    }, limit);
                } else {
                    lastArgs = args;
                }
            };
        },
        
        /**
         * Debounce - wait N ms after last call
         * Use for: input, search, resize completion
         */
        debounce(func, wait = 250, immediate = false) {
            let timeout = null;
            
            return function(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func.apply(this, args);
                };
                
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                
                if (callNow) func.apply(this, args);
            };
        },
        
        /**
         * RequestAnimationFrame throttle - for animations
         */
        rafThrottle(func) {
            let ticking = false;
            
            return function(...args) {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        func.apply(this, args);
                        ticking = false;
                    });
                    ticking = true;
                }
            };
        },
        
        /**
         * Lazy load images with IntersectionObserver
         */
        lazyLoadImages(selector = 'img[data-src]', options = {}) {
            const defaultOptions = {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                            img.removeAttribute('data-srcset');
                        }
                        observer.unobserve(img);
                    }
                });
            }, { ...defaultOptions, ...options });
            
            document.querySelectorAll(selector).forEach(img => observer.observe(img));
            
            return observer;
        },
        
        /**
         * Batch DOM updates - group DOM operations
         */
        batchDOMUpdates(updates) {
            return new Promise(resolve => {
                requestAnimationFrame(() => {
                    const fragment = document.createDocumentFragment();
                    updates(fragment);
                    resolve(fragment);
                });
            });
        }
    };
})();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceUtils;
}
