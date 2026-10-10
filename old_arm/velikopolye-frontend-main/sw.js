// sw.js
const CACHE_NAME = 'arm-v2';
const STATIC_CACHE = 'arm-static-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/css/animations.css',
    '/js/dashboard.js',
    '/js/orders.js',
    '/js/fleet.js',
    '/js/links.js',
    '/js/repair_requests.js',
    '/js/my_lists.js',
    '/js/inspection.js',
    '/js/search.js'
];

// Установка – кешируем всё сразу
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Кеширование ресурсов');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.warn('[SW] Не все ресурсы закешированы:', err))
    );
});

// Активация – удаляем старые кэши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== STATIC_CACHE)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Перехват запросов – сначала кэш, потом сеть (быстрее для мобильных)
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // API-запросы: сначала сеть, потом кэш (всегда свежие данные)
    if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Кешируем успешные ответы
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(STATIC_CACHE).then(cache => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Статика: сначала кэш (мгновенно), потом сеть (обновление в фоне)
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Обновляем кэш в фоне (stale-while-revalidate)
                    fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(STATIC_CACHE).then(cache => {
                                    cache.put(event.request, networkResponse);
                                });
                            }
                        })
                        .catch(() => {});
                    return cachedResponse;
                }
                // Если нет в кэше – идём в сеть
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            const clone = networkResponse.clone();
                            caches.open(STATIC_CACHE).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        return new Response('Офлайн-режим', { status: 503 });
                    });
            })
    );
});

// Автоматическое обновление
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});