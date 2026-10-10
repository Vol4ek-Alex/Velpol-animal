(function () {
    'use strict';

    window.HerdModule = {
        groups: [],
        categories: [],
        distributions: {},
        activeCategoryId: 'all',

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

        number(value) {
            const result = Number(value);
            return Number.isFinite(result) ? result : 0;
        },

        farmName(value) {
            if (typeof window.cleanFarmName === 'function') {
                return window.cleanFarmName(value);
            }

            return String(value || '')
                .replace(/["'«»]/g, '')
                .trim();
        },

        async loadData() {
            const [
                groupsResponse,
                categoriesResponse,
                distributionsResponse
            ] = await Promise.all([
                db
                    .from('farms_and_groups')
                    .select('*')
                    .order('farm_name')
                    .order('group_name'),

                db
                    .from('herd_categories')
                    .select('*')
                    .order('sort_order')
                    .order('name'),

                db
                    .from('group_category_heads')
                    .select(`
                        group_id,
                        category_id,
                        heads,
                        herd_categories (
                            id,
                            name
                        )
                    `)
            ]);

            if (groupsResponse.error) {
                throw groupsResponse.error;
            }

            if (categoriesResponse.error) {
                throw categoriesResponse.error;
            }

            if (distributionsResponse.error) {
                throw distributionsResponse.error;
            }

            this.groups = groupsResponse.data || [];
            this.categories = categoriesResponse.data || [];
            this.distributions = {};

            (distributionsResponse.data || []).forEach(row => {
                if (!this.distributions[row.group_id]) {
                    this.distributions[row.group_id] = [];
                }

                this.distributions[row.group_id].push({
                    category_id: row.category_id,
                    heads: this.number(row.heads),
                    name:
                        row.herd_categories?.name ||
                        'Без категории'
                });
            });
        },

        filterFarm(groups) {
            const currentFarm =
                window.state.currentFarm;

            if (!currentFarm || currentFarm === 'Все') {
                return groups;
            }

            return groups.filter(group => {
                return (
                    group.farm_name === currentFarm ||
                    this.farmName(group.farm_name) ===
                    this.farmName(currentFarm)
                );
            });
        },

        filterCategory(groups) {
            if (
                !this.activeCategoryId ||
                this.activeCategoryId === 'all'
            ) {
                return groups;
            }

            return groups.filter(group => {
                return (this.distributions[group.id] || [])
                    .some(item => {
                        return (
                            String(item.category_id) ===
                            String(this.activeCategoryId) &&
                            this.number(item.heads) > 0
                        );
                    });
            });
        },

        getDistribution(groupId) {
            return this.distributions[groupId] || [];
        },

        getDistributionText(groupId) {
            const items = this.getDistribution(groupId)
                .filter(item => this.number(item.heads) > 0);

            if (!items.length) {
                return 'Не распределено';
            }

            return items
                .map(item => {
                    return `${item.name}: ${item.heads}`;
                })
                .join(', ');
        },

        calculateStats(groups) {
            const total = groups.reduce((sum, group) => {
                return sum + this.number(group.head_count);
            }, 0);

            const previous = groups.reduce((sum, group) => {
                return sum + this.number(
                    group.prev_head_count
                );
            }, 0);

            return {
                total,
                previous,
                difference: total - previous,
                count: groups.length
            };
        },

        categoryButtons() {
            const items = [
                {
                    id: 'all',
                    name: 'Все категории'
                },
                ...this.categories.map(category => ({
                    id: category.id,
                    name: category.name
                }))
            ];

            return items.map(item => `
                <button
                    type="button"
                    class="
                        herd-category-filter-button
                        ${
                            String(this.activeCategoryId) ===
                            String(item.id)
                                ? 'active'
                                : ''
                        }
                    "
                    data-category-id="${this.escape(item.id)}"
                >
                    ${this.escape(item.name)}
                </button>
            `).join('');
        },

        categoryTotals(groups) {
            const totals = {};

            this.categories.forEach(category => {
                totals[category.id] = {
                    name: category.name,
                    heads: 0
                };
            });

            groups.forEach(group => {
                this.getDistribution(group.id)
                    .forEach(item => {
                        if (!totals[item.category_id]) {
                            totals[item.category_id] = {
                                name: item.name ||
                                    'Без категории',
                                heads: 0
                            };
                        }

                        totals[item.category_id].heads +=
                            this.number(item.heads);
                    });
            });

            return Object.values(totals);
        },

        renderCategoryTotals(groups) {
            const totals =
                this.categoryTotals(groups);

            if (!totals.length) {
                return `
                    <div class="herd-empty-message">
                        Категории не созданы
                    </div>
                `;
            }

            return totals.map(item => `
                <div class="herd-category-total-card">
                    <span title="${this.escape(item.name)}">
                        ${this.escape(item.name)}
                    </span>

                    <strong>
                        ${item.heads.toLocaleString('ru-RU')}
                    </strong>
                </div>
            `).join('');
        },

        renderRows(groups) {
            if (!groups.length) {
                return `
                    <tr>
                        <td
                            colspan="${state.isEditMode ? 6 : 5}"
                            class="herd-empty-cell"
                        >
                            Нет данных по выбранным фильтрам
                        </td>
                    </tr>
                `;
            }

            return groups.map(group => {
                const current =
                    this.number(group.head_count);

                const previous =
                    this.number(group.prev_head_count);

                const difference =
                    current - previous;

                return `
                    <tr>
                        <td>
                            <span class="herd-farm-name">
                                ${this.escape(
                                    this.farmName(
                                        group.farm_name
                                    )
                                )}
                            </span>
                        </td>

                        <td>
                            <strong>
                                ${this.escape(group.group_name)}
                            </strong>
                        </td>

                        <td>
                            <span
                                class="herd-distribution"
                                title="${this.escape(
                                    this.getDistributionText(
                                        group.id
                                    )
                                )}"
                            >
                                ${this.escape(
                                    this.getDistributionText(
                                        group.id
                                    )
                                )}
                            </span>
                        </td>

                        <td>
                            ${
                                state.isEditMode
                                    ? `
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            class="
                                                modal-input
                                                herd-count-input
                                            "
                                            data-group-id="${group.id}"
                                            value="${current}"
                                        >
                                    `
                                    : `
                                        <strong
                                            class="herd-head-value"
                                        >
                                            ${current.toLocaleString(
                                                'ru-RU'
                                            )}
                                            <span>гол.</span>
                                        </strong>
                                    `
                            }
                        </td>

                        <td>
                            <span class="
                                badge
                                ${
                                    difference >= 0
                                        ? 'badge-green'
                                        : 'badge-red'
                                }
                            ">
                                ${
                                    difference >= 0
                                        ? '+'
                                        : ''
                                }${difference} гол.
                            </span>

                            ${
                                group.last_change_reason
                                    ? `
                                        <div class="herd-last-change">
                                            ${this.escape(
                                                group.last_change_reason
                                            )}
                                            ${
                                                group.last_change_amount
                                                    ? ` — ${
                                                        group.last_change_amount
                                                    } гол.`
                                                    : ''
                                            }
                                        </div>
                                    `
                                    : ''
                            }
                        </td>

                        ${
                            state.isEditMode
                                ? `
                                    <td>
                                        <div class="herd-actions">
                                            <button
                                                type="button"
                                                class="
                                                    glass-btn
                                                    herd-category-button
                                                "
                                                data-group-id="${group.id}"
                                                title="Назначить категории"
                                            >
                                                🏷️
                                            </button>

                                            <button
                                                type="button"
                                                class="
                                                    glass-btn
                                                    herd-edit-button
                                                "
                                                data-group-id="${group.id}"
                                                title="Изменить группу"
                                            >
                                                ✏️
                                            </button>

                                            <button
                                                type="button"
                                                class="
                                                    glass-btn
                                                    herd-delete-button
                                                "
                                                data-group-id="${group.id}"
                                                title="Удалить группу"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                `
                                : ''
                        }
                    </tr>
                `;
            }).join('');
        },

        pageMarkup(groups) {
            const farmGroups =
                this.filterFarm(groups);

            const visibleGroups =
                this.filterCategory(farmGroups);

            const stats =
                this.calculateStats(visibleGroups);

            return `
                <style>
                    .herd-page {
                        width: 100%;
                        min-width: 0;
                    }

                    .herd-header {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 18px;
                        margin-bottom: 18px;
                    }

                    .herd-title {
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

                    .herd-description {
                        margin: 5px 0 0;
                        color: var(--muted);
                        font-size: .86rem;
                    }

                    .herd-category-filter {
                        display: flex;
                        gap: 6px;
                        margin-bottom: 14px;
                        padding: 5px;
                        overflow-x: auto;
                        border: 1px solid var(--line);
                        border-radius: 15px;
                        background: rgba(10,22,39,.52);
                        scrollbar-width: none;
                    }

                    .herd-category-filter::-webkit-scrollbar {
                        display: none;
                    }

                    .herd-category-filter-button {
                        flex: 0 0 auto;
                        min-height: 34px;
                        padding: 7px 11px;
                        border: 1px solid transparent;
                        border-radius: 10px;
                        background: transparent;
                        color: var(--muted);
                        cursor: pointer;
                        font-size: .75rem;
                        font-weight: 600;
                        white-space: nowrap;
                    }

                    .herd-category-filter-button.active,
                    .herd-category-filter-button:hover {
                        border-color: rgba(
                            255,255,255,.22
                        );
                        background: rgba(
                            255,255,255,.13
                        );
                        color: #fff;
                    }

                    .herd-stats {
                        display: grid;
                        grid-template-columns:
                            repeat(3, minmax(0, 1fr));
                        gap: 12px;
                        margin-bottom: 14px;
                    }

                    .herd-stat {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        min-width: 0;
                        height: 130px;
                        padding: 17px;
                    }

                    .herd-stat-label {
                        color: var(--muted);
                        font-size: .79rem;
                        font-weight: 600;
                    }

                    .herd-stat-value {
                        color: #fff;
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size: 1.7rem;
                        font-weight: 700;
                    }

                    .herd-stat-value span {
                        color: var(--muted);
                        font-family: "Exo 2", sans-serif;
                        font-size: .78rem;
                    }

                    .herd-category-totals {
                        display: grid;
                        grid-template-columns:
                            repeat(5, minmax(0, 1fr));
                        gap: 8px;
                        margin-bottom: 14px;
                    }

                    .herd-category-total-card {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        min-width: 0;
                        height: 70px;
                        padding: 10px;
                        border: 1px solid
                            rgba(255,255,255,.1);
                        border-radius: 13px;
                        background: rgba(7,18,32,.32);
                    }

                    .herd-category-total-card span {
                        overflow: hidden;
                        color: var(--muted);
                        font-size: .7rem;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .herd-category-total-card strong {
                        color: #fff;
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size: 1rem;
                    }

                    .herd-edit-panel {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        margin-bottom: 14px;
                        padding: 14px 18px;
                    }

                    .herd-edit-label {
                        color: var(--amber);
                        font-size: .82rem;
                        font-weight: 700;
                    }

                    .herd-table-panel {
                        padding: 18px;
                    }

                    .herd-table-heading {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        margin-bottom: 12px;
                    }

                    .herd-table-title {
                        margin: 0;
                        color: #fff;
                        font-size: 1rem;
                        font-weight: 800;
                    }

                    .herd-table-caption {
                        color: var(--subtle);
                        font-size: .74rem;
                    }

                    .herd-farm-name {
                        color: var(--muted);
                    }

                    .herd-distribution {
                        display: block;
                        max-width: 250px;
                        overflow: hidden;
                        color: var(--blue);
                        font-size: .75rem;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .herd-head-value {
                        color: var(--blue);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                    }

                    .herd-head-value span {
                        color: var(--muted);
                        font-family: "Exo 2", sans-serif;
                        font-size: .7rem;
                    }

                    .herd-count-input {
                        width: 95px !important;
                        min-height: 36px;
                        padding: 6px 8px !important;
                    }

                    .herd-last-change {
                        margin-top: 5px;
                        color: var(--subtle);
                        font-size: .7rem;
                    }

                    .herd-actions {
                        display: flex;
                        gap: 5px;
                        white-space: nowrap;
                    }

                    .herd-actions .glass-btn {
                        min-width: 34px;
                        min-height: 34px;
                        padding: 5px 7px;
                    }

                    .herd-empty-message,
                    .herd-empty-cell {
                        padding: 25px;
                        color: var(--muted);
                        text-align: center;
                    }

                    @media (max-width: 1100px) {
                        .herd-category-totals {
                            grid-template-columns:
                                repeat(3, minmax(0, 1fr));
                        }
                    }

                    @media (max-width: 700px) {
                        .herd-header {
                            flex-direction: column;
                            gap: 12px;
                        }

                        .herd-stats {
                            grid-template-columns: 1fr;
                            grid-auto-rows: 116px;
                        }

                        .herd-stat {
                            height: 116px;
                        }

                        .herd-category-totals {
                            grid-template-columns:
                                repeat(2, minmax(0, 1fr));
                        }

                        .herd-edit-panel {
                            align-items: stretch;
                            flex-direction: column;
                        }

                        .herd-edit-panel .glass-btn {
                            width: 100%;
                        }

                        .herd-table-panel {
                            padding: 14px;
                        }
                    }

                    @media (max-width: 380px) {
                        .herd-category-totals {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>

                <div class="herd-page">
                    <div class="herd-header">
                        <div>
                            <h1 class="herd-title">
                                Поголовье и группы
                            </h1>

                            <p class="herd-description">
                                Управление составом стада
                            </p>
                        </div>

                        <div id="herd-farm-selector"></div>
                    </div>

                    <div class="herd-category-filter">
                        ${this.categoryButtons()}
                    </div>

                    <div class="herd-stats">
                        <div class="glass-panel herd-stat">
                            <span class="herd-stat-label">
                                Поголовье
                            </span>

                            <strong class="herd-stat-value">
                                ${stats.total.toLocaleString(
                                    'ru-RU'
                                )}
                                <span>гол.</span>
                            </strong>

                            <span class="
                                badge
                                ${
                                    stats.difference >= 0
                                        ? 'badge-green'
                                        : 'badge-red'
                                }
                            ">
                                ${
                                    stats.difference >= 0
                                        ? '+'
                                        : ''
                                }${stats.difference} гол.
                            </span>
                        </div>

                        <div class="glass-panel herd-stat">
                            <span class="herd-stat-label">
                                Прошлый месяц
                            </span>

                            <strong class="herd-stat-value">
                                ${stats.previous.toLocaleString(
                                    'ru-RU'
                                )}
                                <span>гол.</span>
                            </strong>

                            <span class="herd-stat-label">
                                По выбранному фильтру
                            </span>
                        </div>

                        <div class="glass-panel herd-stat">
                            <span class="herd-stat-label">
                                Активных групп
                            </span>

                            <strong class="herd-stat-value">
                                ${stats.count}
                                <span>групп</span>
                            </strong>

                            <span class="herd-stat-label">
                                Текущий фильтр
                            </span>
                        </div>
                    </div>

                    <div class="herd-category-totals">
                        ${this.renderCategoryTotals(
                            farmGroups
                        )}
                    </div>

                    ${
                        state.isEditMode
                            ? `
                                <div
                                    class="
                                        glass-panel
                                        herd-edit-panel
                                    "
                                >
                                    <span class="herd-edit-label">
                                        ⚙️ Режим редактирования
                                    </span>

                                    <div style="
                                        display:flex;
                                        gap:8px;
                                        flex-wrap:wrap;
                                    ">
                                        <button
                                            type="button"
                                            class="glass-btn"
                                            id="herd-manage-categories"
                                        >
                                            ⚙️ Категории
                                        </button>

                                        <button
                                            type="button"
                                            class="glass-btn"
                                            id="herd-add-group"
                                            style="
                                                border-color:
                                                    var(--green-dark);
                                                color:
                                                    var(--green);
                                            "
                                        >
                                            + Добавить группу
                                        </button>

                                        <button
                                            type="button"
                                            class="glass-btn"
                                            id="herd-add-object"
                                            style="
                                                border-color:
                                                    var(--blue);
                                                color:
                                                    var(--blue);
                                            "
                                        >
                                            ＋ Новый объект
                                        </button>
                                    </div>
                                </div>
                            `
                            : ''
                    }

                    <section
                        class="
                            glass-panel
                            herd-table-panel
                        "
                    >
                        <div class="herd-table-heading">
                            <h2 class="herd-table-title">
                                Состав стада
                            </h2>

                            <span class="herd-table-caption">
                                ${visibleGroups.length} записей
                            </span>
                        </div>

                        <div class="table-responsive">
                            <table class="glass-table">
                                <thead>
                                    <tr>
                                        <th>Объект</th>
                                        <th>Группа</th>
                                        <th>Категории</th>
                                        <th>Поголовье</th>
                                        <th>Изменение</th>
                                        ${
                                            state.isEditMode
                                                ? '<th>Действия</th>'
                                                : ''
                                        }
                                    </tr>
                                </thead>

                                <tbody>
                                    ${this.renderRows(
                                        visibleGroups
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            `;
        },

        async openForm(options) {
            const settings = options || {};
            const overlay =
                document.createElement('div');

            overlay.className =
                'modal-overlay open';

            overlay.innerHTML = `
                <div class="modal-box">
                    <h3 style="
                        margin:0;
                        color:#fff;
                        font-size:1.1rem;
                    ">
                        ${this.escape(
                            settings.title || 'Форма'
                        )}
                    </h3>

                    <div
                        class="herd-form-fields"
                        style="
                            display:flex;
                            flex-direction:column;
                            gap:12px;
                            margin-top:16px;
                        "
                    ></div>

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:18px;
                    ">
                        <button
                            type="button"
                            class="glass-btn form-cancel"
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="glass-btn form-submit"
                            style="
                                border-color:
                                    var(--green-dark);
                                color:var(--green);
                            "
                        >
                            ${this.escape(
                                settings.submitText ||
                                'Сохранить'
                            )}
                        </button>
                    </div>
                </div>
            `;

            const fieldsNode =
                overlay.querySelector(
                    '.herd-form-fields'
                );

            (settings.fields || []).forEach(field => {
                const wrapper =
                    document.createElement('div');

                const label =
                    document.createElement('label');

                label.textContent =
                    field.label || '';

                label.style.cssText = `
                    display:block;
                    margin-bottom:5px;
                    color:var(--muted);
                    font-size:.76rem;
                    font-weight:600;
                `;

                let input;

                if (field.type === 'select') {
                    input =
                        document.createElement('select');

                    (field.options || []).forEach(option => {
                        const node =
                            document.createElement('option');

                        node.value = option.value;
                        node.textContent = option.label;

                        if (
                            String(option.value) ===
                            String(field.value)
                        ) {
                            node.selected = true;
                        }

                        input.appendChild(node);
                    });
                } else {
                    input =
                        document.createElement('input');

                    input.type =
                        field.type || 'text';

                    input.value =
                        field.value ?? '';

                    if (field.min !== undefined) {
                        input.min = field.min;
                    }

                    if (field.step !== undefined) {
                        input.step = field.step;
                    }

                    if (field.placeholder) {
                        input.placeholder =
                            field.placeholder;
                    }
                }

                input.className = 'modal-input';
                input.dataset.field = field.name;

                wrapper.appendChild(label);
                wrapper.appendChild(input);
                fieldsNode.appendChild(wrapper);
            });

            document.body.appendChild(overlay);

            return new Promise(resolve => {
                let finished = false;

                const close = value => {
                    if (finished) return;

                    finished = true;
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector('.form-cancel')
                    .addEventListener(
                        'click',
                        () => close(null)
                    );

                overlay
                    .querySelector('.form-submit')
                    .addEventListener(
                        'click',
                        () => {
                            const result = {};

                            overlay
                                .querySelectorAll(
                                    '[data-field]'
                                )
                                .forEach(input => {
                                    result[input.dataset.field] =
                                        input.value;
                                });

                            close(result);
                        }
                    );
            });
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
                            class="glass-btn confirm-no"
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="glass-btn confirm-yes"
                            style="
                                border-color:var(--red);
                                color:var(--red);
                            "
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            return new Promise(resolve => {
                const close = value => {
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector('.confirm-no')
                    .addEventListener(
                        'click',
                        () => close(false)
                    );

                overlay
                    .querySelector('.confirm-yes')
                    .addEventListener(
                        'click',
                        () => close(true)
                    );
            });
        },

        async bindEvents() {
            const container =
                document.getElementById('main-content');

            if (!container) return;

            renderFarmSelector(
                this.groups,
                'herd-farm-selector'
            );

            container
                .querySelectorAll(
                    '.herd-category-filter-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => {
                            this.activeCategoryId =
                                button.dataset.categoryId;

                            this.render();
                        }
                    );
                });

            const manageButton =
                container.querySelector(
                    '#herd-manage-categories'
                );

            if (manageButton) {
                manageButton.addEventListener(
                    'click',
                    async () => {
                        await CategoriesModule.openManager();
                        await this.render();
                    }
                );
            }

            const addGroupButton =
                container.querySelector(
                    '#herd-add-group'
                );

            if (addGroupButton) {
                addGroupButton.addEventListener(
                    'click',
                    () => this.addGroup()
                );
            }

            const addObjectButton =
                container.querySelector(
                    '#herd-add-object'
                );

            if (addObjectButton) {
                addObjectButton.addEventListener(
                    'click',
                    () => this.addObject()
                );
            }

            container
                .querySelectorAll(
                    '.herd-category-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => this.editCategories(
                            button.dataset.groupId
                        )
                    );
                });

            container
                .querySelectorAll(
                    '.herd-count-input'
                )
                .forEach(input => {
                    input.addEventListener(
                        'change',
                        () => {
                            const group =
                                this.groups.find(item => {
                                    return String(item.id) ===
                                        String(
                                            input.dataset.groupId
                                        );
                                });

                            if (group) {
                                this.changeCount(
                                    group,
                                    input.value
                                );
                            }
                        }
                    );
                });

            container
                .querySelectorAll(
                    '.herd-edit-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => this.editGroup(
                            button.dataset.groupId
                        )
                    );
                });

            container
                .querySelectorAll(
                    '.herd-delete-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => this.deleteGroup(
                            button.dataset.groupId
                        )
                    );
                });
        },

        async render() {
            const container =
                document.getElementById('main-content');

            if (!container) return;

            try {
                await this.loadData();

                const groups =
                    this.filterFarm(this.groups);

                container.innerHTML =
                    this.pageMarkup(groups);

                await this.bindEvents();
            } catch (error) {
                console.error(
                    'Herd render error:',
                    error
                );

                showAppError(
                    'Не удалось загрузить раздел поголовья.',
                    error
                );
            }
        },

        async editCategories(groupId) {
            const group =
                this.groups.find(item => {
                    return String(item.id) ===
                        String(groupId);
                });

            if (!group) return;

            try {
                const distribution =
                    await CategoriesModule
                        .openDistributionModal({
                            group,
                            headCount: this.number(
                                group.head_count
                            ),
                            title:
                                'Назначение категорий группе'
                        });

                if (!distribution) return;

                const response =
                    await db.rpc(
                        'replace_group_category_heads',
                        {
                            p_group_id: group.id,
                            p_distribution: distribution
                        }
                    );

                if (response.error) {
                    throw response.error;
                }

                await this.render();
            } catch (error) {
                console.error(
                    'Edit categories error:',
                    error
                );

                alert(
                    error.message ||
                    'Не удалось сохранить категории.'
                );
            }
        },

        async changeCount(group, rawValue) {
            const oldCount =
                this.number(group.head_count);

            const newCount = Math.max(
                0,
                parseInt(rawValue, 10) || 0
            );

            if (newCount === oldCount) {
                return;
            }

            if (newCount > oldCount) {
                await this.increaseCount(
                    group,
                    newCount
                );
            } else {
                await this.decreaseCount(
                    group,
                    newCount
                );
            }
        },

        async increaseCount(group, newCount) {
            try {
                const distribution =
                    await CategoriesModule
                        .openDistributionModal({
                            group,
                            headCount: newCount,
                            title:
                                'Распределение поголовья'
                        });

                if (!distribution) {
                    await this.render();
                    return;
                }

                const response =
                    await db.rpc(
                        'set_group_heads',
                        {
                            p_group_id: group.id,
                            p_new_count: newCount,
                            p_distribution:
                                distribution
                        }
                    );

                if (response.error) {
                    throw response.error;
                }

                await this.render();
            } catch (error) {
                console.error(
                    'Increase count error:',
                    error
                );

                alert(
                    error.message ||
                    'Не удалось сохранить поголовье.'
                );

                await this.render();
            }
        },

        async decreaseCount(group, newCount) {
            const quantity =
                this.number(group.head_count) -
                newCount;

            try {
                if (
                    !window.MovementsModule ||
                    typeof MovementsModule.open !==
                        'function'
                ) {
                    throw new Error(
                        'Модуль операций не подключён.'
                    );
                }

                const operation =
                    await MovementsModule.open({
                        group,
                        quantity
                    });

                if (!operation) {
                    await this.render();
                    return;
                }

                const distribution =
                    await CategoriesModule
                        .openDistributionModal({
                            group,
                            headCount: newCount,
                            title:
                                'Распределение остатка'
                        });

                if (!distribution) {
                    await this.render();
                    return;
                }

                const response =
                    await db.rpc(
                        'register_herd_movement',
                        {
                            p_movement_type:
                                operation.type,

                            p_source_group_id:
                                group.id,

                            p_quantity:
                                operation.quantity,

                            p_source_distribution:
                                distribution,

                            p_destination_group_id:
                                operation.destinationGroupId ||
                                null,

                            p_destination_category_id:
                                operation.destinationCategoryId ||
                                null,

                            p_reason:
                                operation.reason ||
                                null,

                            p_comment:
                                operation.comment ||
                                null
                        }
                    );

                if (response.error) {
                    throw response.error;
                }

                await this.render();
            } catch (error) {
                console.error(
                    'Decrease count error:',
                    error
                );

                alert(
                    error.message ||
                    'Не удалось записать операцию.'
                );

                await this.render();
            }
        },

        async addGroup() {
            try {
                const response =
                    await db
                        .from('farms_and_groups')
                        .select('farm_name');

                if (response.error) {
                    throw response.error;
                }

                const farms = Array.from(
                    new Set(
                        (response.data || [])
                            .map(item => item.farm_name)
                            .filter(Boolean)
                            .map(item =>
                                this.farmName(item)
                            )
                    )
                );

                const fields = [];

                if (farms.length) {
                    fields.push({
                        name: 'farm_name',
                        label: 'Объект',
                        type: 'select',
                        value:
                            state.currentFarm !== 'Все'
                                ? state.currentFarm
                                : farms[0],
                        options: farms.map(farm => ({
                            value: farm,
                            label: farm
                        }))
                    });
                } else {
                    fields.push({
                        name: 'farm_name',
                        label: 'Новый объект',
                        type: 'text',
                        value: '',
                        placeholder:
                            'Например: МТФ Дубники'
                    });
                }

                fields.push(
                    {
                        name: 'group_name',
                        label: 'Название группы',
                        type: 'text',
                        value: '',
                        placeholder:
                            'Например: Дойное стадо'
                    },
                    {
                        name: 'head_count',
                        label: 'Начальное поголовье',
                        type: 'number',
                        value: 0,
                        min: 0,
                        step: 1
                    }
                );

                const form =
                    await this.openForm({
                        title: 'Добавить группу',
                        submitText: 'Создать',
                        fields
                    });

                if (!form) return;

                const farmName =
                    String(form.farm_name || '')
                        .trim();

                const groupName =
                    String(form.group_name || '')
                        .trim();

                const headCount = Math.max(
                    0,
                    parseInt(form.head_count, 10) || 0
                );

                if (!farmName || !groupName) {
                    alert(
                        'Заполните объект и группу.'
                    );
                    return;
                }

                const insertResponse =
                    await db
                        .from('farms_and_groups')
                        .insert({
                            farm_name: farmName,
                            group_name: groupName,
                            age_range: null,
                            head_count: headCount,
                            prev_head_count: headCount,
                            last_change_reason: null,
                            last_change_amount: 0,
                            last_change_at: null
                        })
                        .select()
                        .single();

                if (insertResponse.error) {
                    throw insertResponse.error;
                }

                const newGroup =
                    insertResponse.data;

                const distribution =
                    await CategoriesModule
                        .openDistributionModal({
                            group: newGroup,
                            headCount,
                            title:
                                'Категории новой группы'
                        });

                if (!distribution) {
                    await db
                        .from('farms_and_groups')
                        .delete()
                        .eq('id', newGroup.id);

                    return;
                }

                const distributionResponse =
                    await db.rpc(
                        'replace_group_category_heads',
                        {
                            p_group_id: newGroup.id,
                            p_distribution:
                                distribution
                        }
                    );

                if (distributionResponse.error) {
                    await db
                        .from('farms_and_groups')
                        .delete()
                        .eq('id', newGroup.id);

                    throw distributionResponse.error;
                }

                state.currentFarm = farmName;

                await this.render();
            } catch (error) {
                console.error(
                    'Add group error:',
                    error
                );

                alert(
                    error.message ||
                    'Не удалось добавить группу.'
                );
            }
        },

        async addObject() {
            try {
                const form =
                    await this.openForm({
                        title: 'Добавить новый объект',
                        submitText: 'Создать объект',
                        fields: [
                            {
                                name: 'farm_name',
                                label: 'Название объекта',
                                type: 'text',
                                value: '',
                                placeholder:
                                    'Например: МТФ Дубники'
                            },
                            {
                                name: 'group_name',
                                label: 'Первая группа',
                                type: 'text',
                                value: '',
                                placeholder:
                                    'Например: Дойное стадо'
                            },
                            {
                                name: 'head_count',
                                label: 'Начальное поголовье',
                                type: 'number',
                                value: 0,
                                min: 0,
                                step: 1
                            }
                        ]
                    });

                if (!form) return;

                const farmName =
                    String(form.farm_name || '')
                        .trim();

                const groupName =
                    String(form.group_name || '')
                        .trim();

                const headCount = Math.max(
                    0,
                    parseInt(form.head_count, 10) || 0
                );

                if (!farmName) {
                    alert(
                        'Введите название объекта.'
                    );
                    return;
                }

                if (!groupName) {
                    alert(
                        'Введите название первой группы.'
                    );
                    return;
                }

                const duplicate =
                    this.groups.some(group => {
                        return this.farmName(
                            group.farm_name
                        ).toLowerCase() ===
                        this.farmName(
                            farmName
                        ).toLowerCase();
                    });

                if (duplicate) {
                    alert(
                        'Объект с таким названием уже существует.'
                    );
                    return;
                }

                const insertResponse =
                    await db
                        .from('farms_and_groups')
                        .insert({
                            farm_name: farmName,
                            group_name: groupName,
                            age_range: null,
                            head_count: headCount,
                            prev_head_count: headCount,
                            last_change_reason: null,
                            last_change_amount: 0,
                            last_change_at: null
                        })
                        .select()
                        .single();

                if (insertResponse.error) {
                    throw insertResponse.error;
                }

                const newGroup =
                    insertResponse.data;

                const distribution =
                    await CategoriesModule
                        .openDistributionModal({
                            group: newGroup,
                            headCount,
                            title:
                                'Категории первой группы'
                        });

                if (!distribution) {
                    await db
                        .from('farms_and_groups')
                        .delete()
                        .eq('id', newGroup.id);

                    return;
                }

                const distributionResponse =
                    await db.rpc(
                        'replace_group_category_heads',
                        {
                            p_group_id: newGroup.id,
                            p_distribution:
                                distribution
                        }
                    );

                if (distributionResponse.error) {
                    await db
                        .from('farms_and_groups')
                        .delete()
                        .eq('id', newGroup.id);

                    throw distributionResponse.error;
                }

                state.currentFarm = farmName;

                await this.render();
            } catch (error) {
                console.error(
                    'Add object error:',
                    error
                );

                alert(
                    error.message ||
                    'Не удалось добавить объект.'
                );
            }
        },

        async editGroup(groupId) {
            const group =
                this.groups.find(item => {
                    return String(item.id) ===
                        String(groupId);
                });

            if (!group) return;

            const form =
                await this.openForm({
                    title: 'Изменить группу',
                    submitText: 'Сохранить',
                    fields: [
                        {
                            name: 'group_name',
                            label: 'Название группы',
                            type: 'text',
                            value: group.group_name
                        }
                    ]
                });

            if (!form) return;

            const name =
                String(form.group_name || '')
                    .trim();

            if (!name) {
                alert(
                    'Введите название группы.'
                );
                return;
            }

            try {
                const response =
                    await db
                        .from('farms_and_groups')
                        .update({
                            group_name: name,
                            updated_at:
                                new Date().toISOString()
                        })
                        .eq('id', group.id);

                if (response.error) {
                    throw response.error;
                }

                await this.render();
            } catch (error) {
                alert(
                    error.message ||
                    'Не удалось изменить группу.'
                );
            }
        },

        async deleteGroup(groupId) {
            const group =
                this.groups.find(item => {
                    return String(item.id) ===
                        String(groupId);
                });

            if (!group) return;

            const confirmed =
                await this.confirmModal(
                    'Удалить группу?',
                    `Группа "${group.group_name}" будет удалена.`
                );

            if (!confirmed) return;

            try {
                const dietsResponse =
                    await db
                        .from('diets')
                        .delete()
                        .eq('group_id', group.id);

                if (dietsResponse.error) {
                    throw dietsResponse.error;
                }

                const response =
                    await db
                        .from('farms_and_groups')
                        .delete()
                        .eq('id', group.id);

                if (response.error) {
                    throw response.error;
                }

                await this.render();
            } catch (error) {
                alert(
                    error.message ||
                    'Не удалось удалить группу.'
                );
            }
        }
    };
})();