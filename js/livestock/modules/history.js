(function () {
    'use strict';

    window.HistoryModule = {
        movements: [],
        groups: [],
        feeds: [],
        diets: [],
        selectedType: 'all',
        selectedFarm: 'Все',
        selectedMonth: '',
        editMode: false,
        reportMonth: '',

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

        number(value) {
            const result = Number(value);
            return Number.isFinite(result) ? result : 0;
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
                arrival: 'Приход',
                departure: 'Выбытие',
                realization: 'Реализация',
                mortality: 'Падёж',
                death: 'Падёж',
                slaughter: 'Забой',
                transfer: 'Перевод'
            };

            return labels[type] || 'Операция';
        },

        getTypeIcon(type) {
            const icons = {
                arrival: '➕',
                departure: '➖',
                realization: '💰',
                mortality: '⚠️',
                death: '⚠️',
                slaughter: '🔪',
                transfer: '↔️'
            };

            return icons[type] || '📋';
        },

        getReportDays(monthValue) {
            const value =
                monthValue || this.selectedMonth;

            const bounds =
                this.getMonthBounds(value);

            if (value === this.currentMonthValue()) {
                return Math.max(
                    1,
                    new Date().getDate()
                );
            }

            return bounds.days;
        },

        currentMonthValue() {
            const now = new Date();

            return [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0')
            ].join('-');
        },

        getMonthBounds(monthValue) {
            const [year, month] = String(
                monthValue || this.currentMonthValue()
            ).split('-').map(Number);

            const start = new Date(year, month - 1, 1);

            const end = new Date(year, month, 1);

            const days = new Date(year, month, 0).getDate();

            const labels = [
                'Январь', 'Февраль', 'Март', 'Апрель',
                'Май', 'Июнь', 'Июль', 'Август',
                'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
            ];

            return {
                start,
                end,
                days,
                label: `${labels[month - 1]} ${year}`
            };
        },

        formatMonthLabel(monthValue) {
            return this.getMonthBounds(monthValue).label;
        },

        formatDate(value) {
            if (!value) {
                return 'Дата не указана';
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return 'Дата не указана';
            }

            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        },

        async loadData() {
            const [
                movementsResponse,
                groupsResponse,
                feedsResponse,
                dietsResponse
            ] = await Promise.all([
                db
                    .from('herd_movements')
                    .select('*')
                    .order('event_date', { ascending: false })
                    .order('created_at', { ascending: false }),

                db
                    .from('farms_and_groups')
                    .select('*')
                    .order('farm_name')
                    .order('group_name'),

                db
                    .from('feeds')
                    .select('*')
                    .order('name'),

                db
                    .from('diets')
                    .select('*')
            ]);

            if (movementsResponse.error) {
                throw movementsResponse.error;
            }

            if (groupsResponse.error) {
                throw groupsResponse.error;
            }

            if (feedsResponse.error) {
                throw feedsResponse.error;
            }

            if (dietsResponse.error) {
                throw dietsResponse.error;
            }

            this.movements = movementsResponse.data || [];
            this.groups = groupsResponse.data || [];
            this.feeds = feedsResponse.data || [];
            this.diets = dietsResponse.data || [];
        },

        getMonthMovements(monthValue) {
            const { start, end } = this.getMonthBounds(
                monthValue || this.selectedMonth
            );

            return this.movements.filter(item => {
                const date = new Date(item.event_date);

                if (Number.isNaN(date.getTime())) {
                    return false;
                }

                return date >= start && date < end;
            });
        },

        calculateFeedUsage(monthValue) {
            /*
             * Для текущего месяца getReportDays
             * возвращает количество дней по
             * сегодняшний — сумма за все
             * прошедшие дни, а не за полный месяц.
             */
            const days = this.getReportDays(
                monthValue ||
                this.reportMonth ||
                this.selectedMonth
            );

            const usage = {};

            let totalKg = 0;
            let totalCost = 0;

            this.diets.forEach(diet => {
                const group =
                    this.groups.find(item => {
                        return String(item.id) ===
                            String(diet.group_id);
                    });

                if (!group) {
                    return;
                }

                const feed =
                    this.feeds.find(item => {
                        return String(item.id) ===
                            String(diet.feed_id);
                    });

                if (!feed) {
                    return;
                }

                const dailyGroupKg =
                    this.number(diet.norm_per_head) *
                    this.number(group.head_count);

                const monthKg =
                    dailyGroupKg * days;

                const price =
                    this.number(feed.price_per_unit);

                const key = String(feed.id);

                if (!usage[key]) {
                    usage[key] = {
                        name: feed.name,
                        unit: feed.unit || 'кг',
                        kg: 0,
                        cost: 0
                    };
                }

                usage[key].kg += monthKg;
                usage[key].cost += monthKg * price;

                totalKg += monthKg;
                totalCost += monthKg * price;
            });

            return {
                list: Object.values(usage),
                totalKg,
                totalCost
            };
        },

        calculateHeadStats(monthValue) {
            const movements =
                this.getMonthMovements(monthValue);

            const stats = {
                arrival: 0,
                mortality: 0,
                slaughter: 0,
                realization: 0,
                transfer: 0
            };

            movements.forEach(item => {
                const heads = this.number(
                    item.quantity ?? item.heads
                );

                if (item.movement_type === 'arrival') {
                    stats.arrival += heads;
                } else if (
                    item.movement_type === 'mortality' ||
                    item.movement_type === 'death'
                ) {
                    stats.mortality += heads;
                } else if (
                    item.movement_type === 'slaughter'
                ) {
                    stats.slaughter += heads;
                } else if (
                    item.movement_type === 'realization'
                ) {
                    stats.realization += heads;
                } else if (
                    item.movement_type === 'transfer'
                ) {
                    stats.transfer += heads;
                }
            });

            return stats;
        },

        getFarms() {
            const seen = {};
            const farms = [];

            this.groups.forEach(group => {
                const name =
                    this.cleanFarmName(
                        group.farm_name
                    );

                if (!name || seen[name]) {
                    return;
                }

                seen[name] = true;
                farms.push(name);
            });

            return farms.sort((a, b) => {
                return a.localeCompare(b, 'ru');
            });
        },

        minMonthValue() {
            let min = null;

            this.movements.forEach(item => {
                const date = new Date(
                    item.event_date
                );

                if (
                    Number.isNaN(date.getTime())
                ) {
                    return;
                }

                const value = [
                    date.getFullYear(),
                    String(
                        date.getMonth() + 1
                    ).padStart(2, '0')
                ].join('-');

                if (!min || value < min) {
                    min = value;
                }
            });

            return min || this.currentMonthValue();
        },

        formatMonthOrDefault(monthValue) {
            const value =
                monthValue ||
                this.selectedMonth ||
                this.currentMonthValue();

            return this.getMonthBounds(value);
        },

        getFilteredMovements() {
            const monthMovements =
                this.getMonthMovements();

            return monthMovements.filter(item => {
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

        renderSummaryTiles() {
            const usage =
                this.calculateFeedUsage();

            const stats =
                this.calculateHeadStats();

            const heads = value => {
                return value > 0
                    ? `${value} гол.`
                    : 'Н/Д';
            };

            const tiles = [
                {
                    icon: '💸',
                    label: 'Траты на корма',
                    value: usage.totalCost > 0
                        ? `${usage.totalCost.toLocaleString(
                            'ru-RU',
                            { maximumFractionDigits: 2 }
                        )} BYN`
                        : 'Н/Д',
                    sub: usage.totalKg > 0
                        ? `${Math.round(
                            usage.totalKg
                        ).toLocaleString('ru-RU')} кг кормов`
                        : 'нет данных',
                    accent: 'amber'
                },
                {
                    icon: '🐄',
                    label: 'Поголовье',
                    value: heads(
                        stats.mortality +
                        stats.realization +
                        stats.slaughter
                    ) === 'Н/Д'
                        ? 'Н/Д'
                        : `−${stats.mortality +
                            stats.realization +
                            stats.slaughter} гол.`,
                    sub: [
                        stats.mortality
                            ? `падёж ${stats.mortality}`
                            : '',
                        stats.realization
                            ? `реализация ${stats.realization}`
                            : ''
                    ].filter(Boolean).join(' · ') ||
                        'движения за период',
                    accent: 'blue'
                }
            ];

            return tiles.map((tile, index) => `
                <div
                    class="
                        history-tile
                        history-tile-${tile.accent}
                    "
                    style="animation-delay:${index * 45}ms"
                >
                    <div class="history-tile-icon">
                        ${tile.icon}
                    </div>

                    <div class="history-tile-body">
                        <div class="history-tile-label">
                            ${tile.label}
                        </div>

                        <div class="history-tile-value">
                            ${tile.value}
                        </div>

                        <div class="history-tile-sub">
                            ${tile.sub}
                        </div>
                    </div>
                </div>
            `).join('');
        },

        renderFeedUsageRows() {
            const usage =
                this.calculateFeedUsage();

            if (!usage.list.length) {
                return `
                    <div class="history-usage-empty">
                        Рационы не заданы — расчёт невозможен
                    </div>
                `;
            }

            return `
                <table class="glass-table history-usage-table">
                    <thead>
                        <tr>
                            <th>Корм</th>
                            <th>Расход</th>
                            <th>Стоимость</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${usage.list.map(item => `
                            <tr>
                                <td>${this.escape(item.name)}</td>
                                <td>
                                    ${Math.round(
                                        item.kg
                                    ).toLocaleString('ru-RU')}
                                    ${this.escape(item.unit)}
                                </td>
                                <td class="history-usage-cost">
                                    ${
                                        item.cost > 0
                                            ? item.cost.toLocaleString(
                                                'ru-RU',
                                                {
                                                    maximumFractionDigits: 2
                                                }
                                            )
                                            : 'Н/Д'
                                    }
                                    BYN
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
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
                        item.destination_category_name
                            ? `
                                <span class="history-category">
                                    Куда: ${this.escape(
                                        item.destination_category_name
                                    )}
                                </span>
                            `
                            : ''
                    }
                `
                : `
                    ${
                        item.destination_category_name
                            ? `
                                <span class="history-category">
                                    Категория: ${this.escape(
                                        item.destination_category_name
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
                    ${
                        this.editMode && this.canUndo()
                            ? `
                                <button
                                    type="button"
                                    class="
                                        history-item-delete
                                    "
                                    data-movement-id="${item.id}"
                                    aria-label="Удалить операцию"
                                >
                                    ✕
                                </button>
                            `
                            : ''
                    }

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

            const monthValue =
                this.selectedMonth ||
                this.currentMonthValue();

            return `
                <style>
                    @keyframes tile-in {
                        from {
                            opacity: 0;
                            transform: translateY(12px) scale(.97);
                        }

                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

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
                        font-size: clamp(1.45rem, 2.5vw, 2rem);
                        font-weight: 800;
                        letter-spacing: -.04em;
                    }

                    .history-description {
                        margin: 5px 0 0;
                        color: var(--muted);
                        font-size: .86rem;
                    }

                    .history-month-row {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 14px;
                        flex-wrap: wrap;
                    }

                    .history-month-input {
                        min-height: 44px;
                        padding: 8px 12px;
                        border: 1px solid var(--line);
                        border-radius: 12px;
                        background: rgba(3,10,20,.75);
                        color: #fff;
                        color-scheme: dark;
                        font: inherit;
                    }

                    .history-month-label {
                        color: var(--muted);
                        font-size: .85rem;
                        font-weight: 700;
                    }

                    .history-tiles {
                        display: grid;
                        grid-template-columns: repeat(
                            auto-fit,
                            minmax(190px, 1fr)
                        );
                        gap: 10px;
                        margin-bottom: 14px;
                    }

                    .history-tile {
                        display: flex;
                        align-items: center;
                        gap: 11px;
                        min-width: 0;
                        padding: 13px 15px;
                        border: 1px solid var(--line);
                        border-radius: 15px;
                        background: rgba(0,0,0,.16);
                        animation: tile-in 340ms ease both;
                        transition: transform 180ms ease, border-color 180ms ease;
                    }

                    body.app-booted .history-tile,
                    body.app-booted .history-item {
                        animation: none;
                    }

                    .history-tile:hover {
                        transform: translateY(-2px);
                        border-color: var(--line-bright);
                    }

                    .history-tile-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex: 0 0 38px;
                        width: 38px;
                        height: 38px;
                        border: 1px solid var(--line);
                        border-radius: 11px;
                        background: rgba(255,255,255,.05);
                        font-size: 1.05rem;
                    }

                    .history-tile-body {
                        min-width: 0;
                    }

                    .history-tile-label {
                        overflow-wrap: anywhere;
                        color: var(--muted);
                        font-size: .72rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: .04em;
                    }

                    .history-tile-value {
                        margin-top: 3px;
                        overflow-wrap: anywhere;
                        color: #fff;
                        font-family: "JetBrains Mono", monospace;
                        font-size: 1.05rem;
                        font-weight: 800;
                    }

                    .history-tile-sub {
                        margin-top: 2px;
                        color: var(--subtle);
                        font-size: .7rem;
                    }

                    .history-tile-green .history-tile-value { color: var(--green); }
                    .history-tile-red .history-tile-value { color: var(--red); }
                    .history-tile-amber .history-tile-value { color: var(--amber); }
                    .history-tile-blue .history-tile-value { color: var(--blue); }
                    .history-tile-purple .history-tile-value { color: var(--purple); }

                    .history-usage-panel {
                        margin-bottom: 14px;
                    }

                    .history-usage-title {
                        margin: 0 0 10px;
                        color: #fff;
                        font-size: .95rem;
                        font-weight: 800;
                    }

                    .history-usage-table {
                        width: 100%;
                    }

                    .history-usage-table th,
                    .history-usage-table td {
                        padding: 8px 10px;
                        font-size: .78rem;
                    }

                    .history-usage-cost {
                        color: var(--amber);
                        font-family: "JetBrains Mono", monospace;
                        white-space: nowrap;
                    }

                    .history-usage-empty {
                        padding: 12px 0 2px;
                        color: var(--muted);
                        font-size: .8rem;
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
                        transition: color 150ms ease, background-color 150ms ease;
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
                        gap: 12px;
                        padding: 16px;
                    }

                    .history-item {
                        position: relative;
                        display: flex;
                        align-items: flex-start;
                        gap: 13px;
                        min-width: 0;
                        padding: 15px 16px;
                        border: 1px solid
                            rgba(255, 255, 255, .1);
                        border-top-color:
                            rgba(255, 255, 255, .22);
                        border-radius: 16px;
                        background:
                            linear-gradient(
                                150deg,
                                rgba(255, 255, 255, .06),
                                rgba(255, 255, 255, .01) 45%,
                                transparent
                            ),
                            rgba(9, 22, 39, .45);
                        box-shadow:
                            0 8px 22px rgba(0, 0, 0, .22),
                            inset 0 1px 0
                            rgba(255, 255, 255, .06);
                        animation: tile-in 320ms ease both;
                        transition:
                            border-color 180ms ease,
                            transform 180ms ease;
                    }

                    .history-item:hover {
                        border-color:
                            rgba(255, 255, 255, .2);
                        transform: translateY(-1px);
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
                        gap: 6px 10px;
                        flex-wrap: wrap;
                    }

                    .history-title {
                        overflow-wrap: anywhere;
                        color: #fff;
                        font-size: .88rem;
                    }

                    .history-date {
                        flex: 0 0 auto;
                        color: var(--subtle);
                        font-size: .71rem;
                        white-space: nowrap;
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
                        padding: 6px 11px;
                        border: 1px solid
                            rgba(52, 211, 153, .35);
                        border-radius: 10px;
                        background:
                            rgba(16, 185, 129, .12);
                        color: var(--green);
                        font-family: "JetBrains Mono", monospace;
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

                    .history-report-hint {
                        margin-bottom: 14px;
                        padding: 18px 20px;
                        color: var(--muted);
                        font-size: .82rem;
                        line-height: 1.55;
                        text-align: center;
                    }

                    .history-report-clear {
                        border-color:
                            rgba(251, 113, 133, .45);
                        color: var(--red);
                    }

                    .history-edit-button.active {
                        border-color: var(--amber);
                        background:
                            rgba(251, 191, 36, .18);
                        color: var(--amber);
                    }

                    .history-edit-hint {
                        margin: 10px 2px 0;
                        color: var(--amber);
                        font-size: .76rem;
                        text-align: center;
                    }

                    .history-item-delete {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex: 0 0 28px;
                        width: 28px;
                        height: 28px;
                        padding: 0;
                        border: 1px solid
                            rgba(251, 113, 133, .5);
                        border-radius: 9px;
                        background:
                            rgba(244, 63, 94, .14);
                        color: var(--red);
                        cursor: pointer;
                        font-size: .8rem;
                        line-height: 1;
                        transition:
                            background-color 150ms ease,
                            transform 150ms ease;
                    }

                    .history-item-delete:hover {
                        background:
                            rgba(244, 63, 94, .3);
                        transform: scale(1.08);
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

                        .history-month-row {
                            align-items: stretch;
                            flex-direction: column;
                        }

                        .history-month-input {
                            width: 100%;
                        }

                        .history-tiles {
                            grid-template-columns: 1fr 1fr;
                            gap: 8px;
                        }

                        .history-tile {
                            align-items: flex-start;
                            flex-direction: column;
                            gap: 8px;
                            padding: 11px 12px;
                        }

                        .history-filters {
                            grid-template-columns: 1fr;
                        }

                        .history-item {
                            flex-wrap: wrap;
                        }

                        .history-content {
                            flex-basis: calc(100% - 46px);
                        }

                        .history-quantity {
                            margin-left: 46px;
                            margin-top: 2px;
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
                                Итоги месяца: корма, падёж,
                                реализация, поголовье
                            </p>
                        </div>

                        ${
                            this.canUndo()
                                ? `
                                    <div class="history-header-actions">
                                        <button
                                            type="button"
                                            class="
                                                glass-btn
                                                history-edit-button
                                                ${
                                                    this.editMode
                                                        ? 'active'
                                                        : ''
                                                }
                                            "
                                        >
                                            ${
                                                this.editMode
                                                    ? '✏️ Редактирование ВКЛ'
                                                    : '✏️ Редактирование'
                                            }
                                        </button>
                                    </div>
                                `
                                : ''
                        }
                    </header>

                    <div class="history-month-row">
                        <input
                            type="month"
                            class="history-month-input"
                            value="${this.escape(monthValue)}"
                            min="${this.escape(this.minMonthValue())}"
                            max="${this.escape(this.currentMonthValue())}"
                            aria-label="Выбор месяца"
                        >

                        <span class="history-month-label">
                            ${this.escape(
                                this.formatMonthLabel(monthValue)
                            )}
                        </span>

                        <button
                            type="button"
                            class="
                                glass-btn
                                history-report-button
                            "
                        >
                            📊 Сформировать отчёт
                        </button>

                        ${
                            this.reportMonth
                                ? `
                                    <button
                                        type="button"
                                        class="
                                            glass-btn
                                            history-report-clear
                                        "
                                        aria-label="Очистить отчёт"
                                    >
                                        ✕ Сбросить
                                    </button>
                                `
                                : ''
                        }
                    </div>

                    ${
                        this.reportMonth === monthValue
                            ? `
                                <div class="history-tiles">
                                    ${this.renderSummaryTiles()}
                                </div>

                                <section
                                    class="
                                        glass-panel
                                        history-usage-panel
                                    "
                                >
                                    <h2
                                        class="
                                            history-usage-title
                                        "
                                    >
                                        🌾 Траты на корма —
                                        ${this.escape(
                                            this.formatMonthLabel(
                                                monthValue
                                            )
                                        )}
                                    </h2>

                                    ${this.renderFeedUsageRows()}
                                </section>
                            `
                            : `
                                <div
                                    class="
                                        glass-panel
                                        history-report-hint
                                    "
                                >
                                    Выберите месяц и нажмите
                                    «Сформировать отчёт»,
                                    чтобы увидеть траты на корма
                                    и движение поголовья.
                                </div>
                            `
                    }

                    <div class="history-filters">
                        <div class="history-type-filters">
                            ${[
                                ['all', 'Все операции'],
                                ['arrival', 'Приход'],
                                ['transfer', 'Переводы'],
                                ['realization', 'Реализация'],
                                ['mortality', 'Падёж'],
                                ['slaughter', 'Забой']
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

                    <section class="glass-panel history-list">
                        ${
                            movements.length
                                ? movements.map(item => {
                                    return this.renderMovement(
                                        item
                                    );
                                }).join('')
                                : `
                                    <div class="history-empty">
                                        Нет операций за выбранный месяц — Н/Д
                                    </div>
                                `
                        }
                    </section>

                    ${
                        this.editMode && this.canUndo()
                            ? `
                                <p
                                    class="
                                        history-edit-hint
                                    "
                                >
                                    Режим редактирования:
                                    нажмите ✕ на операции,
                                    чтобы удалить её и
                                    восстановить поголовье.
                                </p>
                            `
                            : ''
                    }
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
                    <h3 style="margin:0;color:#fff;">
                        Вход в редактирование
                    </h3>

                    <p class="history-modal-text">
                        Введите PIN-код, чтобы открыть
                        режим правки истории: удаление
                        операций и восстановление
                        поголовья.
                    </p>

                    <input
                        type="password"
                        inputmode="numeric"
                        maxlength="4"
                        autocomplete="off"
                        class="modal-input history-pin-input"
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
                            class="glass-btn history-pin-cancel"
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="glass-btn history-pin-submit"
                            style="
                                border-color:var(--amber);
                                color:var(--amber);
                            "
                        >
                            Войти
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
                    .querySelector('.history-pin-cancel')
                    .addEventListener('click', () => close(null));

                overlay
                    .querySelector('.history-pin-submit')
                    .addEventListener('click', () => {
                        const pin =
                            String(input.value || '').trim();

                        if (!/^\d{4}$/.test(pin)) {
                            errorNode.textContent =
                                'Введите PIN из 4 цифр.';
                            input.focus();
                            return;
                        }

                        close(pin);
                    });

                input.addEventListener('keydown', event => {
                    if (event.key === 'Enter') {
                        overlay
                            .querySelector('.history-pin-submit')
                            .click();
                    }

                    if (event.key === 'Escape') {
                        close(null);
                    }
                });
            });
        },

        async confirmDeleteModal(item) {
            const overlay =
                document.createElement('div');

            overlay.className =
                'modal-overlay open';

            overlay.innerHTML = `
                <div class="modal-box">
                    <h3 style="margin:0;color:#fff;">
                        Удалить операцию?
                    </h3>

                    <p class="history-modal-text">
                        ${this.escape(
                            this.getTypeLabel(
                                item.movement_type
                            )
                        )} от
                        ${this.escape(
                            this.formatDate(
                                item.event_date
                            )
                        )}
                        — ${Number(item.quantity) || 0} гол.

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
                            class="glass-btn history-confirm-no"
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="glass-btn history-confirm-yes"
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
                    .querySelector('.history-confirm-no')
                    .addEventListener('click', () => close(false));

                overlay
                    .querySelector('.history-confirm-yes')
                    .addEventListener('click', () => close(true));
            });
        },

        async showMessageModal(title, message) {
            const overlay =
                document.createElement('div');

            overlay.className =
                'modal-overlay open';

            overlay.innerHTML = `
                <div class="modal-box">
                    <h3 style="margin:0;color:#fff;">
                        ${this.escape(title)}
                    </h3>

                    <p class="history-modal-text">
                        ${this.escape(message)}
                    </p>

                    <button
                        type="button"
                        class="glass-btn history-message-close"
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
                .querySelector('.history-message-close')
                .addEventListener('click', () => {
                    overlay.remove();
                });
        },

        async toggleEditMode() {
            if (!this.canUndo()) {
                await this.showMessageModal(
                    'Нет доступа',
                    'Редактировать историю может только администратор или пользователь с соответствующим разрешением.'
                );

                return;
            }

            if (this.editMode) {
                this.editMode = false;
                await this.render();
                return;
            }

            const pin =
                await this.requestPinModal();

            if (pin === null) {
                return;
            }

            if (pin !== '2174') {
                await this.showMessageModal(
                    'Неверный PIN-код',
                    'Доступ в режим редактирования запрещён.'
                );

                return;
            }

            this.editMode = true;

            await this.showMessageModal(
                'Режим редактирования включён',
                'Нажимайте ✕ на операциях, чтобы удалять их и восстанавливать поголовье.'
            );

            await this.render();
        },

        async deleteMovement(id) {
            const item = this.movements.find(
                entry => String(entry.id) === String(id)
            );

            if (!item) {
                return;
            }

            const confirmed =
                await this.confirmDeleteModal(item);

            if (!confirmed) {
                return;
            }

            try {
                /*
                 * RPC пишет источник в group_id,
                 * source_group_id может быть пустым —
                 * берём с fallback.
                 */
                const sourceGroupId =
                    item.group_id ||
                    item.source_group_id;

                if (
                    item.movement_type !== 'transfer' &&
                    sourceGroupId
                ) {
                    const groupResponse =
                        await db
                            .from('farms_and_groups')
                            .select('id, head_count')
                            .eq(
                                'id',
                                sourceGroupId
                            )
                            .maybeSingle();

                    if (groupResponse.error) {
                        throw groupResponse.error;
                    }

                    const group =
                        groupResponse.data;

                    if (group) {
                        const current =
                            this.number(
                                group.head_count
                            );

                        // Приход добавлял головы —
                        // удаляем их; выбытие убирало —
                        // возвращаем.
                        const restored =
                            item.movement_type ===
                            'arrival'
                                ? current -
                                  this.number(
                                      item.quantity ??
                                      item.heads
                                  )
                                : current +
                                  this.number(
                                      item.quantity ??
                                      item.heads
                                  );

                        const response =
                            await db
                                .from('farms_and_groups')
                                .update({
                                    head_count:
                                        Math.max(0, restored)
                                })
                                .eq('id', group.id)
                                .select('id');

                        if (response.error) {
                            throw response.error;
                        }

                        if (
                            !response.data ||
                            response.data.length === 0
                        ) {
                            throw new Error(
                                'Не удалось изменить поголовье — проверьте права на изменение групп.'
                            );
                        }
                    }
                }

                if (
                    item.movement_type === 'transfer'
                ) {
                    // Перевод: возвращаем головы
                    // источнику и убираем из приёмника
                    // (id приёмника не хранится — ищем
                    // по названию фермы и группы).
                    const destinationGroup =
                        this.groups.find(entry => {
                            return this.cleanFarmName(
                                entry.farm_name
                            ) ===
                            this.cleanFarmName(
                                item.destination_farm_name
                            ) &&
                            entry.group_name ===
                            item.destination_group_name;
                        });

                    const restoreSide =
                        async (groupId, delta) => {
                            if (!groupId) {
                                return;
                            }

                            const response =
                                await db
                                    .from(
                                        'farms_and_groups'
                                    )
                                    .select(
                                        'id, head_count'
                                    )
                                    .eq('id', groupId)
                                    .maybeSingle();

                            if (response.error) {
                                throw response.error;
                            }

                            if (!response.data) {
                                return;
                            }

                            const next =
                                Math.max(
                                    0,
                                    this.number(
                                        response.data
                                            .head_count
                                    ) + delta
                                );

                            const update =
                                await db
                                    .from(
                                        'farms_and_groups'
                                    )
                                    .update({
                                        head_count: next
                                    })
                                    .eq('id', groupId)
                                    .select('id');

                            if (update.error) {
                                throw update.error;
                            }
                        };

                    await restoreSide(
                        sourceGroupId,
                        this.number(
                            item.quantity ?? item.heads
                        )
                    );

                    await restoreSide(
                        destinationGroup
                            ? destinationGroup.id
                            : null,
                        -this.number(
                            item.quantity ?? item.heads
                        )
                    );
                }

                const response = await db
                    .from('herd_movements')
                    .delete()
                    .eq('id', item.id);

                if (response.error) {
                    throw response.error;
                }

                await this.loadData();

                await this.showMessageModal(
                    'Операция удалена',
                    'Запись удалена, поголовье восстановлено.'
                );

                await this.render();
            } catch (error) {
                console.error(
                    'Delete movement error:',
                    error
                );

                await this.showMessageModal(
                    'Не удалось удалить операцию',
                    error.message ||
                    'Проверьте права доступа.'
                );
            }
        },

        bindEvents() {
            const container =
                document.getElementById(
                    'main-content'
                );

            if (!container) {
                return;
            }

            const monthInput =
                container.querySelector(
                    '.history-month-input'
                );

            if (monthInput) {
                if (!monthInput.value) {
                    monthInput.value =
                        this.currentMonthValue();
                }

                monthInput.addEventListener(
                    'change',
                    () => {
                        this.selectedMonth =
                            monthInput.value ||
                            this.currentMonthValue();

                        this.render();
                    }
                );
            }

            container
                .querySelectorAll('.history-filter-button')
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

            const editButton =
                container.querySelector(
                    '.history-edit-button'
                );

            if (editButton) {
                editButton.addEventListener(
                    'click',
                    () => this.toggleEditMode()
                );
            }

            const reportButton =
                container.querySelector(
                    '.history-report-button'
                );

            if (reportButton) {
                reportButton.addEventListener(
                    'click',
                    () => {
                        this.reportMonth =
                            this.selectedMonth ||
                            this.currentMonthValue();

                        this.render();
                    }
                );
            }

            const clearButton =
                container.querySelector(
                    '.history-report-clear'
                );

            if (clearButton) {
                clearButton.addEventListener(
                    'click',
                    () => {
                        this.reportMonth = '';

                        this.render();
                    }
                );
            }

            container
                .querySelectorAll(
                    '.history-item-delete'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => this.deleteMovement(
                            button.dataset.movementId
                        )
                    );
                });
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

            if (!this.selectedMonth) {
                this.selectedMonth =
                    this.currentMonthValue();
            }

            try {
                await this.loadData();

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
