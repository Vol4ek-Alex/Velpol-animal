(function () {
    'use strict';

    window.DietsModule = {
        selectedTime: 'Сутки',
        activeGroupId: null,

        escape(value) {
            return typeof window.escapeHtml === 'function'
                ? window.escapeHtml(value)
                : String(value ?? '');
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
                        'can_view_diets'
                    )
                )
            );
        },

        canEdit() {
            return Boolean(
                window.AuthModule &&
                (
                    window.AuthModule.isAdmin() ||
                    window.AuthModule.hasPermission(
                        'can_edit_diets'
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

            return {
                groups: groupsResponse.data || [],
                feeds: feedsResponse.data || [],
                diets: dietsResponse.data || []
            };
        },

        filterGroups(groups) {
            if (
                !state.currentFarm ||
                state.currentFarm === 'Все'
            ) {
                return groups;
            }

            return groups.filter(group => {
                return (
                    group.farm_name === state.currentFarm ||
                    cleanFarmName(group.farm_name) ===
                    cleanFarmName(state.currentFarm)
                );
            });
        },

        createFeedMap(groupDiets) {
            const map = {};

            groupDiets.forEach(diet => {
                const feedId = String(diet.feed_id);

                if (!map[feedId]) {
                    map[feedId] = {
                        normI: 0,
                        normII: 0,
                        rowsI: [],
                        rowsII: []
                    };
                }

                const value =
                    this.number(diet.norm_per_head);

                if (diet.feeding_time === 'I') {
                    map[feedId].normI += value;
                    map[feedId].rowsI.push(diet);
                } else if (
                    diet.feeding_time === 'II'
                ) {
                    map[feedId].normII += value;
                    map[feedId].rowsII.push(diet);
                } else {
                    map[feedId].normI += value / 2;
                    map[feedId].normII += value / 2;
                }
            });

            return map;
        },

        getDisplayNorm(feedData) {
            if (this.selectedTime === 'I') {
                return feedData.normI;
            }

            if (this.selectedTime === 'II') {
                return feedData.normII;
            }

            return feedData.normI + feedData.normII;
        },

        getTimeLabel() {
            if (this.selectedTime === 'I') {
                return 'I кормление';
            }

            if (this.selectedTime === 'II') {
                return 'II кормление';
            }

            return 'Сутки';
        },

        renderEmpty(message) {
            return `
                <div class="glass-panel diets-empty">
                    ${this.escape(message)}
                </div>
            `;
        },

        renderGroup(group, feeds, diets, totals) {
            const groupDiets =
                diets.filter(diet => {
                    return String(diet.group_id) ===
                        String(group.id);
                });

            const feedMap =
                this.createFeedMap(groupDiets);

            const feedIds =
                Object.keys(feedMap);

            let groupTotal = 0;
            let groupCost = 0;

            const rows = feedIds.map(feedId => {
                const feed =
                    feeds.find(item => {
                        return String(item.id) ===
                            String(feedId);
                    });

                const feedData =
                    feedMap[feedId];

                const displayNorm =
                    this.getDisplayNorm(feedData);

                const groupTotalKg =
                    Math.round(
                        displayNorm *
                        this.number(group.head_count)
                    );

                const feedPrice =
                    this.number(feed?.price_per_unit);

                const rowCost =
                    groupTotalKg * feedPrice;

                groupTotal += groupTotalKg;
                groupCost += rowCost;
                totals.totalKg += groupTotalKg;
                totals.totalCost += rowCost;

                const feedName =
                    feed?.name || 'Корм / добавка';

                const unit =
                    feed?.unit || 'кг';

                return `
                    <tr>
                        <td>
                            <span class="diet-feed-name">
                                ${this.escape(feedName)}
                            </span>
                        </td>

                        <td>
                            ${
                                this.canEdit() && state.isEditMode
                                    ? `
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            class="
                                                modal-input
                                                diet-norm-input
                                            "
                                            data-group-id="${group.id}"
                                            data-feed-id="${feedId}"
                                            value="${displayNorm.toFixed(2)}"
                                        >
                                    `
                                    : `
                                        <strong
                                            class="
                                                diet-norm-value
                                            "
                                        >
                                            ${displayNorm.toFixed(2)}
                                            <span>
                                                ${this.escape(unit)}
                                            </span>
                                        </strong>
                                    `
                            }
                        </td>

                        <td class="diet-total-cell">
                            ${groupTotalKg.toLocaleString(
                                'ru-RU'
                            )}
                            ${this.escape(unit)}
                        </td>

                        ${
                            this.canEdit() && state.isEditMode
                                ? `
                                    <td>
                                        <button
                                            type="button"
                                            class="
                                                glass-btn
                                                diet-delete-button
                                            "
                                            data-group-id="${group.id}"
                                            data-feed-id="${feedId}"
                                            title="Удалить корм"
                                        >
                                            🗑
                                        </button>
                                    </td>
                                `
                                : ''
                        }
                    </tr>
                `;
            }).join('');

            return `
                <section
                    class="
                        glass-panel
                        diet-group-panel
                    "
                >
                    <div class="diet-group-header">
                        <div>
                            <h2 class="diet-group-title">
                                ${this.escape(
                                    group.group_name
                                )}
                            </h2>

                            <div class="diet-group-farm">
                                ${this.escape(
                                    cleanFarmName(
                                        group.farm_name
                                    )
                                )}
                            </div>
                        </div>

                        <div class="diet-group-heads">
                            ${this.number(
                                group.head_count
                            ).toLocaleString('ru-RU')}
                            гол.
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="glass-table diets-table">
                            <thead>
                                <tr>
                                    <th>
                                        Корм / добавка
                                    </th>

                                    <th>
                                        Норма,
                                        кг/гол.
                                    </th>

                                    <th>
                                        Замес,
                                        кг
                                    </th>

                                    ${
                                        this.canEdit() && state.isEditMode
                                            ? '<th>Действия</th>'
                                            : ''
                                    }
                                </tr>
                            </thead>

                            <tbody>
                                ${
                                    rows ||
                                    `
                                        <tr>
                                            <td
                                                colspan="${
                                                    this.canEdit() && state.isEditMode
                                                        ? 4
                                                        : 3
                                                }"
                                                class="
                                                    diet-empty-row
                                                "
                                            >
                                                Рацион не задан
                                            </td>
                                        </tr>
                                    `
                                }
                            </tbody>
                        </table>
                    </div>

                    ${
                        this.canEdit() && state.isEditMode
                            ? `
                                <div class="diet-group-actions">
                                    <button
                                        type="button"
                                        class="glass-btn diet-add-feed-button"
                                        data-group-id="${group.id}"
                                    >
                                        + Добавить корм
                                    </button>
                                </div>
                            `
                            : ''
                    }

                    <div class="diet-group-total">
                        Замес группы:
                        <strong>
                            ${groupTotal.toLocaleString(
                                'ru-RU'
                            )}
                            кг
                        </strong>
                        ${
                            groupCost > 0
                                ? `
                                    <span
                                        class="
                                            diet-group-cost
                                        "
                                    >
                                        · ~${groupCost.toLocaleString(
                                            'ru-RU',
                                            {
                                                maximumFractionDigits: 2
                                            }
                                        )}
                                        BYN/сутки
                                    </span>
                                `
                                : ''
                        }
                    </div>
                </section>
            `;
        },

        renderPage(groups, feeds, diets) {
            const totals = {
                totalKg: 0,
                totalCost: 0
            };

            const groupCards =
                groups.map(group => {
                    return this.renderGroup(
                        group,
                        feeds,
                        diets,
                        totals
                    );
                }).join('');

            return `
                <style>
                    .diets-page {
                        width:100%;
                        min-width:0;
                    }

                    .diets-header {
                        display:flex;
                        align-items:flex-start;
                        justify-content:space-between;
                        gap:18px;
                        margin-bottom:16px;
                    }

                    .diets-title {
                        margin:0;
                        color:#fff;
                        font-size:clamp(
                            1.4rem,
                            2.5vw,
                            2rem
                        );
                        font-weight:800;
                        letter-spacing:-.04em;
                    }

                    .diets-description {
                        margin:5px 0 0;
                        color:var(--muted);
                        font-size:.86rem;
                    }

                    .diets-selector {
                        flex:0 0 auto;
                        max-width:100%;
                    }

                    .diets-toolbar {
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                        margin-bottom:14px;
                    }

                    .diets-time-switcher {
                        display:flex;
                        gap:4px;
                        padding:4px;
                        border:1px solid var(--line);
                        border-radius:12px;
                        background:rgba(0,0,0,.25);
                    }

                    .diets-time-button {
                        min-height:34px;
                        padding:7px 11px;
                        border:1px solid transparent;
                        border-radius:9px;
                        background:transparent;
                        color:var(--muted);
                        cursor:pointer;
                        font:inherit;
                        font-size:.74rem;
                        font-weight:700;
                    }

                    .diets-time-button.active {
                        border-color:var(--line-bright);
                        background:rgba(255,255,255,.12);
                        color:#fff;
                    }

                    .diet-group-panel {
                        padding:18px;
                    }

                    .diet-group-header {
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:12px;
                        margin-bottom:13px;
                        padding-bottom:11px;
                        border-bottom:1px solid var(--line);
                    }

                    .diet-group-title {
                        margin:0;
                        color:#fff;
                        font-size:1.02rem;
                        font-weight:800;
                    }

                    .diet-group-farm {
                        margin-top:3px;
                        color:var(--muted);
                        font-size:.76rem;
                    }

                    .diet-group-heads {
                        flex:0 0 auto;
                        padding:5px 10px;
                        border:1px solid
                            rgba(125,211,252,.3);
                        border-radius:9px;
                        background:
                            rgba(56,189,248,.12);
                        color:var(--blue);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size:.8rem;
                        font-weight:700;
                        white-space:nowrap;
                    }

                    .diets-table {
                        min-width:620px;
                    }

                    .diet-feed-name {
                        color:#fff;
                        font-weight:650;
                    }

                    .diet-norm-input {
                        width:100px !important;
                        min-height:34px;
                        padding:6px 8px !important;
                        font-family:
                            "JetBrains Mono",
                            monospace;
                    }

                    .diet-norm-value {
                        color:var(--blue);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                    }

                    .diet-norm-value span {
                        color:var(--muted);
                        font-family:"Exo 2",sans-serif;
                        font-size:.7rem;
                    }

                    .diet-total-cell {
                        color:var(--green);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-weight:800;
                        text-align:right;
                    }

                    /*
                     * П.4: заголовок «Замес, кг»
                     * над значениями колонки
                     * (оба по правому краю).
                     */
                    .diets-table th:nth-child(3) {
                        text-align:right;
                    }

                    .diet-delete-button {
                        min-width:34px;
                        min-height:34px;
                        padding:5px 7px;
                        border-color:
                            rgba(251,113,133,.35);
                    }

                    .diet-empty-row {
                        padding:20px !important;
                        color:var(--muted);
                        text-align:center;
                    }

                    .diet-group-actions {
                        margin-top:12px;
                        margin-bottom:4px;
                    }

                    .diet-group-total {
                        display:flex;
                        align-items:baseline;
                        flex-wrap:wrap;
                        gap:6px 10px;
                        margin-top:12px;
                        padding-top:10px;
                        border-top:1px solid var(--line);
                        color:var(--muted);
                        font-size:.8rem;
                    }

                    .diet-group-total strong {
                        color:#fff;
                        font-family:
                            "JetBrains Mono",
                            monospace;
                    }

                    .diet-group-cost {
                        color: var(--green);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size:.74rem;
                    }

                    .diets-summary {
                        position:fixed;
                        right:20px;
                        bottom:20px;
                        left:calc(
                            var(--sidebar-width) + 34px
                        );
                        z-index:999;
                        display:flex;
                        align-items:center;
                        justify-content:space-around;
                        gap:15px;
                        flex-wrap:wrap;
                        max-width:1080px;
                        margin:0 auto;
                        padding:14px 20px;
                        border:1px solid
                            rgba(52,211,153,.45);
                        border-radius:16px;
                        background:rgba(10,15,30,.94);
                        box-shadow:
                            0 20px 50px
                            rgba(0,0,0,.55);
                    }

                    .diets-summary-cost {
                        color:var(--amber);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                    }

                    .diets-summary-label {
                        color:var(--muted);
                        font-size:.76rem;
                        font-weight:600;
                    }

                    .diets-summary-value {
                        margin-top:3px;
                        overflow-wrap:anywhere;
                        color:#fff;
                        font-size:1.18rem;
                        font-weight:800;
                    }

                    .diets-summary-value span {
                        color:var(--muted);
                        font-size:.76rem;
                        font-weight:600;
                    }

                    .br-symbol {
                        position:relative;
                        display:inline-block;
                        font-family:"Exo 2",sans-serif;
                    }

                    .br-symbol::after {
                        content:"";
                        position:absolute;
                        left:-6%;
                        right:-6%;
                        top:46%;
                        height:2px;
                        border-radius:2px;
                        background:currentColor;
                        transform:rotate(-10deg);
                    }

                    .diets-summary-kg {
                        color:var(--green);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size:1.05rem;
                        font-weight:800;
                        white-space:nowrap;
                    }

                    .diets-groups {
                        display:flex;
                        flex-direction:column;
                        gap:14px;
                    }

                    .diets-empty {
                        padding:30px;
                        color:var(--muted);
                        text-align:center;
                    }

                    @media(max-width:900px) {
                        .diets-summary {
                            left:20px;
                        }
                    }

                    @media(max-width:700px) {
                        .diets-header {
                            flex-direction:column;
                            gap:12px;
                        }

                        .diets-selector {
                            width:100%;
                        }

                        .diets-toolbar {
                            align-items:stretch;
                            flex-direction:column;
                        }

                        .diets-time-switcher {
                            width:100%;
                        }

                        .diets-time-button {
                            flex:1;
                        }

                        .diet-group-panel {
                            padding:14px;
                        }

                        .diets-summary {
                            right:10px;
                            bottom:calc(
                                62px +
                                env(safe-area-inset-bottom)
                            );
                            left:10px;
                            padding:10px 13px;
                            gap:8px;
                        }

                        .diets-summary-value {
                            font-size:1rem;
                        }

                        .diets-summary-kg {
                            font-size:.9rem;
                        }
                    }
                </style>

                <div class="diets-page">
                    <header class="diets-header">
                        <div>
                            <h1 class="diets-title">
                                Загрузочные листы
                            </h1>

                            <p class="diets-description">
                                ${
                                    this.canEdit() && state.isEditMode
                                        ? 'Режим редактирования доступен'
                                        : 'Режим просмотра'
                                }
                            </p>
                        </div>

                        <div
                            id="diets-farm-selector"
                            class="diets-selector"
                        ></div>
                    </header>

                    <div class="diets-toolbar">
                        <div>
                            ${
                                this.canEdit() && state.isEditMode
                                    ? `
                                        <button
                                            type="button"
                                            class="glass-btn diets-feeds-button"
                                        >
                                            ⚙️ Справочник кормов
                                        </button>
                                    `
                                    : ''
                            }
                        </div>

                        <div class="diets-time-switcher">
                            ${[
                                ['I', 'I кормление'],
                                ['II', 'II кормление'],
                                ['Сутки', '☀️ Сутки']
                            ].map(([value, label]) => `
                                <button
                                    type="button"
                                    class="
                                        diets-time-button
                                        ${
                                            this.selectedTime ===
                                            value
                                                ? 'active'
                                                : ''
                                        }
                                    "
                                    data-time="${value}"
                                >
                                    ${label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="diets-groups">
                        ${
                            groupCards ||
                            this.renderEmpty(
                                'Нет групп по выбранному объекту.'
                            )
                        }
                    </div>

                    <div class="diets-summary">
                        <div>
                            <div
                                class="
                                    diets-summary-label
                                "
                            >
                                Итого замес
                                (${this.getTimeLabel()})
                            </div>

                            <div
                                class="
                                    diets-summary-value
                                "
                            >
                                ${totals.totalKg.toLocaleString(
                                    'ru-RU'
                                )}
                                <span>кг</span>
                            </div>
                        </div>

                        <div>
                            <div
                                class="
                                    diets-summary-label
                                "
                            >
                                Стоимость
                            </div>

                            <div
                                class="
                                    diets-summary-value
                                    diets-summary-cost
                                "
                            >
                                ${
                                    totals.totalCost > 0
                                        ? totals.totalCost.toLocaleString(
                                            'ru-RU',
                                            {
                                                maximumFractionDigits: 2
                                            }
                                        )
                                        : 'Н/Д'
                                }
                                <span>
                                    BYN/сутки
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        bindEvents() {
            const container =
                document.getElementById(
                    'main-content'
                );

            if (!container) {
                return;
            }

            renderFarmSelector(
                this.lastGroups || [],
                'diets-farm-selector'
            );

            container
                .querySelectorAll(
                    '.diets-time-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => {
                            this.selectedTime =
                                button.dataset.time;

                            this.render();
                        }
                    );
                });

            const feedsButton =
                container.querySelector(
                    '.diets-feeds-button'
                );

            if (feedsButton) {
                feedsButton.addEventListener(
                    'click',
                    () => this.openManageFeedsModal()
                );
            }

            container
                .querySelectorAll(
                    '.diet-add-feed-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => {
                            this.openFeedModal(
                                button.dataset.groupId
                            );
                        }
                    );
                });

            container
                .querySelectorAll(
                    '.diet-delete-button'
                )
                .forEach(button => {
                    button.addEventListener(
                        'click',
                        () => {
                            this.deleteRow(
                                button.dataset.groupId,
                                button.dataset.feedId
                            );
                        }
                    );
                });

            container
                .querySelectorAll(
                    '.diet-norm-input'
                )
                .forEach(input => {
                    input.addEventListener(
                        'change',
                        () => {
                            this.updateNorm(
                                input.dataset.groupId,
                                input.dataset.feedId,
                                input.value
                            );
                        }
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
                    'У вас нет разрешения на просмотр рационов.'
                );
                return;
            }

            try {
                const data =
                    await this.loadData();

                const groups =
                    this.filterGroups(
                        data.groups
                    );

                this.lastGroups =
                    data.groups;

                container.innerHTML =
                    this.renderPage(
                        groups,
                        data.feeds,
                        data.diets
                    );

                this.bindEvents();
            } catch (error) {
                console.error(
                    'Diets render error:',
                    error
                );

                showAppError(
                    'Не удалось загрузить рационы.',
                    error
                );
            }
        },

        async openFeedModal(groupId) {
            if (!this.canEdit()) {
                showSimpleMessage(
                    'Нет доступа',
                    'Администратор запретил изменение рационов.'
                );

                return;
            }

            this.activeGroupId = groupId;

            const response =
                await db
                    .from('feeds')
                    .select('*')
                    .order('name');

            if (response.error) {
                alert(response.error.message);
                return;
            }

            const feeds =
                response.data || [];

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
                        Добавить корм в рацион
                    </h3>

                    <div style="
                        display:flex;
                        flex-direction:column;
                        gap:12px;
                        margin-top:16px;
                    ">
                        <label style="
                            color:var(--muted);
                            font-size:.76rem;
                            font-weight:600;
                        ">
                            Корм

                            <select
                                class="
                                    modal-input
                                    diet-feed-select
                                "
                                style="margin-top:5px"
                            >
                                ${feeds.map(feed => `
                                    <option
                                        value="${feed.id}"
                                    >
                                        ${this.escape(
                                            feed.name
                                        )}
                                    </option>
                                `).join('')}
                            </select>
                        </label>

                        <label style="
                            color:var(--muted);
                            font-size:.76rem;
                            font-weight:600;
                        ">
                            Суточная норма,
                            кг на голову

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value="1"
                                class="
                                    modal-input
                                    diet-feed-norm
                                "
                                style="margin-top:5px"
                            >
                        </label>
                    </div>

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
                                diet-feed-cancel
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                diet-feed-submit
                            "
                            style="
                                border-color:
                                    var(--green-dark);
                                color:var(--green);
                            "
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const close = () => {
                overlay.remove();
            };

            overlay
                .querySelector('.diet-feed-cancel')
                .addEventListener('click', close);

            overlay
                .querySelector('.diet-feed-submit')
                .addEventListener(
                    'click',
                    async () => {
                        const feedId =
                            overlay.querySelector(
                                '.diet-feed-select'
                            ).value;

                        const norm =
                            Math.max(
                                0,
                                parseFloat(
                                    overlay.querySelector(
                                        '.diet-feed-norm'
                                    ).value
                                ) || 0
                            );

                        if (!feedId || norm <= 0) {
                            alert(
                                'Выберите корм и укажите норму.'
                            );
                            return;
                        }

                        try {
                            await db
                                .from('diets')
                                .delete()
                                .eq(
                                    'group_id',
                                    this.activeGroupId
                                )
                                .eq(
                                    'feed_id',
                                    feedId
                                );

                            const half = norm / 2;

                            const response =
                                await db
                                    .from('diets')
                                    .insert([
                                        {
                                            group_id:
                                                this.activeGroupId,
                                            feed_id: feedId,
                                            feeding_time: 'I',
                                            norm_per_head: half
                                        },
                                        {
                                            group_id:
                                                this.activeGroupId,
                                            feed_id: feedId,
                                            feeding_time: 'II',
                                            norm_per_head: half
                                        }
                                    ]);

                            if (response.error) {
                                throw response.error;
                            }

                            close();
                            await this.render();
                        } catch (error) {
                            alert(
                                error.message ||
                                'Не удалось добавить корм.'
                            );
                        }
                    }
                );
        },

        async updateNorm(groupId, feedId, value) {
            if (!this.canEdit()) {
                await this.render();
                return;
            }

            const norm =
                Math.max(
                    0,
                    parseFloat(value) || 0
                );

            try {
                await db
                    .from('diets')
                    .delete()
                    .eq('group_id', groupId)
                    .eq('feed_id', feedId);

                if (norm > 0) {
                    let rows;

                    if (this.selectedTime === 'I') {
                        rows = [
                            {
                                group_id: groupId,
                                feed_id: feedId,
                                feeding_time: 'I',
                                norm_per_head: norm
                            }
                        ];
                    } else if (
                        this.selectedTime === 'II'
                    ) {
                        rows = [
                            {
                                group_id: groupId,
                                feed_id: feedId,
                                feeding_time: 'II',
                                norm_per_head: norm
                            }
                        ];
                    } else {
                        const half = norm / 2;

                        rows = [
                            {
                                group_id: groupId,
                                feed_id: feedId,
                                feeding_time: 'I',
                                norm_per_head: half
                            },
                            {
                                group_id: groupId,
                                feed_id: feedId,
                                feeding_time: 'II',
                                norm_per_head: half
                            }
                        ];
                    }

                    const response =
                        await db
                            .from('diets')
                            .insert(rows);

                    if (response.error) {
                        throw response.error;
                    }
                }

                await this.render();
            } catch (error) {
                alert(
                    error.message ||
                    'Не удалось сохранить норму.'
                );

                await this.render();
            }
        },

        async deleteRow(groupId, feedId) {
            if (!this.canEdit()) {
                showSimpleMessage(
                    'Нет доступа',
                    'Администратор запретил изменение рационов.'
                );

                return;
            }

            const confirmed =
                await this.confirmModal(
                    'Удалить корм?',
                    'Корм будет удалён из рациона группы.'
                );

            if (!confirmed) {
                return;
            }

            try {
                const response =
                    await db
                        .from('diets')
                        .delete()
                        .eq('group_id', groupId)
                        .eq('feed_id', feedId);

                if (response.error) {
                    throw response.error;
                }

                await this.render();
            } catch (error) {
                alert(
                    error.message ||
                    'Не удалось удалить корм.'
                );
            }
        },

        async openManageFeedsModal() {
            if (!this.canEdit()) {
                showSimpleMessage(
                    'Нет доступа',
                    'Администратор запретил управление кормами.'
                );

                return;
            }

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
                        Справочник кормов
                    </h3>

                    <div style="
                        display:flex;
                        gap:8px;
                        margin-top:15px;
                    ">
                        <input
                            type="text"
                            class="
                                modal-input
                                feed-name-input
                            "
                            placeholder="Название корма"
                        >

                        <button
                            type="button"
                            class="
                                glass-btn
                                feed-create-button
                            "
                            style="color:var(--green)"
                        >
                            Добавить
                        </button>
                    </div>

                    <div
                        class="feed-manager-error"
                        style="
                            min-height:20px;
                            margin-top:8px;
                            color:var(--red);
                            font-size:.78rem;
                        "
                    ></div>

                    <div
                        class="feed-manager-list"
                        style="
                            display:flex;
                            flex-direction:column;
                            gap:8px;
                            max-height:300px;
                            margin-top:5px;
                            overflow-y:auto;
                        "
                    ></div>

                    <button
                        type="button"
                        class="
                            glass-btn
                            feed-manager-close
                        "
                        style="
                            width:100%;
                            margin-top:16px;
                        "
                    >
                        Закрыть
                    </button>
                </div>
            `;

            document.body.appendChild(overlay);

            const list =
                overlay.querySelector(
                    '.feed-manager-list'
                );

            const errorNode =
                overlay.querySelector(
                    '.feed-manager-error'
                );

            const renderList = async () => {
                const response =
                    await db
                        .from('feeds')
                        .select('*')
                        .order('name');

                if (response.error) {
                    throw response.error;
                }

                const feeds =
                    response.data || [];

                list.innerHTML =
                    feeds.map(feed => `
                        <div style="
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:8px;
                            flex-wrap:wrap;
                            padding:9px;
                            border:1px solid var(--line);
                            border-radius:10px;
                        ">
                            <span style="
                                flex:1 1 120px;
                                min-width:0;
                                overflow-wrap:anywhere;
                            ">
                                ${this.escape(
                                    feed.name
                                )}
                            </span>

                            <label style="
                                display:flex;
                                align-items:center;
                                gap:6px;
                                color:var(--muted);
                                font-size:.75rem;
                            ">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    class="
                                        modal-input
                                        feed-price-input
                                    "
                                    data-id="${feed.id}"
                                    value="${this.number(feed.price_per_unit)}"
                                    title="Цена за единицу, BYN"
                                    style="
                                        width:88px;
                                        min-height:34px;
                                        padding:6px 8px;
                                    "
                                >
                                BYN/${this.escape(feed.unit || 'кг')}
                            </label>

                            <span style="
                                display:flex;
                                gap:5px;
                            ">
                                <button
                                    type="button"
                                    class="
                                        glass-btn
                                        feed-rename-button
                                    "
                                    data-id="${feed.id}"
                                >
                                    ✏️
                                </button>

                                <button
                                    type="button"
                                    class="
                                        glass-btn
                                        feed-delete-button
                                    "
                                    data-id="${feed.id}"
                                    style="
                                        color:var(--red);
                                    "
                                >
                                    🗑
                                </button>
                            </span>
                        </div>
                    `).join('');

                list
                    .querySelectorAll(
                        '.feed-price-input'
                    )
                    .forEach(input => {
                        input.addEventListener(
                            'change',
                            async () => {
                                const price =
                                    Math.max(
                                        0,
                                        parseFloat(
                                            input.value
                                        ) || 0
                                    );

                                const updated =
                                    await db
                                        .from('feeds')
                                        .update({
                                            price_per_unit: price,
                                            updated_at: new Date().toISOString()
                                        })
                                        .eq(
                                            'id',
                                            input.dataset.id
                                        );

                                if (updated.error) {
                                    errorNode.textContent =
                                        updated.error.message;
                                    return;
                                }

                                errorNode.textContent = '';
                            }
                        );
                    });

                list
                    .querySelectorAll(
                        '.feed-rename-button'
                    )
                    .forEach(button => {
                        button.addEventListener(
                            'click',
                            async () => {
                                const feed =
                                    feeds.find(item => {
                                        return String(
                                            item.id
                                        ) === String(
                                            button.dataset.id
                                        );
                                    });

                                if (!feed) return;

                                const name =
                                    await this.textModal(
                                        'Новое название корма',
                                        feed.name
                                    );

                                if (name === null) {
                                    return;
                                }

                                const value =
                                    name.trim();

                                if (!value) {
                                    return;
                                }

                                const update =
                                    await db
                                        .from('feeds')
                                        .update({
                                            name: value
                                        })
                                        .eq(
                                            'id',
                                            feed.id
                                        );

                                if (update.error) {
                                    errorNode.textContent =
                                        update.error.message;
                                    return;
                                }

                                await renderList();
                            }
                        );
                    });

                list
                    .querySelectorAll(
                        '.feed-delete-button'
                    )
                    .forEach(button => {
                        button.addEventListener(
                            'click',
                            async () => {
                                const used =
                                    await db
                                        .from('diets')
                                        .select(
                                            'id',
                                            {
                                                count:
                                                    'exact',
                                                head: true
                                            }
                                        )
                                        .eq(
                                            'feed_id',
                                            button.dataset.id
                                        );

                                if (used.error) {
                                    errorNode.textContent =
                                        used.error.message;
                                    return;
                                }

                                if (
                                    Number(
                                        used.count || 0
                                    ) > 0
                                ) {
                                    errorNode.textContent =
                                        'Корм используется в рационах.';
                                    return;
                                }

                                const deleted =
                                    await db
                                        .from('feeds')
                                        .delete()
                                        .eq(
                                            'id',
                                            button.dataset.id
                                        );

                                if (deleted.error) {
                                    errorNode.textContent =
                                        deleted.error.message;
                                    return;
                                }

                                await renderList();
                            }
                        );
                    });
            };

            overlay
                .querySelector(
                    '.feed-create-button'
                )
                .addEventListener(
                    'click',
                    async () => {
                        const input =
                            overlay.querySelector(
                                '.feed-name-input'
                            );

                        const name =
                            input.value.trim();

                        if (!name) {
                            errorNode.textContent =
                                'Введите название корма.';
                            return;
                        }

                        const response =
                            await db
                                .from('feeds')
                                .insert({
                                    name,
                                    unit: 'кг'
                                });

                        if (response.error) {
                            errorNode.textContent =
                                response.error.message;
                            return;
                        }

                        input.value = '';
                        errorNode.textContent = '';

                        await renderList();
                    }
                );

            overlay
                .querySelector(
                    '.feed-manager-close'
                )
                .addEventListener(
                    'click',
                    async () => {
                        overlay.remove();
                        await this.render();
                    }
                );

            await renderList();
        },

        async textModal(title, value) {
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

                    <input
                        type="text"
                        class="modal-input text-modal-value"
                        value="${this.escape(value)}"
                        style="margin-top:15px"
                    >

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:16px;
                    ">
                        <button
                            type="button"
                            class="
                                glass-btn
                                text-modal-cancel
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                text-modal-submit
                            "
                            style="
                                border-color:
                                    var(--green-dark);
                                color:var(--green);
                            "
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const input =
                overlay.querySelector(
                    '.text-modal-value'
                );

            input.focus();
            input.select();

            return new Promise(resolve => {
                const close = value => {
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector(
                        '.text-modal-cancel'
                    )
                    .addEventListener(
                        'click',
                        () => close(null)
                    );

                overlay
                    .querySelector(
                        '.text-modal-submit'
                    )
                    .addEventListener(
                        'click',
                        () => close(input.value)
                    );

                input.addEventListener(
                    'keydown',
                    event => {
                        if (event.key === 'Enter') {
                            close(input.value);
                        }

                        if (event.key === 'Escape') {
                            close(null);
                        }
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
                        margin:10px 0 0;
                        color:var(--muted);
                        line-height:1.5;
                    ">
                        ${this.escape(message)}
                    </p>

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:17px;
                    ">
                        <button
                            type="button"
                            class="
                                glass-btn
                                diet-confirm-no
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                diet-confirm-yes
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
                const close = value => {
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector(
                        '.diet-confirm-no'
                    )
                    .addEventListener(
                        'click',
                        () => close(false)
                    );

                overlay
                    .querySelector(
                        '.diet-confirm-yes'
                    )
                    .addEventListener(
                        'click',
                        () => close(true)
                    );
            });
        }
    };
})();
