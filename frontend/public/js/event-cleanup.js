/**
 * Event Cleanup Utility - Auto cleanup for event listeners
 */
(function() {
    'use strict';
    const listeners = new Map();
    let id = 0;
    
    window.registerListener = function(el, evt, fn, opts) {
        el.addEventListener(evt, fn, opts);
        listeners.set(++id, {el, evt, fn, opts});
        return id;
    };
    
    window.removeListener = function(lid) {
        const l = listeners.get(lid);
        if (l) { l.el.removeEventListener(l.evt, l.fn, l.opts); listeners.delete(lid); }
    };
    
    window.cleanupAll = function() {
        listeners.forEach(l => l.el.removeEventListener(l.evt, l.fn, l.opts));
        listeners.clear();
    };
    
    window.addEventListener('beforeunload', cleanupAll);
})();
