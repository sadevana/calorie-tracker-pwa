const CACHE_NAME = 'nutrition-tracker-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/add-meal.html',
    '/add-product.html',
    '/settings.html',
    '/css/styles.css',
    '/js/db/repository.js',
    '/js/services/nutritionService.js',
    '/js/ui/mainScreen.js',
    '/js/ui/addMealScreen.js',
    '/js/ui/addProductScreen.js',
    '/js/ui/settingsScreen.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
}); 