const CACHE_NAME = 'velpol-agro-v19';
const APP_VERSION = '1.1.6';

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
    './js/mechanization/fleet.js',
    './admin/index.html',
    './admin/admin-script.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(APP_FILES);
            })
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

    const isNavigate = request.mode === 'navigate';
    const cachedFallback = async () => {
        const cache = await caches.open(CACHE_NAME);

        if (isNavigate) {
            const match =
                await cache.match(request) ||
                await cache.match('./index.html') ||
                await cache.match('./');

            if (match) return match;
        }

        const match = await cache.match(request);
        if (match) return match;

        return Response.error();
    };

    event.respondWith(
        fetch(request)
            .then(response => {
                // Обновляем кэш только для успешных
                // локальных GET-ответов.
                if (
                    response &&
                    response.ok &&
                    response.status !== 206
                ) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            const cacheKey = isNavigate
                                ? './index.html'
                                : request;
                            return cache.put(cacheKey, copy);
                        })
                        .catch(err => console.warn('Cache error:', err));
                }

                return response;
            })
            .catch(cachedFallback)
    );
});
