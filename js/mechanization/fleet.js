export async function init() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
        <div style="max-width: 1400px; margin: 0 auto;">
            <div class="glass-panel fleet-toolbar">
                <div class="fleet-toolbar-head">
                    <h2><span class="fleet-toolbar-icon">🚜</span> Управление автопарком</h2>
                    <p>Учет техники, закрепление водителей и механизаторов, контроль документов и ремонтов</p>
                </div>
                <div class="fleet-toolbar-actions">
                    <button onclick="window.openDriversModal()" class="glass-btn">👤 Вод/Мех</button>
                    <button onclick="window.openTagsModal()" class="glass-btn">🏷️ Теги</button>
                    <button onclick="window.openCategoriesModal()" class="glass-btn">📂 Категории</button>
                    <button onclick="window.openHoursModal()" class="glass-btn fleet-btn-blue">⏱️ Добавить часы</button>
                    <button onclick="window.openVehicleModalForm()" class="glass-btn modal-btn-primary">➕ Карта</button>
                </div>
            </div>

            <div class="glass-panel fleet-search-panel">
                <div class="fleet-search-fields">
                    <input type="text" id="vehicleSearchInput" class="modal-field" placeholder="🔍 Поиск по модели, номеру, VIN, водителю или тегу...">
                    <select id="sortSelect" onchange="window.handleSortChange(this.value)" class="modal-field">
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
 * Редизайн модалок в дизайн-системе Животноводства:
 * та же структура .modal-box (h3 + border-bottom, поля .modal-field,
 * кнопки .glass-btn, отступы 22px) — inline-стили сведены к раскладке.
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
                <div class="fleet-modal-footer">
                    <button type="submit" class="glass-btn modal-btn-primary" style="flex: 1;">Сохранить</button>
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
    window.openVehicleModalForm = (v = null) => openVehicleModal(v);
    window.closeVModal = () => closeModalOverlay('vFormModal');
    window.openCategoriesModal = () => renderCategoriesModalList();
    window.openTagsModal = () => renderTagsModalList();
    window.openDriversModal = () => renderDriversModalList();
    window.closeDriversModal = () => closeModalOverlay('driversManagementModal');
    window.closeTagsModal = () => closeModalOverlay('tagsManagementModal');
    window.closeCategoriesModal = () => closeModalOverlay('categoriesModal');
    window.closeTasksModal = () => closeModalOverlay('tasksModal');
    window.handleSortChange = (val) => {
        currentSort = val;
        renderFleet();
    };
    window.openHoursModal = openHoursModal;
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
    const isNoCatActive = selectedCategory.toLowerCase() === 'без категории';
    const isOtherActive = !isAllActive && !isNoCatActive;

    const otherCats = categories.filter(c => c !== 'Без категории');
    const activeBtnStyle = 'background: rgba(52, 211, 153, 0.22); border-color: var(--green); color: var(--green); font-weight: 800;';

    let html = `
        <span style="font-size: 0.76rem; color: var(--subtle); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Категории:</span>
        <button onclick="window.filterCategory('all')" class="glass-btn" style="min-height: 32px; padding: 6px 12px; font-size: 0.74rem; ${isAllActive ? activeBtnStyle : ''}">Все</button>
        <button onclick="window.filterCategory('Без категории')" class="glass-btn" style="min-height: 32px; padding: 6px 12px; font-size: 0.74rem; ${isNoCatActive ? activeBtnStyle : ''}">Без категории</button>
        <div style="position: relative; display: inline-block;">
            <button onclick="window.toggleCategoryDropdown(event)" class="glass-btn modal-btn-primary" style="min-height: 32px; padding: 6px 12px; font-size: 0.74rem; display: flex; align-items: center; gap: 4px; ${isOtherActive ? activeBtnStyle : ''}">
                <span>${isOtherActive ? selectedCategory : `— Другие (${otherCats.length}) —`}</span>
                <span style="font-size: 0.6rem; transition: transform 180ms ease; ${window._isCategoriesDropdownOpen ? 'transform: rotate(180deg);' : ''}">▼</span>
            </button>
            <div style="position: absolute; top: 100%; left: 0; margin-top: 4px; width: 220px; max-height: 240px; overflow-y: auto; background: var(--glass-strong); border: 1px solid var(--line-bright); border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); z-index: 50; padding: 4px; display: ${window._isCategoriesDropdownOpen ? 'block' : 'none'};" id="customCategoryDropdownMenu">
                ${otherCats.map(c => `
                    <button onclick="window.filterCategory('${c.replace(/'/g, "\\'")}')" class="glass-btn modal-btn-primary" style="width: 100%; text-align: left; min-height: 36px; padding: 8px 10px; font-size: 0.8rem; margin-bottom: 2px; ${selectedCategory === c ? activeBtnStyle : ''}">
                            ${c}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    bar.innerHTML = html;

    window.toggleCategoryDropdown = (e) => {
        e.stopPropagation();
        window._isCategoriesDropdownOpen = !window._isCategoriesDropdownOpen;
        renderCategoriesBar();
    };

    window.filterCategory = (cat) => {
        if (!cat) return;
        selectedCategory = cat;
        window._isCategoriesDropdownOpen = false;
        renderCategoriesBar();
        renderFleet();
    };
}

// Закрытие дропдауна по клику вне его
if (!window._categoryDropdownClickSetup) {
    document.addEventListener('click', () => {
        if (window._isCategoriesDropdownOpen) {
            window._isCategoriesDropdownOpen = false;
            const menu = document.getElementById('customCategoryDropdownMenu');
            if (menu) menu.style.display = 'none';
        }
    });
    window._categoryDropdownClickSetup = true;
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

    uniqueTypesInFiltered.forEach(cat => {
        const catList = filtered.filter(v => (v.type || "Без категории").toLowerCase() === cat.toLowerCase());
        if (catList.length === 0) return;

        html += `
            <div class="fleet-group">
                <h3 class="fleet-group-title">${esc(cat)} — ${catList.length} ед.</h3>
                <div class="fleet-grid">
                    ${catList.map(v => {
                        const now = new Date();

                        const formatDocStatus = (dateStr) => {
                            if (!dateStr) return { text: '—', cls: 'is-muted' };
                            const diffDays = Math.ceil((new Date(dateStr) - now) / (1000 * 60 * 60 * 24));
                            const formattedDate = new Date(dateStr).toLocaleDateString('ru-RU');
                            if (diffDays <= 0) {
                                return { text: `${formattedDate} (Просрочено)`, cls: 'is-overdue' };
                            }
                            if (diffDays <= 30) {
                                return { text: `${formattedDate} (${diffDays} дн.)`, cls: 'is-soon' };
                            }
                            return { text: formattedDate, cls: 'is-ok' };
                        };

                        const toInfo = formatDocStatus(v.inspection_date);
                        const insInfo = formatDocStatus(v.insurance_date);
                        const vehicleTagsArray = v.tags ? v.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                        const vTasks = tasks.filter(t => t.vehicle_id === v.id);
                        const safeVehicleJson = JSON.stringify(v).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                        const unit = getUnitByCategory(v.type);
                        const label = unit === 'км' ? 'Пробег' : 'Наработка';
                        const role = getDriverRole(v.type);

                        // Цветовая схема карточки по статусу (как бейджи статусов в Животноводстве)
                        let cardStatusClass = '';
                        if (vehicleTagsArray.includes('Неисправен')) cardStatusClass = 'is-broken';
                        else if (vehicleTagsArray.includes('Гарантия')) cardStatusClass = 'is-warranty';

                        return `
                            <div onclick="window.openVehicleModalForm(${safeVehicleJson})" class="glass-panel fleet-card ${cardStatusClass}">
                                <div class="fleet-card-head">
                                    <h4>${esc(v.model)}</h4>
                                    <button onclick="event.stopPropagation(); window.openVehicleModalForm(${safeVehicleJson})" class="fleet-card-edit" title="Редактировать">✏️</button>
                                </div>

                                <div class="fleet-card-driver">
                                    <span>👤 ${role}:</span>
                                    <span class="fleet-card-driver-name">${esc(v.notes || 'Не закреплен')}</span>
                                </div>

                                <div class="fleet-card-tags">
                                    ${vehicleTagsArray.map(t => {
                                        const knownTag = baseTags.find(bt => bt.name.toLowerCase() === t.toLowerCase());
                                        const badgeBg = knownTag ? knownTag.color : '#e2e8f0';
                                        return `<span class="fleet-tag" style="background-color: ${badgeBg};">${esc(t)}</span>`;
                                    }).join('')}
                                </div>

                                <div class="fleet-card-ids">
                                    <div class="fleet-plate">${esc(v.plate || 'БЕЗ ГОСНОМЕРА')}</div>
                                    ${v.inv_number ? `<span class="fleet-inv">Инв. №: ${esc(v.inv_number)}</span>` : ''}
                                </div>
                                ${v.vin_number ? `<div class="fleet-vin" title="${esc(v.vin_number)}">VIN: ${esc(v.vin_number)}</div>` : ''}

                                <div class="fleet-card-docs">
                                    <div class="fleet-doc-row">
                                        <span>${label}:</span>
                                        <span class="fleet-doc-value">${v.current_hours || 0} ${unit}</span>
                                    </div>
                                    <div class="fleet-doc-row">
                                        <span>Техосмотр:</span>
                                        <span class="fleet-doc-badge ${toInfo.cls}">${esc(toInfo.text)}</span>
                                    </div>
                                    <div class="fleet-doc-row">
                                        <span>Страховка:</span>
                                        <span class="fleet-doc-badge ${insInfo.cls}">${esc(insInfo.text)}</span>
                                    </div>
                                </div>

                                <button onclick="event.stopPropagation(); window.openTasksModalForm(${v.id}, '${v.model.replace(/'/g, "\\'")}')" class="glass-btn fleet-tasks-btn">
                                    📋 Задачи (${vTasks.length})
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `<div class="fleet-empty">Техника не найдена</div>`;
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
        catSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    const driverSelect = document.getElementById('vDriver');
    if (driverSelect) {
        driverSelect.innerHTML = `<option value="">— Не закреплен —</option>` +
            drivers.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    const tagsBox = document.getElementById('tagsCheckboxContainer');
    if (tagsBox) {
        tagsBox.innerHTML = baseTags.map(t => `
            <label style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.3); font-size: 0.72rem; font-weight: 800; color: #0b1728; background-color: ${t.color}; cursor: pointer; user-select: none;">
                <input type="checkbox" name="vTags" value="${t.name}" style="width: 14px; height: 14px; accent-color: #10b981; cursor: pointer;">
                ${t.name}
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
                const cb = document.querySelector(`input[name="vTags"][value="${t}"]`);
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
    if (!window._supabase) return;
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
    } catch (e) { alert(e.message); }
}

async function handleDeleteVehicle() {
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
        } catch (e) { alert(e.message); }
    }
}

// ===== Управление водителями =====
function renderDriversModalList() {
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
            <button onclick="window.deleteCustomDriver('${d.replace(/'/g, "\\'")}')" class="fleet-list-delete">Удалить</button>
        </div>
    `).join('');
}

async function addCustomDriver() {
    const input = document.getElementById('newDriverNameInput');
    if (!input || !input.value.trim()) return;
    try {
        await fleetInsert('fleet_drivers', [{ name: input.value.trim() }]);
        input.value = "";
        await loadAllData(false);
    } catch (e) { console.error(e); }
}

async function deleteCustomDriver(driverName) {
    if (confirm(`Удалить вод/мех-а "${driverName}" из базы данных?`)) {
        try {
            await fleetDelete('fleet_drivers', { name: driverName });
            await loadAllData(false);
        } catch (e) { console.error(e); }
    }
}

// ===== Управление тегами =====
function renderTagsModalList() {
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
            <button onclick="window.deleteCustomTag(${t.id})" class="fleet-list-delete">Удалить</button>
        </div>
    `).join('');
}

async function addCustomTag() {
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
    } catch (e) { console.error(e); }
}

async function deleteCustomTag(tagId) {
    const target = baseTags.find(t => t.id === tagId);
    if (target && confirm(`Удалить тег "${target.name}" из базы данных?`)) {
        try {
            await fleetDelete('fleet_tags', { id: tagId });
            await loadAllData(false);
        } catch (e) { console.error(e); }
    }
}

// ===== Управление категориями =====
function renderCategoriesModalList() {
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
            ${c !== 'Без категории' ? `<button onclick="window.deleteCustomCategory('${c.replace(/'/g, "\\'")}')" class="fleet-list-delete">Удалить</button>` : ''}
        </div>
    `).join('');
}

async function addCustomCategory() {
    const input = document.getElementById('newCatInput');
    if (!input || !input.value.trim()) return;
    try {
        await fleetInsert('fleet_categories', [{ name: input.value.trim() }]);
        input.value = "";
        await loadAllData(false);
    } catch (e) { console.error(e); }
}

async function deleteCustomCategory(catName) {
    if (confirm(`Удалить категорию "${catName}"? Все машины из неё будут переведены в "Без категории".`)) {
        try {
            await fleetUpdate('vehicles', { type: 'Без категории' }, { type: catName });
            await fleetDelete('fleet_categories', { name: catName });
            await loadAllData(false);
        } catch(err) { console.error("Ошибка удаления категории:", err); }
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
    list.innerHTML = vTasks.map(t => `
        <div class="fleet-task-row">
            <span>${window.escapeHtml ? window.escapeHtml(t.text) : t.text}</span>
            <button onclick="window.completeTask(${t.id})" class="fleet-task-done">Готово</button>
        </div>
    `).join('');
}

async function addVehicleTask() {
    const vId = document.getElementById('taskVehicleId').value;
    const vName = document.getElementById('taskVehicleName').value;
    const textInput = document.getElementById('newTaskText');
    if (!textInput || !textInput.value.trim()) return;
    try {
        await fleetInsert('vehicle_tasks', [{ vehicle_id: parseInt(vId), vehicle_name: vName, text: textInput.value.trim(), is_completed: false }]);
        textInput.value = "";
        await loadAllData(true);
        renderTasksListInsideModal();
    } catch (e) { console.error(e); }
}

async function completeTask(taskId) {
    try {
        await fleetUpdate('vehicle_tasks', { is_completed: true }, { id: taskId });
        await loadAllData(true);
        const modal = document.getElementById('tasksModal');
        if (modal && modal.style.display === 'flex') renderTasksListInsideModal();
    } catch (e) { console.error(e); }
}

// ===== Добавление часов через модалку =====
async function openHoursModal() {
    const modal = document.getElementById('hoursModal');
    if (!modal) return;
    openModalOverlay('hoursModal');

    const select = document.getElementById('hoursVehicleSelect');
    if (!select) return;
    if (vehicles.length === 0) await loadAllData(false);
    const sorted = [...vehicles].sort((a, b) => (a.model || '').localeCompare(b.model || ''));
    select.innerHTML = sorted.map(v => {
        const unit = getUnitByCategory(v.type);
        return `<option value="${v.id}">${v.model} ${v.plate ? '['+v.plate+']' : '[б/н]'} (${v.current_hours || 0} ${unit})</option>`;
    }).join('');
    document.getElementById('hoursInput').value = '';
}

function closeHoursModal() {
    closeModalOverlay('hoursModal');
}

async function submitHours() {
    const select = document.getElementById('hoursVehicleSelect');
    const input = document.getElementById('hoursInput');
    const vehicleId = select.value;
    const hours = parseFloat(input.value);
    if (!vehicleId) { alert('Выберите технику'); return; }
    if (isNaN(hours) || hours <= 0) { alert('Введите положительное число часов'); return; }
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
        alert('Ошибка: ' + err.message);
    }
}
