/// <reference lib="webworker" />

const CACHE_NAME = 'nutrition-tracker-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/add-meal.html',
    '/products.html',
    '/settings.html',
    '/css/styles.css',
    '/js/services/nutritionService.mjs',
    '/js/utils/html.mjs',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', /** @param {ExtendableEvent} event */ event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', /** @param {ExtendableEvent} event */ event => {
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
self.addEventListener('fetch', /** @param {FetchEvent} event */ event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
}); 