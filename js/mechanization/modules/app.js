(function () {
    'use strict';

    window.state = window.state || {
        activeModule: 'dashboard',
        isEditMode: false
    };

    if (!window.state.activeModule) {
        window.state.activeModule = 'dashboard';
    }

    window.escapeHtml = function (value) {
        return String(
            value === null || value === undefined
                ? ''
                : value
        )
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Единый стиль сообщений вместо alert()
    window.alert = function (message) {
        if (typeof window.showSimpleMessage === 'function') {
            window.showSimpleMessage(
                'Сообщение',
                String(message ?? '')
            );
            return;
        }

        console.warn('alert:', message);
    };

    window.showSimpleMessage = function (title, message) {
        const overlay = document.createElement('div');

        overlay.className = 'modal-overlay open';

        overlay.innerHTML = `
            <div class="modal-box">
                <h3 style="margin:0;color:#fff;">
                    ${window.escapeHtml(title)}
                </h3>

                <p style="margin:12px 0 0;color:var(--muted);line-height:1.5;">
                    ${window.escapeHtml(message)}
                </p>

                <button
                    type="button"
                    class="glass-btn simple-message-close"
                    style="width:100%;margin-top:18px;"
                >
                    Закрыть
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = function () {
            overlay.remove();
        };

        const closeButton = overlay.querySelector('.simple-message-close');

        if (closeButton) {
            closeButton.addEventListener('click', close);
        }

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                close();
            }
        });
    };

    window.showAppError = function (message, error) {
        console.error('Ошибка приложения:', error || message);

        const container = document.getElementById('main-content');

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="glass-panel app-error">
                <div class="app-error-icon">⚠️</div>

                <h2>Не удалось загрузить данные</h2>

                <p>${window.escapeHtml(message)}</p>

                <button type="button" class="glass-btn app-retry-button">
                    ↻ Повторить
                </button>
            </div>
        `;

        const retryButton = container.querySelector('.app-retry-button');

        if (retryButton) {
            retryButton.addEventListener('click', function () {
                window.renderCurrentModule();
            });
        }
    };

    function findModule(moduleName) {
        const moduleNames = {
            dashboard: 'MechDashboardModule',
            fleet: 'MechFleetModule'
        };

        const globalName = moduleNames[moduleName];

        if (!globalName) {
            return null;
        }

        const module = window[globalName];

        if (module && typeof module.render === 'function') {
            return module;
        }

        return null;
    }

    function hasModuleAccess(moduleName) {
        if (
            !window.AuthModule ||
            !window.AuthModule.session
        ) {
            return false;
        }

        if (
            typeof window.AuthModule.isAdmin === 'function' &&
            window.AuthModule.isAdmin()
        ) {
            return true;
        }

        return Boolean(
            window.AuthModule.canAccessModule &&
            window.AuthModule.canAccessModule(moduleName)
        );
    }

    window.getCurrentModule = function () {
        const moduleName = window.state.activeModule || 'dashboard';

        const module = findModule(moduleName);

        if (!module) {
            throw new Error(`Модуль "${moduleName}" не найден.`);
        }

        return module;
    };

    function renderAccessDenied(moduleName) {
        const container = document.getElementById('main-content');

        if (!container) {
            return;
        }

        const names = {
            dashboard: 'Статистика',
            fleet: 'Автопарк'
        };

        container.innerHTML = `
            <div class="glass-panel app-error">
                <div class="app-error-icon">🔒</div>

                <h2>Нет доступа</h2>

                <p>
                    У вас нет разрешения на раздел
                    «${window.escapeHtml(names[moduleName] || moduleName)}».
                </p>

                <p style="margin-top:10px;color:var(--subtle);font-size:.8rem;">
                    Обратитесь к администратору ресурса.
                </p>
            </div>
        `;
    }

    window.navigate = function (moduleName, element) {
        const allowedModules = ['dashboard', 'fleet'];

        if (!allowedModules.includes(moduleName)) {
            return;
        }

        if (!hasModuleAccess(moduleName)) {
            renderAccessDenied(moduleName);
            return;
        }

        window.state.activeModule = moduleName;

        document.querySelectorAll('.menu-item').forEach(function (item) {
            item.classList.remove('active');
        });

        if (element) {
            element.classList.add('active');
        }

        if (window.innerWidth <= 900) {
            window.closeMenu();
        }

        window.renderCurrentModule();
    };

    window.renderCurrentModule = async function () {
        const container = document.getElementById('main-content');

        if (!container) {
            return;
        }

        if (!window.AuthModule || !window.AuthModule.session) {
            return;
        }

        const moduleName = window.state.activeModule || 'dashboard';

        if (!hasModuleAccess(moduleName)) {
            const fallback = hasModuleAccess('dashboard')
                ? 'dashboard'
                : null;

            if (!fallback) {
                renderAccessDenied(moduleName);
                return;
            }

            window.state.activeModule = fallback;
        }

        try {
            // Останавливаем таймеры предыдущего модуля,
            // чтобы фоновые интервалы не накапливались.
            if (window.MechDashboardModule?.stopTimers) {
                window.MechDashboardModule.stopTimers();
            }
            if (window.MechFleetModule?.stopTimers) {
                window.MechFleetModule.stopTimers();
            }

            const module = window.getCurrentModule();

            if (!module) {
                throw new Error(
                    `Модуль "${window.state.activeModule}" не найден.`
                );
            }

            await module.render();

            document.body.classList.add('app-booted');
        } catch (error) {
            window.showAppError(
                'Не удалось получить данные. Проверьте подключение к Supabase.',
                error
            );
        }
    };

    function setupMobileMenu() {
        const header = document.querySelector('.mobile-header');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');

        if (!header || !sidebar || !backdrop) {
            return;
        }

        const appLayout = document.querySelector('.app-layout');

        if (appLayout && backdrop.parentElement !== appLayout) {
            appLayout.insertBefore(backdrop, sidebar);
        }

        const menuButton = header.querySelector('.mobile-menu-icon');

        if (menuButton) {
            menuButton.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                window.toggleMenu();
            });
        }

        sidebar.addEventListener('click', function (event) {
            event.stopPropagation();
        });

        backdrop.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            window.closeMenu();
        });
    }

    window.toggleMenu = function () {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const menuButton = document.querySelector('.mobile-menu-icon');

        if (!sidebar) {
            return;
        }

        const open = !sidebar.classList.contains('open');

        sidebar.classList.toggle('open', open);

        if (backdrop) {
            backdrop.classList.toggle('open', open);
        }

        document.body.classList.toggle('menu-open', open);

        if (menuButton) {
            menuButton.setAttribute('aria-expanded', String(open));
        }
    };

    window.closeMenu = function () {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const menuButton = document.querySelector('.mobile-menu-icon');

        if (sidebar) {
            sidebar.classList.remove('open');
        }

        if (backdrop) {
            backdrop.classList.remove('open');
        }

        document.body.classList.remove('menu-open');

        if (menuButton) {
            menuButton.setAttribute('aria-expanded', 'false');
        }
    };

    window.openSuggestionModal = function () {
        const modal = document.getElementById('suggestion-modal');
        const textarea = document.getElementById('suggestion-text');

        if (!modal) {
            return;
        }

        modal.classList.add('open');

        modal.onclick = function (event) {
            if (event.target === modal) {
                window.closeSuggestionModal();
            }
        };

        if (textarea) {
            textarea.value = '';
            setTimeout(function () {
                textarea.focus();
            }, 60);
        }
    };

    window.closeSuggestionModal = function () {
        const modal = document.getElementById('suggestion-modal');

        if (modal) {
            modal.classList.remove('open');
        }
    };

    window.sendSuggestion = async function () {
        const textarea = document.getElementById('suggestion-text');
        const sendButton = document.getElementById('suggestion-send-button');

        const text = String(textarea ? textarea.value : '').trim();

        if (text.length < 3) {
            window.showSimpleMessage(
                'Пустое предложение',
                'Опишите вашу идею подробнее — минимум 3 символа.'
            );
            return;
        }

        if (sendButton) {
            sendButton.disabled = true;
        }

        try {
            const response = await db
                .from('suggestions')
                .insert({
                    text: text,
                    user_id:
                        window.AuthModule && window.AuthModule.session
                            ? window.AuthModule.session.user.id
                            : null,
                    user_name:
                        window.AuthModule && window.AuthModule.profile
                            ? window.AuthModule.profile.full_name || 'Неизвестный'
                            : 'Неизвестный',
                    page: 'mech-' + window.state.activeModule
                });

            if (response.error) {
                throw response.error;
            }

            window.closeSuggestionModal();

            window.showSimpleMessage(
                'Спасибо!',
                'Ваше предложение отправлено администратору.'
            );
        } catch (error) {
            console.error('Suggestion error:', error);

            window.showSimpleMessage(
                'Не удалось отправить',
                error.message || 'Проверьте подключение и повторите позже.'
            );
        } finally {
            if (sendButton) {
                sendButton.disabled = false;
            }
        }
    };

    function updateMenuByPermissions() {
        document.querySelectorAll('.menu-item').forEach(function (item) {
            const moduleName = (
                item.getAttribute('onclick') || ''
            ).match(/navigate\(['"]([^'"]+)/)?.[1];

            if (!moduleName) {
                return;
            }

            item.style.display = hasModuleAccess(moduleName) ? '' : 'none';
        });
    }

    async function startApplication() {
        setupMobileMenu();

        if (
            window.AuthModule &&
            typeof window.AuthModule.initialize === 'function'
        ) {
            await window.AuthModule.initialize();
        }

        if (!window.AuthModule || !window.AuthModule.session) {
            return;
        }

        updateMenuByPermissions();

        if (!hasModuleAccess(window.state.activeModule)) {
            window.state.activeModule = 'dashboard';
        }

        window.renderCurrentModule();
    }

    const resizeHandler = debounce(
        function () {
            if (window.innerWidth > 900) {
                window.closeMenu();
            }
        },
        150
    );

    window.addEventListener('resize', resizeHandler);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApplication);
    } else {
        startApplication();
    }
})();
