export const template = `
    <!-- Шапка -->
    <div class="animate-fade-in-down mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <span class="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white p-2 rounded-xl shadow-md">📊</span>
                Панель управления
            </h1>
            <p class="text-sm text-gray-500 mt-1 font-medium">Оперативная сводка по филиалу СХК «Великополье»</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200">
            <span class="text-2xl text-gray-400">⏰</span>
            <div class="text-right">
                <p id="dashLiveTime" class="text-lg font-mono font-bold text-gray-900 leading-none">00:00:00</p>
                <p id="dashLiveDate" class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Загрузка даты...</p>
            </div>
        </div>
    </div>

    <!-- Статистика (4 карточки с задержкой) -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 card-stagger">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-between hover-lift">
            <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Автопарк</p>
                <h3 id="dashTotal" class="text-4xl font-black text-gray-900 mt-1">0</h3>
                <p class="text-xs text-gray-400 font-medium mt-0.5">ед. техники</p>
            </div>
            <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl text-indigo-600">🚜</div>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-between hover-lift delay-50">
            <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Готово
                </p>
                <h3 id="dashReady" class="text-4xl font-black text-gray-900 mt-1">0</h3>
            </div>
            <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl text-emerald-600">✅</div>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-between hover-lift delay-100">
            <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Хранение
                </p>
                <h3 id="dashStorage" class="text-4xl font-black text-gray-900 mt-1">0</h3>
            </div>
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl text-blue-600">🏠</div>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-between hover-lift delay-150">
            <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span> Ремонт
                </p>
                <h3 id="dashInRepair" class="text-4xl font-black text-gray-900 mt-1">0</h3>
            </div>
            <div class="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl text-red-600">🔧</div>
        </div>
    </div>

    <!-- Три колонки -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Задачи -->
        <div class="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up delay-100">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div class="flex items-center gap-2">
                    <span class="text-lg">📋</span>
                    <h3 class="text-sm font-extrabold text-gray-700 uppercase tracking-wider">Задачи</h3>
                </div>
                <span id="taskCounter" class="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">0</span>
            </div>
            <div class="p-4 space-y-3 flex-shrink-0">
                <select id="taskVehicleSelect" class="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:border-transparent font-medium text-gray-700">
                    <option value="">-- Общая заметка --</option>
                </select>
                <div class="flex gap-2">
                    <input type="text" id="taskTextInput" placeholder="Текст задачи..." class="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:border-transparent">
                    <button onclick="window.dashAddRepairTask()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm">＋</button>
                </div>
            </div>
            <div id="containerTasks" class="flex-1 px-4 pb-4 space-y-2.5 overflow-y-auto max-h-[360px]">
                <div class="text-gray-400 text-sm py-6 text-center">Загрузка...</div>
            </div>
        </div>

        <!-- Гарантия -->
        <div class="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative animate-fade-in-up delay-200">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div class="flex items-center gap-2">
                    <span class="text-lg">🛠️</span>
                    <h3 class="text-sm font-extrabold text-gray-700 uppercase tracking-wider">Гарантия</h3>
                </div>
                <button onclick="window.dashToggleFilterDropdown(event)" class="text-xs bg-white hover:bg-gray-100 border border-gray-200 font-bold px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1">
                    <span>⚙️</span> Фильтр
                </button>
            </div>
            <div id="dashFilterDropdown" class="absolute left-4 top-[72px] w-64 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 space-y-3 hidden max-h-[300px] overflow-y-auto">
                <div class="flex items-center justify-between border-b border-gray-100 pb-2">
                    <p class="text-[10px] font-black uppercase text-gray-400 tracking-wider">Отображать</p>
                    <button onclick="window.dashResetFilter()" class="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition">Показать все</button>
                </div>
                <div id="dashFilterCheckboxes" class="space-y-1.5 text-sm"></div>
                <div id="dashFilterStats" class="text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-1 text-center"></div>
            </div>
            <div id="containerWarranty" class="flex-1 px-4 pb-4 space-y-2.5 overflow-y-auto max-h-[360px]">
                <div class="text-gray-400 text-sm py-6 text-center">Загрузка...</div>
            </div>
        </div>

        <!-- Документы -->
        <div class="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up delay-300">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div class="flex items-center gap-2">
                    <span class="text-lg">📄</span>
                    <h3 class="text-sm font-extrabold text-gray-700 uppercase tracking-wider">Документы</h3>
                </div>
            </div>
            <div id="containerDocs" class="flex-1 px-4 pb-4 space-y-2.5 overflow-y-auto max-h-[360px]">
                <div class="text-gray-400 text-sm py-6 text-center">Загрузка...</div>
            </div>
        </div>
    </div>

    <!-- Модалка -->
    <div id="dashEditModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 relative border border-gray-200 modal-enter">
            <button onclick="window.dashCloseModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
            <div>
                <h4 id="modalVehicleTitle" class="text-lg font-black text-gray-900 leading-tight">Модель техники</h4>
                <p id="modalVehiclePlate" class="text-sm font-mono text-gray-500 mt-0.5">[0000 AA-7]</p>
            </div>
            <div id="modalWarrantySection" class="space-y-4 pt-2 border-t border-gray-100 hidden">
                <div><label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Текущая наработка</label><input type="number" id="inputModalCurrentHours" class="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-none"></div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Нулевая база</label><input type="number" id="inputModalZeroHours" class="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-none"></div>
                    <div><label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Периодичность</label><input type="number" id="inputModalStepHours" class="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-none"></div>
                </div>
            </div>
            <div id="modalDocsSection" class="space-y-4 pt-2 border-t border-gray-100 hidden">
                <div><label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Дата Гостехосмотра</label><input type="date" id="inputModalInspectionDate" class="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-400 focus:outline-none"></div>
                <div><label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Дата Страховки</label><input type="date" id="inputModalInsuranceDate" class="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-400 focus:outline-none"></div>
            </div>
            <button onclick="window.dashSaveModalData()" class="w-full bg-gray-900 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition shadow-md text-sm">Сохранить изменения</button>
        </div>
    </div>

    <!-- Нижняя панель -->
    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up delay-350">
        <div class="flex items-center gap-3">
            <span class="text-2xl">📌</span>
            <div>
                <p class="text-sm font-bold text-gray-900">Необходимо внести комплексные изменения?</p>
                <p class="text-xs text-gray-500 font-medium">Перейдите в раздел Автопарк для редактирования карточек</p>
            </div>
        </div>
        <button onclick="window.switchModule('fleet')" class="bg-gray-900 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-2">
            Перейти в Автопарк <span>➔</span>
        </button>
    </div>
`;

// ===== ВСЕ ФУНКЦИИ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ =====
// (тут должен быть весь остальной код dashboard.js – он не меняется)
// Просто оставьте всё, что было после template.

let refreshIntervalId = null;
let clockIntervalId = null;
let activeModalVehicleId = null;

function getUnitByCategory(type) {
    if (!type) return 'м/ч';
    const lower = type.toLowerCase();
    const carKeywords = ['легковой', 'грузовой', 'грузопассажирский', 'автобус', 'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'];
    for (let kw of carKeywords) {
        if (lower.includes(kw)) return 'км';
    }
    return 'м/ч';
}

export async function init() {
    window.dashCompleteTask = dashCompleteTask;
    window.dashAddRepairTask = dashAddRepairTask;
    window.dashToggleFilterDropdown = dashToggleFilterDropdown;
    window.dashToggleLocalVisibility = dashToggleLocalVisibility;
    window.dashResetFilter = dashResetFilter;
    window.dashOpenWarrantyModal = dashOpenWarrantyModal;
    window.dashOpenDocsModal = dashOpenDocsModal;
    window.dashCloseModal = dashCloseModal;
    window.dashSaveModalData = dashSaveModalData;

    document.addEventListener('click', function(e) {
        const drop = document.getElementById('dashFilterDropdown');
        if (drop && !drop.contains(e.target) && !e.target.closest('button')) {
            drop.classList.add('hidden');
        }
    });

    if (clockIntervalId) clearInterval(clockIntervalId);
    startLiveClock();

    await loadDashboardData();
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(loadDashboardData, 5000);
}

function startLiveClock() {
    const updateClock = () => {
        const now = new Date();
        const timeEl = document.getElementById('dashLiveTime');
        const dateEl = document.getElementById('dashLiveDate');
        if (timeEl) timeEl.innerText = now.toLocaleTimeString('ru-RU');
        if (dateEl) {
            const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            dateEl.innerText = now.toLocaleDateString('ru-RU', options).replace('.', '');
        }
    };
    updateClock();
    clockIntervalId = setInterval(updateClock, 1000);
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
        console.error("Ошибка обновления Dashboard:", err.message);
    }
}

function updateTaskCounter(count) {
    const el = document.getElementById('taskCounter');
    if (el) el.innerText = count;
}

function renderStats(list) {
    const stats = {
        'dashTotal': list.length,
        'dashReady': list.filter(v => v.tags && v.tags.includes('Готов')).length,
        'dashStorage': list.filter(v => v.tags && v.tags.includes('На хранении')).length,
        'dashInRepair': list.filter(v => v.tags && v.tags.includes('В ремонте')).length
    };
    for (const [id, value] of Object.entries(stats)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }
}

function populateVehicleDropdown(vehicles) {
    const select = document.getElementById('taskVehicleSelect');
    if (!select || select.options.length > 1) return;
    const sorted = [...vehicles].sort((a,b) => a.model.localeCompare(b.model));
    sorted.forEach(v => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ id: v.id, name: v.model });
        opt.innerText = `${v.model} ${v.plate ? '['+v.plate+']' : '[б/н]'}`;
        select.appendChild(opt);
    });
}

function dashToggleFilterDropdown(e) {
    e.stopPropagation();
    const drop = document.getElementById('dashFilterDropdown');
    if (drop) drop.classList.toggle('hidden');
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
        container.innerHTML = `<p class="text-gray-400 text-sm py-2 text-center font-medium">Нет гарантийной техники</p>`;
        if (statsEl) statsEl.innerText = '';
        return;
    }
    warrantyVehicles.sort((a,b) => a.model.localeCompare(b.model));
    container.innerHTML = warrantyVehicles.map(v => {
        const isChecked = !hiddenVehicles.includes(v.id) ? 'checked' : '';
        return `
            <label class="flex items-center gap-2 cursor-pointer py-1 hover:bg-gray-50 rounded-lg px-2 text-gray-800 font-medium text-sm">
                <input type="checkbox" ${isChecked} onchange="window.dashToggleLocalVisibility(${v.id}, this.checked)" class="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500">
                <span class="truncate">${v.model} ${v.plate ? '('+v.plate+')' : '(б/н)'}</span>
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
    const setInner = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    setInner('modalVehicleTitle', model);
    setInner('modalVehiclePlate', plate ? `[${plate}]` : '[б/н]');
    setVal('inputModalCurrentHours', current);
    setVal('inputModalZeroHours', zero);
    setVal('inputModalStepHours', step);
    setVal('inputModalInspectionDate', inspectDate || '');
    setVal('inputModalInsuranceDate', insDate || '');

    document.getElementById('modalWarrantySection').classList.remove('hidden');
    document.getElementById('modalDocsSection').classList.add('hidden');
    document.getElementById('dashEditModal').classList.remove('hidden');
}

function dashOpenDocsModal(id, model, plate, inspectDate, insDate, current, zero, step) {
    activeModalVehicleId = id;
    const setInner = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    setInner('modalVehicleTitle', model);
    setInner('modalVehiclePlate', plate ? `[${plate}]` : '[б/н]');
    setVal('inputModalInspectionDate', inspectDate || '');
    setVal('inputModalInsuranceDate', insDate || '');
    setVal('inputModalCurrentHours', current);
    setVal('inputModalZeroHours', zero);
    setVal('inputModalStepHours', step);

    document.getElementById('modalDocsSection').classList.remove('hidden');
    document.getElementById('modalWarrantySection').classList.add('hidden');
    document.getElementById('dashEditModal').classList.remove('hidden');
}

function dashCloseModal() {
    document.getElementById('dashEditModal').classList.add('hidden');
    activeModalVehicleId = null;
}

async function dashSaveModalData() {
    if (!activeModalVehicleId) return;
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
        alert("Ошибка сохранения: " + err.message);
    }
}

async function dashAddRepairTask() {
    const select = document.getElementById('taskVehicleSelect');
    const input = document.getElementById('taskTextInput');
    if (!input || !input.value.trim()) return;
    let vehicleId = null;
    let vehicleName = "Заметка / Пометка";
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
        alert("Ошибка добавления: " + err.message);
    }
}

async function dashCompleteTask(taskId) {
    try {
        const { error } = await window._supabase.from('vehicle_tasks').update({ is_completed: true }).eq('id', taskId);
        if (error) throw error;
        await loadDashboardData();
    } catch (err) {
        alert("Ошибка закрытия: " + err.message);
    }
}

function renderSeparatedAlerts(list, activeTasks) {
    const today = new Date();
    const plateMap = {};
    list.forEach(v => { plateMap[v.id] = v.plate ? `[${v.plate}]` : '[б/н]'; });
    const hiddenVehicles = JSON.parse(localStorage.getItem('dash_hidden_warranty') || '[]');

    const containerTasks = document.getElementById('containerTasks');
    if (containerTasks) {
        if (activeTasks.length > 0) {
            containerTasks.innerHTML = activeTasks.map(task => {
                const plateStr = plateMap[task.vehicle_id] || '';
                return `
                    <div class="bg-amber-50/80 border border-amber-200 rounded-xl p-3 shadow-sm hover:shadow-md transition flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-xs font-extrabold text-amber-800 uppercase tracking-wide">${task.vehicle_id ? '🚜 ' + task.vehicle_name : '📝 Заметка'}</span>
                                <span class="text-xs font-mono text-gray-500">${plateStr}</span>
                            </div>
                            <p class="text-sm font-semibold text-gray-900 mt-0.5 break-words">${task.text}</p>
                        </div>
                        <button onclick="window.dashCompleteTask('${task.id}')" class="bg-amber-600 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex-shrink-0">Готово</button>
                    </div>
                `;
            }).join('');
        } else {
            containerTasks.innerHTML = `<div class="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-center text-sm font-bold text-emerald-800">✅ Нет активных задач</div>`;
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
                    id: v.id,
                    model: v.model,
                    plate: cleanPlate,
                    plateLabel: plateStr,
                    daysLeft: diff,
                    isCritical: diff <= 0,
                    inspectDate: v.inspection_date,
                    insDate: v.insurance_date,
                    current: v.current_hours || 0,
                    zero: v.zero_hours || 0,
                    step: v.step_hours || 125,
                    statusText: diff <= 0 ? `🛑 Просрочен Гостехосмотр!` : `⚠️ Техосмотр истекает через ${diff} дн.`
                });
            }
        }
        if (v.insurance_date) {
            const diffIns = Math.ceil((new Date(v.insurance_date) - today) / (1000 * 60 * 60 * 24));
            if (diffIns <= 30) {
                docAlerts.push({
                    id: v.id,
                    model: v.model,
                    plate: cleanPlate,
                    plateLabel: plateStr,
                    daysLeft: diffIns,
                    isCritical: diffIns <= 0,
                    inspectDate: v.inspection_date,
                    insDate: v.insurance_date,
                    current: v.current_hours || 0,
                    zero: v.zero_hours || 0,
                    step: v.step_hours || 125,
                    statusText: diffIns <= 0 ? `🛑 Закончилась страховка!` : `⚠️ Страховка истекает через ${diffIns} дн.`
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
                statusText = `🚨 <span class="text-red-700 font-black">Срочно ТО (${nextTO} ${unit})!</span> Осталось <b>${hoursLeft} ${unit}</b>.`;
            } else if (hoursLeft <= 100) {
                status = 'warning';
                statusText = `⚠️ Срок ТО (${nextTO} ${unit}). Осталось <b>${hoursLeft} ${unit}</b>.`;
            }

            warrantyAlerts.push({
                id: v.id,
                status: status,
                hoursLeft: hoursLeft,
                model: v.model,
                plate: cleanPlate,
                plateLabel: plateStr,
                hours: hours,
                zeroHours: zeroHours,
                stepHours: stepHours,
                inspectDate: v.inspection_date,
                insDate: v.insurance_date,
                text: statusText,
                unit: unit,
                label: label
            });
        }
    });

    warrantyAlerts.sort((a, b) => a.hoursLeft - b.hoursLeft);
    docAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    const containerWarranty = document.getElementById('containerWarranty');
    if (containerWarranty) {
        if (warrantyAlerts.length === 0) {
            containerWarranty.innerHTML = `<div class="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-center text-sm font-bold text-emerald-800">✅ Нет техники на контроле</div>`;
        } else {
            containerWarranty.innerHTML = warrantyAlerts.map(a => {
                let cardClass = "bg-blue-50/60 border-blue-200";
                let textClass = "text-blue-900";
                if (a.status === 'danger') {
                    cardClass = "bg-red-50/70 border-red-200";
                    textClass = "text-red-900";
                } else if (a.status === 'warning') {
                    cardClass = "bg-amber-50/70 border-amber-200";
                    textClass = "text-amber-900";
                }
                return `
                    <div class="border rounded-xl p-3 shadow-sm hover:shadow-md transition ${cardClass} flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-sm font-extrabold ${textClass}">${a.model}</span>
                                <span class="text-xs font-mono text-gray-500">${a.plateLabel}</span>
                            </div>
                            <p class="text-sm font-medium text-gray-800 mt-0.5 break-words">${a.text}</p>
                        </div>
                        <button onclick="window.dashOpenWarrantyModal(${a.id}, '${a.model}', '${a.plate}', ${a.hours}, ${a.zeroHours}, ${a.stepHours}, '${a.inspectDate || ''}', '${a.insDate || ''}')" class="p-1.5 hover:bg-black/5 rounded-lg text-gray-600 hover:text-gray-900 transition flex-shrink-0" title="Изменить параметры">✏️</button>
                    </div>
                `;
            }).join('');
        }
    }

    const containerDocs = document.getElementById('containerDocs');
    if (containerDocs) {
        if (docAlerts.length === 0) {
            containerDocs.innerHTML = `<div class="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-center text-sm font-bold text-emerald-800">✅ Все документы в порядке!</div>`;
        } else {
            containerDocs.innerHTML = docAlerts.map(d => {
                const cardClass = d.isCritical ? "bg-red-50/70 border-red-200" : "bg-amber-50/70 border-amber-200";
                const textClass = d.isCritical ? "text-red-900" : "text-amber-900";
                return `
                    <div class="border rounded-xl p-3 shadow-sm hover:shadow-md transition ${cardClass} flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-sm font-extrabold ${textClass}">${d.model}</span>
                                <span class="text-xs font-mono text-gray-500">${d.plateLabel}</span>
                            </div>
                            <p class="text-sm font-medium text-gray-800 mt-0.5 break-words">${d.statusText}</p>
                        </div>
                        <button onclick="window.dashOpenDocsModal(${d.id}, '${d.model}', '${d.plate}', '${d.inspectDate || ''}', '${d.insDate || ''}', ${d.current}, ${d.zero}, ${d.step})" class="p-1.5 hover:bg-black/5 rounded-lg text-gray-600 hover:text-gray-900 transition flex-shrink-0" title="Изменить даты">✏️</button>
                    </div>
                `;
            }).join('');
        }
    }
}