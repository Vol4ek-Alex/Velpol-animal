(function () {
    'use strict';

    window.DashboardModule = {
        groups: [],
        diets: [],
        movements: [],
        categories: [],
        distributions: [],

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

        canView() {
            return Boolean(
                window.AuthModule &&
                (
                    window.AuthModule.isAdmin() ||
                    window.AuthModule.hasPermission(
                        'can_view_dashboard'
                    )
                )
            );
        },

        async loadData() {
            const responses = await Promise.all([
                db
                    .from('farms_and_groups')
                    .select('*'),

                db
                    .from('diets')
                    .select('*'),

                db
                    .from('herd_movements')
                    .select('*')
                    .order('event_date', {
                        ascending: false
                    }),

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

            const [
                groupsResponse,
                dietsResponse,
                movementsResponse,
                categoriesResponse,
                distributionsResponse
            ] = responses;

            if (groupsResponse.error) {
                throw groupsResponse.error;
            }

            if (dietsResponse.error) {
                throw dietsResponse.error;
            }

            if (movementsResponse.error) {
                throw movementsResponse.error;
            }

            if (categoriesResponse.error) {
                throw categoriesResponse.error;
            }

            if (distributionsResponse.error) {
                throw distributionsResponse.error;
            }

            this.groups =
                groupsResponse.data || [];

            this.diets =
                dietsResponse.data || [];

            this.movements =
                movementsResponse.data || [];

            this.categories =
                categoriesResponse.data || [];

            this.distributions =
                distributionsResponse.data || [];
        },

        filterGroups() {
            const farm =
                window.state.currentFarm;

            if (!farm || farm === 'Все') {
                return this.groups;
            }

            return this.groups.filter(group => {
                return (
                    group.farm_name === farm ||
                    this.farmName(group.farm_name) ===
                    this.farmName(farm)
                );
            });
        },

        getDistribution(groupId) {
            return this.distributions.filter(item => {
                return String(item.group_id) ===
                    String(groupId);
            });
        },

        getCategoryName(categoryId) {
            const category =
                this.categories.find(item => {
                    return String(item.id) ===
                        String(categoryId);
                });

            return category?.name || 'Без категории';
        },

        getCategoryText(groupId) {
            const rows =
                this.getDistribution(groupId)
                    .filter(item => {
                        return this.number(item.heads) > 0;
                    });

            if (!rows.length) {
                return 'Не распределено';
            }

            return rows.map(row => {
                return `${
                    row.herd_categories?.name ||
                    this.getCategoryName(
                        row.category_id
                    )
                }: ${this.number(row.heads)}`;
            }).join(', ');
        },

        getFeedTotal(groups) {
            return groups.reduce((total, group) => {
                const groupTotal =
                    this.diets
                        .filter(diet => {
                            return String(
                                diet.group_id
                            ) === String(group.id);
                        })
                        .reduce((sum, diet) => {
                            return sum +
                                this.number(
                                    diet.norm_per_head
                                ) *
                                this.number(
                                    group.head_count
                                );
                        }, 0);

                return total + groupTotal;
            }, 0);
        },

        getMonthStart() {
            const date = new Date();

            date.setDate(1);
            date.setHours(0, 0, 0, 0);

            return date;
        },

        getMovementTotals() {
            const start =
                this.getMonthStart();

            const farm =
                window.state.currentFarm;

            const movements =
                this.movements.filter(item => {
                    const date =
                        new Date(item.event_date);

                    const farmMatches =
                        !farm ||
                        farm === 'Все' ||
                        this.farmName(
                            item.source_farm_name
                        ) === this.farmName(farm) ||
                        this.farmName(
                            item.destination_farm_name
                        ) === this.farmName(farm);

                    return date >= start && farmMatches;
                });

            return {
                realization: movements
                    .filter(item => {
                        return item.movement_type ===
                            'realization';
                    })
                    .reduce((sum, item) => {
                        return sum + this.number(
                            item.quantity
                        );
                    }, 0),

                mortality: movements
                    .filter(item => {
                        return item.movement_type ===
                            'mortality';
                    })
                    .reduce((sum, item) => {
                        return sum + this.number(
                            item.quantity
                        );
                    }, 0)
            };
        },

        getCategoryStats(groups) {
            const result = {};

            this.categories.forEach(category => {
                result[category.id] = {
                    name: category.name,
                    heads: 0,
                    groups: 0
                };
            });

            groups.forEach(group => {
                this.getDistribution(group.id)
                    .forEach(row => {
                        if (!result[row.category_id]) {
                            result[row.category_id] = {
                                name:
                                    row.herd_categories?.name ||
                                    'Без категории',
                                heads: 0,
                                groups: 0
                            };
                        }

                        const heads =
                            this.number(row.heads);

                        result[row.category_id].heads +=
                            heads;

                        if (heads > 0) {
                            result[row.category_id].groups +=
                                1;
                        }
                    });
            });

            return Object.values(result);
        },

        renderCategoryCards(stats) {
            if (!stats.length) {
                return `
                    <div class="dashboard-empty">
                        Категории не созданы
                    </div>
                `;
            }

            return stats.map((item, index) => `
                <div
                    class="
                        dashboard-category-card
                        category-color-${index % 6}
                    "
                >
                    <div
                        class="
                            dashboard-category-top
                        "
                    >
                        <span>
                            🐄
                        </span>

                        <small>
                            ${item.groups} групп
                        </small>
                    </div>

                    <div
                        class="
                            dashboard-category-name
                        "
                    >
                        ${this.escape(item.name)}
                    </div>

                    <strong
                        class="
                            dashboard-category-value
                        "
                    >
                        ${item.heads.toLocaleString(
                            'ru-RU'
                        )}
                        <span>гол.</span>
                    </strong>
                </div>
            `).join('');
        },

        renderRows(groups) {
            if (!groups.length) {
                return `
                    <tr>
                        <td
                            colspan="5"
                            style="
                                padding:25px;
                                color:var(--muted);
                                text-align:center;
                            "
                        >
                            Нет данных
                        </td>
                    </tr>
                `;
            }

            return groups.map(group => {
                const current =
                    this.number(group.head_count);

                const previous =
                    this.number(
                        group.prev_head_count
                    );

                const difference =
                    current - previous;

                return `
                    <tr>
                        <td>
                            <span
                                class="
                                    dashboard-farm-name
                                "
                            >
                                ${this.escape(
                                    this.farmName(
                                        group.farm_name
                                    )
                                )}
                            </span>
                        </td>

                        <td>
                            <strong>
                                ${this.escape(
                                    group.group_name
                                )}
                            </strong>
                        </td>

                        <td>
                            <span
                                class="
                                    dashboard-category-label
                                "
                                title="${this.escape(
                                    this.getCategoryText(
                                        group.id
                                    )
                                )}"
                            >
                                ${this.escape(
                                    this.getCategoryText(
                                        group.id
                                    )
                                )}
                            </span>
                        </td>

                        <td>
                            <strong
                                class="
                                    dashboard-head-value
                                "
                            >
                                ${current.toLocaleString(
                                    'ru-RU'
                                )}
                                <span>гол.</span>
                            </strong>
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
                        </td>
                    </tr>
                `;
            }).join('');
        },

        renderPage(groups) {
            let totalHead = 0;
            let previousHead = 0;

            groups.forEach(group => {
                totalHead += this.number(
                    group.head_count
                );

                previousHead += this.number(
                    group.prev_head_count
                );
            });

            const difference =
                totalHead - previousHead;

            const feedKg =
                this.getFeedTotal(groups);

            const movementTotals =
                this.getMovementTotals();

            const categoryStats =
                this.getCategoryStats(groups);

            return `
                <style>
                    .dashboard-page {
                        width:100%;
                        min-width:0;
                    }

                    .dashboard-header {
                        display:flex;
                        align-items:flex-start;
                        justify-content:space-between;
                        gap:18px;
                        margin-bottom:18px;
                    }

                    .dashboard-title {
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

                    .dashboard-description {
                        margin:5px 0 0;
                        color:var(--muted);
                        font-size:.86rem;
                    }

                    .dashboard-selector {
                        flex:0 0 auto;
                        max-width:100%;
                    }

                    .dashboard-stats {
                        display:grid;
                        grid-template-columns:
                            repeat(5, minmax(0, 1fr));
                        gap:12px;
                        margin-bottom:14px;
                    }

                    .dashboard-stat {
                        display:flex;
                        flex-direction:column;
                        justify-content:space-between;
                        min-width:0;
                        height:138px;
                        padding:17px;
                        overflow:hidden;
                    }

                    .dashboard-stat-label {
                        color:var(--muted);
                        font-size:.77rem;
                        font-weight:600;
                    }

                    .dashboard-stat-value {
                        color:#fff;
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size:1.7rem;
                        font-weight:700;
                        white-space:nowrap;
                    }

                    .dashboard-stat-value span {
                        color:var(--muted);
                        font-family:"Exo 2",sans-serif;
                        font-size:.76rem;
                    }

                    .dashboard-stat-note {
                        color:var(--subtle);
                        font-size:.7rem;
                    }

                    .dashboard-section {
                        margin-bottom:14px;
                        padding:18px;
                    }

                    .dashboard-section-heading {
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:12px;
                        margin-bottom:14px;
                    }

                    .dashboard-section-title {
                        margin:0;
                        color:#fff;
                        font-size:1rem;
                        font-weight:800;
                    }

                    .dashboard-section-caption {
                        color:var(--subtle);
                        font-size:.74rem;
                    }

                    .dashboard-category-grid {
                        display:grid;
                        grid-template-columns:
                            repeat(5, minmax(0, 1fr));
                        gap:10px;
                    }

                    .dashboard-category-card {
                        min-width:0;
                        height:140px;
                        padding:14px;
                        overflow:hidden;
                        border-left:3px solid var(--green);
                        border-radius:14px;
                        background:rgba(5,16,30,.42);
                    }

                    .dashboard-category-top {
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        color:var(--muted);
                        font-size:1.1rem;
                    }

                    .dashboard-category-top small {
                        font-size:.68rem;
                    }

                    .dashboard-category-name {
                        min-height:35px;
                        margin-top:13px;
                        overflow:hidden;
                        color:var(--muted);
                        font-size:.78rem;
                        font-weight:700;
                        text-overflow:ellipsis;
                    }

                    .dashboard-category-value {
                        display:block;
                        margin-top:7px;
                        color:#fff;
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size:1.25rem;
                    }

                    .dashboard-category-value span {
                        color:var(--muted);
                        font-family:"Exo 2",sans-serif;
                        font-size:.7rem;
                    }

                    .category-color-1 {
                        border-left-color:var(--blue);
                    }

                    .category-color-2 {
                        border-left-color:var(--amber);
                    }

                    .category-color-3 {
                        border-left-color:#c4b5fd;
                    }

                    .category-color-4 {
                        border-left-color:#fb923c;
                    }

                    .category-color-5 {
                        border-left-color:var(--red);
                    }

                    .dashboard-category-label {
                        display:block;
                        max-width:260px;
                        overflow:hidden;
                        color:var(--blue);
                        font-size:.72rem;
                        text-overflow:ellipsis;
                        white-space:nowrap;
                    }

                    .dashboard-farm-name {
                        color:var(--muted);
                    }

                    .dashboard-head-value {
                        color:var(--blue);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                    }

                    .dashboard-head-value span {
                        color:var(--muted);
                        font-family:"Exo 2",sans-serif;
                        font-size:.7rem;
                    }

                    .dashboard-empty {
                        padding:25px;
                        color:var(--muted);
                        text-align:center;
                    }

                    @media(max-width:1250px) {
                        .dashboard-stats {
                            grid-template-columns:
                                repeat(3, minmax(0, 1fr));
                        }
                    }

                    @media(max-width:1100px) {
                        .dashboard-category-grid {
                            grid-template-columns:
                                repeat(3, minmax(0, 1fr));
                        }
                    }

                    @media(max-width:700px) {
                        .dashboard-header {
                            flex-direction:column;
                            gap:12px;
                        }

                        .dashboard-selector {
                            width:100%;
                        }

                        .dashboard-stats {
                            grid-template-columns:1fr;
                            grid-auto-rows:116px;
                        }

                        .dashboard-stat {
                            height:116px;
                        }

                        .dashboard-section {
                            padding:14px;
                        }

                        .dashboard-section-heading {
                            align-items:flex-start;
                            flex-direction:column;
                            gap:4px;
                        }

                        .dashboard-category-grid {
                            grid-template-columns:
                                repeat(2, minmax(0, 1fr));
                        }

                        .dashboard-category-card {
                            height:130px;
                        }
                    }

                    @media(max-width:380px) {
                        .dashboard-category-grid {
                            grid-template-columns:1fr;
                        }
                    }
                </style>

                <div class="dashboard-page">
                    <header class="dashboard-header">
                        <div>
                            <h1 class="dashboard-title">
                                Статистика
                            </h1>

                            <p
                                class="
                                    dashboard-description
                                "
                            >
                                Сводная структура поголовья
                                и кормления
                            </p>
                        </div>

                        <div
                            id="dashboard-farm-selector"
                            class="dashboard-selector"
                        ></div>
                    </header>

                    <div class="dashboard-stats">
                        <div
                            class="
                                glass-panel
                                dashboard-stat
                            "
                        >
                            <span
                                class="
                                    dashboard-stat-label
                                "
                            >
                                Общее поголовье
                            </span>

                            <strong
                                class="
                                    dashboard-stat-value
                                "
                            >
                                ${totalHead.toLocaleString(
                                    'ru-RU'
                                )}
                                <span>гол.</span>
                            </strong>

                            <span
                                class="
                                    dashboard-stat-note
                                    ${
                                        difference >= 0
                                            ? 'badge-green'
                                            : 'badge-red'
                                    }
                                "
                            >
                                ${
                                    difference >= 0
                                        ? '+'
                                        : ''
                                }${difference}
                                гол. за месяц
                            </span>
                        </div>

                        <div
                            class="
                                glass-panel
                                dashboard-stat
                            "
                        >
                            <span
                                class="
                                    dashboard-stat-label
                                "
                            >
                                Суточный расход
                            </span>

                            <strong
                                class="
                                    dashboard-stat-value
                                "
                            >
                                ${(feedKg / 1000).toFixed(1)}
                                <span>т/день</span>
                            </strong>

                            <span
                                class="
                                    dashboard-stat-note
                                "
                            >
                                ${Math.round(
                                    feedKg
                                ).toLocaleString(
                                    'ru-RU'
                                )}
                                кг за сутки
                            </span>
                        </div>

                        <div
                            class="
                                glass-panel
                                dashboard-stat
                            "
                        >
                            <span
                                class="
                                    dashboard-stat-label
                                "
                            >
                                Активных групп
                            </span>

                            <strong
                                class="
                                    dashboard-stat-value
                                "
                            >
                                ${groups.length}
                                <span>групп</span>
                            </strong>

                            <span
                                class="
                                    dashboard-stat-note
                                "
                            >
                                По выбранному объекту
                            </span>
                        </div>

                        <div
                            class="
                                glass-panel
                                dashboard-stat
                            "
                        >
                            <span
                                class="
                                    dashboard-stat-label
                                "
                            >
                                Реализовано
                            </span>

                            <strong
                                class="
                                    dashboard-stat-value
                                "
                            >
                                ${movementTotals.realization}
                                <span>гол.</span>
                            </strong>

                            <span
                                class="
                                    dashboard-stat-note
                                "
                            >
                                С начала месяца
                            </span>
                        </div>

                        <div
                            class="
                                glass-panel
                                dashboard-stat
                            "
                        >
                            <span
                                class="
                                    dashboard-stat-label
                                "
                            >
                                Падёж
                            </span>

                            <strong
                                class="
                                    dashboard-stat-value
                                "
                            >
                                ${movementTotals.mortality}
                                <span>гол.</span>
                            </strong>

                            <span
                                class="
                                    dashboard-stat-note
                                "
                            >
                                С начала месяца
                            </span>
                        </div>
                    </div>

                    <section
                        class="
                            glass-panel
                            dashboard-section
                        "
                    >
                        <div
                            class="
                                dashboard-section-heading
                            "
                        >
                            <h2
                                class="
                                    dashboard-section-title
                                "
                            >
                                Поголовье по категориям
                            </h2>

                            <span
                                class="
                                    dashboard-section-caption
                                "
                            >
                                Текущее распределение
                            </span>
                        </div>

                        <div
                            class="
                                dashboard-category-grid
                            "
                        >
                            ${this.renderCategoryCards(
                                categoryStats
                            )}
                        </div>
                    </section>

                    <section
                        class="
                            glass-panel
                            dashboard-section
                        "
                    >
                        <div
                            class="
                                dashboard-section-heading
                            "
                        >
                            <h2
                                class="
                                    dashboard-section-title
                                "
                            >
                                Структура стада
                            </h2>

                            <span
                                class="
                                    dashboard-section-caption
                                "
                            >
                                ${groups.length} групп
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
                                        <th>Динамика</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${this.renderRows(groups)}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            `;
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
                    'У вас нет разрешения на просмотр дашборда.'
                );

                return;
            }

            try {
                await this.loadData();

                const groups =
                    this.filterGroups();

                container.innerHTML =
                    this.renderPage(groups);

                renderFarmSelector(
                    this.groups,
                    'dashboard-farm-selector'
                );
            } catch (error) {
                console.error(
                    'Dashboard render error:',
                    error
                );

                showAppError(
                    'Не удалось загрузить дашборд.',
                    error
                );
            }
        }
    };
})();