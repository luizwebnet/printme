const CACHE_NAME = 'label-print-app-cache-v2';
const urlsToCache = [
    '/printme/',
    '/printme/index.html',
    '/printme/styles.css',
    '/printme/app.js',
    '/printme/manifest.json',
    '/printme/icons/icon-192.png',
    '/printme/icons/icon-512.png',
    '/printme/icons/img.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});
