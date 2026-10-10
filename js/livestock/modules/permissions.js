(function () {
    'use strict';

    window.PermissionsModule = {
        definitions: [
            {
                key: 'can_view_dashboard',
                label: 'Просмотр дашборда',
                group: 'Разделы'
            },
            {
                key: 'can_view_herd',
                label: 'Просмотр поголовья',
                group: 'Разделы'
            },
            {
                key: 'can_view_diets',
                label: 'Просмотр рационов',
                group: 'Разделы'
            },
            {
                key: 'can_view_reports',
                label: 'Просмотр потребности',
                group: 'Разделы'
            },
            {
                key: 'can_view_history',
                label: 'Просмотр истории операций',
                group: 'Разделы'
            },
            {
                key: 'can_edit_herd',
                label: 'Изменение поголовья',
                group: 'Поголовье'
            },
            {
                key: 'can_manage_movements',
                label: 'Падёж, реализация и перевод',
                group: 'Поголовье'
            },
            {
                key: 'can_manage_groups',
                label: 'Создание и удаление групп',
                group: 'Поголовье'
            },
            {
                key: 'can_manage_categories',
                label: 'Управление категориями',
                group: 'Поголовье'
            },
            {
                key: 'can_edit_diets',
                label: 'Изменение рационов',
                group: 'Кормление'
            },
            {
                key: 'can_send_messages',
                label: 'Отправка сообщений',
                group: 'Пользователи'
            }
        ],

        isAdmin() {
            return Boolean(
                window.AuthModule &&
                typeof window.AuthModule.isAdmin ===
                    'function' &&
                window.AuthModule.isAdmin()
            );
        },

        has(permission) {
            if (this.isAdmin()) {
                return true;
            }

            if (
                !window.AuthModule ||
                typeof window.AuthModule.hasPermission !==
                    'function'
            ) {
                return false;
            }

            return window.AuthModule.hasPermission(
                permission
            );
        },

        require(permission, message) {
            if (this.has(permission)) {
                return true;
            }

            if (
                typeof window.showSimpleMessage ===
                'function'
            ) {
                window.showSimpleMessage(
                    'Нет доступа',
                    message ||
                    'Это действие запрещено администратором.'
                );
            }

            return false;
        },

        getDefaultPermissions() {
            return {
                can_view_dashboard: true,
                can_view_herd: true,
                can_edit_herd: false,
                can_manage_movements: false,
                can_view_diets: true,
                can_edit_diets: false,
                can_view_reports: true,
                can_view_history: false,
                can_manage_categories: false,
                can_manage_groups: false,
                can_send_messages: false
            };
        },

        normalizePermissions(value) {
            const defaults =
                this.getDefaultPermissions();

            const source =
                value && typeof value === 'object'
                    ? value
                    : {};

            const result = {};

            Object.keys(defaults).forEach(key => {
                result[key] =
                    source[key] === true;
            });

            return result;
        },

        groupedDefinitions() {
            return this.definitions.reduce(
                (groups, definition) => {
                    if (!groups[definition.group]) {
                        groups[definition.group] = [];
                    }

                    groups[definition.group].push(
                        definition
                    );

                    return groups;
                },
                {}
            );
        },

        renderToggleRows(permissions) {
            const groups =
                this.groupedDefinitions();

            return Object.keys(groups)
                .map(groupName => {
                    const rows =
                        groups[groupName]
                            .map(definition => {
                                const checked =
                                    permissions[
                                        definition.key
                                    ] === true;

                                return `
                                    <label
                                        class="
                                            permission-row
                                        "
                                    >
                                        <span>
                                            ${window.escapeHtml(
                                                definition.label
                                            )}
                                        </span>

                                        <input
                                            type="checkbox"
                                            class="
                                                permission-toggle
                                            "
                                            data-permission="${
                                                definition.key
                                            }"
                                            ${
                                                checked
                                                    ? 'checked'
                                                    : ''
                                            }
                                        >

                                        <span
                                            class="
                                                permission-switch
                                            "
                                        ></span>
                                    </label>
                                `;
                            })
                            .join('');

                    return `
                        <div class="permission-group">
                            <div
                                class="
                                    permission-group-title
                                "
                            >
                                ${window.escapeHtml(
                                    groupName
                                )}
                            </div>

                            ${rows}
                        </div>
                    `;
                })
                .join('');
        },

        async updateUserPermissions(
            userId,
            permissions
        ) {
            if (!this.isAdmin()) {
                throw new Error(
                    'Только администратор может менять разрешения.'
                );
            }

            const normalized =
                this.normalizePermissions(
                    permissions
                );

            const response =
                await db.rpc(
                    'admin_update_permissions',
                    {
                        p_user_id: userId,
                        p_permissions: normalized
                    }
                );

            if (response.error) {
                throw response.error;
            }

            return normalized;
        },

        async setUserBlocked(userId, blocked) {
            if (!this.isAdmin()) {
                throw new Error(
                    'Только администратор может блокировать пользователей.'
                );
            }

            const response =
                await db.rpc(
                    'admin_set_user_blocked',
                    {
                        p_user_id: userId,
                        p_blocked: Boolean(blocked)
                    }
                );

            if (response.error) {
                throw response.error;
            }
        },

        async openEditor(user) {
            if (!this.isAdmin()) {
                if (
                    typeof window.showSimpleMessage ===
                    'function'
                ) {
                    window.showSimpleMessage(
                        'Нет доступа',
                        'Разрешения доступны только администратору.'
                    );
                }

                return;
            }

            const profile =
                user.profile || {};

            const current =
                this.normalizePermissions(
                    user.permissions || {}
                );

            const overlay =
                document.createElement('div');

            overlay.className =
                'modal-overlay open';

            overlay.innerHTML = `
                <div class="modal-box permission-editor-box"
                    role="dialog" aria-modal="true"
                    aria-labelledby="permission-editor-title">
                    <h3 class="permission-editor-title"
                        id="permission-editor-title">
                        Разрешения пользователя
                    </h3>

                    <p class="permission-editor-user">
                        ${window.escapeHtml(
                            profile.full_name || ''
                        )}
                        <br>
                        <span>
                            ${window.escapeHtml(
                                profile.login || ''
                            )}
                            ·
                            ${window.escapeHtml(
                                profile.position || ''
                            )}
                        </span>
                    </p>

                    <div
                        class="
                            permission-editor-list
                        "
                    >
                        ${this.renderToggleRows(current)}
                    </div>

                    <div
                        class="
                            permission-editor-error
                        "
                        role="alert"
                    ></div>

                    <div
                        class="
                            permission-editor-actions
                        "
                    >
                        <button
                            type="button"
                            class="
                                glass-btn
                                permission-editor-cancel
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                permission-editor-save
                            "
                            style="
                                border-color:var(--green-dark);
                                color:var(--green);
                            "
                        >
                            Сохранить
                        </button>
                    </div>
                </div>

                <style>
                    .permission-editor-box {
                        display:flex;
                        flex-direction:column;
                        width:100%;
                        max-width:540px;
                        max-height:calc(100vh - 32px);
                        max-height:calc(100dvh - 32px);
                        overflow:hidden;
                    }

                    .permission-editor-box > :not(.permission-editor-list) {
                        flex-shrink:0;
                    }

                    .permission-editor-title {
                        margin:0;
                        color:#fff;
                        font-size:1.1rem;
                    }

                    .permission-editor-user {
                        margin:8px 0 15px;
                        color:var(--muted);
                        font-size:.82rem;
                        line-height:1.5;
                        overflow-wrap:anywhere;
                    }

                    .permission-editor-user span {
                        color:var(--subtle);
                        font-size:.75rem;
                    }

                    .permission-editor-list {
                        display:flex;
                        flex-direction:column;
                        flex:0 1 auto;
                        gap:12px;
                        min-height:0;
                        max-height:430px;
                        padding:2px 6px 2px 2px;
                        overflow-x:hidden;
                        overflow-y:auto;
                        overscroll-behavior-y:contain;
                        scrollbar-gutter:stable;
                        scrollbar-width:thin;
                        scrollbar-color:var(--line-bright) transparent;
                        -webkit-overflow-scrolling:touch;
                    }

                    .permission-editor-list::-webkit-scrollbar {
                        width:6px;
                    }

                    .permission-editor-list::-webkit-scrollbar-thumb {
                        border-radius:999px;
                        background:var(--line-bright);
                    }

                    .permission-group {
                        flex-shrink:0;
                        overflow:hidden;
                        border:1px solid var(--line);
                        border-radius:12px;
                        background:rgba(0,0,0,.13);
                    }

                    .permission-group-title {
                        padding:9px 12px;
                        border-bottom:1px solid var(--line);
                        color:var(--green);
                        font-size:.75rem;
                        font-weight:800;
                        letter-spacing:.04em;
                        text-transform:uppercase;
                    }

                    .permission-row {
                        position:relative;
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:12px;
                        min-height:45px;
                        padding:8px 12px;
                        border-bottom:1px solid
                            rgba(255,255,255,.06);
                        color:var(--text);
                        cursor:pointer;
                        font-size:.8rem;
                        line-height:1.45;
                    }

                    .permission-row:hover {
                        background:rgba(255,255,255,.04);
                    }

                    .permission-row > span:first-child {
                        min-width:0;
                        overflow-wrap:anywhere;
                    }

                    .permission-row:last-child {
                        border-bottom:0;
                    }

                    .permission-toggle {
                        position:absolute;
                        width:1px;
                        height:1px;
                        opacity:0;
                        pointer-events:none;
                    }

                    .permission-switch {
                        position:relative;
                        flex:0 0 42px;
                        width:42px;
                        height:24px;
                        border:1px solid var(--line-bright);
                        border-radius:999px;
                        background:rgba(0,0,0,.35);
                        transition:
                            background 160ms ease,
                            border-color 160ms ease;
                    }

                    .permission-switch::after {
                        position:absolute;
                        top:3px;
                        left:3px;
                        width:16px;
                        height:16px;
                        border-radius:50%;
                        background:var(--muted);
                        content:"";
                        transition:
                            transform 160ms ease,
                            background 160ms ease;
                    }

                    .permission-toggle:checked
                    + .permission-switch {
                        border-color:var(--green-dark);
                        background:rgba(16,185,129,.35);
                    }

                    .permission-toggle:checked
                    + .permission-switch::after {
                        background:var(--green);
                        transform:translateX(18px);
                    }

                    .permission-toggle:focus-visible
                    + .permission-switch {
                        outline:2px solid var(--green);
                        outline-offset:3px;
                    }

                    .permission-editor-error {
                        margin-top:9px;
                        color:var(--red);
                        font-size:.78rem;
                        overflow-wrap:anywhere;
                    }

                    .permission-editor-error:empty {
                        display:none;
                    }

                    .permission-editor-actions {
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:15px;
                        padding-top:12px;
                        border-top:1px solid var(--line);
                    }

                    @media(max-width:500px) {
                        .permission-editor-box {
                            padding:16px;
                            border-radius:16px;
                        }

                        .permission-editor-actions {
                            gap:8px;
                        }

                        .permission-editor-actions
                        .glass-btn {
                            flex:1;
                            min-width:0;
                        }
                    }
                </style>
            `;

            document.body.appendChild(overlay);

            return new Promise(resolve => {
                let closed = false;

                const close = value => {
                    if (closed) {
                        return;
                    }

                    closed = true;
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector(
                        '.permission-editor-cancel'
                    )
                    .addEventListener(
                        'click',
                        () => close(null)
                    );

                overlay
                    .querySelector(
                        '.permission-editor-save'
                    )
                    .addEventListener(
                        'click',
                        async event => {
                            const button =
                                event.currentTarget;

                            const errorNode =
                                overlay.querySelector(
                                    '.permission-editor-error'
                                );

                            const result = {};

                            overlay
                                .querySelectorAll(
                                    '.permission-toggle'
                                )
                                .forEach(input => {
                                    result[
                                        input.dataset.permission
                                    ] = input.checked;
                                });

                            button.disabled = true;
                            errorNode.textContent = '';

                            try {
                                await this.updateUserPermissions(
                                    profile.id,
                                    result
                                );

                                close(result);
                            } catch (error) {
                                button.disabled = false;
                                errorNode.textContent =
                                    error.message ||
                                    'Не удалось сохранить разрешения.';
                            }
                        }
                    );
            });
        }
    };
})();