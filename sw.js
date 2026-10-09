const CACHE_NAME = 'velpol-agro-v1';

const APP_FILES = [
    './',
    './index.html',
    './manifest.json',
    './assets/bg-farm.jpg',
    './assets/icon.svg',
    './styles/main.css',
    './js/config.js',
    './js/app.js',
    './js/main-selector.js',
    './js/modules/common.js',
    './js/modules/auth.js',
    './js/modules/messages.js',
    './js/modules/permissions.js',
    './js/livestock/index.html',
    './js/livestock/modules/categories.js',
    './js/livestock/modules/movements.js',
    './js/livestock/modules/dashboard.js',
    './js/livestock/modules/diets.js',
    './js/livestock/modules/herd.js',
    './js/livestock/modules/reports.js',
    './js/livestock/modules/history.js',
    './js/livestock/modules/users.js',
    './js/agronomy/index.html',
    './js/agronomy/styles.css',
    './js/agronomy/app.js',
    './js/agronomy/modules/dashboard.js',
    './js/agronomy/modules/fields.js',
    './js/agronomy/modules/crops.js',
    './mechanization/index.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('velpol-') && name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            }),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request, { cache: 'no-store' })
                .then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put('./index.html', copy))
                            .catch(err => console.warn('Cache error:', err));
                    }
                    return response;
                })
                .catch(async () => {
                    return await caches.match(request) || 
                           await caches.match('./index.html') || 
                           Response.error();
                })
        );
        return;
    }

    event.respondWith(
        fetch(request, { cache: 'no-store' })
            .then(response => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(request, copy))
                        .catch(err => console.warn('Cache error:', err));
                }
                return response;
            })
            .catch(async () => await caches.match(request) || Response.error())
    );
});
