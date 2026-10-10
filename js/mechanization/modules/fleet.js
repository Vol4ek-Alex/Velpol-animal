(function () {
    'use strict';

    let vehicles = [];
    let tasks = [];
    let categories = [];
    let drivers = [];
    let baseTags = [];

    let searchQuery = '';
    let selectedCategory = 'all';
    let currentSort = 'name_asc';
    let refreshIntervalId = null;
    let searchDebounce = null;
    let isCategoriesDropdownOpen = false;

    function esc(value) {
        return window.escapeHtml(value);
    }

    function getUnitByCategory(type) {
        if (!type) return 'м/ч';
        const lower = String(type).toLowerCase();
        const carKeywords = [
            'легков', 'грузов', 'грузопассажир', 'автобус',
            'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'
        ];
        for (let kw of carKeywords) {
            if (lower.includes(kw)) return 'км';
        }
        return 'м/ч';
    }

    function getDriverRole(type) {
        if (!type) return 'Механизатор';
        const lower = String(type).toLowerCase();
        const carKeywords = [
            'легков', 'грузов', 'грузопассажир', 'автобус',
            'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'
        ];
        for (let kw of carKeywords) {
            if (lower.includes(kw)) return 'Водитель';
        }
        return 'Механизатор';
    }

    window.MechFleetModule = {
        async render() {
            const container = document.getElementById('main-content');

            container.innerHTML = `
                <div class="glass-panel" style="padding:15px 18px;margin-bottom:15px;">
                    <h1 style="margin:0;font-size:1.3rem;font-weight:800;color:#fff;">
                        🚜 Автопарк
                    </h1>
                    <p style="margin:4px 0 12px;color:var(--muted);font-size:0.8rem;font-weight:600;">
                        Учет техники, закрепление водителей и механизаторов, контроль документов и ремонтов
                    </p>

                    <div class="mech-toolbar">
                        <input
                            type="text"
                            id="mechVehicleSearch"
                            class="mech-search"
                            placeholder="🔍 Поиск по модели, номеру, VIN, водителю или тегу..."
                        >
                        <select id="mechSortSelect" class="mech-select">
                            <option value="name_asc">По названию (А–Я)</option>
                            <option value="name_desc">По названию (Я–А)</option>
                            <option value="hours_desc">По наработке (сначала max)</option>
                        </select>
                        <button type="button" class="glass-btn" onclick="MechFleetModule.openDriversModal()">👤 Вод/Мех</button>
                        <button type="button" class="glass-btn" onclick="MechFleetModule.openTagsModal()">🏷️ Теги</button>
                        <button type="button" class="glass-btn" onclick="MechFleetModule.openCategoriesModal()">📂 Категории</button>
                        <button type="button" class="glass-btn" onclick="MechFleetModule.openHoursModal()">⏱️ Добавить часы</button>
                        <button type="button" class="glass-btn primary" onclick="MechFleetModule.openVehicleModal()">➕ Карта</button>
                    </div>

                    <div class="mech-catbar" id="mechCategoriesBar"></div>
                </div>

                <div id="mechFleetGrid"></div>

                <div id="mechVFormModal" class="modal-overlay">
                    <div class="modal-box">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;padding-bottom:11px;border-bottom:1px solid var(--line);">
                            <h3 id="mechVModalTitle" style="margin:0;color:#fff;font-size:1.02rem;font-weight:800;">Карточка техники</h3>
                            <button type="button" class="modal-close-x" onclick="MechFleetModule.closeVModal()">✕</button>
                        </div>

                        <form id="mechVForm" style="display:flex;flex-direction:column;gap:12px;">
                            <input type="hidden" id="mechVId">
                            <div class="mech-form-grid">
                                <div>
                                    <label class="modal-label">Категория</label>
                                    <select id="mechVCategory" required class="modal-input" style="padding-top:8px;padding-bottom:8px;"></select>
                                </div>
                                <div>
                                    <label class="modal-label">Модель</label>
                                    <input type="text" id="mechVName" required class="modal-input" placeholder="МТЗ-3522">
                                </div>
                                <div>
                                    <label class="modal-label">Вод/Мех</label>
                                    <select id="mechVDriver" class="modal-input" style="padding-top:8px;padding-bottom:8px;"></select>
                                </div>
                                <div>
                                    <label class="modal-label">Наработка (м/ч)</label>
                                    <input type="number" id="mechVHours" required class="modal-input" placeholder="0">
                                </div>
                                <div>
                                    <label class="modal-label">Госномер</label>
                                    <input type="text" id="mechVPlate" class="modal-input" placeholder="1234 AB-7">
                                </div>
                                <div>
                                    <label class="modal-label">Инв. №</label>
                                    <input type="text" id="mechVInv" class="modal-input" placeholder="00125">
                                </div>
                                <div class="full">
                                    <label class="modal-label">VIN / Заводской номер</label>
                                    <input type="text" id="mechVVin" class="modal-input" placeholder="Номер рамы">
                                </div>
                                <div>
                                    <label class="modal-label">Техосмотр до</label>
                                    <input type="date" id="mechVToDate" class="modal-input">
                                </div>
                                <div>
                                    <label class="modal-label">Страховка до</label>
                                    <input type="date" id="mechVInsuranceDate" class="modal-input">
                                </div>
                            </div>

                            <div>
                                <label class="modal-label">Теги статусов</label>
                                <div id="mechTagsCheckboxContainer" class="mech-checkboxes"></div>
                            </div>

                            <button type="submit" class="glass-btn primary" style="width:100%;">Сохранить</button>
                            <button type="button" id="mechVDeleteBtn" class="glass-btn danger" style="width:100%;display:none;">Удалить из базы</button>
                        </form>
                    </div>
                </div>

                <div id="mechDriversModal" class="modal-overlay">
                    <div class="modal-box" style="max-width:380px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
                            <h3 style="margin:0;color:#fff;font-size:1rem;font-weight:800;">👤 Водители и механизаторы</h3>
                            <button type="button" class="modal-close-x" onclick="MechFleetModule.closeModal('mechDriversModal')">✕</button>
                        </div>
                        <div class="modal-list" id="mechModalDriversList"></div>
                        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:9px;">
                            <input type="text" id="mechNewDriverName" class="modal-input" style="font-size:0.86rem;" placeholder="ФИО...">
                            <button type="button" class="glass-btn primary" style="width:100%;" onclick="MechFleetModule.addDriver()">Добавить</button>
                        </div>
                    </div>
                </div>

                <div id="mechTagsModal" class="modal-overlay">
                    <div class="modal-box" style="max-width:380px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
                            <h3 style="margin:0;color:#fff;font-size:1rem;font-weight:800;">🏷️ Управление тегами</h3>
                            <button type="button" class="modal-close-x" onclick="MechFleetModule.closeModal('mechTagsModal')">✕</button>
                        </div>
                        <div class="modal-list" id="mechModalTagsList"></div>
                        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:9px;">
                            <input type="text" id="mechNewTagName" class="modal-input" style="font-size:0.86rem;" placeholder="Название статуса...">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <label class="modal-label" style="margin:0;">Цвет:</label>
                                <input type="color" id="mechNewTagColor" value="#e2e8f0" style="width:44px;height:38px;border:1px solid var(--line);border-radius:10px;background:none;cursor:pointer;">
                            </div>
                            <button type="button" class="glass-btn primary" style="width:100%;" onclick="MechFleetModule.addTag()">Создать тег</button>
                        </div>
                    </div>
                </div>

                <div id="mechCategoriesModal" class="modal-overlay">
                    <div class="modal-box" style="max-width:380px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
                            <h3 style="margin:0;color:#fff;font-size:1rem;font-weight:800;">📂 Категории</h3>
                            <button type="button" class="modal-close-x" onclick="MechFleetModule.closeModal('mechCategoriesModal')">✕</button>
                        </div>
                        <div class="modal-list" id="mechModalCategoriesList"></div>
                        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:9px;">
                            <input type="text" id="mechNewCatName" class="modal-input" style="font-size:0.86rem;" placeholder="Новая категория...">
                            <button type="button" class="glass-btn primary" style="width:100%;" onclick="MechFleetModule.addCategory()">Добавить</button>
                        </div>
                    </div>
                </div>

                <div id="mechTasksModal" class="modal-overlay">
                    <div class="modal-box" style="max-width:420px;">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                            <div>
                                <h3 style="margin:0;color:#fff;font-size:1rem;font-weight:800;">Задачи по технике</h3>
                                <p id="mechTasksModalSubtitle" style="margin:2px 0 0;color:var(--muted);font-size:0.78rem;font-weight:600;"></p>
                            </div>
                            <button type="button" class="modal-close-x" onclick="MechFleetModule.closeModal('mechTasksModal')">✕</button>
                        </div>
                        <input type="hidden" id="mechTaskVehicleId">
                        <input type="hidden" id="mechTaskVehicleName">
                        <div class="modal-list" id="mechVehicleTasksList" style="margin-top:12px;"></div>
                        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:9px;">
                            <textarea id="mechNewTaskText" rows="2" class="modal-input" style="font-size:0.86rem;min-height:64px;resize:vertical;" placeholder="Текст задачи..."></textarea>
                            <button type="button" class="glass-btn primary" style="width:100%;" onclick="MechFleetModule.addVehicleTask()">Добавить задачу</button>
                        </div>
                    </div>
                </div>

                <div id="mechHoursModal" class="modal-overlay">
                    <div class="modal-box" style="max-width:380px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
                            <h3 style="margin:0;color:#fff;font-size:1rem;font-weight:800;">⏱️ Добавить наработку</h3>
                            <button type="button" class="modal-close-x" onclick="MechFleetModule.closeModal('mechHoursModal')">✕</button>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:12px;">
                            <div>
                                <label class="modal-label">Выберите технику</label>
                                <select id="mechHoursVehicleSelect" class="modal-input" style="padding-top:8px;padding-bottom:8px;font-size:0.86rem;">
                                    <option value="">-- Загрузка --</option>
                                </select>
                            </div>
                            <div>
                                <label class="modal-label">Количество часов</label>
                                <input type="number" id="mechHoursInput" min="0" step="0.5" class="modal-input" placeholder="Например, 8.5">
                            </div>
                            <button type="button" class="glass-btn primary" style="width:100%;" onclick="MechFleetModule.submitHours()">Добавить</button>
                        </div>
                    </div>
                </div>
            `;

            this.bindEvents();
            await this.loadAllData(true);

            if (refreshIntervalId) clearInterval(refreshIntervalId);
            refreshIntervalId = setInterval(() => this.loadAllData(false), 10000);
        },

        stopTimers() {
            if (refreshIntervalId) {
                clearInterval(refreshIntervalId);
                refreshIntervalId = null;
            }
        },

        bindEvents() {
            const search = document.getElementById('mechVehicleSearch');
            if (search) {
                search.addEventListener('input', () => {
                    clearTimeout(searchDebounce);
                    searchDebounce = setTimeout(() => {
                        searchQuery = search.value.toLowerCase().trim();
                        this.renderFleet();
                    }, 250);
                });
            }

            const sort = document.getElementById('mechSortSelect');
            if (sort) {
                sort.addEventListener('change', () => {
                    currentSort = sort.value;
                    this.renderFleet();
                });
            }

            const form = document.getElementById('mechVForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleFormSubmit();
                });
            }

            const delBtn = document.getElementById('mechVDeleteBtn');
            if (delBtn) {
                delBtn.addEventListener('click', () => this.deleteVehicle());
            }

            document.addEventListener('click', () => {
                if (isCategoriesDropdownOpen) {
                    isCategoriesDropdownOpen = false;
                    const menu = document.getElementById('mechCatDropdownMenu');
                    if (menu) menu.classList.remove('open');
                }
            });
        },

        async loadAllData(isFirstLoad = false) {
            if (!window.db) return;
            try {
                const [resVehicles, resTasks, resDrivers, resCategories, resTags] =
                    await Promise.all([
                        db.from('vehicles').select('*'),
                        db.from('vehicle_tasks').select('*').eq('is_completed', false),
                        db.from('fleet_drivers').select('*'),
                        db.from('fleet_categories').select('*'),
                        db.from('fleet_tags').select('*')
                    ]);

                if (!resVehicles.error && resVehicles.data) vehicles = resVehicles.data;
                if (!resTasks.error && resTasks.data) tasks = resTasks.data;

                let categoriesChanged = false;

                if (!resDrivers.error && resDrivers.data) {
                    drivers = resDrivers.data.map(d => d.name);
                }

                if (!resCategories.error && resCategories.data) {
                    const newCategories = resCategories.data.map(c => c.name);
                    if (!newCategories.includes('Без категории')) {
                        newCategories.push('Без категории');
                    }
                    if (JSON.stringify(categories) !== JSON.stringify(newCategories)) {
                        categories = newCategories;
                        categoriesChanged = true;
                    }
                }

                if (!resTags.error && resTags.data) {
                    baseTags = resTags.data.map(t => ({
                        id: t.id,
                        name: t.name,
                        color: t.color || '#e2e8f0'
                    }));
                }

                vehicles.forEach(v => {
                    const typeName = v.type || 'Без категории';
                    if (
                        !categories
                            .map(c => String(c).toLowerCase())
                            .includes(typeName.toLowerCase())
                    ) {
                        categories.push(typeName);
                        categoriesChanged = true;
                    }
                });

                if (isFirstLoad || categoriesChanged) {
                    this.renderCategoriesBar();
                }

                if (!isFirstLoad) {
                    const driversModal = document.getElementById('mechDriversModal');
                    const tagsModal = document.getElementById('mechTagsModal');
                    const categoriesModal = document.getElementById('mechCategoriesModal');

                    if (driversModal && driversModal.classList.contains('open')) {
                        this.renderDriversList();
                    }
                    if (tagsModal && tagsModal.classList.contains('open')) {
                        this.renderTagsList();
                    }
                    if (categoriesModal && categoriesModal.classList.contains('open')) {
                        this.renderCategoriesList();
                    }
                }

                this.renderFleet();
            } catch (e) {
                console.error('Ошибка синхронизации данных автопарка:', e);
            }
        },

        renderCategoriesBar() {
            const bar = document.getElementById('mechCategoriesBar');
            if (!bar) return;

            const isAllActive = selectedCategory === 'all';
            const isNoCatActive =
                String(selectedCategory).toLowerCase() === 'без категории';
            const isOtherActive = !isAllActive && !isNoCatActive;
            const otherCats = categories.filter(c => c !== 'Без категории');

            bar.innerHTML = `
                <span class="mech-section-label" style="margin:0;">Категории:</span>
                <button
                    type="button"
                    class="mech-cat-btn ${isAllActive ? 'active' : ''}"
                    onclick="MechFleetModule.filterCategory('all')"
                >Все</button>
                <button
                    type="button"
                    class="mech-cat-btn ${isNoCatActive ? 'active' : ''}"
                    onclick="MechFleetModule.filterCategory('Без категории')"
                >Без категории</button>
                <div class="mech-cat-dropdown">
                    <button
                        type="button"
                        class="mech-cat-btn ${isOtherActive ? 'active' : ''}"
                        onclick="MechFleetModule.toggleCategoryDropdown(event)"
                    >
                        ${isOtherActive ? esc(selectedCategory) : `— Другие (${otherCats.length}) —`} ▾
                    </button>
                    <div class="mech-cat-menu" id="mechCatDropdownMenu">
                        ${otherCats.map(c => `
                            <button
                                type="button"
                                class="${selectedCategory === c ? 'active' : ''}"
                                onclick="MechFleetModule.filterCategory('${String(c).replace(/'/g, "\\'")}')"
                            >${esc(c)}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        toggleCategoryDropdown(e) {
            e.stopPropagation();
            isCategoriesDropdownOpen = !isCategoriesDropdownOpen;
            const menu = document.getElementById('mechCatDropdownMenu');
            if (menu) menu.classList.toggle('open', isCategoriesDropdownOpen);
        },

        filterCategory(cat) {
            if (!cat) return;
            selectedCategory = cat;
            isCategoriesDropdownOpen = false;
            this.renderCategoriesBar();
            this.renderFleet();
        },

        renderFleet() {
            const container = document.getElementById('mechFleetGrid');
            if (!container) return;

            const filtered = vehicles.filter(v => {
                const vType = v.type || 'Без категории';
                const haystacks = [
                    v.model, v.plate, v.inv_number,
                    v.vin_number, v.tags, v.notes
                ].map(x => String(x || '').toLowerCase());

                const queryMatch = haystacks.some(h => h.includes(searchQuery));
                if (!queryMatch) return false;

                if (selectedCategory !== 'all') {
                    if (
                        String(vType).toLowerCase() !==
                        String(selectedCategory).toLowerCase()
                    ) {
                        return false;
                    }
                }
                return true;
            });

            filtered.sort((a, b) => {
                if (currentSort === 'name_asc') {
                    return String(a.model || '').localeCompare(String(b.model || ''));
                }
                if (currentSort === 'name_desc') {
                    return String(b.model || '').localeCompare(String(a.model || ''));
                }
                if (currentSort === 'hours_desc') {
                    return (b.current_hours || 0) - (a.current_hours || 0);
                }
                return 0;
            });

            let html = '';
            const uniqueTypes = [
                ...new Set(filtered.map(v => v.type || 'Без категории'))
            ];

            uniqueTypes.forEach(cat => {
                const catList = filtered.filter(
                    v =>
                        String(v.type || 'Без категории').toLowerCase() ===
                        String(cat).toLowerCase()
                );
                if (catList.length === 0) return;

                html += `
                    <div class="mech-section-label" style="margin:0 0 8px;">
                        ${esc(cat)} — ${catList.length} ед.
                    </div>
                    <div class="mech-grid cols-3" style="margin-bottom:18px;">
                        ${catList.map(v => this.renderVehicleCard(v)).join('')}
                    </div>
                `;
            });

            container.innerHTML = html ||
                '<div class="glass-panel mech-empty">Техника не найдена</div>';
        },

        renderVehicleCard(v) {
            const now = new Date();

            const formatDocStatus = (dateStr) => {
                if (!dateStr) {
                    return { text: '—', badge: '' };
                }
                const diffDays = Math.ceil(
                    (new Date(dateStr) - now) / (1000 * 60 * 60 * 24)
                );
                const formatted = new Date(dateStr).toLocaleDateString('ru-RU');
                if (diffDays <= 0) {
                    return {
                        text: `${formatted} (просрочено)`,
                        badge: 'badge-red'
                    };
                }
                if (diffDays <= 30) {
                    return {
                        text: `${formatted} (${diffDays} дн.)`,
                        badge: 'badge-amber'
                    };
                }
                return { text: formatted, badge: 'badge-blue' };
            };

            const toInfo = formatDocStatus(v.inspection_date);
            const insInfo = formatDocStatus(v.insurance_date);

            const tagsArray = v.tags
                ? v.tags.split(',').map(t => t.trim()).filter(Boolean)
                : [];
            const vTasks = tasks.filter(t => t.vehicle_id === v.id);
            const unit = getUnitByCategory(v.type);
            const label = unit === 'км' ? 'Пробег' : 'Наработка';
            const role = getDriverRole(v.type);

            let statusClass = '';
            if (tagsArray.includes('Неисправен')) statusClass = 'status-broken';
            else if (tagsArray.includes('Гарантия')) statusClass = 'status-warranty';

            return `
                <div
                    class="glass-panel mech-card ${statusClass}"
                    onclick='MechFleetModule.openVehicleModalById(${JSON.stringify(v.id)})'
                >
                    <div class="mech-card-title">
                        <span>${esc(v.model)}</span>
                        <button
                            type="button"
                            class="modal-close-x"
                            style="font-size:1rem;"
                            onclick="event.stopPropagation(); MechFleetModule.openVehicleModalById(${JSON.stringify(v.id)})"
                            title="Редактировать"
                        >✏️</button>
                    </div>

                    <div class="mech-row">
                        <span class="label">👤 ${role}:</span>
                        <span class="value">${esc(v.notes || 'Не закреплен')}</span>
                    </div>

                    ${tagsArray.length ? `
                        <div class="mech-tags">
                            ${tagsArray.map(t => {
                                const known = baseTags.find(
                                    bt =>
                                        String(bt.name).toLowerCase() ===
                                        t.toLowerCase()
                                );
                                const color = known ? known.color : '#e2e8f0';
                                return `<span class="mech-tag" style="background:${color};">${esc(t)}</span>`;
                            }).join('')}
                        </div>
                    ` : ''}

                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <span class="mech-plate">${esc(v.plate || 'БЕЗ ГОСНОМЕРА')}</span>
                        ${v.inv_number ? `
                            <span style="color:var(--subtle);font-family:'JetBrains Mono',monospace;font-size:0.68rem;">
                                Инв. №: ${esc(v.inv_number)}
                            </span>
                        ` : ''}
                    </div>

                    ${v.vin_number ? `
                        <div
                            style="color:var(--subtle);font-family:'JetBrains Mono',monospace;font-size:0.68rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                            title="${esc(v.vin_number)}"
                        >VIN: ${esc(v.vin_number)}</div>
                    ` : ''}

                    <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;padding-top:10px;border-top:1px solid var(--line);">
                        <div class="mech-row">
                            <span class="label">${label}:</span>
                            <span class="value" style="font-family:'JetBrains Mono',monospace;">
                                ${v.current_hours || 0} ${unit}
                            </span>
                        </div>
                        <div class="mech-row">
                            <span class="label">Техосмотр:</span>
                            <span class="badge ${toInfo.badge}">${esc(toInfo.text)}</span>
                        </div>
                        <div class="mech-row">
                            <span class="label">Страховка:</span>
                            <span class="badge ${insInfo.badge}">${esc(insInfo.text)}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="glass-btn"
                        style="width:100%;margin-top:4px;border-color:rgba(52,211,153,0.4);color:var(--green);"
                        onclick="event.stopPropagation(); MechFleetModule.openTasksModal(${JSON.stringify(v.id)}, '${String(v.model || '').replace(/'/g, "\\'")}')"
                    >📋 Задачи (${vTasks.length})</button>
                </div>
            `;
        },

        openVehicleModalById(id) {
            const v = vehicles.find(x => x.id === id);
            this.openVehicleModal(v || null);
        },

        openVehicleModal(vehicle = null) {
            const modal = document.getElementById('mechVFormModal');
            const title = document.getElementById('mechVModalTitle');
            const delBtn = document.getElementById('mechVDeleteBtn');
            if (!modal) return;

            const catSelect = document.getElementById('mechVCategory');
            if (catSelect) {
                catSelect.innerHTML = categories
                    .map(c => `<option value="${esc(c)}">${esc(c)}</option>`)
                    .join('');
            }

            const driverSelect = document.getElementById('mechVDriver');
            if (driverSelect) {
                driverSelect.innerHTML =
                    '<option value="">— Не закреплен —</option>' +
                    drivers
                        .map(d => `<option value="${esc(d)}">${esc(d)}</option>`)
                        .join('');
            }

            const tagsBox = document.getElementById('mechTagsCheckboxContainer');
            if (tagsBox) {
                tagsBox.innerHTML = baseTags.map(t => `
                    <label class="mech-check-tag" style="background:${t.color};">
                        <input type="checkbox" name="mechVTags" value="${esc(t.name)}">
                        ${esc(t.name)}
                    </label>
                `).join('');
            }

            document.getElementById('mechVForm').reset();
            modal.classList.add('open');

            if (vehicle) {
                title.innerText = 'Редактирование параметров техники';
                document.getElementById('mechVId').value = vehicle.id;
                document.getElementById('mechVCategory').value =
                    vehicle.type || 'Без категории';
                document.getElementById('mechVName').value = vehicle.model || '';
                document.getElementById('mechVDriver').value = vehicle.notes || '';
                document.getElementById('mechVPlate').value = vehicle.plate || '';
                document.getElementById('mechVInv').value = vehicle.inv_number || '';
                document.getElementById('mechVHours').value =
                    vehicle.current_hours || 0;
                document.getElementById('mechVVin').value = vehicle.vin_number || '';
                document.getElementById('mechVToDate').value =
                    vehicle.inspection_date || '';
                document.getElementById('mechVInsuranceDate').value =
                    vehicle.insurance_date || '';

                if (vehicle.tags) {
                    vehicle.tags.split(',').map(t => t.trim()).forEach(t => {
                        const cb = document.querySelector(
                            `input[name="mechVTags"][value="${CSS.escape(t)}"]`
                        );
                        if (cb) cb.checked = true;
                    });
                }
                if (delBtn) delBtn.style.display = 'flex';
            } else {
                title.innerText = 'Добавление новой техники';
                document.getElementById('mechVId').value = '';
                document.getElementById('mechVCategory').value = 'Без категории';
                document.getElementById('mechVDriver').value = '';
                if (delBtn) delBtn.style.display = 'none';
            }
        },

        closeVModal() {
            document.getElementById('mechVFormModal').classList.remove('open');
        },

        closeModal(id) {
            const modal = document.getElementById(id);
            if (modal) modal.classList.remove('open');
        },

        async handleFormSubmit() {
            if (!window.db) return;

            const id = document.getElementById('mechVId').value;
            const selectedTags = [];
            document
                .querySelectorAll('input[name="mechVTags"]:checked')
                .forEach(cb => selectedTags.push(cb.value));

            const val = (eid) => document.getElementById(eid).value;

            const payload = {
                type: val('mechVCategory'),
                model: val('mechVName'),
                notes: val('mechVDriver'),
                plate: val('mechVPlate'),
                inv_number: val('mechVInv'),
                current_hours: parseInt(val('mechVHours')) || 0,
                vin_number: val('mechVVin') || null,
                inspection_date: val('mechVToDate') || null,
                insurance_date: val('mechVInsuranceDate') || null,
                tags: selectedTags.join(', ')
            };

            try {
                if (id) {
                    const { error } = await db
                        .from('vehicles')
                        .update(payload)
                        .eq('id', id);
                    if (error) throw error;
                } else {
                    const { error } = await db
                        .from('vehicles')
                        .insert([payload]);
                    if (error) throw error;
                }
                this.closeVModal();
                await this.loadAllData(true);
            } catch (e) {
                alert(e.message);
            }
        },

        async deleteVehicle() {
            const id = document.getElementById('mechVId').value;
            if (!id || !window.db) return;

            if (confirm('Вы точно хотите удалить технику?')) {
                try {
                    const { error } = await db
                        .from('vehicles')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    this.closeVModal();
                    await this.loadAllData(true);
                } catch (e) {
                    alert(e.message);
                }
            }
        },

        // ===== Водители =====
        openDriversModal() {
            document.getElementById('mechDriversModal').classList.add('open');
            this.renderDriversList();
        },

        renderDriversList() {
            const list = document.getElementById('mechModalDriversList');
            if (!list) return;
            list.innerHTML = drivers.map(d => `
                <div class="modal-list-item">
                    <span>👤 ${esc(d)}</span>
                    <button
                        type="button"
                        class="del"
                        onclick="MechFleetModule.deleteDriver('${String(d).replace(/'/g, "\\'")}')"
                    >Удалить</button>
                </div>
            `).join('') || '<div class="mech-hint">Список пуст</div>';
        },

        async addDriver() {
            const input = document.getElementById('mechNewDriverName');
            if (!window.db || !input || !input.value.trim()) return;
            try {
                const { error } = await db
                    .from('fleet_drivers')
                    .insert([{ name: input.value.trim() }]);
                if (error) throw error;
                input.value = '';
                await this.loadAllData(false);
            } catch (e) {
                console.error(e);
            }
        },

        async deleteDriver(driverName) {
            if (!window.db) return;
            if (confirm(`Удалить вод/мех-а "${driverName}" из базы данных?`)) {
                try {
                    await db
                        .from('fleet_drivers')
                        .delete()
                        .eq('name', driverName);
                    await this.loadAllData(false);
                } catch (e) {
                    console.error(e);
                }
            }
        },

        // ===== Теги =====
        openTagsModal() {
            document.getElementById('mechTagsModal').classList.add('open');
            this.renderTagsList();
        },

        renderTagsList() {
            const list = document.getElementById('mechModalTagsList');
            if (!list) return;
            list.innerHTML = baseTags.map(t => `
                <div class="modal-list-item">
                    <span style="display:flex;align-items:center;gap:8px;">
                        <span
                            style="width:14px;height:14px;border-radius:50%;border:1px solid var(--line-bright);background:${t.color};"
                        ></span>
                        ${esc(t.name)}
                    </span>
                    <button
                        type="button"
                        class="del"
                        onclick="MechFleetModule.deleteTag(${t.id})"
                    >Удалить</button>
                </div>
            `).join('') || '<div class="mech-hint">Список пуст</div>';
        },

        async addTag() {
            const nameInput = document.getElementById('mechNewTagName');
            const colorInput = document.getElementById('mechNewTagColor');
            if (!window.db || !nameInput || !nameInput.value.trim()) return;
            try {
                const { error } = await db.from('fleet_tags').insert([{
                    name: nameInput.value.trim(),
                    color: colorInput.value
                }]);
                if (error) throw error;
                nameInput.value = '';
                await this.loadAllData(false);
            } catch (e) {
                console.error(e);
            }
        },

        async deleteTag(tagId) {
            if (!window.db) return;
            const target = baseTags.find(t => t.id === tagId);
            if (
                target &&
                confirm(`Удалить тег "${target.name}" из базы данных?`)
            ) {
                try {
                    await db.from('fleet_tags').delete().eq('id', tagId);
                    await this.loadAllData(false);
                } catch (e) {
                    console.error(e);
                }
            }
        },

        // ===== Категории =====
        openCategoriesModal() {
            document.getElementById('mechCategoriesModal').classList.add('open');
            this.renderCategoriesList();
        },

        renderCategoriesList() {
            const list = document.getElementById('mechModalCategoriesList');
            if (!list) return;
            list.innerHTML = categories.map(c => `
                <div class="modal-list-item">
                    <span>${esc(c)}</span>
                    ${c !== 'Без категории' ? `
                        <button
                            type="button"
                            class="del"
                            onclick="MechFleetModule.deleteCategory('${String(c).replace(/'/g, "\\'")}')"
                        >Удалить</button>
                    ` : ''}
                </div>
            `).join('');
        },

        async addCategory() {
            const input = document.getElementById('mechNewCatName');
            if (!window.db || !input || !input.value.trim()) return;
            try {
                const { error } = await db
                    .from('fleet_categories')
                    .insert([{ name: input.value.trim() }]);
                if (error) throw error;
                input.value = '';
                await this.loadAllData(false);
            } catch (e) {
                console.error(e);
            }
        },

        async deleteCategory(catName) {
            if (!window.db) return;
            if (
                confirm(
                    `Удалить категорию "${catName}"? Вся техника из неё будет переведена в «Без категории».`
                )
            ) {
                try {
                    await db
                        .from('vehicles')
                        .update({ type: 'Без категории' })
                        .eq('type', catName);
                    await db
                        .from('fleet_categories')
                        .delete()
                        .eq('name', catName);
                    await this.loadAllData(false);
                } catch (e) {
                    console.error('Ошибка удаления категории:', e);
                }
            }
        },

        // ===== Задачи по технике =====
        openTasksModal(vehicleId, vehicleName) {
            const modal = document.getElementById('mechTasksModal');
            if (!modal) return;

            modal.classList.add('open');
            document.getElementById('mechTaskVehicleId').value = vehicleId;
            document.getElementById('mechTaskVehicleName').value = vehicleName;
            document.getElementById('mechTasksModalSubtitle').innerText =
                `Техника: ${vehicleName}`;
            document.getElementById('mechNewTaskText').value = '';
            this.renderTasksList();
        },

        renderTasksList() {
            const vId = parseInt(
                document.getElementById('mechTaskVehicleId').value
            );
            const list = document.getElementById('mechVehicleTasksList');
            if (!list) return;

            const vTasks = tasks.filter(t => t.vehicle_id === vId);
            if (vTasks.length === 0) {
                list.innerHTML = '<div class="mech-hint" style="text-align:center;">Нет активных задач</div>';
                return;
            }
            list.innerHTML = vTasks.map(t => `
                <div class="mech-alert warning" style="padding:8px 11px;">
                    <div class="text" style="font-size:0.78rem;">${esc(t.text)}</div>
                    <button
                        type="button"
                        class="glass-btn"
                        style="min-height:28px;padding:3px 10px;font-size:0.7rem;border-color:var(--green-dark);color:var(--green);"
                        onclick="MechFleetModule.completeTask(${t.id})"
                    >Готово</button>
                </div>
            `).join('');
        },

        async addVehicleTask() {
            const vId = document.getElementById('mechTaskVehicleId').value;
            const vName = document.getElementById('mechTaskVehicleName').value;
            const textInput = document.getElementById('mechNewTaskText');
            if (!textInput || !textInput.value.trim() || !window.db) return;

            try {
                const { error } = await db.from('vehicle_tasks').insert([{
                    vehicle_id: parseInt(vId),
                    vehicle_name: vName,
                    text: textInput.value.trim(),
                    is_completed: false
                }]);
                if (error) throw error;
                textInput.value = '';
                await this.loadAllData(true);
                this.renderTasksList();
            } catch (e) {
                console.error(e);
            }
        },

        async completeTask(taskId) {
            if (!window.db) return;
            try {
                await db
                    .from('vehicle_tasks')
                    .update({ is_completed: true })
                    .eq('id', taskId);
                await this.loadAllData(true);
                const modal = document.getElementById('mechTasksModal');
                if (modal && modal.classList.contains('open')) {
                    this.renderTasksList();
                }
            } catch (e) {
                console.error(e);
            }
        },

        // ===== Наработка =====
        async openHoursModal() {
            const modal = document.getElementById('mechHoursModal');
            if (!modal) return;
            modal.classList.add('open');

            const select = document.getElementById('mechHoursVehicleSelect');
            if (!select) return;
            if (vehicles.length === 0) await this.loadAllData(false);

            const sorted = [...vehicles].sort((a, b) =>
                String(a.model || '').localeCompare(String(b.model || ''))
            );
            select.innerHTML = sorted.map(v => `
                <option value="${v.id}">
                    ${esc(v.model)} ${v.plate ? '[' + esc(v.plate) + ']' : '[б/н]'} (${v.current_hours || 0} м/ч)
                </option>
            `).join('');
            document.getElementById('mechHoursInput').value = '';
        },

        async submitHours() {
            const select = document.getElementById('mechHoursVehicleSelect');
            const input = document.getElementById('mechHoursInput');
            const vehicleId = select.value;
            const hours = parseFloat(input.value);

            if (!vehicleId) {
                alert('Выберите технику');
                return;
            }
            if (isNaN(hours) || hours <= 0) {
                alert('Введите положительное число часов');
                return;
            }
            if (!window.db) return;

            try {
                const { data, error } = await db
                    .from('vehicles')
                    .select('current_hours')
                    .eq('id', vehicleId)
                    .single();
                if (error) throw error;

                const newHours = (data.current_hours || 0) + hours;

                const { error: updateError } = await db
                    .from('vehicles')
                    .update({ current_hours: newHours })
                    .eq('id', vehicleId);
                if (updateError) throw updateError;

                this.closeModal('mechHoursModal');
                await this.loadAllData(false);
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        }
    };
})();
