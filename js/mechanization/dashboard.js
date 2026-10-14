/*
 * =====================================================
 * МОДУЛЬ «МЕХАНИЗАЦИЯ» — Панель управления (Статистика)
 *
 * Полностью переработанный интерфейс: KPI-карточки
 * с индикаторами состояния парка, панели задач,
 * контроля ТО по гарантии и документов.
 * Бизнес-логика и схема БД (vehicles, vehicle_tasks)
 * сохранены без изменений.
 * =====================================================
 */

const DASH_STYLES = `
<style id="dash-styles">
.dash-root {
    display: flex;
    flex-direction: column;
    gap: 22px;
    max-width: 1400px;
    margin: 0 auto;
}

/* ---------- Шапка ---------- */
.dash-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
    padding: 24px 26px;
}

.dash-header-titles h1 {
    margin: 0 0 6px;
    color: #fff;
    font-size: 1.55rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 12px;
}

.dash-header-titles p {
    margin: 0;
    color: var(--muted);
    font-size: 0.88rem;
    font-weight: 500;
}

.dash-header-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--subtle);
    font-size: 0.76rem;
    font-weight: 700;
}

.dash-live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px rgba(52, 211, 153, 0.7);
    animation: dash-pulse 2s ease-in-out infinite;
}

@keyframes dash-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
}

/* ---------- KPI ---------- */
.dash-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
}

.dash-kpi {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px 22px 18px;
    overflow: hidden;
    transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease, box-shadow 220ms ease;
}

.dash-kpi:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.22);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
}

.dash-kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.dash-kpi-label {
    color: var(--muted);
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
}

.dash-kpi-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    font-size: 1.15rem;
}

.dash-kpi-value {
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 2.15rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
}

.dash-kpi-value .dash-kpi-unit {
    color: var(--subtle);
    font-family: 'Exo 2', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    margin-left: 4px;
}

.dash-kpi-bar {
    height: 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.07);
    overflow: hidden;
}

.dash-kpi-bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--green-dark), var(--green));
    box-shadow: 0 0 10px rgba(52, 211, 153, 0.45);
    transition: width 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.dash-kpi--green .dash-kpi-bar-fill { background: linear-gradient(90deg, #10b981, #34d399); box-shadow: 0 0 10px rgba(52, 211, 153, 0.45); }
.dash-kpi--blue .dash-kpi-bar-fill { background: linear-gradient(90deg, #38bdf8, #7dd3fc); box-shadow: 0 0 10px rgba(125, 211, 252, 0.45); }
.dash-kpi--amber .dash-kpi-bar-fill { background: linear-gradient(90deg, #d97706, #fbbf24); box-shadow: 0 0 10px rgba(251, 191, 36, 0.45); }
.dash-kpi--red .dash-kpi-bar-fill { background: linear-gradient(90deg, #e11d48, #fb7185); box-shadow: 0 0 10px rgba(251, 113, 133, 0.45); }

.dash-kpi--red .dash-kpi-icon { border-color: rgba(251, 113, 133, 0.4); background: rgba(251, 113, 133, 0.1); }
.dash-kpi--amber .dash-kpi-icon { border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.1); }
.dash-kpi--blue .dash-kpi-icon { border-color: rgba(125, 211, 252, 0.4); background: rgba(125, 211, 252, 0.1); }
.dash-kpi--green .dash-kpi-icon { border-color: rgba(52, 211, 153, 0.4); background: rgba(52, 211, 153, 0.1); }

/* ---------- Панели ---------- */
.dash-panels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 16px;
    align-items: start;
}

.dash-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 22px;
}

.dash-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--line);
}

.dash-panel-title {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0;
    color: #fff;
    font-size: 0.94rem;
    font-weight: 800;
    letter-spacing: -0.01em;
}

.dash-panel-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 20px;
    padding: 0 7px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 800;
}

.dash-panel-badge--warn {
    border-color: rgba(251, 191, 36, 0.5);
    background: rgba(251, 191, 36, 0.12);
    color: var(--amber);
}

.dash-panel-badge--danger {
    border-color: rgba(251, 113, 133, 0.5);
    background: rgba(251, 113, 133, 0.12);
    color: var(--red);
}

.dash-panel-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 120px;
    max-height: 460px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.dash-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 28px 16px;
    border: 1px dashed rgba(255, 255, 255, 0.14);
    border-radius: 14px;
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 700;
    text-align: center;
}

.dash-empty-ok {
    border-color: rgba(52, 211, 153, 0.35);
    background: rgba(52, 211, 153, 0.06);
    color: var(--green);
}

/* ---------- Форма задачи ---------- */
.dash-task-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.03);
}

.dash-task-form-row {
    display: flex;
    gap: 8px;
}

.dash-input,
.dash-select {
    width: 100%;
    min-height: 42px;
    padding: 9px 13px;
    outline: none;
    border: 1px solid var(--line);
    border-radius: 11px;
    background: var(--input-bg);
    color: #fff;
    font-family: inherit;
    font-size: 0.84rem;
    font-weight: 500;
    color-scheme: dark;
    transition: border-color 160ms ease, box-shadow 160ms ease;
}

.dash-input:focus,
.dash-select:focus {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.dash-add-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 46px;
    min-height: 42px;
    padding: 9px 13px;
    border: 1px solid var(--green);
    border-radius: 11px;
    background: rgba(52, 211, 153, 0.15);
    color: var(--green);
    font-size: 0.95rem;
    font-weight: 800;
    cursor: pointer;
    transition: background-color 160ms ease, transform 160ms ease;
}

.dash-add-btn:hover { background: rgba(52, 211, 153, 0.24); }
.dash-add-btn:active { transform: scale(0.95); }

/* ---------- Карточки алертов ---------- */
.dash-alert {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 13px 14px;
    border-radius: 13px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.03);
    animation: dash-card-in 300ms ease both;
}

@keyframes dash-card-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.dash-alert--task { border-color: rgba(251, 191, 36, 0.38); background: rgba(251, 191, 36, 0.07); }
.dash-alert--info { border-color: rgba(125, 211, 252, 0.32); background: rgba(125, 211, 252, 0.06); }
.dash-alert--warning { border-color: rgba(251, 191, 36, 0.42); background: rgba(251, 191, 36, 0.09); }
.dash-alert--danger { border-color: rgba(251, 113, 133, 0.45); background: rgba(251, 113, 133, 0.09); }

.dash-alert-main { flex: 1; min-width: 0; }

.dash-alert-title-row {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    margin-bottom: 5px;
}

.dash-alert-name {
    font-size: 0.86rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.01em;
}

.dash-alert-plate {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--subtle);
    padding: 1px 6px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.04);
}

.dash-alert-text {
    margin: 0;
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.45;
    word-break: break-word;
}

.dash-alert-text b { color: #fff; }

.dash-alert-text .dash-critical { color: var(--red); font-weight: 800; }

.dash-alert-action {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 6px 11px;
    border: 1px solid transparent;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--muted);
    font-size: 0.74rem;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

.dash-alert-action:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border-color: var(--line-bright);
}

.dash-alert-action--done {
    border-color: rgba(52, 211, 153, 0.5);
    background: rgba(52, 211, 153, 0.13);
    color: var(--green);
}

.dash-alert-action--done:hover {
    background: rgba(52, 211, 153, 0.22);
    color: #6ee7b7;
}

/* ---------- Фильтр гарантии ---------- */
.dash-filter-wrap { position: relative; }

.dash-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 6px 12px;
    border: 1px solid var(--line-bright);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--muted);
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
    transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

.dash-filter-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }

.dash-filter-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 60;
    display: none;
    width: 270px;
    max-width: calc(100vw - 44px);
    max-height: 320px;
    overflow-y: auto;
    padding: 14px;
    border: 1px solid var(--line-bright);
    border-radius: 16px;
    background: var(--glass-strong);
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
}

.dash-filter-menu.open { display: block; }

.dash-filter-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--line);
}

.dash-filter-head p {
    margin: 0;
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.dash-filter-reset {
    border: none;
    background: none;
    color: var(--green);
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
}

.dash-filter-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 8px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    transition: background-color 140ms ease;
}

.dash-filter-item:hover { background: rgba(255, 255, 255, 0.05); }

.dash-filter-item input {
    width: 15px;
    height: 15px;
    accent-color: #10b981;
    cursor: pointer;
}

.dash-filter-item span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dash-filter-stats {
    padding-top: 10px;
    margin-top: 10px;
    border-top: 1px solid var(--line);
    color: var(--subtle);
    font-size: 0.7rem;
    font-weight: 700;
    text-align: center;
}

/* ---------- Модалка ---------- */
.dash-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(3, 8, 16, 0.74);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.dash-modal.open { display: flex; }

.dash-modal-box {
    position: relative;
    width: 100%;
    max-width: 460px;
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    padding: 24px;
    border: 1px solid var(--line-bright);
    border-radius: 22px;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), transparent 44%), rgba(15, 31, 52, 0.98);
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.58);
}

.dash-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--muted);
    font-size: 1.05rem;
    cursor: pointer;
    transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

.dash-modal-close:hover { color: #fff; background: rgba(255, 255, 255, 0.1); border-color: var(--line); }

.dash-modal-head { margin-bottom: 18px; }

.dash-modal-head h4 {
    margin: 0 0 5px;
    color: #fff;
    font-size: 1.12rem;
    font-weight: 800;
    letter-spacing: -0.01em;
}

.dash-modal-head p {
    margin: 0;
    font-family: 'JetBrains Mono', monospace;
    color: var(--muted);
    font-size: 0.82rem;
}

.dash-modal-section {
    padding-top: 16px;
    border-top: 1px solid var(--line);
}

.dash-modal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.dash-modal-field { margin-bottom: 14px; }
.dash-modal-grid .dash-modal-field { margin-bottom: 0; }

.dash-modal-save {
    width: 100%;
    margin-top: 18px;
    min-height: 44px;
    border: 1px solid var(--green);
    border-radius: 12px;
    background: rgba(52, 211, 153, 0.18);
    color: var(--green);
    font-size: 0.86rem;
    font-weight: 800;
    cursor: pointer;
    transition: background-color 160ms ease, transform 160ms ease;
}

.dash-modal-save:hover { background: rgba(52, 211, 153, 0.27); }
.dash-modal-save:active { transform: scale(0.98); }

.dash-ro-notice {
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
}

@media (max-width: 700px) {
    .dash-header { padding: 18px; }
    .dash-kpi-value { font-size: 1.8rem; }
    .dash-modal-grid { grid-template-columns: 1fr; }
}
</style>
`;

export async function init() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = DASH_STYLES + `
        <div class="dash-root">
            <div class="glass-panel dash-header">
                <div class="dash-header-titles">
                    <h1>📊 Панель управления</h1>
                    <p>Оперативная сводка по филиалу СХК «Великополье»</p>
                </div>
                <div class="dash-header-meta">
                    <span class="dash-live-dot"></span>
                    <span>обновляется автоматически</span>
                </div>
            </div>

            <div class="dash-kpi-grid">
                <div class="glass-panel dash-kpi">
                    <div class="dash-kpi-top">
                        <span class="dash-kpi-label">Автопарк</span>
                        <span class="dash-kpi-icon">🚜</span>
                    </div>
                    <div class="dash-kpi-value" id="dashTotal">0<span class="dash-kpi-unit">ед.</span></div>
                    <div class="dash-kpi-bar"><div class="dash-kpi-bar-fill" id="dashTotalBar" style="width:100%"></div></div>
                </div>
                <div class="glass-panel dash-kpi dash-kpi--green">
                    <div class="dash-kpi-top">
                        <span class="dash-kpi-label">Готово</span>
                        <span class="dash-kpi-icon">✅</span>
                    </div>
                    <div class="dash-kpi-value" id="dashReady">0<span class="dash-kpi-unit">ед.</span></div>
                    <div class="dash-kpi-bar"><div class="dash-kpi-bar-fill" id="dashReadyBar" style="width:0%"></div></div>
                </div>
                <div class="glass-panel dash-kpi dash-kpi--blue">
                    <div class="dash-kpi-top">
                        <span class="dash-kpi-label">Хранение</span>
                        <span class="dash-kpi-icon">🏠</span>
                    </div>
                    <div class="dash-kpi-value" id="dashStorage">0<span class="dash-kpi-unit">ед.</span></div>
                    <div class="dash-kpi-bar"><div class="dash-kpi-bar-fill" id="dashStorageBar" style="width:0%"></div></div>
                </div>
                <div class="glass-panel dash-kpi dash-kpi--red">
                    <div class="dash-kpi-top">
                        <span class="dash-kpi-label">Ремонт</span>
                        <span class="dash-kpi-icon">🔧</span>
                    </div>
                    <div class="dash-kpi-value" id="dashInRepair">0<span class="dash-kpi-unit">ед.</span></div>
                    <div class="dash-kpi-bar"><div class="dash-kpi-bar-fill" id="dashInRepairBar" style="width:0%"></div></div>
                </div>
            </div>

            <div class="dash-panels">
                <div class="glass-panel dash-panel">
                    <div class="dash-panel-head">
                        <h3 class="dash-panel-title"><span>📋</span> Задачи</h3>
                        <span class="dash-panel-badge" id="taskCounter">0</span>
                    </div>
                    <div class="dash-task-form" id="dashTaskForm">
                        <select id="taskVehicleSelect" class="dash-select">
                            <option value="">— Общая заметка —</option>
                        </select>
                        <div class="dash-task-form-row">
                            <input type="text" id="taskTextInput" class="dash-input" placeholder="Текст задачи...">
                            <button onclick="window.dashAddRepairTask()" class="dash-add-btn" title="Добавить задачу">＋</button>
                        </div>
                    </div>
                    <div class="dash-panel-body" id="containerTasks">
                        <div class="dash-empty">Загрузка...</div>
                    </div>
                </div>

                <div class="glass-panel dash-panel">
                    <div class="dash-panel-head">
                        <h3 class="dash-panel-title"><span>🛠️</span> Гарантия · контроль ТО</h3>
                        <div class="dash-filter-wrap">
                            <button onclick="window.dashToggleFilterDropdown(event)" class="dash-filter-btn">⚙️ Фильтр</button>
                            <div class="dash-filter-menu" id="dashFilterDropdown">
                                <div class="dash-filter-head">
                                    <p>Отображать</p>
                                    <button onclick="window.dashResetFilter()" class="dash-filter-reset">Показать все</button>
                                </div>
                                <div id="dashFilterCheckboxes"></div>
                                <div class="dash-filter-stats" id="dashFilterStats"></div>
                            </div>
                        </div>
                    </div>
                    <div class="dash-panel-body" id="containerWarranty">
                        <div class="dash-empty">Загрузка...</div>
                    </div>
                </div>

                <div class="glass-panel dash-panel">
                    <div class="dash-panel-head">
                        <h3 class="dash-panel-title"><span>📄</span> Документы</h3>
                        <span class="dash-panel-badge" id="docsCounter">0</span>
                    </div>
                    <div class="dash-panel-body" id="containerDocs">
                        <div class="dash-empty">Загрузка...</div>
                    </div>
                </div>
            </div>

            <div class="dash-modal" id="dashEditModal">
                <div class="dash-modal-box">
                    <button onclick="window.dashCloseModal()" class="dash-modal-close" aria-label="Закрыть">✕</button>
                    <div class="dash-modal-head">
                        <h4 id="modalVehicleTitle">Модель техники</h4>
                        <p id="modalVehiclePlate">[0000 AA-7]</p>
                    </div>
                    <div id="modalWarrantySection" class="dash-modal-section" style="display:none;">
                        <div class="dash-modal-field">
                            <label class="modal-label">Текущая наработка</label>
                            <input type="number" id="inputModalCurrentHours" class="dash-input">
                        </div>
                        <div class="dash-modal-grid">
                            <div class="dash-modal-field">
                                <label class="modal-label">Нулевая база</label>
                                <input type="number" id="inputModalZeroHours" class="dash-input">
                            </div>
                            <div class="dash-modal-field">
                                <label class="modal-label">Периодичность</label>
                                <input type="number" id="inputModalStepHours" class="dash-input">
                            </div>
                        </div>
                    </div>
                    <div id="modalDocsSection" class="dash-modal-section" style="display:none;">
                        <div class="dash-modal-field">
                            <label class="modal-label">Дата Гостехосмотра</label>
                            <input type="date" id="inputModalInspectionDate" class="dash-input">
                        </div>
                        <div class="dash-modal-field">
                            <label class="modal-label">Дата Страховки</label>
                            <input type="date" id="inputModalInsuranceDate" class="dash-input">
                        </div>
                    </div>
                    <div id="modalReadOnlyNotice" class="dash-ro-notice" style="display:none; margin-top:16px;">
                        <span>🔒</span>
                        <span>Редактирование доступно только пользователям с правом записи.</span>
                    </div>
                    <button onclick="window.dashSaveModalData()" class="dash-modal-save" id="modalSaveBtn">Сохранить изменения</button>
                </div>
            </div>
        </div>
    `;

    setupDashboard();
}

let refreshIntervalId = null;
let activeModalVehicleId = null;

/* Право записи: админ или mechanization_edit. */
function dashCanEdit() {
    return window._mechIsAdmin === true || window._mechCanEdit === true;
}

/* Единица измерения: км для колёсной техники, м/ч — остальной. */
function getUnitByCategory(type) {
    if (!type) return 'м/ч';
    const lower = type.toLowerCase();
    const carKeywords = ['легковой', 'грузовой', 'грузопассажирский', 'автобус', 'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'];
    for (let kw of carKeywords) {
        if (lower.includes(kw)) return 'км';
    }
    return 'м/ч';
}

function setupDashboard() {
    window.dashCompleteTask = dashCompleteTask;
    window.dashAddRepairTask = dashAddRepairTask;
    window.dashToggleFilterDropdown = dashToggleFilterDropdown;
    window.dashToggleLocalVisibility = dashToggleLocalVisibility;
    window.dashResetFilter = dashResetFilter;
    window.dashOpenWarrantyModal = dashOpenWarrantyModal;
    window.dashOpenDocsModal = dashOpenDocsModal;
    window.dashCloseModal = dashCloseModal;
    window.dashSaveModalData = dashSaveModalData;

    // Формы добавления задач — только при праве записи.
    const taskForm = document.getElementById('dashTaskForm');
    if (taskForm && !dashCanEdit()) taskForm.style.display = 'none';

    // Закрытие фильтра по клику вне его.
    document.addEventListener('click', function (e) {
        const wrap = document.querySelector('.dash-filter-wrap');
        const drop = document.getElementById('dashFilterDropdown');
        if (drop && wrap && !wrap.contains(e.target)) {
            drop.classList.remove('open');
        }
    });

    // Закрытие модалки по клику на фон.
    const modal = document.getElementById('dashEditModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) dashCloseModal();
        });
    }

    loadDashboardData();
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(function () {
        if (document.visibilityState !== 'visible') return;
        loadDashboardData();
    }, 10000);
}

async function loadDashboardData() {
    if (!window._supabase) return;
    try {
        const [vehiclesRes, tasksRes] = await Promise.all([
            window._supabase.from('vehicles').select('*'),
            window._supabase.from('vehicle_tasks').select('*').eq('is_completed', false)
        ]);

        if (vehiclesRes.error) throw vehiclesRes.error;
        if (tasksRes.error) throw tasksRes.error;

        const vehiclesList = vehiclesRes.data || [];
        const activeTasks = tasksRes.data || [];

        window.dashCachedVehicles = vehiclesList;
        window.dashCachedTasks = activeTasks;

        renderStats(vehiclesList);
        populateVehicleDropdown(vehiclesList);
        renderFilterCheckboxes(vehiclesList);
        renderSeparatedAlerts(vehiclesList, activeTasks);
        updateTaskCounter(activeTasks.length);
    } catch (err) {
        console.error('Ошибка обновления Dashboard:', err.message);
    }
}

function updateTaskCounter(count) {
    const el = document.getElementById('taskCounter');
    if (el) {
        el.textContent = count;
        el.classList.toggle('dash-panel-badge--warn', count > 0);
    }
}

function renderStats(list) {
    const total = list.length;
    const ready = list.filter(v => v.tags && v.tags.includes('Готов')).length;
    const storage = list.filter(v => v.tags && v.tags.includes('На хранении')).length;
    const repair = list.filter(v => v.tags && v.tags.includes('В ремонте')).length;

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = value + '<span class="dash-kpi-unit">ед.</span>';
    };
    const setBar = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.style.width = (total > 0 ? Math.round((value / total) * 100) : 0) + '%';
    };

    set('dashTotal', total);
    set('dashReady', ready);
    set('dashStorage', storage);
    set('dashInRepair', repair);
    setBar('dashReadyBar', ready);
    setBar('dashStorageBar', storage);
    setBar('dashInRepairBar', repair);
}

function populateVehicleDropdown(vehicles) {
    const select = document.getElementById('taskVehicleSelect');
    if (!select || select.options.length > 1) return;
    const sorted = [...vehicles].sort((a, b) => (a.model || '').localeCompare(b.model || ''));
    sorted.forEach(v => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ id: v.id, name: v.model });
        opt.innerText = `${v.model} ${v.plate ? '[' + v.plate + ']' : '[б/н]'}`;
        select.appendChild(opt);
    });
}

function dashToggleFilterDropdown(e) {
    e.stopPropagation();
    const drop = document.getElementById('dashFilterDropdown');
    if (drop) drop.classList.toggle('open');
}

function renderFilterCheckboxes(vehicles) {
    const container = document.getElementById('dashFilterCheckboxes');
    if (!container) return;
    const hiddenVehicles = JSON.parse(localStorage.getItem('dash_hidden_warranty') || '[]');
    const warrantyVehicles = vehicles.filter(v => {
        const tags = v.tags ? v.tags.split(',').map(t => t.trim()) : [];
        return tags.includes('Гарантия');
    });
    const statsEl = document.getElementById('dashFilterStats');
    if (warrantyVehicles.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--muted); font-size:0.78rem; padding:10px 0; margin:0;">Нет гарантийной техники</p>`;
        if (statsEl) statsEl.innerText = '';
        return;
    }
    warrantyVehicles.sort((a, b) => (a.model || '').localeCompare(b.model || ''));
    container.innerHTML = warrantyVehicles.map(v => {
        const isChecked = !hiddenVehicles.includes(v.id) ? 'checked' : '';
        return `
            <label class="dash-filter-item">
                <input type="checkbox" ${isChecked} onchange="window.dashToggleLocalVisibility(${v.id}, this.checked)">
                <span>${(window.escapeHtml || (s => String(s ?? '')))(v.model)} ${v.plate ? '(' + (window.escapeHtml || (s => s))(v.plate) + ')' : '(б/н)'}</span>
            </label>
        `;
    }).join('');
    const visibleCount = warrantyVehicles.filter(v => !hiddenVehicles.includes(v.id)).length;
    if (statsEl) statsEl.innerText = `Показано ${visibleCount} из ${warrantyVehicles.length}`;
}

function dashToggleLocalVisibility(vehicleId, isChecked) {
    let hiddenVehicles = JSON.parse(localStorage.getItem('dash_hidden_warranty') || '[]');
    if (isChecked) {
        hiddenVehicles = hiddenVehicles.filter(id => id !== vehicleId);
    } else {
        if (!hiddenVehicles.includes(vehicleId)) hiddenVehicles.push(vehicleId);
    }
    localStorage.setItem('dash_hidden_warranty', JSON.stringify(hiddenVehicles));
    if (window.dashCachedVehicles && window.dashCachedTasks) {
        renderSeparatedAlerts(window.dashCachedVehicles, window.dashCachedTasks);
    }
}

function dashResetFilter() {
    localStorage.removeItem('dash_hidden_warranty');
    loadDashboardData();
}

function dashOpenWarrantyModal(id, model, plate, current, zero, step, inspectDate, insDate) {
    activeModalVehicleId = id;
    document.getElementById('modalVehicleTitle').innerText = model;
    document.getElementById('modalVehiclePlate').innerText = plate ? `[${plate}]` : '[б/н]';
    document.getElementById('inputModalCurrentHours').value = current;
    document.getElementById('inputModalZeroHours').value = zero;
    document.getElementById('inputModalStepHours').value = step;
    document.getElementById('inputModalInspectionDate').value = inspectDate || '';
    document.getElementById('inputModalInsuranceDate').value = insDate || '';
    document.getElementById('modalWarrantySection').style.display = 'block';
    document.getElementById('modalDocsSection').style.display = 'none';
    applyModalEditMode();
    document.getElementById('dashEditModal').classList.add('open');
}

function dashOpenDocsModal(id, model, plate, inspectDate, insDate, current, zero, step) {
    activeModalVehicleId = id;
    document.getElementById('modalVehicleTitle').innerText = model;
    document.getElementById('modalVehiclePlate').innerText = plate ? `[${plate}]` : '[б/н]';
    document.getElementById('inputModalInspectionDate').value = inspectDate || '';
    document.getElementById('inputModalInsuranceDate').value = insDate || '';
    document.getElementById('inputModalCurrentHours').value = current;
    document.getElementById('inputModalZeroHours').value = zero;
    document.getElementById('inputModalStepHours').value = step;
    document.getElementById('modalDocsSection').style.display = 'block';
    document.getElementById('modalWarrantySection').style.display = 'none';
    applyModalEditMode();
    document.getElementById('dashEditModal').classList.add('open');
}

/* Без права записи поля и кнопка сохранения блокируются. */
function applyModalEditMode() {
    const editable = dashCanEdit();
    const ids = [
        'inputModalCurrentHours', 'inputModalZeroHours', 'inputModalStepHours',
        'inputModalInspectionDate', 'inputModalInsuranceDate'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !editable;
    });
    const btn = document.getElementById('modalSaveBtn');
    if (btn) btn.style.display = editable ? '' : 'none';
    const notice = document.getElementById('modalReadOnlyNotice');
    if (notice) notice.style.display = editable ? 'none' : 'flex';
}

function dashCloseModal() {
    const modal = document.getElementById('dashEditModal');
    if (modal) modal.classList.remove('open');
    activeModalVehicleId = null;
}

async function dashSaveModalData() {
    if (!activeModalVehicleId) return;
    if (!dashCanEdit()) {
        window.showSimpleMessage && window.showSimpleMessage('Только просмотр', 'У вас нет права редактирования.');
        return;
    }
    const curHrs = parseInt(document.getElementById('inputModalCurrentHours').value) || 0;
    const zeroHrs = parseInt(document.getElementById('inputModalZeroHours').value) || 0;
    const stepHrs = parseInt(document.getElementById('inputModalStepHours').value) || 125;
    const inspectDt = document.getElementById('inputModalInspectionDate').value || null;
    const insDt = document.getElementById('inputModalInsuranceDate').value || null;

    try {
        const { error } = await window._supabase
            .from('vehicles')
            .update({
                current_hours: curHrs,
                zero_hours: zeroHrs,
                step_hours: stepHrs,
                inspection_date: inspectDt,
                insurance_date: insDt
            })
            .eq('id', activeModalVehicleId);
        if (error) throw error;
        dashCloseModal();
        await loadDashboardData();
    } catch (err) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', 'Не удалось сохранить: ' + err.message);
    }
}

async function dashAddRepairTask() {
    if (!dashCanEdit()) {
        window.showSimpleMessage && window.showSimpleMessage('Только просмотр', 'У вас нет права добавлять задачи.');
        return;
    }
    const select = document.getElementById('taskVehicleSelect');
    const input = document.getElementById('taskTextInput');
    if (!input || !input.value.trim()) return;
    let vehicleId = null;
    let vehicleName = 'Заметка / Пометка';
    if (select && select.value) {
        const parsed = JSON.parse(select.value);
        vehicleId = parsed.id;
        vehicleName = parsed.name;
    }
    const userRole = localStorage.getItem('user_role') || 'Сотрудник';
    const finalTaskText = `${input.value.trim()} [${userRole}]`;
    try {
        const { error } = await window._supabase.from('vehicle_tasks').insert([{
            vehicle_id: vehicleId,
            vehicle_name: vehicleName,
            text: finalTaskText,
            is_completed: false
        }]);
        if (error) throw error;
        input.value = '';
        if (select) select.value = '';
        await loadDashboardData();
    } catch (err) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', 'Не удалось добавить задачу: ' + err.message);
    }
}

async function dashCompleteTask(taskId) {
    if (!dashCanEdit()) {
        window.showSimpleMessage && window.showSimpleMessage('Только просмотр', 'У вас нет права закрывать задачи.');
        return;
    }
    try {
        const { error } = await window._supabase.from('vehicle_tasks').update({ is_completed: true }).eq('id', taskId);
        if (error) throw error;
        await loadDashboardData();
    } catch (err) {
        window.showSimpleMessage && window.showSimpleMessage('Ошибка', 'Не удалось закрыть задачу: ' + err.message);
    }
}

/* Безопасная подстановка строк в onclick-атрибуты. */
function jsStr(s) {
    return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function renderSeparatedAlerts(list, activeTasks) {
    const esc = window.escapeHtml || (s => String(s ?? ''));
    const today = new Date();
    const plateMap = {};
    list.forEach(v => { plateMap[v.id] = v.plate ? `[${v.plate}]` : '[б/н]'; });
    const hiddenVehicles = JSON.parse(localStorage.getItem('dash_hidden_warranty') || '[]');
    const editable = dashCanEdit();

    /* --- Задачи --- */
    const containerTasks = document.getElementById('containerTasks');
    if (containerTasks) {
        if (activeTasks.length > 0) {
            containerTasks.innerHTML = activeTasks.map(task => `
                <div class="dash-alert dash-alert--task">
                    <div class="dash-alert-main">
                        <div class="dash-alert-title-row">
                            <span class="dash-alert-name">${task.vehicle_id ? '🚜 ' + esc(task.vehicle_name) : '📝 Заметка'}</span>
                            <span class="dash-alert-plate">${esc(plateMap[task.vehicle_id] || '')}</span>
                        </div>
                        <p class="dash-alert-text">${esc(task.text)}</p>
                    </div>
                    ${editable ? `<button onclick="window.dashCompleteTask('${task.id}')" class="dash-alert-action dash-alert-action--done">Готово</button>` : ''}
                </div>
            `).join('');
        } else {
            containerTasks.innerHTML = `<div class="dash-empty dash-empty-ok">✅ Нет активных задач</div>`;
        }
    }

    const warrantyAlerts = [];
    const docAlerts = [];

    list.forEach(v => {
        const cleanPlate = v.plate || '';
        const plateStr = v.plate ? ` [${v.plate}]` : ' [б/н]';
        const unit = getUnitByCategory(v.type);
        const label = unit === 'км' ? 'Пробег' : 'Наработка';

        if (v.inspection_date) {
            const diff = Math.ceil((new Date(v.inspection_date) - today) / (1000 * 60 * 60 * 24));
            if (diff <= 30) {
                docAlerts.push({
                    id: v.id, model: v.model, plate: cleanPlate, plateLabel: plateStr,
                    daysLeft: diff, isCritical: diff <= 0,
                    inspectDate: v.inspection_date, insDate: v.insurance_date,
                    current: v.current_hours || 0, zero: v.zero_hours || 0, step: v.step_hours || 125,
                    statusText: diff <= 0 ? '🛑 Просрочен Гостехосмотр!' : `⚠️ Техосмотр истекает через ${diff} дн.`
                });
            }
        }
        if (v.insurance_date) {
            const diffIns = Math.ceil((new Date(v.insurance_date) - today) / (1000 * 60 * 60 * 24));
            if (diffIns <= 30) {
                docAlerts.push({
                    id: v.id, model: v.model, plate: cleanPlate, plateLabel: plateStr,
                    daysLeft: diffIns, isCritical: diffIns <= 0,
                    inspectDate: v.inspection_date, insDate: v.insurance_date,
                    current: v.current_hours || 0, zero: v.zero_hours || 0, step: v.step_hours || 125,
                    statusText: diffIns <= 0 ? '🛑 Закончилась страховка!' : `⚠️ Страховка истекает через ${diffIns} дн.`
                });
            }
        }

        const vehicleTagsArray = v.tags ? v.tags.split(',').map(t => t.trim()) : [];
        if (vehicleTagsArray.includes('Гарантия') && !hiddenVehicles.includes(v.id)) {
            const hours = v.current_hours || 0;
            const zeroHours = v.zero_hours || 0;
            const stepHours = v.step_hours || 125;
            const relativeHours = hours - zeroHours;
            const nextTO = zeroHours + (Math.ceil((relativeHours + 1) / stepHours) * stepHours);
            const hoursLeft = nextTO - hours;

            let status = 'info';
            let statusText = `⚙️ ${label} ${hours} ${unit}. До ТО (${nextTO} ${unit}) ещё <b>${hoursLeft} ${unit}</b>.`;
            if (hoursLeft <= 50) {
                status = 'danger';
                statusText = `🚨 <span class="dash-critical">Срочно ТО (${nextTO} ${unit})!</span> Осталось <b>${hoursLeft} ${unit}</b>.`;
            } else if (hoursLeft <= 100) {
                status = 'warning';
                statusText = `⚠️ Срок ТО (${nextTO} ${unit}). Осталось <b>${hoursLeft} ${unit}</b>.`;
            }

            warrantyAlerts.push({
                id: v.id, status: status, hoursLeft: hoursLeft,
                model: v.model, plate: cleanPlate, plateLabel: plateStr,
                hours, zeroHours, stepHours,
                inspectDate: v.inspection_date, insDate: v.insurance_date,
                text: statusText, unit, label
            });
        }
    });

    warrantyAlerts.sort((a, b) => a.hoursLeft - b.hoursLeft);
    docAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    /* --- Гарантия / ТО --- */
    const containerWarranty = document.getElementById('containerWarranty');
    if (containerWarranty) {
        if (warrantyAlerts.length === 0) {
            containerWarranty.innerHTML = `<div class="dash-empty dash-empty-ok">✅ Нет техники на контроле</div>`;
        } else {
            containerWarranty.innerHTML = warrantyAlerts.map(a => `
                <div class="dash-alert dash-alert--${a.status}">
                    <div class="dash-alert-main">
                        <div class="dash-alert-title-row">
                            <span class="dash-alert-name">${esc(a.model)}</span>
                            <span class="dash-alert-plate">${esc(a.plateLabel)}</span>
                        </div>
                        <p class="dash-alert-text">${a.text}</p>
                    </div>
                    <button onclick="window.dashOpenWarrantyModal(${a.id}, '${jsStr(a.model)}', '${jsStr(a.plate)}', ${a.hours}, ${a.zeroHours}, ${a.stepHours}, '${a.inspectDate || ''}', '${a.insDate || ''}')" class="dash-alert-action" title="Изменить параметры">✏️</button>
                </div>
            `).join('');
        }
    }

    /* --- Документы --- */
    const containerDocs = document.getElementById('containerDocs');
    if (containerDocs) {
        const docsCounter = document.getElementById('docsCounter');
        if (docsCounter) {
            docsCounter.textContent = docAlerts.length;
            docsCounter.classList.toggle('dash-panel-badge--danger', docAlerts.some(d => d.isCritical));
            docsCounter.classList.toggle('dash-panel-badge--warn', docAlerts.length > 0 && !docAlerts.some(d => d.isCritical));
        }
        if (docAlerts.length === 0) {
            containerDocs.innerHTML = `<div class="dash-empty dash-empty-ok">✅ Все документы в порядке!</div>`;
        } else {
            containerDocs.innerHTML = docAlerts.map(d => `
                <div class="dash-alert ${d.isCritical ? 'dash-alert--danger' : 'dash-alert--warning'}">
                    <div class="dash-alert-main">
                        <div class="dash-alert-title-row">
                            <span class="dash-alert-name">${esc(d.model)}</span>
                            <span class="dash-alert-plate">${esc(d.plateLabel)}</span>
                        </div>
                        <p class="dash-alert-text">${esc(d.statusText)}</p>
                    </div>
                    <button onclick="window.dashOpenDocsModal(${d.id}, '${jsStr(d.model)}', '${jsStr(d.plate)}', '${d.inspectDate || ''}', '${d.insDate || ''}', ${d.current}, ${d.zero}, ${d.step})" class="dash-alert-action" title="Изменить даты">✏️</button>
                </div>
            `).join('');
        }
    }
}
