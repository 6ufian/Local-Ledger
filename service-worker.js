const CACHE_NAME = 'local-ledger-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/customers.html',
    '/stock.html',
    '/reports.html',
    '/settings.html',
    '/customer-profile.html',
    '/css/style.css',
    '/js/main.js',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
];

// Install a service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Cache and return requests
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});