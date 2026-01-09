// Service Worker v2.0 - Enhanced Caching
// SuperChessPrep - January 2026
const CACHE_NAME = 'scp-v4.0';
const CACHE_VERSION = 4;

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/css/core_min.css',
  '/css/critical.min.css',
  '/js/config.js',
  '/images/circle-logo.webp',
  '/offline.html'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network (static assets)
  cacheFirst: [
    /\.css$/,
    /\.js$/,
    /\.woff2?$/,
    /\.png$/,
    /\.jpg$/,
    /\.webp$/,
    /\.svg$/
  ],
  // Network first, fallback to cache (HTML, API)
  networkFirst: [
    /\.html$/,
    /\/api\//
  ],
  // Cache only (fonts from CDN)
  cacheOnly: [
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/
  ]
};

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Precache failed:', err))
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v' + CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http(s)
  if (!url.protocol.startsWith('http')) return;
  
  // Determine strategy
  let strategy = 'networkFirst'; // default
  
  for (const [strat, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pattern.test(url.pathname) || pattern.test(url.href))) {
      strategy = strat;
      break;
    }
  }
  
  if (strategy === 'cacheFirst') {
    event.respondWith(cacheFirst(request));
  } else if (strategy === 'cacheOnly') {
    event.respondWith(cacheOnly(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.error('[SW] Fetch failed:', err);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Cache-only strategy
async function cacheOnly(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  // If not cached, fetch and cache
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Resource not available', { status: 503 });
  }
}
