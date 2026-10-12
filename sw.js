const CACHE_NAME = 'velpol-agro-v12';

const APP_FILES = [
    './',
    './index.html',
    './manifest.json',
    './assets/backgrounds/bg_farm_dash.jpg',
    './assets/backgrounds/bg_farm_diets.jpg',
    './assets/backgrounds/bg_farm_herd.jpg',
    './assets/backgrounds/bg_mech_stat.jpg',
    './assets/backgrounds/bg_mech_park.jpg',
    './assets/backgrounds/farm_card.jpg',
    './assets/backgrounds/mech-card.jpg',
    './assets/backgrounds/bg_agro_card.jpg',
    './assets/icons/icon.svg',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './styles/main.css',
    './js/config.js',
    './js/offline-sync.js',
    './js/splash.js',
    './js/app.js',
    './js/main-selector.js',
    './js/livestock/index.html',
    './js/livestock/modules/common.js',
    './js/livestock/modules/auth.js',
    './js/livestock/modules/categories.js',
    './js/livestock/modules/movements.js',
    './js/livestock/modules/dashboard.js',
    './js/livestock/modules/diets.js',
    './js/livestock/modules/herd.js',
    './js/livestock/modules/reports.js',
    './js/livestock/modules/history.js',
    './js/agronomy/index.html',
    './js/mechanization/index.html',
    './js/mechanization/dashboard.js',
    './js/mechanization/fleet.js'
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

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
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
