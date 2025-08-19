const CACHE_NAME = 'local-ledger-v1';
const urlsToCache = [
    '/Local-Ledger/',
    '/Local-Ledger/index.html',
    '/Local-Ledger/customers.html',
    '/Local-Ledger/stock.html',
    '/Local-Ledger/reports.html',
    '/Local-Ledger/settings.html',
    '/Local-Ledger/customer-profile.html',
    '/Local-Ledger/css/style.css',
    '/Local-Ledger/js/main.js',
    '/Local-Ledger/images/icon-192.png',
    '/Local-Ledger/images/icon-512.png',
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