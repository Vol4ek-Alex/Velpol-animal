/* =====================================================
   SPLASH SCREEN «Великополье»
   Анимированный экран загрузки для мобильных устройств.
   В фоне проверяет доступные обновления (Service Worker)
   и уведомляет пользователя о новой версии.
   ===================================================== */
(function () {
    'use strict';

    var isMobile = window.matchMedia('(max-width: 700px)').matches;
    var splash = null;
    var MIN_DISPLAY_MS = 900;
    var startTime = Date.now();

    function buildSplash() {
        var el = document.createElement('div');
        el.id = 'velpol-splash';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = `
            <div class="splash-inner">
                <div class="splash-logo">🌾</div>
                <div class="splash-title">Великополье</div>
                <div class="splash-spinner"></div>
                <div class="splash-status">Загрузка...</div>
            </div>
        `;
        document.body.appendChild(el);
        return el;
    }

    function hide() {
        if (!splash) return;
        var elapsed = Date.now() - startTime;
        var wait = Math.max(0, MIN_DISPLAY_MS - elapsed);

        setTimeout(function () {
            splash.classList.add('splash-hide');
            setTimeout(function () {
                splash.remove();
                splash = null;
            }, 420);
        }, wait);
    }

    /* Проверка обновлений: если Service Worker
       установил новую версию — предлагаем перезагрузку. */
    function checkForUpdates() {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        navigator.serviceWorker.ready.then(function (registration) {
            function announceUpdate() {
                showUpdateNotice();
            }

            if (registration.waiting) {
                announceUpdate();
                return;
            }

            registration.addEventListener('updatefound', function () {
                var installing = registration.installing;
                if (!installing) return;
                installing.addEventListener('statechange', function () {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        announceUpdate();
                    }
                });
            });
        }).catch(function () { /* обновления недоступны — не критично */ });
    }

    function showUpdateNotice() {
        var bar = document.createElement('div');
        bar.className = 'splash-update-bar';
        bar.innerHTML = `
            <span>Доступно обновление приложения</span>
            <button type="button" class="splash-update-btn">Обновить</button>
        `;

        bar.querySelector('.splash-update-btn').addEventListener('click', function () {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }
            window.location.reload();
        });

        document.body.appendChild(bar);
        requestAnimationFrame(function () {
            bar.classList.add('visible');
        });

        /* Кнопка остаётся доступной 30 секунд,
           затем уведомление исчезает. */
        setTimeout(function () {
            bar.classList.remove('visible');
            setTimeout(function () { bar.remove(); }, 350);
        }, 30000);
    }

    function requestSkipWaiting() {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
            return;
        }
        navigator.serviceWorker.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'SKIP_WAITING') {
                self_skipWaiting();
            }
        });
    }

    function self_skipWaiting() { /* зарезервировано */ }

    function init() {
        /* Splash только на мобильных и только один раз за сессию страницы. */
        if (!isMobile || document.getElementById('velpol-splash')) {
            checkForUpdates();
            return;
        }

        splash = buildSplash();
        checkForUpdates();
        requestSkipWaiting();

        /* Скрываем splash, когда страница готова
           (или по таймауту на случай долгой сети). */
        var hidden = false;
        function doHide() {
            if (hidden) return;
            hidden = true;
            hide();
        }

        window.addEventListener('load', doHide);
        setTimeout(doHide, 4000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
