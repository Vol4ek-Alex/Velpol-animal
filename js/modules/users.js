(function () {
    'use strict';

    window.UsersModule = {
        users: [],
        searchText: '',

        escape(value) {
            if (typeof window.escapeHtml === 'function') {
                return window.escapeHtml(value);
            }

            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        isAdmin() {
            return Boolean(
                window.AuthModule &&
                typeof window.AuthModule.isAdmin ===
                    'function' &&
                window.AuthModule.isAdmin()
            );
        },

        canView() {
            return (
                this.isAdmin() ||
                Boolean(
                    window.AuthModule &&
                    typeof window.AuthModule.hasPermission ===
                        'function' &&
                    window.AuthModule.hasPermission(
                        'can_view_users'
                    )
                )
            );
        },

        canManage() {
            return this.isAdmin();
        },

        getProfile(user) {
            return user?.profile || {};
        },

        getPermissions(user) {
            return user?.permissions || {};
        },

        getPresence(user) {
            return user?.presence || {};
        },

        getUserById(userId) {
            return this.users.find(user => {
                return String(
                    this.getProfile(user).id
                ) === String(userId);
            });
        },

        formatDate(value) {
            if (!value) {
                return 'Нет данных';
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return 'Нет данных';
            }

            return date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        isOnline(user) {
            const presence =
                this.getPresence(user);

            if (!presence.is_online) {
                return false;
            }

            if (!presence.last_seen_at) {
                return false;
            }

            const timestamp =
                new Date(
                    presence.last_seen_at
                ).getTime();

            return (
                Number.isFinite(timestamp) &&
                Date.now() - timestamp < 90000
            );
        },

        getStatusText(user) {
            return this.isOnline(user)
                ? 'В сети'
                : 'Не в сети';
        },

        getStatusClass(user) {
            return this.isOnline(user)
                ? 'is-online'
                : 'is-offline';
        },

        getPermissionsCount(user) {
            return Object.values(
                this.getPermissions(user)
            ).filter(value => value === true).length;
        },

        normalizeUsersResponse(data) {
            let payload = data;

            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch (parseError) {
                    payload = null;
                }
            }

            if (!payload) {
                return [];
            }

            let rows = [];

            if (Array.isArray(payload)) {
                rows = payload;
            } else if (typeof payload === 'object') {
                rows = Array.isArray(payload.users)
                    ? payload.users
                    : Array.isArray(payload.data)
                        ? payload.data
                        : [payload];
            }

            return rows
                .filter(row => row && typeof row === 'object')
                .map(row => {
                    const profile = row.profile || row;
                    const permissions =
                        row.permissions || row.user_permissions || {};

                    return {
                        profile,
                        permissions,
                        presence: row.presence || row.user_presence || {}
                    };
                })
                .filter(row => row.profile && row.profile.id);
        },

        async loadUsers() {
            if (!this.canView()) {
                throw new Error(
                    'Недостаточно прав для просмотра пользователей.'
                );
            }

            const response = await db.rpc(
                'admin_get_users'
            );

            if (!response.error) {
                const normalized =
                    this.normalizeUsersResponse(
                        response.data
                    );

                this.users = normalized;
                return this.users;
            }

            this.users = await this.loadUsersFallback(
                response.error
            );

            return this.users;
        },

        async loadUsersFallback(rpcError) {
            const profilesResponse = await db
                .from('user_profiles')
                .select('*');

            if (profilesResponse.error) {
                throw rpcError ||
                    profilesResponse.error;
            }

            const profiles =
                profilesResponse.data || [];

            if (!profiles.length) {
                return [];
            }

            const permissionsResponse = await db
                .from('user_permissions')
                .select('*');

            const presenceResponse = await db
                .from('user_presence')
                .select('*');

            if (permissionsResponse.error || presenceResponse.error) {
                throw permissionsResponse.error || presenceResponse.error;
            }

            const permissionsRows =
                permissionsResponse.data || [];
            const presenceRows =
                presenceResponse.data || [];

            return profiles.map(profile => {
                const id = String(profile.id);

                return {
                    profile,
                    permissions:
                        permissionsRows.find(row => {
                            return (
                                String(row.user_id) === id
                            );
                        }) || {},
                    presence:
                        presenceRows.find(row => {
                            return (
                                String(row.user_id) === id
                            );
                        }) || {}
                };
            });
        },

        getFilteredUsers() {
            const query =
                String(this.searchText || '')
                    .trim()
                    .toLowerCase();

            if (!query) {
                return this.users;
            }

            return this.users.filter(user => {
                const profile =
                    this.getProfile(user);

                const text = [
                    profile.login,
                    profile.full_name,
                    profile.position,
                    profile.role
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return text.includes(query);
            });
        },

        renderUserCard(user) {
            const profile =
                this.getProfile(user);

            const presence =
                this.getPresence(user);

            const blocked =
                profile.is_blocked === true;

            const initials =
                String(
                    profile.full_name ||
                    profile.login ||
                    '?'
                )
                    .trim()
                    .charAt(0)
                    .toUpperCase();

            return `
                <article
                    class="user-card"
                    data-user-id="${this.escape(
                        profile.id
                    )}"
                >
                    <div class="user-card-main">
                        <div class="user-avatar">
                            ${this.escape(initials)}
                        </div>

                        <div class="user-card-info">
                            <div class="user-card-title-row">
                                <strong class="user-card-name">
                                    ${this.escape(
                                        profile.full_name ||
                                        profile.login ||
                                        'Без имени'
                                    )}
                                </strong>

                                <span
                                    class="
                                        user-status
                                        ${this.getStatusClass(user)}
                                    "
                                >
                                    <i></i>
                                    ${this.getStatusText(user)}
                                </span>
                            </div>

                            <div class="user-card-login">
                                @${this.escape(
                                    profile.login || ''
                                )}
                            </div>

                            <div class="user-card-position">
                                ${this.escape(
                                    profile.position ||
                                    'Должность не указана'
                                )}
                            </div>
                        </div>
                    </div>

                    <div class="user-card-meta">
                        <span>
                            ${
                                profile.role === 'admin'
                                    ? 'Администратор'
                                    : 'Пользователь'
                            }
                        </span>

                        <span>
                            Разрешений:
                            ${this.getPermissionsCount(user)}
                        </span>

                        <span>
                            Последний вход:
                            ${this.formatDate(
                                profile.last_seen_at ||
                                presence.last_seen_at
                            )}
                        </span>
                    </div>

                    ${
                        blocked
                            ? `
                                <div class="user-blocked-label">
                                    Пользователь заблокирован
                                </div>
                            `
                            : ''
                    }

                    <div class="user-card-actions">
                        ${this.canManage() ? `
                        <button type="button" class="glass-btn user-permissions-button" data-user-id="${this.escape(
                            profile.id
                        )}">
                            Разрешения
                        </button>
                        <button type="button" class="glass-btn user-block-button" data-user-id="${this.escape(
                            profile.id
                        )}">
                            ${blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                        ` : ''}
                        ${window.MessagesModule?.canSendMessages() ? `
                            <button type="button" class="glass-btn user-message-button" data-user-id="${this.escape(profile.id)}">
                                ✉ Сообщение
                            </button>
                        ` : ''}
                    </div>
                </article>
            `;
        },

        renderPage() {
            const users =
                this.getFilteredUsers();

            const onlineCount =
                this.users.filter(user => {
                    return this.isOnline(user);
                }).length;

            const blockedCount =
                this.users.filter(user => {
                    return this.getProfile(user)
                        .is_blocked === true;
                }).length;

            return `
                <style>
                    .users-page {
                        width:100%;
                        min-width:0;
                    }

                    .users-header {
                        display:flex;
                        align-items:flex-start;
                        justify-content:space-between;
                        gap:16px;
                        margin-bottom:16px;
                    }

                    .users-title {
                        margin:0;
                        color:#fff;
                        font-size:clamp(
                            1.45rem,
                            2.5vw,
                            2rem
                        );
                        font-weight:800;
                        letter-spacing:-.04em;
                    }

                    .users-description {
                        margin:5px 0 0;
                        color:var(--muted);
                        font-size:.86rem;
                    }

                    .users-search {
                        width:min(100%,300px);
                        min-height:42px;
                        padding:9px 12px;
                        outline:none;
                        border:1px solid var(--line);
                        border-radius:11px;
                        background:rgba(3,10,20,.62);
                        color:#fff;
                        font:inherit;
                    }

                    .users-search:focus {
                        border-color:var(--green);
                        box-shadow:
                            0 0 0 3px
                            rgba(16,185,129,.12);
                    }

                    .users-summary {
                        display:grid;
                        grid-template-columns:
                            repeat(3,minmax(0,1fr));
                        gap:10px;
                        margin-bottom:14px;
                    }

                    .users-summary-card {
                        display:flex;
                        flex-direction:column;
                        justify-content:space-between;
                        min-height:92px;
                        padding:14px;
                    }

                    .users-summary-label {
                        color:var(--muted);
                        font-size:.76rem;
                        font-weight:600;
                    }

                    .users-summary-value {
                        color:#fff;
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size:1.45rem;
                        font-weight:700;
                    }

                    .users-list {
                        display:grid;
                        grid-template-columns:
                            repeat(2,minmax(0,1fr));
                        gap:10px;
                    }

                    .user-card {
                        display:flex;
                        flex-direction:column;
                        min-width:0;
                        padding:15px;
                        border:1px solid var(--line);
                        border-radius:16px;
                        background:rgba(14,30,51,.68);
                        box-shadow:
                            0 12px 30px
                            rgba(0,0,0,.16);
                    }

                    .user-card-main {
                        display:flex;
                        align-items:flex-start;
                        gap:11px;
                        min-width:0;
                    }

                    .user-avatar {
                        display:flex;
                        flex:0 0 42px;
                        align-items:center;
                        justify-content:center;
                        width:42px;
                        height:42px;
                        border:1px solid
                            rgba(52,211,153,.45);
                        border-radius:13px;
                        background:
                            rgba(16,185,129,.18);
                        color:var(--green);
                        font-size:1.1rem;
                        font-weight:800;
                    }

                    .user-card-info {
                        min-width:0;
                    }

                    .user-card-title-row {
                        display:flex;
                        align-items:center;
                        flex-wrap:wrap;
                        gap:7px;
                    }

                    .user-card-name {
                        overflow:hidden;
                        color:#fff;
                        font-size:.9rem;
                        text-overflow:ellipsis;
                        white-space:nowrap;
                    }

                    .user-status {
                        display:inline-flex;
                        align-items:center;
                        gap:5px;
                        color:var(--subtle);
                        font-size:.68rem;
                        white-space:nowrap;
                    }

                    .user-status i {
                        display:block;
                        width:7px;
                        height:7px;
                        border-radius:50%;
                        background:var(--subtle);
                    }

                    .user-status.is-online {
                        color:var(--green);
                    }

                    .user-status.is-online i {
                        background:var(--green);
                        box-shadow:
                            0 0 8px var(--green);
                    }

                    .user-card-login {
                        margin-top:2px;
                        color:var(--blue);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size:.72rem;
                    }

                    .user-card-position {
                        margin-top:4px;
                        overflow:hidden;
                        color:var(--muted);
                        font-size:.76rem;
                        text-overflow:ellipsis;
                        white-space:nowrap;
                    }

                    .user-card-meta {
                        display:flex;
                        flex-wrap:wrap;
                        gap:6px 12px;
                        margin-top:13px;
                        padding-top:10px;
                        border-top:1px solid
                            rgba(255,255,255,.08);
                        color:var(--subtle);
                        font-size:.69rem;
                        line-height:1.4;
                    }

                    .user-blocked-label {
                        margin-top:10px;
                        padding:7px 9px;
                        border:1px solid
                            rgba(251,113,133,.35);
                        border-radius:8px;
                        background:
                            rgba(244,63,94,.12);
                        color:var(--red);
                        font-size:.74rem;
                        font-weight:700;
                    }

                    .user-card-actions {
                        display:flex;
                        flex-wrap:wrap;
                        gap:7px;
                        margin-top:13px;
                    }

                    .user-card-actions .glass-btn {
                        min-height:34px;
                        padding:7px 10px;
                        font-size:.73rem;
                    }


                    @media(max-width:900px) {
                        .users-list {
                            grid-template-columns:1fr;
                        }
                    }

                    @media(max-width:700px) {
                        .users-header {
                            flex-direction:column;
                        }

                        .users-search {
                            width:100%;
                        }

                        .users-summary {
                            grid-template-columns:1fr;
                        }
                    }
                </style>

                <div class="users-page">
                    <header class="users-header">
                        <div>
                            <h1 class="users-title">
                                Пользователи
                            </h1>

                            <p class="users-description">
                                Активность, роли и разрешения
                            </p>
                        </div>

                        <input
                            type="search"
                            class="users-search"
                            placeholder="Поиск пользователя..."
                            value="${this.escape(
                                this.searchText
                            )}"
                        >
                    </header>

                    <div class="users-summary">
                        <div
                            class="
                                glass-panel
                                users-summary-card
                            "
                        >
                            <span
                                class="
                                    users-summary-label
                                "
                            >
                                Всего пользователей
                            </span>

                            <strong
                                class="
                                    users-summary-value
                                "
                            >
                                ${this.users.length}
                            </strong>
                        </div>

                        <div
                            class="
                                glass-panel
                                users-summary-card
                            "
                        >
                            <span
                                class="
                                    users-summary-label
                                "
                            >
                                Сейчас в сети
                            </span>

                            <strong
                                class="
                                    users-summary-value
                                "
                                style="color:var(--green)"
                            >
                                ${onlineCount}
                            </strong>
                        </div>

                        <div
                            class="
                                glass-panel
                                users-summary-card
                            "
                        >
                            <span
                                class="
                                    users-summary-label
                                "
                            >
                                Заблокировано
                            </span>

                            <strong
                                class="
                                    users-summary-value
                                "
                                style="color:var(--red)"
                            >
                                ${blockedCount}
                            </strong>
                        </div>
                    </div>

                    <div class="users-list">
                        ${
                            users.length
                                ? users.map(user => {
                                    return this.renderUserCard(
                                        user
                                    );
                                }).join('')
                                : `
                                    <div class="users-empty">
                                        Пользователи не найдены
                                    </div>
                                `
                        }
                    </div>
                </div>
            `;
        },

        async changeBlocked(user) {
            if (!this.canManage()) {
                await this.showMessage(
                    'Нет доступа',
                    'Изменять статус пользователя может только администратор.'
                );

                return;
            }

            const profile =
                this.getProfile(user);

            if (
                window.AuthModule?.profile?.id &&
                String(
                    window.AuthModule.profile.id
                ) === String(profile.id)
            ) {
                await this.showMessage(
                    'Операция запрещена',
                    'Нельзя заблокировать самого себя.'
                );

                return;
            }

            const blocked =
                profile.is_blocked !== true;

            const confirmed =
                await this.confirmModal(
                    blocked
                        ? 'Заблокировать пользователя?'
                        : 'Разблокировать пользователя?',
                    blocked
                        ? 'Пользователь потеряет доступ к ресурсу.'
                        : 'Пользователь снова сможет войти.'
                );

            if (!confirmed) {
                return;
            }

            const response =
                await db.rpc(
                    'admin_set_user_blocked',
                    {
                        p_user_id: profile.id,
                        p_blocked: blocked
                    }
                );

            if (response.error) {
                await this.showMessage(
                    'Ошибка',
                    response.error.message
                );

                return;
            }

            await this.loadUsers();
            this.renderContent();
        },

        async editPermissions(user) {
            if (!this.canManage()) {
                await this.showMessage(
                    'Нет доступа',
                    'Изменять разрешения может только администратор.'
                );

                return;
            }

            if (
                !window.PermissionsModule ||
                typeof PermissionsModule.openEditor !==
                    'function'
            ) {
                await this.showMessage(
                    'Ошибка',
                    'Модуль разрешений не подключён.'
                );

                return;
            }

            const result =
                await PermissionsModule.openEditor(user);

            if (result) {
                await this.loadUsers();
                this.renderContent();
            }
        },


        async confirmModal(title, message) {
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
                        ${this.escape(title)}
                    </h3>

                    <p style="
                        margin:12px 0 0;
                        color:var(--muted);
                        line-height:1.5;
                    ">
                        ${this.escape(message)}
                    </p>

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:18px;
                    ">
                        <button
                            type="button"
                            class="
                                glass-btn
                                users-confirm-no
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                users-confirm-yes
                            "
                            style="
                                border-color:var(--red);
                                color:var(--red);
                            "
                        >
                            Подтвердить
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            return new Promise(resolve => {
                let finished = false;

                const close = value => {
                    if (finished) {
                        return;
                    }

                    finished = true;
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector(
                        '.users-confirm-no'
                    )
                    .addEventListener(
                        'click',
                        () => close(false)
                    );

                overlay
                    .querySelector(
                        '.users-confirm-yes'
                    )
                    .addEventListener(
                        'click',
                        () => close(true)
                    );

                overlay.addEventListener(
                    'click',
                    event => {
                        if (event.target === overlay) {
                            close(false);
                        }
                    }
                );
            });
        },

        async showMessage(title, message) {
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
                        ${this.escape(title)}
                    </h3>

                    <p style="
                        margin:12px 0 0;
                        color:var(--muted);
                        line-height:1.5;
                    ">
                        ${this.escape(message)}
                    </p>

                    <button
                        type="button"
                        class="
                            glass-btn
                            users-message-close
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

            overlay
                .querySelector(
                    '.users-message-close'
                )
                .addEventListener(
                    'click',
                    () => overlay.remove()
                );
        },

        bindCardEvents() {
            const container =
                document.getElementById(
                    'main-content'
                );

            if (!container) {
                return;
            }

            const bindAction = (selector, action) => {
                container.querySelectorAll(selector).forEach(button => {
                    button.addEventListener('click', async () => {
                        const user = this.getUserById(button.dataset.userId);

                        if (!user || button.disabled) {
                            return;
                        }

                        button.disabled = true;

                        try {
                            await action(user);
                        } catch (error) {
                            console.error('User action error:', error);
                            await this.showMessage(
                                'Ошибка',
                                error.message || 'Не удалось выполнить действие.'
                            );
                        } finally {
                            button.disabled = false;
                        }
                    });
                });
            };

            bindAction('.user-permissions-button', user => this.editPermissions(user));
            bindAction('.user-block-button', user => this.changeBlocked(user));
            bindAction('.user-message-button', user => window.MessagesModule.openSendModal(user));
        },

        renderUsersList() {
            if (window.state?.activeModule !== 'users' || !this.canView()) {
                return;
            }

            const container = document.getElementById(
                'main-content'
            );

            if (!container) {
                return;
            }

            const list = container.querySelector(
                '.users-list'
            );

            if (!list) {
                this.renderContent();
                return;
            }

            const users = this.getFilteredUsers();

            list.innerHTML = users.length
                ? users
                      .map(user => {
                          return this.renderUserCard(user);
                      })
                      .join('')
                : `
                    <div class="users-empty">
                        Пользователи не найдены
                    </div>
                `;

            this.bindCardEvents();
        },

        renderContent() {
            if (window.state?.activeModule !== 'users' || !this.canView()) {
                return;
            }

            const container =
                document.getElementById(
                    'main-content'
                );

            if (!container) {
                return;
            }

            container.innerHTML =
                this.renderPage();

            const search =
                container.querySelector(
                    '.users-search'
                );

            if (search) {
                search.addEventListener(
                    'input',
                    event => {
                        this.searchText =
                            event.target.value;

                        this.renderUsersList();
                    }
                );
            }

            this.bindCardEvents();
        },

        async render() {
            const container =
                document.getElementById(
                    'main-content'
                );

            if (!container) {
                return;
            }

            if (!this.canView()) {
                window.showAppError(
                    'У вас нет разрешения на просмотр пользователей.'
                );

                return;
            }

            try {
                await this.loadUsers();
                this.renderContent();
            } catch (error) {
                console.error(
                    'Users render error:',
                    error
                );

                if (window.state?.activeModule !== 'users' || !this.canView()) {
                    return;
                }

                window.showAppError(
                    'Не удалось загрузить пользователей.',
                    error
                );
            }
        }
    };
})();
