(function () {
    'use strict';

    window.ReportsModule = {
        daysPeriod: 30,
        groups: [],
        feeds: [],
        diets: [],
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
                        'can_view_reports'
                    )
                )
            );
        },

        async loadData() {
            const [
                groupsResponse,
                feedsResponse,
                dietsResponse
            ] = await Promise.all([
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

            if (groupsResponse.error) {
                throw groupsResponse.error;
            }

            if (feedsResponse.error) {
                throw feedsResponse.error;
            }

            if (dietsResponse.error) {
                throw dietsResponse.error;
            }

            this.groups =
                groupsResponse.data || [];

            this.feeds =
                feedsResponse.data || [];

            this.diets =
                dietsResponse.data || [];
        },

        filterGroups() {
            if (
                !state.currentFarm ||
                state.currentFarm === 'Все'
            ) {
                return this.groups;
            }

            return this.groups.filter(group => {
                return (
                    group.farm_name === state.currentFarm ||
                    cleanFarmName(group.farm_name) ===
                    cleanFarmName(state.currentFarm)
                );
            });
        },

        getFeed(feedId) {
            return this.feeds.find(feed => {
                return String(feed.id) ===
                    String(feedId);
            });
        },

        calculateSummary(groups) {
            const summary = {};
            let totalWeightKg = 0;
            let totalCost = 0;

            this.diets.forEach(diet => {
                const group =
                    groups.find(item => {
                        return String(item.id) ===
                            String(diet.group_id);
                    });

                if (!group) {
                    return;
                }

                const feed =
                    this.getFeed(diet.feed_id);

                const feedName =
                    feed?.name || 'Неизвестный корм';

                const feedUnit =
                    feed?.unit || 'кг';

                const feedPrice =
                    this.number(feed?.price_per_unit);

                const dailyGroupKg =
                    this.number(diet.norm_per_head) *
                    this.number(group.head_count);

                const periodKg =
                    dailyGroupKg *
                    this.daysPeriod;

                const periodCost =
                    periodKg * feedPrice;

                if (!summary[feedName]) {
                    summary[feedName] = {
                        name: feedName,
                        unit: feedUnit,
                        dailyKg: 0,
                        periodKg: 0,
                        periodCost: 0
                    };
                }

                summary[feedName].dailyKg +=
                    dailyGroupKg;

                summary[feedName].periodKg +=
                    periodKg;

                summary[feedName].periodCost +=
                    periodCost;

                totalWeightKg += periodKg;
                totalCost += periodCost;
            });

            return {
                list: Object.values(summary),
                totalWeightKg,
                totalCost
            };
        },

        getPeriodLabel() {
            if (this.daysPeriod === 1) {
                return '1 день';
            }

            if (this.daysPeriod === 30) {
                return '30 дней';
            }

            if (this.daysPeriod === 90) {
                return 'Квартал';
            }

            if (this.daysPeriod === 365) {
                return '1 год';
            }

            return `${this.daysPeriod} дней`;
        },

        renderSummaryRows(summaryList) {
            if (!summaryList.length) {
                return `
                    <tr>
                        <td
                            colspan="5"
                            class="reports-empty-cell"
                        >
                            Нет назначенных рационов
                            для расчёта
                        </td>
                    </tr>
                `;
            }

            return summaryList.map(item => `
                <tr>
                    <td>
                        <strong class="reports-feed-name">
                            ${this.escape(item.name)}
                        </strong>
                    </td>

                    <td>
                        ${Math.round(
                            item.dailyKg
                        ).toLocaleString('ru-RU')}
                        ${this.escape(item.unit)}
                    </td>

                    <td>
                        <strong>
                            ${Math.round(
                                item.periodKg
                            ).toLocaleString('ru-RU')}
                            ${this.escape(item.unit)}
                        </strong>
                    </td>

                    <td class="reports-tons-cell">
                        ${(item.periodKg / 1000).toFixed(2)}
                        т
                    </td>

                    <td class="reports-cost-cell">
                        ${
                            item.periodCost > 0
                                ? item.periodCost.toLocaleString(
                                    'ru-RU',
                                    {
                                        maximumFractionDigits: 2
                                    }
                                )
                                : '—'
                        }
                        BYN
                    </td>
                </tr>
            `).join('');
        },

        renderPage(groups, summary) {
            const summaryList =
                summary.list;

            const totalWeightKg =
                summary.totalWeightKg;

            const totalCost =
                summary.totalCost || 0;

            return `
                <style>
                    .reports-page {
                        width: 100%;
                        min-width: 0;
                    }

                    .reports-header {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 16px;
                        margin-bottom: 20px;
                    }

                    .reports-title {
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

                    .reports-description {
                        margin: 5px 0 0;
                        color: var(--muted);
                        font-size: .86rem;
                    }

                    .reports-period-switcher {
                        display: flex;
                        gap: 4px;
                        padding: 4px;
                        border: 1px solid var(--line);
                        border-radius: 13px;
                        background: rgba(0,0,0,.25);
                    }

                    .reports-period-button {
                        min-height: 36px;
                        padding: 7px 10px;
                        border: 1px solid transparent;
                        border-radius: 9px;
                        background: transparent;
                        color: var(--muted);
                        cursor: pointer;
                        font: inherit;
                        font-size: .73rem;
                        font-weight: 700;
                        white-space: nowrap;
                    }

                    .reports-period-button.active {
                        border-color: var(--line-bright);
                        background: rgba(255,255,255,.12);
                        color: #fff;
                    }

                    .reports-selector {
                        margin-bottom: 14px;
                    }

                    .reports-cost-card {
                        border-color:
                            rgba(251,191,36,.35);
                        background:
                            linear-gradient(
                                135deg,
                                rgba(15,23,42,.9),
                                rgba(251,191,36,.12)
                            );
                    }

                    .reports-cost-value {
                        color: var(--amber);
                    }

                    .reports-total-card {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 18px;
                        margin-bottom: 20px;
                        padding: 23px;
                        border-color:
                            rgba(16,185,129,.35);
                        background:
                            linear-gradient(
                                135deg,
                                rgba(15,23,42,.9),
                                rgba(16,185,129,.15)
                            );
                    }

                    .reports-total-card > div {
                        min-width: 0;
                    }

                    .reports-total-label {
                        color: var(--muted);
                        font-size: .8rem;
                        font-weight: 700;
                        letter-spacing: .04em;
                        text-transform: uppercase;
                    }

                    .reports-total-value {
                        margin-top: 5px;
                        overflow-wrap: anywhere;
                        color: #fff;
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size: clamp(
                            1.3rem,
                            3.5vw,
                            2.1rem
                        );
                        font-weight: 800;
                        letter-spacing: -.03em;
                        line-height: 1.15;
                    }

                    .reports-total-value span {
                        color: var(--green);
                        font-size: 1rem;
                    }

                    .reports-object-label {
                        color: var(--muted);
                        font-size: .78rem;
                    }

                    .reports-object-value {
                        margin-top: 4px;
                        color: var(--blue);
                        font-size: .98rem;
                        font-weight: 800;
                        text-align: right;
                    }

                    .reports-table-panel {
                        margin-bottom: 16px;
                        padding: 20px;
                    }

                    .reports-section-title {
                        margin: 0 0 15px;
                        color: #fff;
                        font-size: 1rem;
                        font-weight: 800;
                    }

                    .reports-feed-name {
                        color: #fff;
                    }

                    .reports-tons-cell {
                        color: var(--green);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size: 1rem;
                        font-weight: 800;
                        text-align: right;
                    }

                    .reports-cost-cell {
                        color: var(--amber);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-weight: 700;
                        text-align: right;
                        white-space: nowrap;
                    }

                    /*
                     * П.7: узкая таблица — «Стоимость»
                     * и «Замес» не уезжают вправо.
                     */
                    .reports-table {
                        min-width: 480px !important;
                        width: 480px !important;
                    }

                    .reports-table th:nth-child(n+3),
                    .reports-table td:nth-child(n+3) {
                        width: 88px;
                    }

                    @media (max-width: 700px) {
                        .reports-table {
                            min-width: 420px !important;
                            width: 420px !important;
                        }
                    }

                    .reports-empty-cell {
                        padding: 28px !important;
                        color: var(--muted);
                        text-align: center;
                    }

                    .reports-actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 8px;
                        flex-wrap: wrap;
                    }

                    @media (max-width: 700px) {
                        .reports-header {
                            flex-direction: column;
                            gap: 12px;
                        }

                        .reports-period-switcher {
                            width: 100%;
                        }

                        .reports-period-button {
                            flex: 1;
                            padding-right: 5px;
                            padding-left: 5px;
                        }

                        .reports-total-card {
                            align-items: flex-start;
                            flex-direction: column;
                            padding: 17px;
                        }

                        .reports-object-value {
                            text-align: left;
                        }

                        .reports-table-panel {
                            padding: 14px;
                        }

                        .reports-actions {
                            justify-content: stretch;
                        }

                        .reports-actions .glass-btn {
                            width: 100%;
                        }
                    }
                </style>

                <div class="reports-page">
                    <header class="reports-header">
                        <div>
                            <h1 class="reports-title">
                                Потребность в кормах
                            </h1>

                            <p class="reports-description">
                                Расчёт объёма заготовок
                                и закупок
                            </p>
                        </div>

                        <div
                            class="
                                reports-period-switcher
                            "
                        >
                            ${[
                                [1, '1 день'],
                                [30, 'Месяц'],
                                [90, 'Квартал'],
                                [365, 'Год']
                            ].map(([days, label]) => `
                                <button
                                    type="button"
                                    class="
                                        reports-period-button
                                        ${
                                            this.daysPeriod === days
                                                ? 'active'
                                                : ''
                                        }
                                    "
                                    data-period="${days}"
                                >
                                    ${label}
                                </button>
                            `).join('')}
                        </div>
                    </header>

                    <div
                        id="reports-farm-selector"
                        class="reports-selector"
                    ></div>

                    <section
                        class="
                            glass-panel
                            reports-total-card
                        "
                    >
                        <div>
                            <div
                                class="
                                    reports-total-label
                                "
                            >
                                Суммарная потребность
                                (${this.escape(
                                    this.getPeriodLabel()
                                )})
                            </div>

                            <div
                                class="
                                    reports-total-value
                                "
                            >
                                ${(totalWeightKg / 1000)
                                    .toFixed(1)}
                                <span>тонн</span>
                            </div>
                        </div>

                        <div>
                            <div
                                class="
                                    reports-object-label
                                "
                            >
                                Объект
                            </div>

                            <div
                                class="
                                    reports-object-value
                                "
                            >
                                ${this.escape(
                                    state.currentFarm ||
                                    'Все объекты'
                                )}
                            </div>
                        </div>
                    </section>

                    ${
                        totalCost > 0
                            ? `
                                <section
                                    class="
                                        glass-panel
                                        reports-total-card
                                        reports-cost-card
                                    "
                                >
                                    <div>
                                        <div
                                            class="
                                                reports-total-label
                                            "
                                        >
                                            Стоимость кормов
                                            (${this.escape(
                                                this.getPeriodLabel()
                                            )})
                                        </div>

                                        <div
                                            class="
                                                reports-total-value
                                                reports-cost-value
                                            "
                                        >
                                            ${totalCost.toLocaleString(
                                                'ru-RU',
                                                {
                                                    maximumFractionDigits: 2
                                                }
                                            )}
                                            <span>BYN</span>
                                        </div>
                                    </div>
                                </section>
                            `
                            : ''
                    }

                    <section
                        class="
                            glass-panel
                            reports-table-panel
                        "
                    >
                        <h2
                            class="
                                reports-section-title
                            "
                        >
                            Объёмы по видам кормов
                        </h2>

                        <div class="table-responsive">
                            <table class="glass-table reports-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Наименование корма
                                        </th>

                                        <th>
                                            Расход в сутки
                                        </th>

                                        <th>
                                            За период
                                        </th>

                                        <th>
                                            Объём, тонн
                                        </th>

                                        <th>
                                            Стоимость
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${this.renderSummaryRows(
                                        summaryList
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div class="reports-actions">
                        <button
                            type="button"
                            class="glass-btn reports-copy-button"
                        >
                            📋 Скопировать отчёт
                        </button>
                    </div>
                </div>
            `;
        },

        bindEvents(groups) {
            const container =
                document.getElementById(
                    'main-content'
                );

            if (!container) {
                return;
            }

            renderFarmSelector(
                groups,
                'reports-farm-selector'
            );

            container
                .querySelectorAll(
                    '.reports-period-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => {
                            this.daysPeriod =
                                Number(
                                    button.dataset.period
                                ) || 30;

                            this.render();
                        }
                    );
                });

            const copyButton =
                container.querySelector(
                    '.reports-copy-button'
                );

            if (copyButton) {
                copyButton.addEventListener(
                    'click',
                    () => this.copyReport()
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
                    'У вас нет разрешения на просмотр потребности.'
                );

                return;
            }

            try {
                await this.loadData();

                const groups =
                    this.filterGroups();

                const summary =
                    this.calculateSummary(groups);

                container.innerHTML =
                    this.renderPage(
                        groups,
                        summary
                    );

                this.bindEvents(this.groups);
            } catch (error) {
                console.error(
                    'Reports render error:',
                    error
                );

                showAppError(
                    'Не удалось загрузить расчёт потребности.',
                    error
                );
            }
        },

        buildReportText() {
            const groups =
                this.filterGroups();

            const summary =
                this.calculateSummary(groups);

            let text =
                'Потребность в кормах\n';

            text +=
                `Объект: ${
                    state.currentFarm || 'Все объекты'
                }\n`;

            text +=
                `Период: ${
                    this.getPeriodLabel()
                }\n\n`;

            summary.list.forEach(item => {
                text +=
                    `${item.name} | ` +
                    `сутки: ${
                        Math.round(
                            item.dailyKg
                        ).toLocaleString('ru-RU')
                    } ${item.unit} | ` +
                    `период: ${
                        Math.round(
                            item.periodKg
                        ).toLocaleString('ru-RU')
                    } ${item.unit} | ` +
                    `итого: ${
                        (item.periodKg / 1000)
                            .toFixed(2)
                    } т` +
                    (
                        item.periodCost > 0
                            ? ` | ${
                                item.periodCost.toLocaleString(
                                    'ru-RU',
                                    {
                                        maximumFractionDigits: 2
                                    }
                                )
                            } BYN`
                            : ''
                    ) +
                    `\n`;
            });

            text +=
                `\nВсего: ${
                    (summary.totalWeightKg / 1000)
                        .toFixed(2)
                } тонн`;

            if (summary.totalCost > 0) {
                text +=
                    `\nСтоимость: ${
                        summary.totalCost.toLocaleString(
                            'ru-RU',
                            {
                                maximumFractionDigits: 2
                            }
                        )
                    } BYN`;
            }

            return text;
        },

        async copyReport() {
            const report =
                this.buildReportText();

            try {
                await navigator.clipboard.writeText(
                    report
                );

                showSimpleMessage(
                    'Готово',
                    'Отчёт скопирован в буфер обмена.'
                );
            } catch (error) {
                const textarea =
                    document.createElement('textarea');

                textarea.value = report;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';

                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();

                document.execCommand('copy');
                textarea.remove();

                showSimpleMessage(
                    'Готово',
                    'Отчёт скопирован в буфер обмена.'
                );
            }
        }
    };
})();