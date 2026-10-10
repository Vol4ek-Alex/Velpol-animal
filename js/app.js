(function () {
    'use strict';

    window.state = window.state || {
        activeModule: 'dashboard',
        currentFarm: 'Все',
        isEditMode: false
    };

    if (!window.state.activeModule) {
        window.state.activeModule = 'dashboard';
    }

    if (!window.state.currentFarm) {
        window.state.currentFarm = 'Все';
    }

    if (typeof window.state.isEditMode !== 'boolean') {
        window.state.isEditMode = false;
    }

    function debounce(func, wait) {
        let timeout = null;

        return function () {
            const context = this;
            const args = arguments;

            clearTimeout(timeout);

            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    window.cleanFarmName = function (name) {
        if (!name) {
            return '';
        }

        return String(name)
            .replace(/["'«»]/g, '')
            .trim();
    };

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

    // Нативные alert() заменяются на стилизованное
    // окно приложения, чтобы интерфейс оставался
    // единым (тёмная тема, шрифт приложения).
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

    window.showSimpleMessage = function (
        title,
        message
    ) {
        const overlay =
            document.createElement('div');

        overlay.className =
            'modal-overlay open';

        overlay.innerHTML = `
            <div class="modal-box">
                <h3 style="
                    margin:0;
                    color:#fff;
                ">
                    ${window.escapeHtml(title)}
                </h3>

                <p style="
                    margin:12px 0 0;
                    color:var(--muted);
                    line-height:1.5;
                ">
                    ${window.escapeHtml(message)}
                </p>

                <button
                    type="button"
                    class="
                        glass-btn
                        simple-message-close
                    "
                    style="
                        width:100%;
                        margin-top:18px;
                    "
                >
                    Закрыть
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = function () {
            overlay.remove();
        };

        const closeButton =
            overlay.querySelector(
                '.simple-message-close'
            );

        if (closeButton) {
            closeButton.addEventListener(
                'click',
                close
            );
        }

        overlay.addEventListener(
            'click',
            function (event) {
                if (event.target === overlay) {
                    close();
                }
            }
        );
    };

    window.showAppError = function (
        message,
        error
    ) {
        console.error(
            'Ошибка приложения:',
            error || message
        );

        const container =
            document.getElementById(
                'main-content'
            );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="glass-panel app-error">
                <div class="app-error-icon">⚠️</div>

                <h2>
                    Не удалось загрузить данные
                </h2>

                <p>
                    ${window.escapeHtml(message)}
                </p>

                <button
                    type="button"
                    class="
                        glass-btn
                        app-retry-button
                    "
                >
                    ↻ Повторить
                </button>
            </div>
        `;

        const retryButton =
            container.querySelector(
                '.app-retry-button'
            );

        if (retryButton) {
            retryButton.addEventListener(
                'click',
                function () {
                    window.renderCurrentModule();
                }
            );
        }
    };

    function findModule(moduleName) {
        const moduleNames = {
            dashboard: 'DashboardModule',
            diets: 'DietsModule',
            herd: 'HerdModule',
            reports: 'ReportsModule',
            history: 'HistoryModule'
        };

        const globalName =
            moduleNames[moduleName];

        if (!globalName) {
            return null;
        }

        const module =
            window[globalName];

        if (
            module &&
            typeof module.render === 'function'
        ) {
            return module;
        }

        return null;
    }

    function getModulePermission(moduleName) {
        const permissions = {
            dashboard: 'can_view_dashboard',
            diets: 'can_view_diets',
            herd: 'can_view_herd',
            reports: 'can_view_reports',
            history: 'can_view_history'
        };

        return permissions[moduleName] || null;
    }

    function hasModuleAccess(moduleName) {
        if (
            !window.AuthModule ||
            !window.AuthModule.session
        ) {
            return false;
        }

        if (
            typeof window.AuthModule.isAdmin ===
            'function' &&
            window.AuthModule.isAdmin()
        ) {
            return true;
        }

        const permission =
            getModulePermission(moduleName);

        if (!permission) {
            return false;
        }

        return Boolean(
            typeof window.AuthModule.hasPermission ===
            'function' &&
            window.AuthModule.hasPermission(
                permission
            )
        );
    }

    window.getCurrentModule = function () {
        const moduleName =
            window.state.activeModule ||
            'dashboard';

        const module =
            findModule(moduleName);

        if (!module) {
            throw new Error(
                `Модуль "${moduleName}" не найден.`
            );
        }

        return module;
    };

    function renderAccessDenied(moduleName) {
        const container =
            document.getElementById(
                'main-content'
            );

        if (!container) {
            return;
        }

        const names = {
            dashboard: 'Дашборд',
            diets: 'Рационы',
            herd: 'Поголовье',
            reports: 'Потребность',
            history: 'История операций'
        };

        container.innerHTML = `
            <div
                class="
                    glass-panel
                    app-error
                "
            >
                <div class="app-error-icon">
                    🔒
                </div>

                <h2>
                    Нет доступа
                </h2>

                <p>
                    У вас нет разрешения на раздел
                    «${window.escapeHtml(
                        names[moduleName] ||
                        moduleName
                    )}».
                </p>

                <p style="
                    margin-top:10px;
                    color:var(--subtle);
                    font-size:.8rem;
                ">
                    Обратитесь к администратору ресурса.
                </p>
            </div>
        `;
    }

    window.navigate = function (
        moduleName,
        element
    ) {
        const allowedModules = [
            'dashboard',
            'diets',
            'herd',
            'reports',
            'history'
        ];

        if (
            !allowedModules.includes(moduleName)
        ) {
            return;
        }

        if (!hasModuleAccess(moduleName)) {
            renderAccessDenied(moduleName);
            return;
        }

        window.state.activeModule =
            moduleName;

        document
            .querySelectorAll('.menu-item')
            .forEach(function (item) {
                item.classList.remove('active');
            });

        if (element) {
            element.classList.add('active');
        } else {
            const menuItem =
                Array.from(
                    document.querySelectorAll(
                        '.menu-item'
                    )
                ).find(function (item) {
                    return (
                        item.dataset.module ===
                        moduleName
                    );
                });

            if (menuItem) {
                menuItem.classList.add('active');
            }
        }

        const footer =
            document.getElementById(
                'diets-floating-footer'
            );

        if (footer) {
            footer.style.display = 'none';
            footer.innerHTML = '';
        }

        if (window.innerWidth <= 900) {
            window.closeMenu();
        }

        if (
            window.AuthModule &&
            typeof window.AuthModule.updatePresence ===
            'function'
        ) {
            window.AuthModule.updatePresence(
                moduleName
            );
        }

        window.renderCurrentModule();
    };

    window.renderCurrentModule = async function () {
        const container =
            document.getElementById(
                'main-content'
            );

        if (!container) {
            return;
        }

        if (
            !window.AuthModule ||
            !window.AuthModule.session
        ) {
            return;
        }

        const moduleName =
            window.state.activeModule ||
            'dashboard';

        if (!hasModuleAccess(moduleName)) {
            const fallback =
                hasModuleAccess('dashboard')
                    ? 'dashboard'
                    : null;

            if (!fallback) {
                renderAccessDenied(moduleName);
                return;
            }

            window.state.activeModule =
                fallback;
        }

        try {
            const module =
                window.getCurrentModule();

            if (!module) {
                throw new Error(
                    `Модуль "${window.state.activeModule}" не найден.`
                );
            }

            await module.render();

            if (
                window.AuthModule &&
                typeof window.AuthModule.updatePresence ===
                'function'
            ) {
                window.AuthModule.updatePresence(
                    window.state.activeModule
                );
            }
        } catch (error) {
            window.showAppError(
                'Не удалось получить данные. Проверьте подключение к Supabase.',
                error
            );
        }
    };

    window.setFarmFilter = function (farmName) {
        window.state.currentFarm =
            farmName || 'Все';

        window.renderCurrentModule();
    };

    window.renderFarmSelector = function (
        groups,
        containerId
    ) {
        const target =
            document.getElementById(containerId);

        if (!target) {
            return;
        }

        const farms = Array.from(
            new Set(
                (groups || [])
                    .map(function (group) {
                        return group.farm_name;
                    })
                    .filter(Boolean)
            )
        );

        const wrapper =
            document.createElement('div');

        wrapper.className =
            'glass-panel farm-selector-wrapper';

        const allButton =
            document.createElement('button');

        allButton.type = 'button';
        allButton.className =
            'farm-btn ' +
            (
                !window.state.currentFarm ||
                window.state.currentFarm === 'Все'
                    ? 'active'
                    : ''
            );

        allButton.textContent =
            'Все объекты';

        allButton.addEventListener(
            'click',
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                window.setFarmFilter('Все');
            }
        );

        wrapper.appendChild(allButton);

        farms.forEach(function (farmName) {
            const button =
                document.createElement('button');

            button.type = 'button';
            button.className =
                'farm-btn ' +
                (
                    window.state.currentFarm ===
                    farmName
                        ? 'active'
                        : ''
                );

            button.textContent =
                window.cleanFarmName(farmName);

            button.addEventListener(
                'click',
                function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    window.setFarmFilter(farmName);
                }
            );

            wrapper.appendChild(button);
        });

        target.innerHTML = '';
        target.appendChild(wrapper);
    };

    window.toggleEditMode = function () {
        const canEdit =
            window.AuthModule &&
            (
                window.AuthModule.isAdmin() ||
                window.AuthModule.hasPermission(
                    'can_edit_herd'
                ) ||
                window.AuthModule.hasPermission(
                    'can_edit_diets'
                )
            );

        if (!canEdit) {
            window.showSimpleMessage(
                'Нет разрешения',
                'Администратор не разрешил редактирование данных.'
            );

            return;
        }

        window.state.isEditMode =
            !window.state.isEditMode;

        document.body.classList.toggle(
            'edit-mode-active',
            window.state.isEditMode
        );

        const button =
            document.getElementById(
                'floating-editor-btn'
            );

        const icon =
            document.getElementById(
                'editor-btn-icon'
            );

        const text =
            document.getElementById(
                'editor-btn-text'
            );

        if (button) {
            button.classList.toggle(
                'active',
                window.state.isEditMode
            );
        }

        if (icon) {
            icon.textContent =
                window.state.isEditMode
                    ? '✏️'
                    : '🔒';
        }

        if (text) {
            text.textContent =
                window.state.isEditMode
                    ? 'Редактирование ВКЛ'
                    : 'Просмотр';
        }

        window.renderCurrentModule();
    };

    function setupMobileMenu() {
        const header =
            document.querySelector(
                '.mobile-header'
            );

        const sidebar =
            document.getElementById('sidebar');

        const backdrop =
            document.getElementById(
                'sidebar-backdrop'
            );

        if (!header || !sidebar || !backdrop) {
            return;
        }

        const appLayout =
            document.querySelector('.app-layout');

        if (
            appLayout &&
            backdrop.parentElement !== appLayout
        ) {
            appLayout.insertBefore(
                backdrop,
                sidebar
            );
        }

        const menuButton =
            header.querySelector(
                '.mobile-menu-icon'
            );

        if (menuButton) {
            menuButton.addEventListener(
                'click',
                function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    window.toggleMenu();
                }
            );
        }

        sidebar.addEventListener(
            'click',
            function (event) {
                event.stopPropagation();
            }
        );

        backdrop.addEventListener(
            'click',
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                window.closeMenu();
            }
        );
    }

    window.toggleMenu = function () {
        const sidebar =
            document.getElementById('sidebar');

        const backdrop =
            document.getElementById(
                'sidebar-backdrop'
            );

        const menuButton =
            document.querySelector(
                '.mobile-menu-icon'
            );

        if (!sidebar) {
            return;
        }

        const open =
            !sidebar.classList.contains('open');

        sidebar.classList.toggle('open', open);

        if (backdrop) {
            backdrop.classList.toggle(
                'open',
                open
            );
        }

        document.body.classList.toggle(
            'menu-open',
            open
        );

        if (menuButton) {
            menuButton.setAttribute(
                'aria-expanded',
                String(open)
            );
        }
    };

    window.closeMenu = function () {
        const sidebar =
            document.getElementById('sidebar');

        const backdrop =
            document.getElementById(
                'sidebar-backdrop'
            );

        const menuButton =
            document.querySelector(
                '.mobile-menu-icon'
            );

        if (sidebar) {
            sidebar.classList.remove('open');
        }

        if (backdrop) {
            backdrop.classList.remove('open');
        }

        document.body.classList.remove(
            'menu-open'
        );

        if (menuButton) {
            menuButton.setAttribute(
                'aria-expanded',
                'false'
            );
        }
    };

    function addLogoutButton() {
        const sidebar =
            document.getElementById('sidebar');

        if (!sidebar) {
            return;
        }

        if (
            sidebar.querySelector(
                '.auth-logout-button'
            )
        ) {
            return;
        }

        const button =
            document.createElement('button');

        button.type = 'button';
        button.className =
            'glass-btn auth-logout-button';
        button.textContent = '← Назад';

        button.addEventListener(
            'click',
            function () {
                window.location.href = '/';
            }
        );

        sidebar.appendChild(button);
    }

    function updateMenuByPermissions() {
        document
            .querySelectorAll('.menu-item')
            .forEach(function (item) {
                const moduleName =
                    item.dataset.module ||
                    (
                        item.getAttribute('onclick') ||
                        ''
                    ).match(
                        /navigate\(['"]([^'"]+)/
                    )?.[1];

                if (!moduleName) {
                    return;
                }

                item.style.display =
                    hasModuleAccess(moduleName)
                        ? ''
                        : 'none';
            });

        const editorButton =
            document.getElementById(
                'floating-editor-btn'
            );

        if (editorButton) {
            const canEdit =
                window.AuthModule &&
                (
                    window.AuthModule.isAdmin() ||
                    window.AuthModule.hasPermission(
                        'can_edit_herd'
                    ) ||
                    window.AuthModule.hasPermission(
                        'can_edit_diets'
                    )
                );

            editorButton.style.display =
                canEdit ? 'flex' : 'none';
        }

        addLogoutButton();
    }

    async function startApplication() {
        setupMobileMenu();

        if (
            window.AuthModule &&
            typeof window.AuthModule.initialize ===
            'function'
        ) {
            await window.AuthModule.initialize();
        }

        if (
            !window.AuthModule ||
            !window.AuthModule.session
        ) {
            return;
        }

        updateMenuByPermissions();

        if (
            !hasModuleAccess(
                window.state.activeModule
            )
        ) {
            window.state.activeModule =
                'dashboard';
        }

        window.renderCurrentModule();

        if (
            window.AuthModule.profile &&
            window.AuthModule.profile.role ===
            'admin'
        ) {
            document.body.classList.add(
                'is-admin'
            );
        }
    }

    const resizeHandler =
        debounce(
            function () {
                if (window.innerWidth > 900) {
                    window.closeMenu();
                }
            },
            150
        );

    window.addEventListener(
        'resize',
        resizeHandler
    );

    window.addEventListener(
        'visibilitychange',
        function () {
            if (
                document.visibilityState ===
                'visible' &&
                window.AuthModule &&
                window.AuthModule.session
            ) {
                window.AuthModule.updatePresence(
                    window.state.activeModule
                );
            }
        }
    );

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            startApplication
        );
    } else {
        startApplication();
    }
})();