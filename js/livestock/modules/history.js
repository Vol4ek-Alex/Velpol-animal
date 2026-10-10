(function () {
    'use strict';

    window.HistoryModule = {
        movements: [],
        selectedType: 'all',
        selectedFarm: 'Все',

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

        cleanFarmName(value) {
            if (typeof window.cleanFarmName === 'function') {
                return window.cleanFarmName(value);
            }

            return String(value || '')
                .replace(/["'«»]/g, '')
                .trim();
        },

        canView() {
            return Boolean(
                window.AuthModule &&
                (
                    window.AuthModule.isAdmin() ||
                    window.AuthModule.hasPermission(
                        'can_view_history'
                    )
                )
            );
        },

        canUndo() {
            return Boolean(
                window.AuthModule &&
                (
                    window.AuthModule.isAdmin() ||
                    window.AuthModule.hasPermission(
                        'can_manage_movements'
                    )
                )
            );
        },

        getTypeLabel(type) {
            const labels = {
                realization: 'Реализация',
                mortality: 'Падёж',
                transfer: 'Перевод'
            };

            return labels[type] || 'Операция';
        },

        getTypeIcon(type) {
            const icons = {
                realization: '💰',
                mortality: '⚠️',
                transfer: '↔️'
            };

            return icons[type] || '📋';
        },

        formatDate(value) {
            if (!value) {
                return 'Дата не указана';
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return 'Дата не указана';
            }

            return date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        async loadMovements() {
            const response = await db
                .from('herd_movements')
                .select('*')
                .order('event_date', {
                    ascending: false
                })
                .order('created_at', {
                    ascending: false
                });

            if (response.error) {
                throw response.error;
            }

            this.movements = response.data || [];

            return this.movements;
        },

        getFarms() {
            const names = new Set();

            this.movements.forEach(item => {
                if (item.source_farm_name) {
                    names.add(
                        this.cleanFarmName(
                            item.source_farm_name
                        )
                    );
                }

                if (item.destination_farm_name) {
                    names.add(
                        this.cleanFarmName(
                            item.destination_farm_name
                        )
                    );
                }
            });

            return Array.from(names).sort((a, b) => {
                return a.localeCompare(b, 'ru');
            });
        },

        getFilteredMovements() {
            return this.movements.filter(item => {
                const typeMatches =
                    this.selectedType === 'all' ||
                    item.movement_type === this.selectedType;

                const farmMatches =
                    this.selectedFarm === 'Все' ||
                    this.cleanFarmName(
                        item.source_farm_name
                    ) === this.selectedFarm ||
                    this.cleanFarmName(
                        item.destination_farm_name
                    ) === this.selectedFarm;

                return typeMatches && farmMatches;
            });
        },

        renderFarmOptions() {
            const farms = this.getFarms();

            return [
                `
                    <option value="Все">
                        Все объекты
                    </option>
                `,
                ...farms.map(farm => `
                    <option
                        value="${this.escape(farm)}"
                        ${
                            farm === this.selectedFarm
                                ? 'selected'
                                : ''
                        }
                    >
                        ${this.escape(farm)}
                    </option>
                `)
            ].join('');
        },

        renderMovement(item) {
            const source = `
                ${this.escape(
                    this.cleanFarmName(
                        item.source_farm_name
                    )
                )}
                —
                ${this.escape(
                    item.source_group_name
                )}
            `;

            const isTransfer =
                item.movement_type === 'transfer';

            const destination = isTransfer
                ? `
                    <div class="history-route">
                        <span aria-hidden="true">↓</span>

                        <span>
                            ${this.escape(
                                this.cleanFarmName(
                                    item.destination_farm_name
                                )
                            )}
                            —
                            ${this.escape(
                                item.destination_group_name
                            )}
                        </span>
                    </div>
                `
                : '';

            const categoryText = isTransfer
                ? `
                    ${
                        item.source_category_name
                            ? `
                                <span
                                    class="
                                        history-category
                                    "
                                >
                                    Откуда:
                                    ${this.escape(
                                        item.source_category_name
                                    )}
                                </span>
                            `
                            : ''
                    }

                    ${
                        item.destination_category_name
                            ? `
                                <span
                                    class="
                                        history-category
                                    "
                                >
                                    Куда:
                                    ${this.escape(
                                        item.destination_category_name
                                    )}
                                </span>
                            `
                            : ''
                    }
                `
                : `
                    ${
                        item.source_category_name
                            ? `
                                <span
                                    class="
                                        history-category
                                    "
                                >
                                    Категория:
                                    ${this.escape(
                                        item.source_category_name
                                    )}
                                </span>
                            `
                            : ''
                    }
                `;

            const note =
                item.comment ||
                item.reason ||
                '';

            return `
                <article class="history-item">
                    <div class="history-icon">
                        ${this.getTypeIcon(
                            item.movement_type
                        )}
                    </div>

                    <div class="history-content">
                        <div class="history-title-row">
                            <strong class="history-title">
                                ${this.getTypeLabel(
                                    item.movement_type
                                )}
                            </strong>

                            <time class="history-date">
                                ${this.formatDate(
                                    item.event_date
                                )}
                            </time>
                        </div>

                        <div class="history-source">
                            ${source}
                        </div>

                        ${destination}

                        ${categoryText}

                        ${
                            note
                                ? `
                                    <div class="history-note">
                                        ${this.escape(note)}
                                    </div>
                                `
                                : ''
                        }
                    </div>

                    <strong class="history-quantity">
                        ${Number(item.quantity) || 0}
                        <span>гол.</span>
                    </strong>
                </article>
            `;
        },

        renderPage() {
            const movements =
                this.getFilteredMovements();

            return `
                <style>
                    .history-page {
                        width: 100%;
                        min-width: 0;
                    }

                    .history-header {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 16px;
                        margin-bottom: 16px;
                    }

                    .history-header-actions {
                        display: flex;
                        flex: 0 0 auto;
                        gap: 8px;
                    }

                    .history-title-main {
                        margin: 0;
                        color: #fff;
                        font-size: clamp(
                            1.45rem,
                            2.5vw,
                            2rem
                        );
                        font-weight: 800;
                        letter-spacing: -.04em;
                    }

                    .history-description {
                        margin: 5px 0 0;
                        color: var(--muted);
                        font-size: .86rem;
                    }

                    .history-filters {
                        display: grid;
                        grid-template-columns:
                            minmax(0, 1fr)
                            minmax(180px, 260px);
                        gap: 10px;
                        margin-bottom: 14px;
                    }

                    .history-type-filters {
                        display: flex;
                        gap: 6px;
                        min-width: 0;
                        padding: 4px;
                        overflow-x: auto;
                        border: 1px solid var(--line);
                        border-radius: 13px;
                        background: rgba(9,22,39,.55);
                        scrollbar-width: none;
                    }

                    .history-type-filters::-webkit-scrollbar {
                        display: none;
                    }

                    .history-filter-button {
                        flex: 0 0 auto;
                        min-height: 36px;
                        padding: 7px 11px;
                        border: 1px solid transparent;
                        border-radius: 9px;
                        background: transparent;
                        color: var(--muted);
                        cursor: pointer;
                        font-size: .76rem;
                        font-weight: 700;
                        white-space: nowrap;
                    }

                    .history-filter-button.active {
                        border-color: var(--line-bright);
                        background: rgba(255,255,255,.12);
                        color: #fff;
                    }

                    .history-farm-select {
                        width: 100%;
                        min-height: 44px;
                        padding: 8px 12px;
                        border: 1px solid var(--line);
                        border-radius: 12px;
                        background: rgba(3,10,20,.75);
                        color: #fff;
                        font: inherit;
                    }

                    .history-list {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        padding: 14px;
                    }

                    .history-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        min-width: 0;
                        padding: 13px;
                        border: 1px solid var(--line);
                        border-radius: 14px;
                        background: rgba(0,0,0,.16);
                    }

                    .history-icon {
                        display: flex;
                        flex: 0 0 32px;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        border: 1px solid var(--line);
                        border-radius: 10px;
                        background: rgba(255,255,255,.05);
                        font-size: 1rem;
                    }

                    .history-content {
                        display: flex;
                        flex: 1 1 auto;
                        flex-direction: column;
                        gap: 5px;
                        min-width: 0;
                    }

                    .history-title-row {
                        display: flex;
                        align-items: baseline;
                        justify-content: space-between;
                        gap: 10px;
                    }

                    .history-title {
                        color: #fff;
                        font-size: .88rem;
                    }

                    .history-date {
                        flex: 0 0 auto;
                        color: var(--subtle);
                        font-size: .71rem;
                    }

                    .history-source,
                    .history-route {
                        overflow-wrap: anywhere;
                        color: var(--muted);
                        font-size: .8rem;
                    }

                    .history-route {
                        display: flex;
                        gap: 7px;
                        color: var(--blue);
                    }

                    .history-category {
                        display: block;
                        color: var(--subtle);
                        font-size: .72rem;
                    }

                    .history-note {
                        overflow-wrap: anywhere;
                        color: var(--amber);
                        font-size: .75rem;
                    }

                    .history-quantity {
                        flex: 0 0 auto;
                        color: var(--green);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size: .86rem;
                        white-space: nowrap;
                    }

                    .history-quantity span {
                        color: var(--muted);
                        font-family: "Exo 2", sans-serif;
                        font-size: .7rem;
                    }

                    .history-empty {
                        padding: 30px 18px;
                        color: var(--muted);
                        text-align: center;
                    }

                    .history-modal-text {
                        margin: 10px 0 0;
                        color: var(--muted);
                        font-size: .82rem;
                        line-height: 1.5;
                    }

                    .history-modal-error {
                        min-height: 20px;
                        margin-top: 8px;
                        color: var(--red);
                        font-size: .78rem;
                    }

                    @media (max-width: 700px) {
                        .history-header {
                            flex-direction: column;
                        }

                        .history-header-actions {
                            width: 100%;
                        }

                        .history-header-actions .glass-btn {
                            width: 100%;
                        }

                        .history-filters {
                            grid-template-columns: 1fr;
                        }

                        .history-item {
                            flex-wrap: wrap;
                        }

                        .history-content {
                            flex-basis: calc(100% - 44px);
                        }

                        .history-title-row {
                            align-items: flex-start;
                            flex-direction: column;
                            gap: 2px;
                        }

                        .history-quantity {
                            margin-left: 44px;
                        }
                    }
                </style>

                <div class="history-page">
                    <header class="history-header">
                        <div>
                            <h1 class="history-title-main">
                                История операций
                            </h1>

                            <p class="history-description">
                                Реализация, падёж и перемещения
                                поголовья
                            </p>
                        </div>

                        ${
                            this.canUndo()
                                ? `
                                    <div
                                        class="
                                            history-header-actions
                                        "
                                    >
                                        <button
                                            type="button"
                                            class="
                                                glass-btn
                                                history-undo-button
                                            "
                                            ${
                                                this.movements.length
                                                    ? ''
                                                    : 'disabled'
                                            }
                                        >
                                            ↶ Отменить последнюю
                                        </button>
                                    </div>
                                `
                                : ''
                        }
                    </header>

                    <div class="history-filters">
                        <div class="history-type-filters">
                            ${[
                                ['all', 'Все операции'],
                                [
                                    'realization',
                                    'Реализация'
                                ],
                                ['mortality', 'Падёж'],
                                ['transfer', 'Переводы']
                            ].map(([type, label]) => `
                                <button
                                    type="button"
                                    class="
                                        history-filter-button
                                        ${
                                            this.selectedType === type
                                                ? 'active'
                                                : ''
                                        }
                                    "
                                    data-type="${type}"
                                >
                                    ${label}
                                </button>
                            `).join('')}
                        </div>

                        <select
                            class="history-farm-select"
                            aria-label="Фильтр по объекту"
                        >
                            ${this.renderFarmOptions()}
                        </select>
                    </div>

                    <section
                        class="
                            glass-panel
                            history-list
                        "
                    >
                        ${
                            movements.length
                                ? movements.map(item => {
                                    return this.renderMovement(
                                        item
                                    );
                                }).join('')
                                : `
                                    <div class="history-empty">
                                        Нет операций по выбранным фильтрам
                                    </div>
                                `
                        }
                    </section>
                </div>
            `;
        },

        async requestPinModal() {
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
                        Отмена последней операции
                    </h3>

                    <p class="history-modal-text">
                        Поголовье будет восстановлено,
                        а запись удалена из истории.
                    </p>

                    <input
                        type="password"
                        inputmode="numeric"
                        maxlength="4"
                        autocomplete="off"
                        class="
                            modal-input
                            history-pin-input
                        "
                        placeholder="Введите PIN-код"
                        style="margin-top:15px"
                    >

                    <div class="history-modal-error"></div>

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:15px;
                    ">
                        <button
                            type="button"
                            class="
                                glass-btn
                                history-pin-cancel
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                history-pin-submit
                            "
                            style="
                                border-color:var(--amber);
                                color:var(--amber);
                            "
                        >
                            Продолжить
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const input =
                overlay.querySelector(
                    '.history-pin-input'
                );

            const errorNode =
                overlay.querySelector(
                    '.history-modal-error'
                );

            setTimeout(() => {
                input.focus();
            }, 50);

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
                        '.history-pin-cancel'
                    )
                    .addEventListener(
                        'click',
                        () => close(null)
                    );

                overlay
                    .querySelector(
                        '.history-pin-submit'
                    )
                    .addEventListener(
                        'click',
                        () => {
                            const pin =
                                String(
                                    input.value || ''
                                ).trim();

                            if (!/^\d{4}$/.test(pin)) {
                                errorNode.textContent =
                                    'Введите PIN из 4 цифр.';
                                input.focus();
                                return;
                            }

                            close(pin);
                        }
                    );

                input.addEventListener(
                    'keydown',
                    event => {
                        if (event.key === 'Enter') {
                            overlay
                                .querySelector(
                                    '.history-pin-submit'
                                )
                                .click();
                        }

                        if (event.key === 'Escape') {
                            close(null);
                        }
                    }
                );
            });
        },

        async confirmUndoModal() {
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
                        Подтвердить отмену?
                    </h3>

                    <p class="history-modal-text">
                        Последняя операция будет отменена.
                        Поголовье восстановится,
                        запись исчезнет из истории.
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
                                history-confirm-no
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                history-confirm-yes
                            "
                            style="
                                border-color:var(--red);
                                color:var(--red);
                            "
                        >
                            Отменить операцию
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
                        '.history-confirm-no'
                    )
                    .addEventListener(
                        'click',
                        () => close(false)
                    );

                overlay
                    .querySelector(
                        '.history-confirm-yes'
                    )
                    .addEventListener(
                        'click',
                        () => close(true)
                    );
            });
        },

        async showMessageModal(title, message) {
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

                    <p class="history-modal-text">
                        ${this.escape(message)}
                    </p>

                    <button
                        type="button"
                        class="
                            glass-btn
                            history-message-close
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

            const close = () => {
                overlay.remove();
            };

            overlay
                .querySelector(
                    '.history-message-close'
                )
                .addEventListener(
                    'click',
                    close
                );
        },

        async undoLastMovement() {
            if (!this.canUndo()) {
                await this.showMessageModal(
                    'Нет доступа',
                    'Отменять операции может только администратор или пользователь с соответствующим разрешением.'
                );

                return;
            }

            if (!this.movements.length) {
                await this.showMessageModal(
                    'История пуста',
                    'Нет операции для отмены.'
                );

                return;
            }

            const pin =
                await this.requestPinModal();

            if (pin === null) {
                return;
            }

            const confirmed =
                await this.confirmUndoModal();

            if (!confirmed) {
                return;
            }

            const response = await db.rpc(
                'undo_last_herd_movement',
                {
                    p_pin: pin
                }
            );

            if (response.error) {
                await this.showMessageModal(
                    'Не удалось отменить операцию',
                    response.error.message ||
                    'Проверьте PIN и состояние групп.'
                );

                return;
            }

            await this.loadMovements();

            await this.showMessageModal(
                'Операция отменена',
                'Поголовье восстановлено, запись удалена из истории.'
            );

            await this.render();
        },

        bindEvents() {
            const container =
                document.getElementById(
                    'main-content'
                );

            if (!container) {
                return;
            }

            container
                .querySelectorAll(
                    '.history-filter-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => {
                            this.selectedType =
                                button.dataset.type;

                            this.render();
                        }
                    );
                });

            const farmSelect =
                container.querySelector(
                    '.history-farm-select'
                );

            if (farmSelect) {
                farmSelect.addEventListener(
                    'change',
                    () => {
                        this.selectedFarm =
                            farmSelect.value;

                        this.render();
                    }
                );
            }

            const undoButton =
                container.querySelector(
                    '.history-undo-button'
                );

            if (undoButton) {
                undoButton.addEventListener(
                    'click',
                    () => this.undoLastMovement()
                );
            }
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
                showAppError(
                    'У вас нет разрешения на просмотр истории.'
                );

                return;
            }

            try {
                await this.loadMovements();

                container.innerHTML =
                    this.renderPage();

                this.bindEvents();
            } catch (error) {
                console.error(
                    'History render error:',
                    error
                );

                showAppError(
                    'Не удалось загрузить историю операций.',
                    error
                );
            }
        }
    };
})();