/*
 * =====================================================
 * МОДУЛЬ «МЕХАНИЗАЦИЯ» — Автопарк (v3, редизайн)
 *
 * Новая архитектура экрана:
 *   1. Hero-панель: заголовок + живые показатели парка.
 *   2. Единая панель управления: поиск, сортировка,
 *      фильтры-чипы по категориям.
 *   3. Карточки техники нового образца: иконка категории,
 *      статус-чип, блок идентификации, метрики документов.
 *   4. Справочники (водители / категории / теги) объединены
 *      в одно окно с вкладками.
 *
 * Бизнес-логика и схема БД (vehicles, vehicle_tasks,
 * fleet_drivers, fleet_categories, fleet_tags) сохранены.
 * =====================================================
 */

const FLEET_STYLES = `
<style id="fleet-styles">
/* =====================================================
   ДИЗАЙН-СИСТЕМА ЭКРАНА «АВТОПАРК» (префикс fx-)
   ===================================================== */
.fleet-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1440px;
    margin: 0 auto;
}

/* ---------- 1. Hero-панель ---------- */
.fx-hero {
    position: relative;
    padding: 26px 28px;
    overflow: hidden;
}

.fx-hero::before {
    position: absolute;
    top: -60%;
    right: -8%;
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(52, 211, 153, 0.12), transparent 65%);
    content: "";
    pointer-events: none;
}

.fx-hero-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.fx-hero-title-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.fx-hero-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border: 1px solid rgba(52, 211, 153, 0.38);
    border-radius: 16px;
    background: linear-gradient(140deg, rgba(52, 211, 153, 0.2), rgba(4, 120, 87, 0.1));
    box-shadow: 0 10px 26px rgba(16, 185, 129, 0.18);
    font-size: 1.5rem;
}

.fx-hero-title {
    margin: 0;
    color: #fff;
    font-size: 1.45rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
}

.fx-hero-sub {
    margin: 5px 0 0;
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.35;
}

.fx-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
}

/* ---------- 2. Панель управления ---------- */
.fx-controls {
    padding: 16px 18px;
}

.fx-controls-row {
    display: flex;
    gap: 10px;
}

.fx-search-wrap {
    position: relative;
    flex: 1 1 300px;
    min-width: 0;
}

.fx-search-wrap .modal-field {
    padding-left: 40px;
}

.fx-search-icon {
    position: absolute;
    top: 50%;
    left: 14px;
    transform: translateY(-50%);
    color: var(--subtle);
    font-size: 0.85rem;
    pointer-events: none;
}

.fx-sort {
    flex: 0 1 270px;
    min-width: 0;
}

.fx-chips {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 7px;
    margin-top: 13px;
    padding-top: 13px;
    border-top: 1px solid var(--line);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.fx-chips::-webkit-scrollbar { display: none; }

.fx-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
    min-height: 36px;
    padding: 6px 14px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--muted);
    cursor: pointer;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    white-space: nowrap;
    transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.fx-chip:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.3);
}

.fx-chip:active { transform: scale(0.96); }

.fx-chip--active {
    color: var(--green);
    background: rgba(52, 211, 153, 0.13);
    border-color: rgba(52, 211, 153, 0.55);
    box-shadow: 0 0 16px rgba(52, 211, 153, 0.12);
}

.fx-chip-emoji { font-size: 0.88rem; }

.fx-chip-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 21px;
    height: 19px;
    padding: 0 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--muted);
    font-size: 0.64rem;
    font-weight: 800;
}

.fx-chip--active .fx-chip-count {
    background: rgba(52, 211, 153, 0.22);
    color: var(--green);
}

/* ---------- 3. Группы и сетка карточек ---------- */
.fx-groups {
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.fx-group-head {
    position: sticky;
    top: 8px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.fx-group-title {
    margin: 0;
    color: #fff;
    font-size: 0.92rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 8px;
}

.fx-group-title-emoji { font-size: 1rem; }

.fx-group-line {
    flex: 1 1 auto;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.14), transparent);
}

.fx-group-count {
    flex-shrink: 0;
    padding: 3px 11px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.fx-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 14px;
    margin-top: 12px;
}

/* ---------- Карточка техники v3 ---------- */
.fx-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-top-color: rgba(255, 255, 255, 0.2);
    border-radius: 18px;
    background:
        linear-gradient(155deg, rgba(255, 255, 255, 0.075) 0%, rgba(255, 255, 255, 0.02) 38%, transparent 72%),
        rgba(11, 24, 43, 0.94);
    box-shadow:
        0 10px 34px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.07);
    cursor: pointer;
    overflow: hidden;
    transition: border-color 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.fx-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.24);
    box-shadow:
        0 22px 52px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.fx-card.is-broken { border-color: rgba(251, 113, 133, 0.42); }
.fx-card.is-broken:hover { border-color: rgba(251, 113, 133, 0.62); }

.fx-card.is-warranty { border-color: rgba(125, 211, 252, 0.42); }
.fx-card.is-warranty:hover { border-color: rgba(125, 211, 252, 0.62); }

/* Верхняя статусная полоса */
.fx-card::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--green), transparent 70%);
    content: "";
    opacity: 0.85;
}

.fx-card.is-broken::before {
    background: linear-gradient(90deg, var(--red), transparent 70%);
    box-shadow: 0 0 14px rgba(251, 113, 133, 0.35);
}

.fx-card.is-warranty::before {
    background: linear-gradient(90deg, var(--blue), transparent 70%);
    box-shadow: 0 0 14px rgba(125, 211, 252, 0.35);
}

.fx-card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 18px 16px;
}

/* Шапка карточки: иконка + модель + статус */
.fx-card-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.fx-card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 46px;
    height: 46px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.05);
    font-size: 1.35rem;
}

.fx-card.is-broken .fx-card-icon {
    background: rgba(251, 113, 133, 0.1);
    border-color: rgba(251, 113, 133, 0.3);
}

.fx-card.is-warranty .fx-card-icon {
    background: rgba(125, 211, 252, 0.1);
    border-color: rgba(125, 211, 252, 0.3);
}

.fx-card-title-wrap {
    flex: 1 1 auto;
    min-width: 0;
}

.fx-card-model {
    color: #fff;
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: -0.015em;
    line-height: 1.2;
    overflow-wrap: anywhere;
}

.fx-card-id {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 7px;
}

.fx-plate {
    padding: 3px 10px;
    border: 1px solid var(--line-bright);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.06em;
}

.fx-inv {
    padding: 3px 8px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--subtle);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.66rem;
    font-weight: 700;
}

.fx-vin {
    color: var(--subtle);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.66rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Статус-чип */
.fx-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 5px 11px;
    border-radius: 999px;
    font-size: 0.66rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.fx-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
}

.fx-status--ok {
    color: var(--green);
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.35);
}

.fx-status--ok .fx-status-dot {
    background: var(--green);
    box-shadow: 0 0 8px rgba(52, 211, 153, 0.8);
}

.fx-status--broken {
    color: var(--red);
    background: rgba(251, 113, 133, 0.1);
    border: 1px solid rgba(251, 113, 133, 0.4);
}

.fx-status--broken .fx-status-dot {
    background: var(--red);
    box-shadow: 0 0 8px rgba(251, 113, 133, 0.8);
}

.fx-status--warranty {
    color: var(--blue);
    background: rgba(125, 211, 252, 0.1);
    border: 1px solid rgba(125, 211, 252, 0.4);
}

.fx-status--warranty .fx-status-dot {
    background: var(--blue);
    box-shadow: 0 0 8px rgba(125, 211, 252, 0.8);
}

/* Теги */
.fx-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.fx-tag {
    padding: 3px 9px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 7px;
    color: #0b1728;
    font-size: 0.64rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
}

/* Водитель */
.fx-driver {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.035);
}

.fx-driver-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(140deg, rgba(52, 211, 153, 0.28), rgba(4, 120, 87, 0.16));
    border: 1px solid rgba(52, 211, 153, 0.35);
    color: var(--green);
    font-size: 0.72rem;
    font-weight: 800;
}

.fx-driver-info {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.fx-driver-role {
    color: var(--subtle);
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.fx-driver-name {
    color: #e7ecf4;
    font-size: 0.8rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Секция метрик: наработка + документы */
.fx-meta {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 8px;
}

.fx-meta-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 9px 11px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.03);
}

.fx-meta-label {
    color: var(--subtle);
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.fx-meta-value {
    color: #fff;
    font-size: 0.86rem;
    font-weight: 800;
    line-height: 1.2;
    display: flex;
    align-items: baseline;
    gap: 4px;
    flex-wrap: wrap;
}

.fx-meta-unit {
    color: var(--muted);
    font-size: 0.66rem;
    font-weight: 600;
}

.fx-meta-note {
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.fx-meta-val--ok { color: var(--muted); }
.fx-meta-val--muted { color: var(--subtle); }
.fx-meta-val--soon { color: var(--amber); }
.fx-meta-val--overdue { color: var(--red); }

/* Нижняя панель карточки */
.fx-card-foot {
    display: flex;
    gap: 8px;
    padding: 11px 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.16);
}

.fx-card-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    flex: 1 1 auto;
    min-height: 36px;
    padding: 7px 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--muted);
    cursor: pointer;
    font-size: 0.74rem;
    font-weight: 700;
    transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.fx-card-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.22);
}

.fx-card-btn--tasks {
    color: var(--subtle);
    flex: 2 1 auto;
}

.fx-card-btn--tasks.has {
    color: var(--green);
    background: rgba(52, 211, 153, 0.07);
    border-color: rgba(52, 211, 153, 0.3);
}

.fx-card-btn--tasks.has:hover {
    background: rgba(52, 211, 153, 0.13);
    border-color: rgba(52, 211, 153, 0.5);
}

.fx-card-btn--edit {
    flex: 0 0 auto;
    min-width: 42px;
    padding: 7px 10px;
    font-size: 0.85rem;
}

.fx-card-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(52, 211, 153, 0.22);
    color: var(--green);
    font-size: 0.64rem;
    font-weight: 800;
}

/* ---------- Пустые состояния ---------- */
.fx-empty {
    padding: 56px 24px;
    border: 1px dashed rgba(255, 255, 255, 0.14);
    border-radius: 18px;
    text-align: center;
    color: var(--muted);
}

.fx-empty-icon {
    font-size: 2.2rem;
    margin-bottom: 12px;
    opacity: 0.7;
}

.fx-empty-text {
    font-size: 0.88rem;
    font-weight: 700;
}

.fx-empty-sub {
    margin-top: 6px;
    font-size: 0.76rem;
    font-weight: 500;
    color: var(--subtle);
}

/* ---------- Элементы модальных окон ---------- */
/* Шапка диалога: иконка + заголовок, вместо голого emoji в строке. */
.fx-dialog-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--line);
}

.fx-dialog-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(52, 211, 153, 0.38);
    border-radius: 13px;
    background: linear-gradient(140deg, rgba(52, 211, 153, 0.18), rgba(4, 120, 87, 0.08));
    font-size: 1.15rem;
}

.fx-dialog-titles {
    flex: 1 1 auto;
    min-width: 0;
}

.fx-dialog-title {
    margin: 0;
    color: #fff;
    font-size: 1.02rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.2;
}

.fx-dialog-sub {
    margin: 3px 0 0;
    color: var(--subtle);
    font-size: 0.74rem;
    font-weight: 600;
    line-height: 1.3;
}

/* Инлайн-добавление: поле и кнопка в одной строке */
.fx-inline-add {
    display: flex;
    gap: 8px;
}

.fx-inline-add .modal-field {
    flex: 1 1 auto;
    min-width: 0;
}

.fx-inline-add .glass-btn {
    flex: 0 0 auto;
    min-height: 44px;
    padding: 9px 18px;
}

/* Быстрые пресеты часов в модалке наработки */
.fx-quick-hours {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.fx-quick-hour {
    min-height: 34px;
    padding: 5px 14px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--muted);
    cursor: pointer;
    font-size: 0.76rem;
    font-weight: 800;
    transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease, transform 150ms ease;
}

.fx-quick-hour:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.32);
}

.fx-quick-hour:active { transform: scale(0.95); }

/* Подтверждение-сводка в модалке наработки */
.fx-hours-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 14px;
    border: 1px solid rgba(125, 211, 252, 0.3);
    border-radius: 12px;
    background: rgba(125, 211, 252, 0.07);
    color: var(--blue);
    font-size: 0.78rem;
    font-weight: 700;
}

.fx-hours-preview b {
    color: #fff;
    font-size: 0.9rem;
    font-weight: 800;
}

/* Превью цвета нового тега */
.fx-color-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.fx-color-preview {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 10px;
}

.fx-modal-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.025);
}

.fx-modal-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--green);
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
}

.fx-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.fx-form-grid .is-full { grid-column: 1 / -1; }

/* Теги-переключатели в форме техники */
.fx-tag-pickers {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.fx-tag-check {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 11px;
    border: 1.5px solid rgba(255, 255, 255, 0.34);
    border-radius: 999px;
    color: #0b1728;
    font-size: 0.7rem;
    font-weight: 800;
    cursor: pointer;
    user-select: none;
    opacity: 0.55;
    transition: opacity 150ms ease, transform 150ms ease, box-shadow 150ms ease;
}

.fx-tag-check:hover { opacity: 0.85; }

.fx-tag-check input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    margin: 0;
    border: 1.5px solid rgba(11, 23, 43, 0.65);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.55);
    cursor: pointer;
    flex-shrink: 0;
}

.fx-tag-check input[type="checkbox"]:checked {
    background: #0b1728;
    box-shadow: inset 0 0 0 2.5px #fff;
}

.fx-tag-check:has(input:checked) {
    opacity: 1;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.28);
    transform: translateY(-1px);
}

/* Вкладки справочников */
.fx-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 14px;
    padding: 4px;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: rgba(0, 0, 0, 0.22);
}

.fx-tab {
    flex: 1 1 0;
    min-height: 38px;
    padding: 7px 8px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.76rem;
    font-weight: 700;
    transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.fx-tab:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }

.fx-tab.active {
    color: var(--green);
    background: rgba(52, 211, 153, 0.11);
    border-color: rgba(52, 211, 153, 0.4);
}

.fx-tabpane {
    display: none;
}

.fx-tabpane.active {
    display: block;
}

/* Строки списков в справочниках */
.fx-rows {
    display: flex;
    flex-direction: column;
    gap: 7px;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 2px;
}

.fx-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 13px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.04);
    font-size: 0.8rem;
    font-weight: 700;
}

.fx-row-name {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #fff;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fx-row-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    font-size: 0.78rem;
}

.fx-row-dot {
    flex-shrink: 0;
    width: 15px;
    height: 15px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 50%;
}

.fx-row-remove {
    flex-shrink: 0;
    min-height: 30px;
    padding: 4px 12px;
    border: 1px solid rgba(251, 113, 133, 0.35);
    border-radius: 9px;
    background: rgba(251, 113, 133, 0.09);
    color: var(--red);
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 700;
    transition: background-color 150ms ease, border-color 150ms ease;
}

.fx-row-remove:hover {
    background: rgba(251, 113, 133, 0.18);
    border-color: rgba(251, 113, 133, 0.6);
}

.fx-add-row {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: 13px;
    padding-top: 13px;
    border-top: 1px solid var(--line);
}

.fx-hint {
    color: var(--subtle);
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.45;
}

/* Задачи */
.fx-task {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 13px;
    border: 1px solid rgba(251, 191, 36, 0.4);
    border-radius: 11px;
    background: rgba(251, 191, 36, 0.1);
    color: var(--amber);
    font-size: 0.78rem;
    font-weight: 700;
}

.fx-task span { word-break: break-word; }

.fx-task-done {
    flex-shrink: 0;
    min-height: 30px;
    padding: 4px 12px;
    border: 1px solid rgba(52, 211, 153, 0.4);
    border-radius: 9px;
    background: rgba(52, 211, 153, 0.1);
    color: var(--green);
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 800;
    white-space: nowrap;
    transition: background-color 150ms ease, border-color 150ms ease;
}

.fx-task-done:hover {
    background: rgba(52, 211, 153, 0.18);
    border-color: rgba(52, 211, 153, 0.65);
}

.fx-task-empty {
    padding: 18px 0;
    text-align: center;
    color: var(--subtle);
    font-size: 0.76rem;
    font-weight: 700;
}

/* Уведомление режима просмотра */
.fx-ro {
    display: none;
    align-items: center;
    gap: 8px;
    padding: 10px 13px;
    border: 1px dashed rgba(251, 191, 36, 0.45);
    border-radius: 12px;
    background: rgba(251, 191, 36, 0.06);
    color: var(--amber);
    font-size: 0.76rem;
    font-weight: 700;
}

.fx-ro.visible { display: flex; }

/* ---------- Адаптив ---------- */
@media (max-width: 700px) {
    .fx-hero { padding: 20px 18px; }
    .fx-controls { padding: 14px; }
    .fx-controls-row { flex-direction: column; }
    .fx-sort { flex: 1 1 auto; }
    .fx-grid { grid-template-columns: 1fr; }
    .fx-meta { grid-template-columns: 1fr 1fr; }
    .fx-meta-cell:first-child { grid-column: 1 / -1; }
    .fx-form-grid { grid-template-columns: 1fr; }
    .fx-hero-actions { width: 100%; }
    .fx-hero-actions .glass-btn { flex: 1 1 auto; }
}

@media (max-width: 480px) {
    .fx-hero-icon { width: 44px; height: 44px; font-size: 1.25rem; }
    .fx-hero-title { font-size: 1.2rem; }
    .fx-card-body { padding: 13px 14px 13px; }
}
</style>
`;

/* ===== Мелкие утилиты ===== */
function esc(v) {
    return window.escapeHtml ? window.escapeHtml(v) : String(v ?? '');
}

/* Строка, безопасная для вставки в JS-атрибут. */
function jsAttr(s) {
    return String(s ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;');
}

function debounceFn(fn, wait) {
    let t = null;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

/* ===== Глобальное состояние ===== */
let vehicles = [];
let tasks = [];
let categories = [];
let drivers = [];
let baseTags = [];

let searchQuery = "";
let selectedCategory = "all";
let currentSort = "name_asc";
let refreshIntervalId = null;

/* ===== Категорийные вспомогательные ===== */
const CAR_KEYWORDS = ['легков', 'грузов', 'грузопассажир', 'автобус', 'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'];

function getUnitByCategory(type) {
    if (!type) return 'м/ч';
    const lower = type.toLowerCase();
    for (let kw of CAR_KEYWORDS) {
        if (lower.includes(kw)) return 'км';
    }
    return 'м/ч';
}

function getDriverRole(type) {
    if (!type) return 'Механизатор';
    const lower = type.toLowerCase();
    for (let kw of CAR_KEYWORDS) {
        if (lower.includes(kw)) return 'Водитель';
    }
    return 'Механизатор';
}

function getCategoryIcon(type) {
    if (!type) return '🚜';
    const lower = type.toLowerCase();
    if (lower.includes('трактор')) return '🚜';
    if (lower.includes('комбайн')) return '🌾';
    if (lower.includes('легков')) return '🚗';
    if (CAR_KEYWORDS.some(kw => lower.includes(kw))) return '🚚';
    if (lower.includes('погруз')) return '🏗️';
    if (lower.includes('прицеп') || lower.includes('полуприцеп')) return '🛻';
    if (lower.includes('экскав') || lower.includes('бульдо')) return '🚧';
    return '🔧';
}

/* Статус техники по тегам. */
function getVehicleStatus(v) {
    const tags = v.tags ? v.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    if (tags.includes('неисправен')) return 'broken';
    if (tags.includes('гарантия')) return 'warranty';
    return 'ok';
}

function formatDocStatus(dateStr) {
    if (!dateStr) return { text: '—', note: null, cls: 'fx-meta-val--muted' };
    const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    const formatted = new Date(dateStr).toLocaleDateString('ru-RU');
    if (diffDays <= 0) return { text: formatted, note: 'Просрочено', cls: 'fx-meta-val--overdue' };
    if (diffDays <= 30) return { text: formatted, note: `${diffDays} дн.`, cls: 'fx-meta-val--soon' };
    return { text: formatted, note: null, cls: 'fx-meta-val--ok' };
}

/* ===== Офлайн-обёртки записей =====
   При отсутствии сети операция сохраняется
   в локальную очередь и отправляется после
   восстановления соединения (js/offline-sync.js). */
function offlineSave(op) {
    return !!(window.OfflineSync && window.OfflineSync.saveOffline(op));
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

/* ===== Режим редактирования ===== */
if (typeof window._mechEditMode === 'undefined') {
    window._mechEditMode = false;
}

/* Колбэк из index.html при переключении плавающей кнопки. */
if (typeof window._mechOnEditModeChange === 'undefined') {
    window._mechOnEditModeChange = function () {
        renderFleet();
    };
}

/* Право записи без учёта режима (справочники, задачи). */
function hasFleetEditRight() {
    return window._mechIsAdmin === true || window._mechCanEdit === true;
}

/* Запись разрешена и правом, и активным режимом. */
function canEditFleet() {
    return hasFleetEditRight() && window._mechEditMode === true;
}

function setEditControlsVisibility() {
    const editable = canEditFleet();

    const actions = document.getElementById('fxHeroActions');
    if (actions) {
        // Кнопка «Добавить технику» и «Наработка» — только
        // в активном режиме записи; справочники — по праву.
        const strict = actions.querySelectorAll('[data-strict-edit]');
        strict.forEach(btn => { btn.style.display = editable ? '' : 'none'; });

        const byRight = actions.querySelectorAll('[data-need-right]');
        byRight.forEach(btn => { btn.style.display = hasFleetEditRight() ? '' : 'none'; });
    }

    document.querySelectorAll('.fx-card-btn--edit').forEach(node => {
        node.style.display = editable ? '' : 'none';
    });

    document.querySelectorAll('.fx-card-btn--tasks').forEach(node => {
        node.style.display = hasFleetEditRight() ? '' : 'none';
    });
}

/* ===== Точка входа ===== */
export async function init() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = FLEET_STYLES + `
        <div class="fleet-root">
            <div class="glass-panel fx-hero">
                <div class="fx-hero-head">
                    <div class="fx-hero-title-wrap">
                        <div class="fx-hero-icon">🚜</div>
                        <div>
                            <h2 class="fx-hero-title">Автопарк</h2>
                            <p class="fx-hero-sub" id="fxHeroSub">Учёт техники, водители и механизаторы, наработка, документы и задачи</p>
                        </div>
                    </div>
                    <div class="fx-hero-actions" id="fxHeroActions">
                        <button onclick="window.openDirectoryModal()" data-need-right class="glass-btn">🗂️ Справочники</button>
                        <button onclick="window.openHoursModal()" data-strict-edit class="glass-btn">⏱️ Наработка</button>
                        <button onclick="window.openVehicleModalForm()" data-strict-edit class="glass-btn modal-btn-primary">➕ Добавить технику</button>
                    </div>
                </div>
            </div>

            <div class="glass-panel fx-controls">
                <div class="fx-controls-row">
                    <div class="fx-search-wrap">
                        <span class="fx-search-icon">🔍</span>
                        <input type="text" id="vehicleSearchInput" class="modal-field" placeholder="Поиск: модель, номер, VIN, водитель, тег...">
                    </div>
                    <select id="sortSelect" onchange="window.handleSortChange(this.value)" class="modal-field fx-sort">
                        <option value="name_asc">По названию (А–Я)</option>
                        <option value="name_desc">По названию (Я–А)</option>
                        <option value="hours_desc">По наработке (сначала max)</option>
                        <option value="docs_urgent">Документы: срочные сначала</option>
                    </select>
                </div>
                <div class="fx-chips" id="fxChipsBar"></div>
            </div>

            <div id="fxGroups" class="fx-groups">
                <div class="fx-empty">
                    <div class="fx-empty-icon">⏳</div>
                    <div class="fx-empty-text">Загрузка данных автопарка...</div>
                </div>
            </div>
        </div>
    `;

    // Модалки живут в body — рендеры контента их не затирают.
    if (!document.getElementById('vFormModal')) {
        document.body.insertAdjacentHTML('beforeend', buildModalsHtml());
        wireModalEvents();
    }

    setupFleet();
}

/* ===== Разметка модальных окон =====
   Каркас (.modal-overlay-fleet, .modal-box-fleet, .modal-field,
   .glass-btn, .modal-close-x) берётся из index.html. */
function buildModalsHtml() {
    return `
    <div id="vFormModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet" style="max-width: 560px;">
            <button onclick="window.closeVModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <div class="fx-dialog-head">
                <div class="fx-dialog-icon">🚜</div>
                <div class="fx-dialog-titles">
                    <h3 id="vModalTitle" class="fx-dialog-title">Карточка техники</h3>
                    <p class="fx-dialog-sub">Заполните параметры — они сразу отразятся в автопарке</p>
                </div>
            </div>
            <form id="vForm" style="display: flex; flex-direction: column; gap: 14px; font-size: 0.88rem;">
                <input type="hidden" id="vId">

                <div class="fx-modal-section">
                    <span class="fx-modal-section-title">⚙️ Основное</span>
                    <div class="fx-form-grid">
                        <div>
                            <label class="modal-label">Категория</label>
                            <select id="vCategory" required class="modal-field"></select>
                        </div>
                        <div>
                            <label class="modal-label">Модель</label>
                            <input type="text" id="vName" required class="modal-field" placeholder="МТЗ-3522">
                        </div>
                        <div>
                            <label class="modal-label">Закреплённый вод/мех</label>
                            <select id="vDriver" class="modal-field"></select>
                        </div>
                        <div>
                            <label class="modal-label" id="vHoursLabel">Наработка, м/ч</label>
                            <input type="number" id="vHours" required class="modal-field" placeholder="0">
                        </div>
                    </div>
                </div>

                <div class="fx-modal-section">
                    <span class="fx-modal-section-title">🔢 Идентификация</span>
                    <div class="fx-form-grid">
                        <div>
                            <label class="modal-label">Госномер</label>
                            <input type="text" id="vPlate" class="modal-field fleet-field-mono" placeholder="1234 AB-7">
                        </div>
                        <div>
                            <label class="modal-label">Инвентарный №</label>
                            <input type="text" id="vInv" class="modal-field fleet-field-mono" placeholder="00125">
                        </div>
                        <div class="is-full">
                            <label class="modal-label">VIN / Заводской номер</label>
                            <input type="text" id="vVin" class="modal-field fleet-field-mono" placeholder="Номер рамы">
                        </div>
                    </div>
                </div>

                <div class="fx-modal-section">
                    <span class="fx-modal-section-title">📃 Документы</span>
                    <div class="fx-form-grid">
                        <div>
                            <label class="modal-label">Техосмотр до</label>
                            <input type="date" id="vToDate" class="modal-field">
                        </div>
                        <div>
                            <label class="modal-label">Страховка до</label>
                            <input type="date" id="vInsuranceDate" class="modal-field">
                        </div>
                    </div>
                </div>

                <div class="fx-modal-section">
                    <span class="fx-modal-section-title">🏷️ Теги статусов</span>
                    <div id="tagsCheckboxContainer" class="fx-tag-pickers"></div>
                    <div class="fx-hint">Теги «Неисправен» и «Гарантия» подсвечивают карточку техники в автопарке.</div>
                </div>

                <div id="vFormRoNotice" class="fx-ro">
                    <span>🔒</span>
                    <span>Редактирование доступно только пользователям с правом записи.</span>
                </div>

                <button type="submit" id="vFormSubmitBtn" class="glass-btn modal-btn-primary" style="width: 100%;">Сохранить</button>
                <button type="button" id="vDeleteBtn" class="glass-btn modal-btn-danger hidden" style="width: 100%;">Удалить из базы</button>
            </form>
        </div>
    </div>

    <div id="directoryModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet" style="max-width: 520px;">
            <button onclick="window.closeDirectoryModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <div class="fx-dialog-head">
                <div class="fx-dialog-icon">🗂️</div>
                <div class="fx-dialog-titles">
                    <h3 class="fx-dialog-title">Справочники автопарка</h3>
                    <p class="fx-dialog-sub">Водители, категории техники и теги статусов</p>
                </div>
            </div>

            <div class="fx-tabs" id="fxDirectoryTabs">
                <button type="button" class="fx-tab active" data-tab="drivers">👤 Вод/Мех</button>
                <button type="button" class="fx-tab" data-tab="categories">📂 Категории</button>
                <button type="button" class="fx-tab" data-tab="tags">🏷️ Теги</button>
            </div>

            <div class="fx-tabpane active" data-pane="drivers">
                <div class="fx-rows" id="modalDriversList"></div>
                <div class="fx-add-row">
                    <div class="fx-inline-add">
                        <input type="text" id="newDriverNameInput" class="modal-field" placeholder="ФИО водителя или механизатора...">
                        <button onclick="window.addCustomDriver()" class="glass-btn modal-btn-primary">➕</button>
                    </div>
                </div>
            </div>

            <div class="fx-tabpane" data-pane="categories">
                <div class="fx-rows" id="modalCategoriesList"></div>
                <div class="fx-add-row">
                    <div class="fx-inline-add">
                        <input type="text" id="newCatInput" class="modal-field" placeholder="Название категории...">
                        <button onclick="window.addCustomCategory()" class="glass-btn modal-btn-primary">➕</button>
                    </div>
                    <div class="fx-hint">При удалении категории техника переходит в «Без категории».</div>
                </div>
            </div>

            <div class="fx-tabpane" data-pane="tags">
                <div class="fx-rows" id="modalTagsList"></div>
                <div class="fx-add-row">
                    <div class="fx-inline-add">
                        <input type="text" id="newTagNameInput" class="modal-field" placeholder="Название статуса...">
                        <button onclick="window.addCustomTag()" class="glass-btn modal-btn-primary">➕</button>
                    </div>
                    <div class="fx-color-row">
                        <div id="newTagColorPreview" class="fx-color-preview" style="background-color: #e2e8f0;"></div>
                        <input type="color" id="newTagColorInput" value="#e2e8f0" class="fleet-color-input">
                        <span class="fx-hint">Цвет тега в карточках техники</span>
                    </div>
                </div>
            </div>

            <button onclick="window.closeDirectoryModal()" class="glass-btn" style="width: 100%; margin-top: 13px;">Закрыть</button>
        </div>
    </div>

    <div id="tasksModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet">
            <button onclick="window.closeTasksModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <div class="fx-dialog-head">
                <div class="fx-dialog-icon">📋</div>
                <div class="fx-dialog-titles">
                    <h3 id="tasksModalTitle" class="fx-dialog-title">Задачи по технике</h3>
                    <p id="tasksModalSubtitle" class="fx-dialog-sub"></p>
                </div>
            </div>
            <input type="hidden" id="taskVehicleId">
            <input type="hidden" id="taskVehicleName">
            <div class="fx-rows" id="vehicleTasksList" style="max-height: 200px;"></div>
            <div class="fx-add-row">
                <textarea id="newTaskText" rows="2" class="modal-field" placeholder="Текст задачи..."></textarea>
                <button onclick="window.addVehicleTask()" class="glass-btn modal-btn-primary" style="width: 100%;">Добавить задачу</button>
            </div>
            <button onclick="window.closeTasksModal()" class="glass-btn" style="width: 100%; margin-top: 12px;">Закрыть</button>
        </div>
    </div>

    <div id="hoursModal" class="modal-overlay-fleet" style="display: none;">
        <div class="modal-box-fleet">
            <button onclick="window.closeHoursModal()" class="modal-close-x" aria-label="Закрыть">✕</button>
            <div class="fx-dialog-head">
                <div class="fx-dialog-icon">⏱️</div>
                <div class="fx-dialog-titles">
                    <h3 class="fx-dialog-title">Добавить наработку</h3>
                    <p class="fx-dialog-sub">Прибавляется к текущему значению выбранной техники</p>
                </div>
            </div>
            <div style="display: flex; flex-direction:column; gap: 14px;">
                <div>
                    <label class="modal-label">Техника</label>
                    <select id="hoursVehicleSelect" class="modal-field">
                        <option value="">-- Загрузка --</option>
                    </select>
                </div>
                <div>
                    <label class="modal-label">Количество часов</label>
                    <input type="number" id="hoursInput" min="0" step="0.5" class="modal-field" placeholder="Например, 8.5">
                    <div class="fx-quick-hours" style="margin-top: 9px;">
                        <button type="button" class="fx-quick-hour" onclick="window.setQuickHours(4)">4 ч</button>
                        <button type="button" class="fx-quick-hour" onclick="window.setQuickHours(8)">8 ч</button>
                        <button type="button" class="fx-quick-hour" onclick="window.setQuickHours(10)">10 ч</button>
                        <button type="button" class="fx-quick-hour" onclick="window.setQuickHours(12)">12 ч</button>
                    </div>
                </div>
                <div id="hoursPreview" class="fx-hours-preview" style="display: none;"></div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 16px; border-top: 1px solid var(--line); padding-top: 14px;">
                <button onclick="window.closeHoursModal()" class="glass-btn" style="flex: 1;">Отмена</button>
                <button onclick="window.submitHours()" class="glass-btn modal-btn-primary" style="flex: 1;">Добавить</button>
            </div>
        </div>
    </div>
    `;
}

/* События, не зависящие от данных. */
function wireModalEvents() {
    const tabs = document.getElementById('fxDirectoryTabs');
    if (tabs) {
        tabs.onclick = (e) => {
            const tab = e.target.closest('.fx-tab');
            if (!tab) return;
            tabs.querySelectorAll('.fx-tab').forEach(t => t.classList.toggle('active', t === tab));
            tabs.querySelectorAll('.fx-tab').forEach(t => {
                const pane = document.querySelector(`.fx-tabpane[data-pane="${t.getAttribute('data-tab')}"]`);
                if (pane) pane.classList.toggle('active', t === tab);
            });
        };
    }

    // Живое превью цвета нового тега.
    const colorInput = document.getElementById('newTagColorInput');
    const colorPreview = document.getElementById('newTagColorPreview');
    if (colorInput && colorPreview) {
        colorInput.addEventListener('input', () => {
            colorPreview.style.backgroundColor = colorInput.value;
        });
    }

    // Сводка «станет →» в модалке наработки.
    const hoursInput = document.getElementById('hoursInput');
    if (hoursInput) {
        hoursInput.addEventListener('input', updateHoursPreview);
    }
    const hoursSelect = document.getElementById('hoursVehicleSelect');
    if (hoursSelect) {
        hoursSelect.addEventListener('change', updateHoursPreview);
    }
}

function updateHoursPreview() {
    const preview = document.getElementById('hoursPreview');
    const select = document.getElementById('hoursVehicleSelect');
    const input = document.getElementById('hoursInput');
    if (!preview || !select || !input) return;

    const hours = parseFloat(input.value);
    const v = vehicles.find(x => String(x.id) === String(select.value));
    if (!v || isNaN(hours) || hours <= 0) {
        preview.style.display = 'none';
        return;
    }

    const unit = getUnitByCategory(v.type);
    const current = v.current_hours || 0;
    preview.style.display = 'flex';
    preview.innerHTML = `
        <span>${esc(v.model)} · сейчас ${current.toLocaleString('ru-RU')} ${unit}</span>
        <span>станет <b>${(current + hours).toLocaleString('ru-RU')} ${unit}</b></span>
    `;
}

/* ===== Оверлеи ===== */
function openModalOverlay(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
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

/* ===== Инициализация поведения ===== */
async function setupFleet() {
    const searchInput = document.getElementById('vehicleSearchInput');
    if (searchInput) {
        searchInput.value = searchQuery;
        const debouncedRender = debounceFn(() => renderFleet(), 220);
        searchInput.oninput = (e) => {
            searchQuery = e.target.value.toLowerCase();
            debouncedRender();
        };
    }

    const form = document.getElementById('vForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await handleFormSubmit();
        };
    }

    const delBtn = document.getElementById('vDeleteBtn');
    if (delBtn) delBtn.onclick = handleDeleteVehicle;

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = currentSort;

    registerWindowApi();

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

function registerWindowApi() {
    window.openVehicleModalForm = (v = null) => {
        if (!canEditFleet()) {
            if (typeof window.showSimpleMessage === 'function') {
                window.showSimpleMessage(
                    hasFleetEditRight() ? 'Режим просмотра' : 'Только просмотр',
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
    window.openDirectoryModal = openDirectoryModalForm;
    window.closeDirectoryModal = () => closeModalOverlay('directoryModal');
    window.closeTasksModal = () => closeModalOverlay('tasksModal');
    window.handleSortChange = (val) => {
        currentSort = val;
        renderFleet();
    };
    window.openHoursModal = () => {
        if (!canEditFleet()) {
            if (typeof window.showSimpleMessage === 'function') {
                window.showSimpleMessage(
                    hasFleetEditRight() ? 'Режим просмотра' : 'Только просмотр',
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
    window.setQuickHours = (h) => {
        const input = document.getElementById('hoursInput');
        if (input) {
            input.value = h;
            updateHoursPreview();
        }
    };
    window.addCustomDriver = addCustomDriver;
    window.deleteCustomDriver = deleteCustomDriver;
    window.addCustomTag = addCustomTag;
    window.deleteCustomTag = deleteCustomTag;
    window.addCustomCategory = addCustomCategory;
    window.deleteCustomCategory = deleteCustomCategory;
    window.openTasksModalForm = openTasksModalForm;
    window.addVehicleTask = addVehicleTask;
    window.completeTask = completeTask;
}

/* ===== Загрузка данных ===== */
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
        if (!resDrivers.error && resDrivers.data) drivers = resDrivers.data.map(d => d.name);

        let categoriesChanged = false;

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

        // Категории, отсутствующие в справочнике, но используемые
        // техникой, добавляются на лету.
        vehicles.forEach(v => {
            const typeName = v.type || "Без категории";
            if (!categories.map(c => c.toLowerCase()).includes(typeName.toLowerCase())) {
                categories.push(typeName);
                categoriesChanged = true;
            }
        });

        if (isFirstLoad || categoriesChanged) {
            renderChipsBar();
        }

        // Живое обновление открытых списков справочника.
        if (!isFirstLoad) {
            const dirModal = document.getElementById('directoryModal');
            if (dirModal && dirModal.style.display === 'flex') {
                updateDriversDOMList();
                updateTagsDOMList();
                updateCategoriesDOMList();
            }
        }

        renderHeroSub();
        renderFleet();
    } catch (e) {
        console.error("Ошибка синхронизации данных автопарка:", e);
    }
}

/* ===== Строка статусов парка под заголовком ===== */
function renderHeroSub() {
    const el = document.getElementById('fxHeroSub');
    if (!el) return;

    const broken = vehicles.filter(v => getVehicleStatus(v) === 'broken').length;
    const warranty = vehicles.filter(v => getVehicleStatus(v) === 'warranty').length;
    const working = vehicles.length - broken;

    const parts = [
        `${vehicles.length} ед. техники`,
        `в работе ${working}`,
    ];
    if (broken > 0) parts.push(`неисправно ${broken}`);
    if (warranty > 0) parts.push(`гарантия ${warranty}`);
    if (tasks.length > 0) parts.push(`задач ${tasks.length}`);

    el.textContent = parts.join(' · ');
}

/* ===== Фильтры-чипы ===== */
function renderChipsBar() {
    const bar = document.getElementById('fxChipsBar');
    if (!bar) return;

    const allCats = categories.filter(c => c !== 'Без категории');
    const noCatCount = vehicles.filter(v => !v.type || v.type === 'Без категории').length;

    const chip = (label, cat, count, emoji) => `
        <button data-cat="${jsAttr(cat)}" class="fx-chip ${selectedCategory === cat ? 'fx-chip--active' : ''}">
            ${emoji ? `<span class="fx-chip-emoji">${emoji}</span>` : ''}
            <span>${esc(label)}</span>
            <span class="fx-chip-count">${count}</span>
        </button>
    `;

    bar.innerHTML =
        chip('Все', 'all', vehicles.length, '🚜') +
        allCats.map(c => chip(c, c, vehicles.filter(v => (v.type || 'Без категории') === c).length, getCategoryIcon(c))).join('') +
        (noCatCount > 0 ? chip('Без категории', 'Без категории', noCatCount, '📦') : '');

    bar.onclick = (e) => {
        const btn = e.target.closest('.fx-chip[data-cat]');
        if (btn) window.filterCategory(btn.getAttribute('data-cat'));
    };

    window.filterCategory = (cat) => {
        if (!cat) return;
        selectedCategory = cat;
        renderChipsBar();
        renderFleet();
    };
}

/* ===== Фильтрация и сортировка ===== */
function getFilteredVehicles() {
    const filtered = vehicles.filter(v => {
        const modelStr = v.model ? v.model.toLowerCase() : '';
        const plateStr = v.plate ? v.plate.toLowerCase() : '';
        const invStr = v.inv_number ? v.inv_number.toLowerCase() : '';
        const vinStr = v.vin_number ? v.vin_number.toLowerCase() : '';
        const tagsStr = v.tags ? v.tags.toLowerCase() : '';
        const driverStr = v.notes ? v.notes.toLowerCase() : '';

        const queryMatch = modelStr.includes(searchQuery) || plateStr.includes(searchQuery) ||
            invStr.includes(searchQuery) || vinStr.includes(searchQuery) ||
            tagsStr.includes(searchQuery) || driverStr.includes(searchQuery);
        if (!queryMatch) return false;

        if (selectedCategory !== 'all') {
            if ((v.type || 'Без категории').toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }
        return true;
    });

    const docUrgency = (v) => {
        const to = formatDocStatus(v.inspection_date);
        const ins = formatDocStatus(v.insurance_date);
        const rank = (s) => s.cls === 'fx-meta-val--overdue' ? 2 : s.cls === 'fx-meta-val--soon' ? 1 : 0;
        return Math.max(rank(to), rank(ins));
    };

    filtered.sort((a, b) => {
        if (currentSort === 'name_asc') return (a.model || '').localeCompare(b.model || '');
        if (currentSort === 'name_desc') return (b.model || '').localeCompare(a.model || '');
        if (currentSort === 'hours_desc') return (b.current_hours || 0) - (a.current_hours || 0);
        if (currentSort === 'docs_urgent') return docUrgency(b) - docUrgency(a) || (a.model || '').localeCompare(b.model || '');
        return 0;
    });

    return filtered;
}

/* ===== Рендер карточек по группам ===== */
function renderFleet() {
    const container = document.getElementById('fxGroups');
    if (!container) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const filtered = getFilteredVehicles();
    const uniqueTypes = [...new Set(filtered.map(v => v.type || "Без категории"))];

    let html = "";

    uniqueTypes.forEach(cat => {
        const catList = filtered.filter(v => (v.type || "Без категории").toLowerCase() === cat.toLowerCase());
        if (catList.length === 0) return;

        html += `
            <div class="fx-group">
                <div class="fx-group-head">
                    <h3 class="fx-group-title">
                        <span class="fx-group-title-emoji">${getCategoryIcon(cat)}</span>
                        ${esc(cat)}
                    </h3>
                    <span class="fx-group-line"></span>
                    <span class="fx-group-count">${catList.length} ед.</span>
                </div>
                <div class="fx-grid">
                    ${catList.map(v => buildVehicleCard(v)).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `
        <div class="fx-empty">
            <div class="fx-empty-icon">🔍</div>
            <div class="fx-empty-text">Техника не найдена</div>
            <div class="fx-empty-sub">Измените поисковый запрос или выберите другую категорию.</div>
        </div>
    `;

    // Делегирование: данные карточек лежат в data-атрибутах,
    // т.к. модели и имена содержат кавычки.
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

        const card = e.target.closest('.fx-card[data-vehicle]');
        if (card) {
            try {
                window.openVehicleModalForm(JSON.parse(card.getAttribute('data-vehicle')));
            } catch (err) { /* ignore */ }
        }
    };

    setEditControlsVisibility();
    window.scrollTo(window.scrollX, scrollTop);
}

function buildVehicleCard(v) {
    const status = getVehicleStatus(v);
    const cardStatusClass = status === 'broken' ? 'is-broken' : status === 'warranty' ? 'is-warranty' : '';
    const statusMeta = {
        broken: { cls: 'fx-status--broken', label: 'Неисправен' },
        warranty: { cls: 'fx-status--warranty', label: 'Гарантия' },
        ok: { cls: 'fx-status--ok', label: 'В работе' }
    }[status];

    const toInfo = formatDocStatus(v.inspection_date);
    const insInfo = formatDocStatus(v.insurance_date);
    const vTasks = tasks.filter(t => t.vehicle_id === v.id);
    const unit = getUnitByCategory(v.type);
    const hoursLabel = unit === 'км' ? 'Пробег' : 'Наработка';
    const role = getDriverRole(v.type);
    const hoursFormatted = (v.current_hours || 0).toLocaleString('ru-RU');

    // Статусные теги показаны чипом в шапке — в строке
    // тегов остаются только остальные.
    const statusTagNames = ['неисправен', 'гарантия'];
    const allTags = v.tags ? v.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const extraTags = allTags.filter(t => !statusTagNames.includes(t.toLowerCase()));

    // Инициалы аватара водителя.
    const driverName = (v.notes || '').trim();
    const initials = driverName
        ? driverName.split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
        : '—';

    const cardData = jsAttr(JSON.stringify(v));

    return `
        <div class="fx-card ${cardStatusClass}" data-vehicle="${cardData}">
            <div class="fx-card-body">
                <div class="fx-card-top">
                    <div class="fx-card-icon">${getCategoryIcon(v.type)}</div>
                    <div class="fx-card-title-wrap">
                        <div class="fx-card-model">${esc(v.model)}</div>
                        <div class="fx-card-id">
                            <span class="fx-plate">${esc(v.plate || 'БЕЗ НОМЕРА')}</span>
                            ${v.inv_number ? `<span class="fx-inv">№ ${esc(v.inv_number)}</span>` : ''}
                        </div>
                        ${v.vin_number ? `<div class="fx-vin">VIN: ${esc(v.vin_number)}</div>` : ''}
                    </div>
                    <span class="fx-status ${statusMeta.cls}">
                        <span class="fx-status-dot"></span>${statusMeta.label}
                    </span>
                </div>

                ${extraTags.length > 0 ? `
                <div class="fx-tags">
                    ${extraTags.map(t => {
                        const known = baseTags.find(bt => bt.name.toLowerCase() === t.toLowerCase());
                        return `<span class="fx-tag" style="background-color:${esc(known ? known.color : '#e2e8f0')};">${esc(t)}</span>`;
                    }).join('')}
                </div>` : ''}

                <div class="fx-driver">
                    <div class="fx-driver-avatar">${esc(initials)}</div>
                    <div class="fx-driver-info">
                        <span class="fx-driver-role">${esc(role)}</span>
                        <span class="fx-driver-name">${esc(driverName || 'Не закреплён')}</span>
                    </div>
                </div>

                <div class="fx-meta">
                    <div class="fx-meta-cell">
                        <span class="fx-meta-label">${hoursLabel}</span>
                        <span class="fx-meta-value">${hoursFormatted} <span class="fx-meta-unit">${unit}</span></span>
                    </div>
                    <div class="fx-meta-cell">
                        <span class="fx-meta-label">Техосмотр</span>
                        <span class="fx-meta-value ${toInfo.cls}">
                            ${esc(toInfo.text)}
                            ${toInfo.note ? `<span class="fx-meta-note">${esc(toInfo.note)}</span>` : ''}
                        </span>
                    </div>
                    <div class="fx-meta-cell">
                        <span class="fx-meta-label">Страховка</span>
                        <span class="fx-meta-value ${insInfo.cls}">
                            ${esc(insInfo.text)}
                            ${insInfo.note ? `<span class="fx-meta-note">${esc(insInfo.note)}</span>` : ''}
                        </span>
                    </div>
                </div>
            </div>

            <div class="fx-card-foot">
                <button class="fx-card-btn fx-card-btn--tasks ${vTasks.length > 0 ? 'has' : ''}" data-vehicle-tasks="${v.id}" data-vehicle-tasks-name="${jsAttr(v.model)}">
                    📋 Задачи
                    ${vTasks.length > 0 ? `<span class="fx-card-badge">${vTasks.length}</span>` : ''}
                </button>
                <button class="fx-card-btn fx-card-btn--edit" data-vehicle-edit="${cardData}" title="Редактировать">✏️</button>
            </div>
        </div>
    `;
}

/* ===== Модалка техники ===== */
function openVehicleModal(vehicle = null) {
    const modal = document.getElementById('vFormModal');
    if (!modal) return;

    const title = document.getElementById('vModalTitle');
    const delBtn = document.getElementById('vDeleteBtn');
    const roNotice = document.getElementById('vFormRoNotice');
    const fields = document.getElementById('vForm');
    const submitBtn = document.getElementById('vFormSubmitBtn');

    // Поля блокируются, если право пропало между открытиями.
    const editable = canEditFleet();
    if (roNotice) roNotice.classList.toggle('visible', !editable);
    fields.querySelectorAll('input, select, textarea, button[type="submit"]').forEach(el => {
        el.disabled = !editable;
    });
    if (delBtn) delBtn.disabled = !editable;
    if (submitBtn) submitBtn.style.display = editable ? '' : 'none';

    const catSelect = document.getElementById('vCategory');
    if (catSelect) {
        catSelect.innerHTML = categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    }

    const driverSelect = document.getElementById('vDriver');
    if (driverSelect) {
        driverSelect.innerHTML = `<option value="">— Не закреплён —</option>` +
            drivers.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
    }

    const tagsBox = document.getElementById('tagsCheckboxContainer');
    if (tagsBox) {
        tagsBox.innerHTML = baseTags.map(t => `
            <label class="fx-tag-check" style="background-color: ${t.color};">
                <input type="checkbox" name="vTags" value="${esc(t.name)}">
                <span>${esc(t.name)}</span>
            </label>
        `).join('');
    }

    fields.reset();
    openModalOverlay('vFormModal');

    if (vehicle) {
        title.innerText = "Редактирование техники";
        const sub = document.querySelector('#vFormModal .fx-dialog-sub');
        if (sub) sub.innerText = vehicle.model || '';
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
            vehicle.tags.split(',').map(t => t.trim()).forEach(t => {
                const cb = document.querySelector(`input[name="vTags"][value="${CSS.escape ? CSS.escape(t) : t}"]`);
                if (cb) cb.checked = true;
            });
        }
        if (delBtn) delBtn.classList.remove('hidden');
    } else {
        title.innerText = "Новая техника";
        document.getElementById('vId').value = '';
        document.getElementById('vCategory').value = 'Без категории';
        document.getElementById('vDriver').value = '';
        if (delBtn) delBtn.classList.add('hidden');
    }

    // Подпись поля наработки зависит от категории:
    // у колёсной техники это пробег в км.
    const syncHoursLabel = () => {
        const label = document.getElementById('vHoursLabel');
        if (label) {
            const unit = getUnitByCategory(document.getElementById('vCategory').value);
            label.innerText = unit === 'км' ? 'Пробег, км' : 'Наработка, м/ч';
        }
    };
    catSelect.onchange = syncHoursLabel;
    syncHoursLabel();
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

/* ===== Справочники (единое окно с вкладками) ===== */
function openDirectoryModalForm() {
    // Справочники доступны только пользователям с правом записи.
    if (!hasFleetEditRight()) {
        window.showSimpleMessage && window.showSimpleMessage(
            'Только просмотр',
            'Администратор выдал вам доступ «только просмотр». Редактирование недоступно.'
        );
        return;
    }
    openModalOverlay('directoryModal');
    updateDriversDOMList();
    updateTagsDOMList();
    updateCategoriesDOMList();
}

/* --- Водители --- */
function updateDriversDOMList() {
    const list = document.getElementById('modalDriversList');
    if (!list) return;
    list.innerHTML = drivers.length === 0
        ? `<div class="fx-task-empty">Список пуст — добавьте первого водителя или механизатора.</div>`
        : drivers.map(d => `
            <div class="fx-row">
                <span class="fx-row-name"><span class="fx-row-icon">👤</span>${esc(d)}</span>
                <button data-driver-del="${esc(d)}" class="fx-row-remove">Удалить</button>
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

/* --- Теги --- */
function updateTagsDOMList() {
    const list = document.getElementById('modalTagsList');
    if (!list) return;
    list.innerHTML = baseTags.length === 0
        ? `<div class="fx-task-empty">Тегов ещё нет — создайте первый статус.</div>`
        : baseTags.map(t => `
            <div class="fx-row">
                <span class="fx-row-name">
                    <span class="fx-row-dot" style="background-color: ${t.color};"></span>
                    ${esc(t.name)}
                </span>
                <button data-tag-del="${t.id}" class="fx-row-remove">Удалить</button>
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

/* --- Категории --- */
function updateCategoriesDOMList() {
    const list = document.getElementById('modalCategoriesList');
    if (!list) return;
    list.innerHTML = categories.map(c => `
        <div class="fx-row">
            <span class="fx-row-name">
                <span class="fx-row-icon">${getCategoryIcon(c)}</span>
                ${esc(c)}
            </span>
            ${c !== 'Без категории' ? `<button data-cat-del="${esc(c)}" class="fx-row-remove">Удалить</button>` : ''}
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
        renderChipsBar();
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
            if (selectedCategory === catName) selectedCategory = 'all';
            await loadAllData(false);
            renderChipsBar();
        } catch (err) {
            window.showSimpleMessage && window.showSimpleMessage('Ошибка', err.message);
        }
    }
}

/* ===== Задачи по технике ===== */
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
        list.innerHTML = `<div class="fx-task-empty">Нет активных задач</div>`;
        return;
    }
    list.innerHTML = vTasks.map(t => `
        <div class="fx-task">
            <span>${esc(t.text)}</span>
            ${hasFleetEditRight() ? `<button data-task-done="${t.id}" class="fx-task-done">Готово</button>` : ''}
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

/* ===== Добавление наработки ===== */
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
        return `<option value="${v.id}">${esc(v.model)} ${v.plate ? '[' + v.plate + ']' : '[б/н]'} (${v.current_hours || 0} ${unit})</option>`;
    }).join('');
    document.getElementById('hoursInput').value = '';
    const preview = document.getElementById('hoursPreview');
    if (preview) preview.style.display = 'none';
    updateHoursPreview();
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
