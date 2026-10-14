/*
 * =====================================================
 * МОДУЛЬ «МЕХАНИЗАЦИЯ» — Автопарк
 *
 * Полностью переработанный интерфейс системы учёта
 * сельхозпарка: панель управления с поиском/сортировкой/
 * фильтром по категориям, сгруппированные premium-карточки
 * техники, модальные окна в едином дизайн-стиле.
 * Бизнес-логика и схема БД (vehicles, vehicle_tasks,
 * fleet_drivers, fleet_categories, fleet_tags) сохранены.
 * =====================================================
 */

const FLEET_STYLES = `
<style id="fleet-styles">
.fleet-root {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 1400px;
    margin: 0 auto;
}

/* ---------- Панель управления ---------- */
.fleet-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 24px;
}

.fleet-toolbar-head h2 {
    margin: 0 0 6px;
    color: #fff;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 11px;
}

.fleet-toolbar-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(52, 211, 153, 0.35);
    border-radius: 13px;
    background: linear-gradient(135deg, rgba(52, 211, 153, 0.16), rgba(4, 120, 87, 0.12));
    font-size: 1.25rem;
}

.fleet-toolbar-head p {
    margin: 0;
    color: var(--muted);
    font-size: 0.84rem;
    font-weight: 500;
}

.fleet-toolbar-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

/* ---------- Поисковая панель ---------- */
.fleet-search-panel {
    padding: 18px 20px;
}

.fleet-search-fields {
    display: flex;
    gap: 12px;
    margin-bottom: 14px;
}

.fleet-search-input {
    flex: 1 1 260px;
    min-width: 0;
}

.fleet-sort-select {
    flex: 0 1 250px;
    min-width: 0;
}

.fleet-categories-bar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.fleet-categories-bar::-webkit-scrollbar { display: none; }

.fleet-cat-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    min-height: 34px;
    padding: 6px 14px;
    border: 1px solid var(--line-bright);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--muted);
    cursor: pointer;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
    transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}

.fleet-cat-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
}

.fleet-cat-btn:active { transform: scale(0.96); }

.fleet-cat-btn--active {
    color: var(--green);
    background: rgba(52, 211, 153, 0.14);
    border-color: rgba(52, 211, 153, 0.55);
    box-shadow: 0 0 18px rgba(52, 211, 153, 0.12);
}

.fleet-cat-btn__icon { font-size: 0.9rem; }

.fleet-cat-btn__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--muted);
}

.fleet-cat-btn--active .fleet-cat-btn__count {
    background: rgba(52, 211, 153, 0.2);
    color: var(--green);
}

/* ---------- Группы и карточки ---------- */
.fleet-grid-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.fleet-group-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 12px 2px;
}

.fleet-group-title {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--muted);
}

.fleet-group-count {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--subtle);
    letter-spacing: 0.04em;
}

.fleet-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 14px;
}

.fleet-card-v2 {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px 20px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-top-color: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    background:
        linear-gradient(150deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.03) 40%, transparent 70%),
        rgba(12, 26, 46, 0.92);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.28),
        0 2px 8px rgba(0, 0, 0, 0.18),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    cursor: pointer;
    overflow: hidden;
    transition: border-color 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.fleet-card-v2::before {
    position: absolute;
    top: 16%;
    bottom: 16%;
    left: 0;
    width: 3px;
    border-radius: 0 3px 3px 0;
    content: "";
    opacity: 0;
    transition: opacity 220ms ease;
}

.fleet-card-v2.is-broken {
    border-color: rgba(251, 113, 133, 0.35);
    background:
        linear-gradient(150deg, rgba(251, 113, 133, 0.07) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 70%),
        rgba(12, 26, 46, 0.92);
}

.fleet-card-v2.is-broken::before {
    background: var(--red);
    box-shadow: 0 0 14px var(--red);
    opacity: 1;
}

.fleet-card-v2.is-warranty {
    border-color: rgba(125, 211, 252, 0.35);
    background:
        linear-gradient(150deg, rgba(125, 211, 252, 0.07) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 70%),
        rgba(12, 26, 46, 0.92);
}

.fleet-card-v2.is-warranty::before {
    background: var(--blue);
    box-shadow: 0 0 14px var(--blue);
    opacity: 1;
}

.fleet-card-v2:hover {
    border-color: rgba(255, 255, 255, 0.22);
    transform: translateY(-4px);
    box-shadow:
        0 20px 56px rgba(0, 0, 0, 0.38),
        0 4px 16px rgba(0, 0, 0, 0.22),
        inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.fleet-card-v2.is-broken:hover { border-color: rgba(251, 113, 133, 0.55); }
.fleet-card-v2.is-warranty:hover { border-color: rgba(125, 211, 252, 0.55); }

.fv2-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.fv2-header-left {
    display: flex;
    align-items: center;
    gap: 7px;
}

.fv2-header-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.fv2-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.fv2-dot-green { background: var(--green); box-shadow: 0 0 8px rgba(52, 211, 153, 0.7); }
.fv2-dot-red { background: var(--red); box-shadow: 0 0 8px rgba(251, 113, 133, 0.7); }
.fv2-dot-blue { background: var(--blue); box-shadow: 0 0 8px rgba(125, 211, 252, 0.7); }

.fv2-status-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--subtle);
}

.fv2-edit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--subtle);
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
    transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

.fv2-edit-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--line-bright);
}

.fv2-model {
    font-size: 1.05rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1.2;
}

.fv2-ids {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.fleet-plate {
    font-size: 0.84rem;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--line-bright);
    padding: 6px 12px;
    border-radius: 10px;
    letter-spacing: 0.05em;
}

.fleet-inv {
    font-size: 0.7rem;
    font-family: 'JetBrains Mono', monospace;
    color: var(--subtle);
    background: rgba(255, 255, 255, 0.05);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid var(--line);
}

.fv2-vin {
    font-size: 0.68rem;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    color: var(--subtle);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fleet-tag {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #0b1728;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.fv2-driver {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
}

.fv2-driver-role {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--subtle);
    white-space: nowrap;
    flex-shrink: 0;
}

.fv2-driver-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fv2-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.1) 80%, transparent);
    margin: 2px 0;
}

.fv2-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
}

.fv2-metric {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.fv2-metric-label {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--subtle);
}

.fv2-metric-value {
    font-size: 0.92rem;
    font-weight: 800;
    color: #fff;
    line-height: 1.2;
}

.fv2-metric-unit {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--muted);
}

.fv2-doc-val {
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1.3;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.fv2-doc-val.is-ok { color: var(--muted); }
.fv2-doc-val.is-muted { color: var(--subtle); }
.fv2-doc-val.is-soon { color: var(--amber); }
.fv2-doc-val.is-overdue { color: var(--red); }

.fv2-doc-sub {
    font-size: 0.62rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.85;
}

.fv2-tasks-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    min-height: 36px;
    padding: 8px 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--subtle);
    cursor: pointer;
    font-size: 0.76rem;
    font-weight: 700;
    transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.fv2-tasks-btn:hover {
    color: var(--muted);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
}

.fv2-tasks-btn--has {
    color: var(--green);
    background: rgba(52, 211, 153, 0.08);
    border-color: rgba(52, 211, 153, 0.3);
}

.fv2-tasks-btn--has:hover {
    background: rgba(52, 211, 153, 0.14);
    border-color: rgba(52, 211, 153, 0.5);
}

.fv2-tasks-icon { font-size: 0.9rem; }

.fv2-tasks-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(52, 211, 153, 0.2);
    color: var(--green);
    font-size: 0.65rem;
    font-weight: 800;
}

.fleet-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--muted);
    font-size: 0.84rem;
    font-weight: 700;
    border: 1px dashed rgba(255, 255, 255, 0.14);
    border-radius: 16px;
}

/* ---------- Списки в модалках ---------- */
.fleet-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: rgba(255, 255, 255, 0.05);
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--line);
    font-size: 0.82rem;
    font-weight: 700;
}

.fleet-list-name { color: #fff; }

.fleet-list-tag {
    display: flex;
    align-items: center;
    gap: 8px;
}

.fleet-list-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.4);
    display: inline-block;
}

.fleet-list-delete {
    border: none;
    background: none;
    color: var(--red);
    cursor: pointer;
    font-weight: 600;
    font-size: 0.8rem;
    padding: 2px 4px;
    border-radius: 6px;
    transition: background-color 150ms ease;
}

.fleet-list-delete:hover {
    text-decoration: underline;
    background: rgba(251, 113, 133, 0.08);
}

.fleet-tasks-empty {
    text-align: center;
    color: var(--muted);
    padding: 12px 0;
    font-size: 0.76rem;
    font-weight: 700;
}

.fleet-task-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: rgba(251, 191, 36, 0.12);
    border: 1px solid rgba(251, 191, 36, 0.4);
    padding: 9px 11px;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--amber);
}

.fleet-task-row span { word-break: break-word; }

.fleet-task-done {
    border: none;
    background: none;
    color: var(--green);
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    font-size: 0.78rem;
    padding: 2px 6px;
    border-radius: 6px;
    transition: background-color 150ms ease;
}

.fleet-task-done:hover { background: rgba(52, 211, 153, 0.12); }

/* Режим только чтения в модалках */
.fleet-ro-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 13px;
    border: 1px dashed rgba(251, 191, 36, 0.45);
    border-radius: 12px;
    background: rgba(251, 191, 36, 0.07);
    color: var(--amber);
    font-size: 0.78rem;
    font-weight: 700;
    margin-top: 12px;
}

@media (max-width: 700px) {
    .fleet-grid { grid-template-columns: 1fr; }

    .fv2-metrics { grid-template-columns: 1fr 1fr; }

    .fv2-metrics .fv2-metric:first-child { grid-column: 1 / -1; }

    .fleet-search-fields { flex-direction: column; }

    .fleet-toolbar { padding: 18px; }
}

@media (max-width: 480px) {
    .fleet-card-v2 { padding: 14px 16px 12px; }
}
</style>
`;

export async function init() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = FLEET_STYLES + `
        <div class="fleet-root">
            <div class="glass-panel fleet-toolbar">
                <div class="fleet-toolbar-head">
                    <h2><span class="fleet-toolbar-icon">🚜</span> Управление автопарком</h2>
                    <p>Учёт техники, закрепление водителей и механизаторов, контроль документов и ремонтов</p>
                </div>
                <div class="fleet-toolbar-actions" id="fleetToolbarActions">
                    <button onclick="window.openDriversModal()" class="glass-btn">👤 Вод/Мех</button>
                    <button onclick="window.openTagsModal()" class="glass-btn">🏷️ Теги</button>
                    <button onclick="window.openCategoriesModal()" class="glass-btn">📂 Категории</button>
                    <button onclick="window.openHoursModal()" class="glass-btn fleet-btn-blue">⏱️ Добавить часы</button>
                    <button onclick="window.openVehicleModalForm()" class="glass-btn modal-btn-primary">➕ Карта</button>
                </div>
            </div>

            <div class="glass-panel fleet-search-panel">
                <div class="fleet-search-fields">
                    <input type="text" id="vehicleSearchInput" class="modal-field fleet-search-input" placeholder="🔍 Поиск по модели, номеру, VIN, водителю или тегу...">
                    <select id="sortSelect" onchange="window.handleSortChange(this.value)" class="modal-field fleet-sort-select">
                        <option value="name_asc">По названию (А–Я)</option>
                        <option value="name_desc">По названию (Я–А)</option>
                        <option value="hours_desc">По наработке (сначала max)</option>
                    </select>
                </div>
                <div class="fleet-categories-bar" id="fleetCategoriesBar"></div>
            </div>

            <div id="fleetGridContainer" class="fleet-grid-container">
                <div class="fleet-empty">Загрузка данных...</div>
            </div>
        </div>
    `;

    // Модалки добавляем в body, чтобы они не перезаписывались при рендере
    if (!document.getElementById('vFormModal')) {
        document.body.insertAdjacentHTML('beforeend', buildModalsHtml());
    }

    setupFleet();
}

/*
 * Модальные окна в дизайн-системе приложения:
 * .modal-box-fleet + .fleet-modal-title, поля .modal-field,
 * кнопки .glass-btn — стили уже определены в index.html.
 */
function buildModalsHtml() {
    return `
    <div id="vFormModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet" style="max-width: 520px;">
            <button onclick="window.closeVModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <h3 id="vModalTitle" class="fleet-modal-title">Карточка техники</h3>
            <form id="vForm" style="display: flex; flex-direction: column; gap: 16px; font-size: 0.88rem;">
                <input type="hidden" id="vId">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <div>
                        <label class="modal-label">Категория</label>
                        <select id="vCategory" required class="modal-field"></select>
                    </div>
                    <div>
                        <label class="modal-label">Модель</label>
                        <input type="text" id="vName" required class="modal-field" placeholder="МТЗ-3522">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <div>
                        <label class="modal-label">Вод/Мех</label>
                        <select id="vDriver" class="modal-field"></select>
                    </div>
                    <div>
                        <label class="modal-label">Наработка (м/ч)</label>
                        <input type="number" id="vHours" required class="modal-field" placeholder="0">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <div>
                        <label class="modal-label">Госномер</label>
                        <input type="text" id="vPlate" class="modal-field fleet-field-mono" placeholder="1234 AB-7">
                    </div>
                    <div>
                        <label class="modal-label">Инв. №</label>
                        <input type="text" id="vInv" class="modal-field fleet-field-mono" placeholder="00125">
                    </div>
                </div>
                <div>
                    <label class="modal-label">VIN / Заводской номер</label>
                    <input type="text" id="vVin" class="modal-field fleet-field-mono" placeholder="Номер рамы">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <div>
                        <label class="modal-label">Техосмотр до</label>
                        <input type="date" id="vToDate" class="modal-field">
                    </div>
                    <div>
                        <label class="modal-label">Страховка до</label>
                        <input type="date" id="vInsuranceDate" class="modal-field">
                    </div>
                </div>
                <div>
                    <label class="modal-label">Теги статусов</label>
                    <div id="tagsCheckboxContainer" class="fleet-tags-picker"></div>
                </div>
                <div id="vFormRoNotice" class="fleet-ro-notice" style="display: none;">
                    <span>🔒</span>
                    <span>Редактирование доступно только пользователям с правом записи.</span>
                </div>
                <div class="fleet-modal-footer">
                    <button type="submit" id="vFormSubmitBtn" class="glass-btn modal-btn-primary" style="flex: 1;">Сохранить</button>
                </div>
                <button type="button" id="vDeleteBtn" class="glass-btn modal-btn-danger hidden" style="width: 100%;">Удалить из базы</button>
            </form>
        </div>
    </div>

    <div id="driversManagementModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet">
            <button onclick="window.closeDriversModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <h3 class="fleet-modal-title">👤 Водители и механизаторы</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;" id="modalDriversList"></div>
            <div class="fleet-modal-footer" style="border-top: 1px solid var(--line); padding-top: 14px; display: flex; flex-direction: column; gap: 12px;">
                <input type="text" id="newDriverNameInput" class="modal-field" placeholder="ФИО...">
                <button onclick="window.addCustomDriver()" class="glass-btn modal-btn-primary" style="width: 100%;">Добавить</button>
                <button onclick="window.closeDriversModal()" class="glass-btn" style="width: 100%;">Закрыть</button>
            </div>
        </div>
    </div>

    <div id="tagsManagementModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet">
            <button onclick="window.closeTagsModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <h3 class="fleet-modal-title">🏷️ Управление тегами</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;" id="modalTagsList"></div>
            <div class="fleet-modal-footer" style="border-top: 1px solid var(--line); padding-top: 14px; display: flex; flex-direction: column; gap: 12px;">
                <input type="text" id="newTagNameInput" class="modal-field" placeholder="Название статуса...">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <label class="modal-label" style="margin: 0;">Цвет:</label>
                    <input type="color" id="newTagColorInput" value="#e2e8f0" class="fleet-color-input">
                </div>
                <button onclick="window.addCustomTag()" class="glass-btn modal-btn-primary" style="width: 100%;">Создать тег</button>
                <button onclick="window.closeTagsModal()" class="glass-btn" style="width: 100%;">Закрыть</button>
            </div>
        </div>
    </div>

    <div id="categoriesModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet">
            <button onclick="window.closeCategoriesModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <h3 class="fleet-modal-title">📂 Категории</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;" id="modalCategoriesList"></div>
            <div class="fleet-modal-footer" style="border-top: 1px solid var(--line); padding-top: 14px; display: flex; flex-direction: column; gap: 12px;">
                <input type="text" id="newCatInput" class="modal-field" placeholder="Новая категория...">
                <button onclick="window.addCustomCategory()" class="glass-btn modal-btn-primary" style="width: 100%;">Добавить</button>
                <button onclick="window.closeCategoriesModal()" class="glass-btn" style="width: 100%;">Закрыть</button>
            </div>
        </div>
    </div>

    <div id="tasksModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet">
            <button onclick="window.closeTasksModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <h3 id="tasksModalTitle" class="fleet-modal-title" style="margin-bottom: 4px;">Задачи по технике</h3>
            <p id="tasksModalSubtitle" style="margin: 0 0 14px 0; color: var(--muted); font-size: 0.8rem;"></p>
            <input type="hidden" id="taskVehicleId">
            <input type="hidden" id="taskVehicleName">
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;" id="vehicleTasksList"></div>
            <div class="fleet-modal-footer" style="border-top: 1px solid var(--line); padding-top: 14px; display: flex; flex-direction: column; gap: 12px;">
                <textarea id="newTaskText" rows="2" class="modal-field" placeholder="Текст задачи..."></textarea>
                <button onclick="window.addVehicleTask()" class="glass-btn modal-btn-primary" style="width: 100%;">Добавить задачу</button>
                <button onclick="window.closeTasksModal()" class="glass-btn" style="width: 100%;">Закрыть</button>
            </div>
        </div>
    </div>

    <div id="hoursModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet">
            <button onclick="window.closeHoursModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <h3 class="fleet-modal-title">⏱️ Добавить наработку</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label class="modal-label">Выберите технику</label>
                    <select id="hoursVehicleSelect" class="modal-field">
                        <option value="">-- Загрузка --</option>
                    </select>
                </div>
                <div>
                    <label class="modal-label">Количество часов</label>
                    <input type="number" id="hoursInput" min="0" step="0.5" class="modal-field" placeholder="Например, 8.5">
                </div>
            </div>
            <div class="fleet-modal-footer" style="border-top: 1px solid var(--line); padding-top: 12px; display: flex; gap: 12px;">
                <button onclick="window.closeHoursModal()" class="glass-btn" style="flex: 1;">Отмена</button>
                <button onclick="window.submitHours()" class="glass-btn modal-btn-primary" style="flex: 1;">Добавить</button>
            </div>
        </div>
    </div>
    `;
}

// ===== Глобальные переменные и настройки =====
if (typeof window._isCategoriesDropdownOpen === 'undefined') {
    window._isCategoriesDropdownOpen = false;
}

let vehicles = [];
let tasks = [];
let categories = [];
let drivers = [];
let baseTags = [];

let searchQuery = "";
let selectedCategory = "all";
let currentSort = "name_asc";
let refreshIntervalId = null;

function openModalOverlay(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
    /* Анимация появления: класс open
       ставится после отображения flex. */
    requestAnimationFrame(function () {
        modal.classList.add('open');
    });
    modal.onclick = (e) => {
        if (e.target === modal) closeModalOverlay(id);
    };
}

function closeModalOverlay(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(function () {
        modal.style.display = 'none';
    }, 200);
}

// Определение единицы измерения в зависимости от категории
function getUnitByCategory(type) {
    if (!type) return 'м/ч';
    const lower = type.toLowerCase();
    const carKeywords = ['легков', 'грузов', 'грузопассажир', 'автобус', 'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'];
    for (let kw of carKeywords) {
        if (lower.includes(kw)) return 'км';
    }
    return 'м/ч';
}

// Определение роли: Водитель или Механизатор
function getDriverRole(type) {
    if (!type) return 'Механизатор';
    const lower = type.toLowerCase();
    const carKeywords = ['легков', 'грузов', 'грузопассажир', 'автобус', 'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'];
    for (let kw of carKeywords) {
        if (lower.includes(kw)) return 'Водитель';
    }
    return 'Механизатор';
}

// ===== Офлайн-обёртки записей =====
// При отсутствии сети операция сохраняется
// в локальную очередь и отправляется после
// восстановления соединения (js/offline-sync.js).
function offlineSave(op) {
    if (window.OfflineSync && window.OfflineSync.saveOffline(op)) {
        return true;
    }
    return false;
}

async function fleetInsert(table, payload) {
    if (offlineSave({ type: 'insert', table, payload })) return { offline: true };
    const { error } = await window._supabase.from(table).insert(payload);
    if (error) throw error;
    return {};
}

async function fleetUpdate(table, payload, match) {
    if (offlineSave({ type: 'update', table, payload, match })) return { offline: true };
    const { error } = await window._supabase.from(table).update(payload).match(match);
    if (error) throw error;
    return {};
}

async function fleetDelete(table, match) {
    if (offlineSave({ type: 'delete', table, match })) return { offline: true };
    const { error } = await window._supabase.from(table).delete().match(match);
    if (error) throw error;
    return {};
}

// ===== Инициализация модуля =====
// Debounce поиска: рендер не запускается
// на каждый символ ввода.
function debounceFn(fn, wait) {
    let t = null;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

/*
 * Режим редактирования: по умолчанию «Просмотр» —
 * кнопки записи скрыты; включается плавающей
 * кнопкой (админ или mechanization_edit).
 */
if (typeof window._mechEditMode === 'undefined') {
    window._mechEditMode = false;
}

window._mechOnEditModeChange = function () {
    renderFleet();
};

function canEditFleet() {
    // Запись разрешена админу или пользователю
    // с правом mechanization_edit (выдаётся в админке),
    // и только в активном режиме редактирования.
    return (
        window._mechIsAdmin === true ||
        window._mechCanEdit === true
    ) && window._mechEditMode === true;
}

/* Право записи без учёта режима (для видимости элементов). */
function hasFleetEditRight() {
    return window._mechIsAdmin === true || window._mechCanEdit === true;
}

function setEditControlsVisibility() {
    const editable = canEditFleet();

    const toolbarActions = document.getElementById('fleetToolbarActions');
    if (toolbarActions) {
        toolbarActions.style.display = editable ? '' : 'none';
    }

    document.querySelectorAll('.fv2-edit-btn').forEach(node => {
        node.style.display = editable ? '' : 'none';
    });

    document.querySelectorAll('.fv2-tasks-btn').forEach(node => {
        node.style.display = hasFleetEditRight() ? '' : 'none';
    });
}

async function setupFleet() {
    // Поиск
    const searchInput = document.getElementById('vehicleSearchInput');
    if (searchInput) {
        searchInput.value = searchQuery;
        const debouncedRender = debounceFn(() => renderFleet(), 220);
        searchInput.oninput = (e) => {
            searchQuery = e.target.value.toLowerCase();
            debouncedRender();
        };
    }

    // Форма редактирования
    const form = document.getElementById('vForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await handleFormSubmit();
        };
    }

    // Кнопка удаления
    const delBtn = document.getElementById('vDeleteBtn');
    if (delBtn) delBtn.onclick = handleDeleteVehicle;

    // Глобальные функции для доступа из HTML
    window.openVehicleModalForm = (v = null) => {
        if (!canEditFleet()) {
            if (typeof window.showSimpleMessage === 'function') {
                window.showSimpleMessage(
                    hasFleetEditRight()
                        ? 'Режим просмотра'
                        : 'Только просмотр',
                    hasFleetEditRight()
                        ? 'Включите режим редактирования (кнопка ✏️ внизу справа), чтобы изменять данные.'
                        : 'Администратор выдал вам доступ «только просмотр». Редактирование недоступно.'
                );
            }
            return;
        }
        openVehicleModal(v);
    };
    window.closeVModal = () => closeModalOverlay('vFormModal');
    window.openCategoriesModal = () => openCategoriesModalForm();
    window.openTagsModal = () => openTagsModalForm();
    window.openDriversModal = () => openDriversModalForm();
    window.closeDriversModal = () => closeModalOverlay('driversManagementModal');
    window.closeTagsModal = () => closeModalOverlay('tagsManagementModal');
    window.closeCategoriesModal = () => closeModalOverlay('categoriesModal');
    window.closeTasksModal = () => closeModalOverlay('tasksModal');
    window.handleSortChange = (val) => {
        currentSort = val;
        renderFleet();
    };
    window.openHoursModal = () => {
        if (!canEditFleet()) {
            if (typeof window.showSimpleMessage === 'function') {
                window.showSimpleMessage(
                    hasFleetEditRight()
                        ? 'Режим просмотра'
                        : 'Только просмотр',
                    hasFleetEditRight()
                        ? 'Включите режим редактирования (кнопка ✏️ внизу справа), чтобы добавлять наработку.'
                        : 'Администратор выдал вам доступ «только просмотр». Редактирование недоступно.'
                );
            }
            return;
        }
        openHoursModalForm();
    };
    window.closeHoursModal = closeHoursModal;
    window.submitHours = submitHours;
    window.addCustomDriver = addCustomDriver;
    window.deleteCustomDriver = deleteCustomDriver;
    window.addCustomTag = addCustomTag;
    window.deleteCustomTag = deleteCustomTag;
    window.addCustomCategory = addCustomCategory;
    window.deleteCustomCategory = deleteCustomCategory;
    window.openTasksModalForm = openTasksModalForm;
    window.addVehicleTask = addVehicleTask;
    window.completeTask = completeTask;

    // Первая загрузка данных
    await loadAllData(true);

    setEditControlsVisibility();

    // Автообновление каждые 10 секунд,
    // только когда вкладка активна.
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        if (!navigator.onLine) return;
        loadAllData(false);
    }, 10000);
}

// ===== Загрузка данных из Supabase =====
async function loadAllData(isFirstLoad = false) {
    if (!window._supabase) return;
    try {
        const [resVehicles, resTasks, resDrivers, resCategories, resTags] = await Promise.all([
            window._supabase.from('vehicles').select('*'),
            window._supabase.from('vehicle_tasks').select('*').eq('is_completed', false),
            window._supabase.from('fleet_drivers').select('*'),
            window._supabase.from('fleet_categories').select('*'),
            window._supabase.from('fleet_tags').select('*')
        ]);

        if (!resVehicles.error && resVehicles.data) vehicles = resVehicles.data;
        if (!resTasks.error && resTasks.data) tasks = resTasks.data;

        let categoriesChanged = false;

        if (!resDrivers.error && resDrivers.data) {
            drivers = resDrivers.data.map(d => d.name);
        }

        if (!resCategories.error && resCategories.data) {
            const newCategories = resCategories.data.map(c => c.name);
            if (!newCategories.includes("Без категории")) newCategories.push("Без категории");
            if (JSON.stringify(categories) !== JSON.stringify(newCategories)) {
                categories = newCategories;
                categoriesChanged = true;
            }
        }

        if (!resTags.error && resTags.data) {
            baseTags = resTags.data.map(t => ({ id: t.id, name: t.name, color: t.color || '#e2e8f0' }));
        }

        // Автоматическое добавление категорий, которых нет в списке, но есть у техники
        vehicles.forEach(v => {
            const typeName = v.type || "Без категории";
            if (!categories.map(c => c.toLowerCase()).includes(typeName.toLowerCase())) {
                categories.push(typeName);
                categoriesChanged = true;
            }
        });

        if (isFirstLoad || categoriesChanged) {
            renderCategoriesBar();
        }

        // Обновление открытых модалок, если они видны
        if (!isFirstLoad) {
            const driversModal = document.getElementById('driversManagementModal');
            const tagsModal = document.getElementById('tagsManagementModal');
            const categoriesModal = document.getElementById('categoriesModal');

            if (driversModal && driversModal.style.display === 'flex') updateDriversDOMList();
            if (tagsModal && tagsModal.style.display === 'flex') updateTagsDOMList();
            if (categoriesModal && categoriesModal.style.display === 'flex') updateCategoriesDOMList();
        }

        renderFleet();
    } catch (e) {
        console.error("Ошибка синхронизации данных автопарка:", e);
    }
}

// ===== Рендеринг панели категорий =====
function renderCategoriesBar() {
    const bar = document.getElementById('fleetCategoriesBar');
    if (!bar) return;

    const isAllActive = selectedCategory === 'all';
    const allCats = categories.filter(c => c !== 'Без категории');
    const esc = window.escapeHtml || (s => String(s ?? ''));

    // Кнопка «Все» + по одной кнопке на каждую категорию
    let html = `
        <button onclick="window.filterCategory('all')" class="fleet-cat-btn ${isAllActive ? 'fleet-cat-btn--active' : ''}">
            <span class="fleet-cat-btn__icon">🚜</span>
            <span>Все</span>
            <span class="fleet-cat-btn__count">${vehicles.length}</span>
        </button>
        ${allCats.map(c => {
            const isActive = selectedCategory === c;
            const count = vehicles.filter(v => (v.type || 'Без категории') === c).length;
            return `
                <button data-cat="${esc(c)}" class="fleet-cat-btn ${isActive ? 'fleet-cat-btn--active' : ''}">
                    <span>${esc(c)}</span>
                    <span class="fleet-cat-btn__count">${count}</span>
                </button>
            `;
        }).join('')}
        ${(() => {
            const noCatCount = vehicles.filter(v => !v.type || v.type === 'Без категории').length;
            if (noCatCount === 0) return '';
            const isActive = selectedCategory.toLowerCase() === 'без категории';
            return `
                <button data-cat="Без категории" class="fleet-cat-btn ${isActive ? 'fleet-cat-btn--active' : ''}">
                    <span>Без категории</span>
                    <span class="fleet-cat-btn__count">${noCatCount}</span>
                </button>
            `;
        })()}
    `;

    bar.innerHTML = html;

    // Делегирование: имя категории может содержать
    // кавычки, поэтому читаем его из data-атрибута.
    bar.onclick = (e) => {
        const btn = e.target.closest('.fleet-cat-btn[data-cat]');
        if (btn) {
            window.filterCategory(btn.getAttribute('data-cat'));
            return;
        }
        if (e.target.closest('.fleet-cat-btn') && e.target.textContent.includes('Все')) {
            window.filterCategory('all');
        }
    };

    window.filterCategory = (cat) => {
        if (!cat) return;
        selectedCategory = cat;
        renderCategoriesBar();
        renderFleet();
    };
}

// ===== Рендеринг карточек =====
function renderFleet() {
    const container = document.getElementById('fleetGridContainer');
    if (!container) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    let filtered = vehicles.filter(v => {
        const vType = v.type || "Без категории";
        const modelStr = v.model ? v.model.toLowerCase() : '';
        const plateStr = v.plate ? v.plate.toLowerCase() : '';
        const invStr = v.inv_number ? v.inv_number.toLowerCase() : '';
        const vinStr = v.vin_number ? v.vin_number.toLowerCase() : '';
        const tagsStr = v.tags ? v.tags.toLowerCase() : '';
        const driverStr = v.notes ? v.notes.toLowerCase() : '';

        const queryMatch = modelStr.includes(searchQuery) || plateStr.includes(searchQuery) || invStr.includes(searchQuery) || vinStr.includes(searchQuery) || tagsStr.includes(searchQuery) || driverStr.includes(searchQuery);
        if (!queryMatch) return false;

        if (selectedCategory !== 'all') {
            if (vType.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        if (currentSort === 'name_asc') return (a.model || '').localeCompare(b.model || '');
        if (currentSort === 'name_desc') return (b.model || '').localeCompare(a.model || '');
        if (currentSort === 'hours_desc') return (b.current_hours || 0) - (a.current_hours || 0);
        return 0;
    });

    let html = "";
    const uniqueTypesInFiltered = [...new Set(filtered.map(v => v.type || "Без категории"))];

    const esc = window.escapeHtml || (s => String(s ?? ''));
    const jsStr = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');

    uniqueTypesInFiltered.forEach(cat => {
        const catList = filtered.filter(v => (v.type || "Без категории").toLowerCase() === cat.toLowerCase());
        if (catList.length === 0) return;

        html += `
            <div class="fleet-group">
                <div class="fleet-group-header">
                    <h3 class="fleet-group-title">${esc(cat)}</h3>
                    <span class="fleet-group-count">${catList.length} ед.</span>
                </div>
                <div class="fleet-grid">
                    ${catList.map(v => {
                        const now = new Date();

                        const formatDocStatus = (dateStr) => {
                            if (!dateStr) return { text: '—', cls: 'is-muted', sub: null, urgent: false };
                            const diffDays = Math.ceil((new Date(dateStr) - now) / (1000 * 60 * 60 * 24));
                            const formattedDate = new Date(dateStr).toLocaleDateString('ru-RU');
                            if (diffDays <= 0) {
                                return { text: formattedDate, sub: 'Просрочено', cls: 'is-overdue', urgent: true };
                            }
                            if (diffDays <= 30) {
                                return { text: formattedDate, sub: `${diffDays} дн.`, cls: 'is-soon', urgent: true };
                            }
                            return { text: formattedDate, sub: null, cls: 'is-ok', urgent: false };
                        };

                        const toInfo = formatDocStatus(v.inspection_date);
                        const insInfo = formatDocStatus(v.insurance_date);
                        const vehicleTagsArray = v.tags ? v.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                        const vTasks = tasks.filter(t => t.vehicle_id === v.id);
                        const unit = getUnitByCategory(v.type);
                        const label = unit === 'км' ? 'Пробег' : 'Наработка';
                        const role = getDriverRole(v.type);

                        // Статус карточки
                        let cardStatusClass = '';
                        const isBroken = vehicleTagsArray.some(t => t.toLowerCase() === 'неисправен');
                        const isWarranty = vehicleTagsArray.some(t => t.toLowerCase() === 'гарантия');
                        if (isBroken) cardStatusClass = 'is-broken';
                        else if (isWarranty) cardStatusClass = 'is-warranty';

                        const statusLabel = isBroken ? 'Неисправен' : isWarranty ? 'Гарантия' : 'В работе';

                        // Наработка — форматирование с разрядами
                        const hoursFormatted = (v.current_hours || 0).toLocaleString('ru-RU');

                        // Теги без статусных (они уже в шапке)
                        const statusTagNames = ['неисправен', 'гарантия'];
                        const extraTags = vehicleTagsArray.filter(t => !statusTagNames.includes(t.toLowerCase()));

                        // Данные карточки для модалки — через data-атрибут
                        const cardData = jsStr(JSON.stringify(v));

                        return `
                            <div class="fleet-card-v2 ${cardStatusClass}" data-vehicle="${cardData}">
                                <div class="fv2-header">
                                    <div class="fv2-header-left">
                                        <div class="fv2-status-dot ${isBroken ? 'fv2-dot-red' : isWarranty ? 'fv2-dot-blue' : 'fv2-dot-green'}"></div>
                                        <span class="fv2-status-label">${statusLabel}</span>
                                    </div>
                                    <div class="fv2-header-right">
                                        ${extraTags.map(t => {
                                            const knownTag = baseTags.find(bt => bt.name.toLowerCase() === t.toLowerCase());
                                            const badgeBg = knownTag ? knownTag.color : '#e2e8f0';
                                            return `<span class="fleet-tag" style="background-color:${esc(badgeBg)};">${esc(t)}</span>`;
                                        }).join('')}
                                        <button class="fv2-edit-btn" data-vehicle-edit="${cardData}" title="Редактировать">✏️</button>
                                    </div>
                                </div>

                                <div class="fv2-model">${esc(v.model)}</div>

                                <div class="fv2-ids">
                                    <div class="fleet-plate">${esc(v.plate || 'БЕЗ НОМЕРА')}</div>
                                    ${v.inv_number ? `<span class="fleet-inv">№ ${esc(v.inv_number)}</span>` : ''}
                                </div>

                                ${v.vin_number ? `<div class="fv2-vin">VIN: ${esc(v.vin_number)}</div>` : ''}

                                <div class="fv2-driver">
                                    <span class="fv2-driver-role">👤 ${role}</span>
                                    <span class="fv2-driver-name">${esc(v.notes || '— не закреплён —')}</span>
                                </div>

                                <div class="fv2-divider"></div>

                                <div class="fv2-metrics">
                                    <div class="fv2-metric">
                                        <span class="fv2-metric-label">${label}</span>
                                        <span class="fv2-metric-value">${hoursFormatted} <span class="fv2-metric-unit">${unit}</span></span>
                                    </div>
                                    <div class="fv2-metric">
                                        <span class="fv2-metric-label">Техосмотр</span>
                                        <span class="fv2-doc-val ${toInfo.cls}">
                                            ${esc(toInfo.text)}
                                            ${toInfo.sub ? `<span class="fv2-doc-sub">${esc(toInfo.sub)}</span>` : ''}
                                        </span>
                                    </div>
                                    <div class="fv2-metric">
                                        <span class="fv2-metric-label">Страховка</span>
                                        <span class="fv2-doc-val ${insInfo.cls}">
                                            ${esc(insInfo.text)}
                                            ${insInfo.sub ? `<span class="fv2-doc-sub">${esc(insInfo.sub)}</span>` : ''}
                                        </span>
                                    </div>
                                </div>

                                <button class="fv2-tasks-btn ${vTasks.length > 0 ? 'fv2-tasks-btn--has' : ''}" data-vehicle-tasks="${v.id}" data-vehicle-tasks-name="${jsStr(v.model)}">
                                    <span class="fv2-tasks-icon">📋</span>
                                    <span>Задачи</span>
                                    ${vTasks.length > 0 ? `<span class="fv2-tasks-badge">${vTasks.length}</span>` : ''}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `<div class="fleet-empty">Техника не найдена</div>`;

    // Делегирование кликов по карточкам: клик по карточке
    // открывает редактирование (при праве), кнопки задач —
    // свою модалку. Имена/номера содержат кавычки —
    // поэтому данные читаются из data-атрибутов.
    container.onclick = (e) => {
        const tasksBtn = e.target.closest('[data-vehicle-tasks]');
        if (tasksBtn) {
            e.stopPropagation();
            if (!hasFleetEditRight()) return;
            openTasksModalForm(
                parseInt(tasksBtn.getAttribute('data-vehicle-tasks'), 10),
                tasksBtn.getAttribute('data-vehicle-tasks-name')
            );
            return;
        }

        const editBtn = e.target.closest('[data-vehicle-edit]');
        if (editBtn) {
            e.stopPropagation();
            try {
                window.openVehicleModalForm(JSON.parse(editBtn.getAttribute('data-vehicle-edit')));
            } catch (err) { /* ignore */ }
            return;
        }

        const card = e.target.closest('.fleet-card-v2[data-vehicle]');
        if (card) {
            try {
                window.openVehicleModalForm(JSON.parse(card.getAttribute('data-vehicle')));
            } catch (err) { /* ignore */ }
        }
    };

    setEditControlsVisibility();
    window.scrollTo(window.scrollX, scrollTop);
}

// ===== Модалка редактирования техники =====
function openVehicleModal(vehicle = null) {
    const modal = document.getElementById('vFormModal');
    const title = document.getElementById('vModalTitle');
    const delBtn = document.getElementById('vDeleteBtn');
    if (!modal) return;

    const catSelect = document.getElementById('vCategory');
    if (catSelect) {
        catSelect.innerHTML = categories.map(c => `<option value="${window.escapeHtml ? window.escapeHtml(c) : c}">${window.escapeHtml ? window.escapeHtml(c) : c}</option>`).join('');
    }

    const driverSelect = document.getElementById('vDriver');
    if (driverSelect) {
        driverSelect.innerHTML = `<option value="">— Не закреплен —</option>` +
            drivers.map(d => `<option value="${window.escapeHtml ? window.escapeHtml(d) : d}">${window.escapeHtml ? window.escapeHtml(d) : d}</option>`).join('');
    }

    const tagsBox = document.getElementById('tagsCheckboxContainer');
    if (tagsBox) {
        tagsBox.innerHTML = baseTags.map(t => `
            <label style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.3); font-size: 0.72rem; font-weight: 800; color: #0b1728; background-color: ${t.color}; cursor: pointer; user-select: none;">
                <input type="checkbox" name="vTags" value="${window.escapeHtml ? window.escapeHtml(t.name) : t.name}" style="width: 14px; height: 14px; accent-color: #10b981; cursor: pointer;">
                ${window.escapeHtml ? window.escapeHtml(t.name) : t.name}
            </label>
        `).join('');
    }

    document.getElementById('vForm').reset();
    openModalOverlay('vFormModal');

    if (vehicle) {
        title.innerText = "Редактирование параметров техники";
        document.getElementById('vId').value = vehicle.id;
        document.getElementById('vCategory').value = vehicle.type || 'Без категории';
        document.getElementById('vName').value = vehicle.model || '';
        document.getElementById('vDriver').value = vehicle.notes || '';
        document.getElementById('vPlate').value = vehicle.plate || '';
        document.getElementById('vInv').value = vehicle.inv_number || '';
        document.getElementById('vHours').value = vehicle.current_hours || 0;
        document.getElementById('vVin').value = vehicle.vin_number || '';
        document.getElementById('vToDate').value = vehicle.inspection_date || '';
        document.getElementById('vInsuranceDate').value = vehicle.insurance_date || '';

        if (vehicle.tags) {
            const arr = vehicle.tags.split(',').map(t => t.trim());
            arr.forEach(t => {
                const cb = document.querySelector(`input[name="vTags"][value="${CSS.escape ? CSS.escape(t) : t}"]`);
                if (cb) cb.checked = true;
            });
        }
        if (delBtn) delBtn.classList.remove('hidden');
    } else {
        title.innerText = "Добавление новой техники";
        document.getElementById('vId').value = '';
        document.getElementById('vCategory').value = 'Без категории';
        document.getElementById('vDriver').value = '';
        if (delBtn) delBtn.classList.add('hidden');
    }
}

async function handleFormSubmit() {
    if (!canEditFleet() || !window._supabase) return;
    const id = document.getElementById('vId').value;
    const selectedTags = [];
    document.querySelectorAll('input[name="vTags"]:checked').forEach(cb => selectedTags.push(cb.value));

    const payload = {
        type: document.getElementById('vCategory').value,
        model: document.getElementById('vName').value,
        notes: document.getElementById('vDriver').value,
        plate: document.getElementById('vPlate').value,
        inv_number: document.getElementById('vInv').value,
        current_hours: parseInt(document.getElementById('vHours').value) || 0,
        vin_number: document.getElementById('vVin').value || null,
        inspection_date: document.getElementById('vToDate').value || null,
        insurance_date: document.getElementById('vInsuranceDate').value || null,
        tags: selectedTags.join(', ')
    };

    try {
        let result;
        if (id) {
            result = await fleetUpdate('vehicles', payload, { id: id });
        } else {
            result = await fleetInsert('vehicles', [payload]);
        }
        window.closeVModal();
        if (result.offline) {
            if (window.OfflineSync) {
                window.OfflineSync.showToast('Нет сети — изменения сохранены локально');
            }
        } else {
            await loadAllData(true);
        }
    } catch (e) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
    }
}

async function handleDeleteVehicle() {
    if (!canEditFleet()) return;
    const id = document.getElementById('vId').value;
    if (!id || !window._supabase) return;
    if (confirm("Вы точно хотите удалить технику?")) {
        try {
            const result = await fleetDelete('vehicles', { id: id });
            window.closeVModal();
            if (result.offline) {
                if (window.OfflineSync) {
                    window.OfflineSync.showToast('Нет сети — удаление сохранено локально');
                }
            } else {
                await loadAllData(true);
            }
        } catch (e) {
            window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
        }
    }
}

// ===== Управление водителями =====
function openDriversModalForm() {
    // Справочники (водители/теги/категории) доступны
    // только пользователям с правом записи.
    if (!hasFleetEditRight()) {
        window.showSimpleMessage && window.showSimpleMessage(
            'Только просмотр',
            'Администратор выдал вам доступ «только просмотр». Редактирование недоступно.'
        );
        return;
    }
    openModalOverlay('driversManagementModal');
    updateDriversDOMList();
}

function updateDriversDOMList() {
    const list = document.getElementById('modalDriversList');
    if (!list) return;
    const esc = window.escapeHtml || (s => String(s ?? ''));
    list.innerHTML = drivers.map(d => `
        <div class="fleet-list-row">
            <span class="fleet-list-name">👤 ${esc(d)}</span>
            <button data-driver-del="${esc(d)}" class="fleet-list-delete">Удалить</button>
        </div>
    `).join('');

    list.onclick = (e) => {
        const btn = e.target.closest('[data-driver-del]');
        if (btn) deleteCustomDriver(btn.getAttribute('data-driver-del'));
    };
}

async function addCustomDriver() {
    if (!hasFleetEditRight()) return;
    const input = document.getElementById('newDriverNameInput');
    if (!input || !input.value.trim()) return;
    try {
        await fleetInsert('fleet_drivers', [{ name: input.value.trim() }]);
        input.value = "";
        await loadAllData(false);
    } catch (e) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
    }
}

async function deleteCustomDriver(driverName) {
    if (!hasFleetEditRight()) return;
    if (confirm(`Удалить вод/мех-а "${driverName}" из базы данных?`)) {
        try {
            await fleetDelete('fleet_drivers', { name: driverName });
            await loadAllData(false);
        } catch (e) {
            window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
        }
    }
}

// ===== Управление тегами =====
function openTagsModalForm() {
    if (!hasFleetEditRight()) {
        window.showSimpleMessage && window.showSimpleMessage(
            'Только просмотр',
            'Администратор выдал вам доступ «только просмотр». Редактирование недоступно.'
        );
        return;
    }
    openModalOverlay('tagsManagementModal');
    updateTagsDOMList();
}

function updateTagsDOMList() {
    const list = document.getElementById('modalTagsList');
    if (!list) return;
    const esc = window.escapeHtml || (s => String(s ?? ''));
    list.innerHTML = baseTags.map(t => `
        <div class="fleet-list-row">
            <div class="fleet-list-tag">
                <span class="fleet-list-dot" style="background-color: ${t.color};"></span>
                <span class="fleet-list-name">${esc(t.name)}</span>
            </div>
            <button data-tag-del="${t.id}" class="fleet-list-delete">Удалить</button>
        </div>
    `).join('');

    list.onclick = (e) => {
        const btn = e.target.closest('[data-tag-del]');
        if (btn) deleteCustomTag(parseInt(btn.getAttribute('data-tag-del'), 10));
    };
}

async function addCustomTag() {
    if (!hasFleetEditRight()) return;
    const nameInput = document.getElementById('newTagNameInput');
    const colorInput = document.getElementById('newTagColorInput');
    if (!nameInput || !nameInput.value.trim()) return;
    try {
        await fleetInsert('fleet_tags', [{
            name: nameInput.value.trim(),
            color: colorInput.value
        }]);
        nameInput.value = "";
        await loadAllData(false);
    } catch (e) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
    }
}

async function deleteCustomTag(tagId) {
    if (!hasFleetEditRight()) return;
    const target = baseTags.find(t => t.id === tagId);
    if (target && confirm(`Удалить тег "${target.name}" из базы данных?`)) {
        try {
            await fleetDelete('fleet_tags', { id: tagId });
            await loadAllData(false);
        } catch (e) {
            window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
        }
    }
}

// ===== Управление категориями =====
function openCategoriesModalForm() {
    if (!hasFleetEditRight()) {
        window.showSimpleMessage && window.showSimpleMessage(
            'Только просмотр',
            'Администратор выдал вам доступ «только просмотр». Редактирование недоступно.'
        );
        return;
    }
    openModalOverlay('categoriesModal');
    updateCategoriesDOMList();
}

function updateCategoriesDOMList() {
    const list = document.getElementById('modalCategoriesList');
    if (!list) return;
    const esc = window.escapeHtml || (s => String(s ?? ''));
    list.innerHTML = categories.map(c => `
        <div class="fleet-list-row">
            <span class="fleet-list-name">${esc(c)}</span>
            ${c !== 'Без категории' ? `<button data-cat-del="${esc(c)}" class="fleet-list-delete">Удалить</button>` : ''}
        </div>
    `).join('');

    list.onclick = (e) => {
        const btn = e.target.closest('[data-cat-del]');
        if (btn) deleteCustomCategory(btn.getAttribute('data-cat-del'));
    };
}

async function addCustomCategory() {
    if (!hasFleetEditRight()) return;
    const input = document.getElementById('newCatInput');
    if (!input || !input.value.trim()) return;
    try {
        await fleetInsert('fleet_categories', [{ name: input.value.trim() }]);
        input.value = "";
        await loadAllData(false);
    } catch (e) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
    }
}

async function deleteCustomCategory(catName) {
    if (!hasFleetEditRight()) return;
    if (confirm(`Удалить категорию "${catName}"? Все машины из неё будут переведены в "Без категории".`)) {
        try {
            await fleetUpdate('vehicles', { type: 'Без категории' }, { type: catName });
            await fleetDelete('fleet_categories', { name: catName });
            await loadAllData(false);
        } catch (err) {
            window.showSimpleMessage && window.showSimpleMessage('Ошибка', err.message);
        }
    }
}

// ===== Задачи по технике =====
function openTasksModalForm(vehicleId, vehicleName) {
    const modal = document.getElementById('tasksModal');
    if (!modal) return;
    document.getElementById('taskVehicleId').value = vehicleId;
    document.getElementById('taskVehicleName').value = vehicleName;
    document.getElementById('tasksModalSubtitle').innerText = `Техника: ${vehicleName}`;
    document.getElementById('newTaskText').value = "";
    openModalOverlay('tasksModal');
    renderTasksListInsideModal();
}

function renderTasksListInsideModal() {
    const vId = parseInt(document.getElementById('taskVehicleId').value);
    const list = document.getElementById('vehicleTasksList');
    if (!list) return;
    const vTasks = tasks.filter(t => t.vehicle_id === vId);
    if (vTasks.length === 0) {
        list.innerHTML = `<div class="fleet-tasks-empty">Нет активных задач</div>`;
        return;
    }
    const esc = window.escapeHtml || (s => String(s ?? ''));
    list.innerHTML = vTasks.map(t => `
        <div class="fleet-task-row">
            <span>${esc(t.text)}</span>
            ${hasFleetEditRight() ? `<button data-task-done="${t.id}" class="fleet-task-done">Готово</button>` : ''}
        </div>
    `).join('');

    list.onclick = (e) => {
        const btn = e.target.closest('[data-task-done]');
        if (btn) completeTask(parseInt(btn.getAttribute('data-task-done'), 10));
    };
}

async function addVehicleTask() {
    if (!hasFleetEditRight()) return;
    const vId = document.getElementById('taskVehicleId').value;
    const vName = document.getElementById('taskVehicleName').value;
    const textInput = document.getElementById('newTaskText');
    if (!textInput || !textInput.value.trim()) return;
    try {
        await fleetInsert('vehicle_tasks', [{ vehicle_id: parseInt(vId), vehicle_name: vName, text: textInput.value.trim(), is_completed: false }]);
        textInput.value = "";
        await loadAllData(true);
        renderTasksListInsideModal();
    } catch (e) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
    }
}

async function completeTask(taskId) {
    if (!hasFleetEditRight()) return;
    try {
        await fleetUpdate('vehicle_tasks', { is_completed: true }, { id: taskId });
        await loadAllData(true);
        const modal = document.getElementById('tasksModal');
        if (modal && modal.style.display === 'flex') renderTasksListInsideModal();
    } catch (e) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', e.message);
    }
}

// ===== Добавление часов через модалку =====
async function openHoursModalForm() {
    const modal = document.getElementById('hoursModal');
    if (!modal) return;
    openModalOverlay('hoursModal');

    const select = document.getElementById('hoursVehicleSelect');
    if (!select) return;
    if (vehicles.length === 0) await loadAllData(false);
    const sorted = [...vehicles].sort((a, b) => (a.model || '').localeCompare(b.model || ''));
    select.innerHTML = sorted.map(v => {
        const unit = getUnitByCategory(v.type);
        return `<option value="${v.id}">${window.escapeHtml ? window.escapeHtml(v.model) : v.model} ${v.plate ? '[' + v.plate + ']' : '[б/н]'} (${v.current_hours || 0} ${unit})</option>`;
    }).join('');
    document.getElementById('hoursInput').value = '';
}

function closeHoursModal() {
    closeModalOverlay('hoursModal');
}

async function submitHours() {
    if (!canEditFleet()) return;
    const select = document.getElementById('hoursVehicleSelect');
    const input = document.getElementById('hoursInput');
    const vehicleId = select.value;
    const hours = parseFloat(input.value);
    if (!vehicleId) {
        window.showSimpleMessage && window.showSimpleMessage('Внимание', 'Выберите технику');
        return;
    }
    if (isNaN(hours) || hours <= 0) {
        window.showSimpleMessage && window.showSimpleMessage('Внимание', 'Введите положительное число часов');
        return;
    }
    try {
        if (offlineSave({ type: 'hours', table: 'vehicles', match: { id: vehicleId }, hours: hours })) {
            /* Офлайн: прибавляем часы к локальной копии,
               синхронизация пересчитает сумму на сервере. */
            const v = vehicles.find(x => String(x.id) === String(vehicleId));
            if (v) v.current_hours = (v.current_hours || 0) + hours;
            closeHoursModal();
            renderFleet();
            if (window.OfflineSync) {
                window.OfflineSync.showToast('Нет сети — наработка сохранена локально');
            }
            return;
        }

        const { data, error } = await window._supabase
            .from('vehicles')
            .select('current_hours')
            .eq('id', vehicleId)
            .single();
        if (error) throw error;
        const current = data.current_hours || 0;
        const newHours = current + hours;
        const { error: updateError } = await window._supabase
            .from('vehicles')
            .update({ current_hours: newHours })
            .eq('id', vehicleId);
        if (updateError) throw updateError;
        closeHoursModal();
        await loadAllData(false);
    } catch (err) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', 'Не удалось сохранить наработку: ' + err.message);
    }
}
