// js/repair_requests.js

export const template = `
<div class="space-y-6 animate-fade-in-down">
    <!-- Верхняя панель -->
    <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span class="bg-orange-100 p-1.5 rounded-lg">🔧</span> Заявки на ремонт
            </h2>
            <p class="text-sm text-gray-500 font-medium">Учёт заявок на ремонт и обслуживание техники</p>
        </div>
        <button onclick="window.openRequestModal()" class="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-2 hover-lift">
            ➕ Новая заявка
        </button>
    </div>

    <!-- Фильтры -->
    <div class="animate-fade-in-up delay-50 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Фильтр по статусу:</span>
        <button onclick="window.filterRequests('all')" id="statusFilter_all" class="px-3 py-1 text-xs font-bold rounded-xl border-2 border-orange-600 bg-orange-600 text-white">Все</button>
        <div id="statusFilterContainer" class="flex flex-wrap gap-2"></div>
        <button onclick="window.openStatusManager()" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-xl border border-gray-300 transition hover-lift">+ Управлять</button>
    </div>

    <!-- Список заявок -->
    <div id="requestsGrid" class="space-y-3 card-stagger">
        <div class="text-center text-gray-400 py-12 text-sm font-medium bg-white rounded-2xl border border-gray-200">Загрузка заявок...</div>
    </div>

    <!-- Модалка создания/редактирования заявки -->
    <div id="requestFormModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-lg p-6 border border-gray-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button onclick="window.closeRequestModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 id="requestModalTitle" class="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">Новая заявка</h3>
            <form id="requestForm" class="space-y-4 text-sm">
                <input type="hidden" id="requestId">
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Заголовок *</label>
                    <input type="text" id="requestTitle" required class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Краткое описание">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Техника</label>
                    <select id="requestVehicle" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-orange-400 focus:border-transparent">
                        <option value="">-- Выберите технику --</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Описание</label>
                    <textarea id="requestDescription" rows="3" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Подробности неисправности"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Приоритет</label>
                        <div class="flex gap-1">
                            <select id="requestPriority" class="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-orange-400 focus:border-transparent">
                                <option value="low">Низкий</option>
                                <option value="normal" selected>Средний</option>
                                <option value="high">Высокий</option>
                                <option value="critical">Критический</option>
                            </select>
                            <button type="button" onclick="window.addPriorityOption()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 rounded-xl border border-gray-300 transition hover-lift" title="Добавить новый приоритет">+</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Статус</label>
                        <div class="flex gap-1">
                            <select id="requestStatus" class="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-orange-400 focus:border-transparent">
                                <option value="new">Новая</option>
                                <option value="in_progress">В работе</option>
                                <option value="completed">Выполнена</option>
                                <option value="cancelled">Отменена</option>
                            </select>
                            <button type="button" onclick="window.addStatusOption()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 rounded-xl border border-gray-300 transition hover-lift" title="Добавить новый статус">+</button>
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Примечания</label>
                    <textarea id="requestNotes" rows="2" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Дополнительная информация"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Оценочная стоимость (руб)</label>
                        <input type="number" id="requestCostEstimate" step="0.01" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-orange-400 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Фактическая стоимость (руб)</label>
                        <input type="number" id="requestActualCost" step="0.01" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-orange-400 focus:border-transparent">
                    </div>
                </div>
                <div class="flex gap-3 pt-3 border-t border-gray-100">
                    <button type="button" onclick="window.closeRequestModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Отмена</button>
                    <button type="submit" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold transition shadow-md hover-lift">Сохранить</button>
                </div>
                <button type="button" id="requestDeleteBtn" class="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition border border-red-300 hidden hover-lift">Удалить заявку</button>
            </form>
        </div>
    </div>

    <div id="statusManagerModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-sm p-6 border border-gray-200 shadow-2xl space-y-4 relative modal-enter">
            <button onclick="window.closeStatusManager()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 class="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">Управление статусами и приоритетами</h3>
            <div>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Статусы</p>
                <div id="statusList" class="space-y-1 max-h-32 overflow-y-auto"></div>
                <div class="flex gap-2 mt-2">
                    <input type="text" id="newStatusInput" placeholder="Новый статус..." class="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent">
                    <button onclick="window.addStatusItem()" class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-xl text-sm font-bold transition hover-lift">Добавить</button>
                </div>
            </div>
            <div class="border-t border-gray-200 pt-3">
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Приоритеты</p>
                <div id="priorityList" class="space-y-1 max-h-32 overflow-y-auto"></div>
                <div class="flex gap-2 mt-2">
                    <input type="text" id="newPriorityInput" placeholder="Новый приоритет..." class="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent">
                    <button onclick="window.addPriorityItem()" class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-xl text-sm font-bold transition hover-lift">Добавить</button>
                </div>
            </div>
            <button onclick="window.closeStatusManager()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Закрыть</button>
        </div>
    </div>
</div>
`;

// ===== Глобальные данные =====
let requests = [];
let vehicles = [];
let allStatuses = ['new', 'in_progress', 'completed', 'cancelled'];
let allPriorities = ['low', 'normal', 'high', 'critical'];

// Храним соответствие отображаемых названий и значений
const statusDisplay = { 'new': 'Новая', 'in_progress': 'В работе', 'completed': 'Выполнена', 'cancelled': 'Отменена' };
const priorityDisplay = { 'low': 'Низкий', 'normal': 'Средний', 'high': 'Высокий', 'critical': 'Критический' };

// ===== Инициализация =====
export async function init() {
    console.log('🔧 Модуль заявок инициализирован');

    // Глобальные функции
    window.openRequestModal = openRequestModal;
    window.closeRequestModal = closeRequestModal;
    window.filterRequests = filterRequests;
    window.openStatusManager = openStatusManager;
    window.closeStatusManager = closeStatusManager;
    window.addPriorityOption = addPriorityOption;
    window.addStatusOption = addStatusOption;
    window.addStatusItem = addStatusItem;
    window.addPriorityItem = addPriorityItem;

    // Загружаем технику
    await loadVehicles();

    // Загружаем заявки
    await loadRequests();
    renderRequests();

    // Обработчики форм
    const form = document.getElementById('requestForm');
    if (form) form.addEventListener('submit', handleRequestSubmit);

    const deleteBtn = document.getElementById('requestDeleteBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', handleDeleteRequest);

    // Загружаем сохранённые статусы/приоритеты из localStorage
    loadCustomOptions();
}

// ===== Загрузка техники =====
async function loadVehicles() {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('vehicles')
            .select('id, model, plate')
            .order('model');
        if (error) throw error;
        vehicles = data || [];
        console.log(`✅ Загружено ${vehicles.length} единиц техники`);
        fillVehicleSelect();
    } catch (err) {
        console.error('Ошибка загрузки техники:', err);
    }
}

function fillVehicleSelect() {
    const select = document.getElementById('requestVehicle');
    if (!select) return;
    select.innerHTML = '<option value="">-- Выберите технику --</option>' +
        vehicles.map(v => `<option value="${v.id}">${v.model} ${v.plate ? '['+v.plate+']' : ''}</option>`).join('');
}

// ===== Загрузка заявок =====
async function loadRequests() {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('repair_requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        requests = data || [];
        console.log(`✅ Загружено ${requests.length} заявок`);
    } catch (err) {
        console.error('Ошибка загрузки заявок:', err);
    }
}

// ===== Рендеринг заявок =====
function renderRequests() {
    const container = document.getElementById('requestsGrid');
    if (!container) return;

    const filtered = getFilteredRequests();

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-400 py-12 text-sm font-medium bg-white rounded-2xl border border-gray-200">Нет заявок</div>`;
        return;
    }

    container.innerHTML = filtered.map(req => {
        const vehicle = vehicles.find(v => v.id === req.vehicle_id);
        const vehicleName = vehicle ? `${vehicle.model} ${vehicle.plate ? '['+vehicle.plate+']' : ''}` : '—';
        const priorityText = priorityDisplay[req.priority] || req.priority;
        const statusText = statusDisplay[req.status] || req.status;

        let priorityColor = 'bg-gray-100 text-gray-700';
        if (req.priority === 'low') priorityColor = 'bg-green-100 text-green-800';
        else if (req.priority === 'normal') priorityColor = 'bg-blue-100 text-blue-800';
        else if (req.priority === 'high') priorityColor = 'bg-yellow-100 text-yellow-800';
        else if (req.priority === 'critical') priorityColor = 'bg-red-100 text-red-800';

        let statusColor = 'bg-gray-100 text-gray-700';
        if (req.status === 'new') statusColor = 'bg-blue-100 text-blue-800';
        else if (req.status === 'in_progress') statusColor = 'bg-amber-100 text-amber-800';
        else if (req.status === 'completed') statusColor = 'bg-green-100 text-green-800';
        else if (req.status === 'cancelled') statusColor = 'bg-red-100 text-red-800';

        const date = new Date(req.created_at).toLocaleDateString('ru-RU');

        return `
            <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer" onclick="window.openRequestModal('${req.id}')">
                <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-gray-900">${req.title || 'Без заголовка'}</h3>
                            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${priorityColor}">${priorityText}</span>
                            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${statusColor}">${statusText}</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">${req.description || '—'}</p>
                        <div class="text-xs text-gray-500 mt-1">🚜 ${vehicleName}</div>
                    </div>
                    <div class="text-xs text-gray-400">📅 ${date}</div>
                </div>
                ${req.notes ? `<div class="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">📝 ${req.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

// ===== Фильтрация =====
let currentStatusFilter = 'all';

function filterRequests(status) {
    currentStatusFilter = status;
    // Обновляем активную кнопку
    document.querySelectorAll('#statusFilterContainer button, #statusFilter_all').forEach(btn => {
        btn.classList.remove('border-orange-600', 'bg-orange-600', 'text-white');
        btn.classList.add('border-gray-300', 'text-gray-700');
        if (btn.id === 'statusFilter_all' && status === 'all') {
            btn.classList.add('border-orange-600', 'bg-orange-600', 'text-white');
        } else if (btn.dataset.status === status) {
            btn.classList.add('border-orange-600', 'bg-orange-600', 'text-white');
        }
    });
    renderRequests();
}

function getFilteredRequests() {
    if (currentStatusFilter === 'all') return requests;
    return requests.filter(r => r.status === currentStatusFilter);
}

// ===== Модалка создания/редактирования =====
let editingRequestId = null;

function openRequestModal(id = null) {
    const modal = document.getElementById('requestFormModal');
    const title = document.getElementById('requestModalTitle');
    const deleteBtn = document.getElementById('requestDeleteBtn');

    // Заполняем select техники
    fillVehicleSelect();

    // Заполняем приоритеты и статусы из кастомных списков
    const prioritySelect = document.getElementById('requestPriority');
    const statusSelect = document.getElementById('requestStatus');
    prioritySelect.innerHTML = allPriorities.map(p => `<option value="${p}">${priorityDisplay[p] || p}</option>`).join('');
    statusSelect.innerHTML = allStatuses.map(s => `<option value="${s}">${statusDisplay[s] || s}</option>`).join('');

    if (id) {
        const req = requests.find(r => r.id === id);
        if (!req) return;
        editingRequestId = id;
        title.textContent = 'Редактирование заявки';
        document.getElementById('requestId').value = req.id;
        document.getElementById('requestTitle').value = req.title || '';
        document.getElementById('requestVehicle').value = req.vehicle_id || '';
        document.getElementById('requestDescription').value = req.description || '';
        document.getElementById('requestPriority').value = req.priority || 'normal';
        document.getElementById('requestStatus').value = req.status || 'new';
        document.getElementById('requestNotes').value = req.notes || '';
        document.getElementById('requestCostEstimate').value = req.cost_estimate || '';
        document.getElementById('requestActualCost').value = req.actual_cost || '';
        deleteBtn.classList.remove('hidden');
    } else {
        editingRequestId = null;
        title.textContent = 'Новая заявка';
        document.getElementById('requestForm').reset();
        document.getElementById('requestId').value = '';
        deleteBtn.classList.add('hidden');
        // Устанавливаем дату сегодня
        document.getElementById('requestTitle').value = 'Заявка от ' + new Date().toLocaleDateString('ru-RU');
        document.getElementById('requestPriority').value = 'normal';
        document.getElementById('requestStatus').value = 'new';
    }

    modal.classList.remove('hidden');
}

function closeRequestModal() {
    document.getElementById('requestFormModal').classList.add('hidden');
    editingRequestId = null;
}

window.closeRequestModal = closeRequestModal;
window.openRequestModal = openRequestModal;

async function handleRequestSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('requestId').value;
    const title = document.getElementById('requestTitle').value.trim();
    const vehicle_id = document.getElementById('requestVehicle').value || null;
    const description = document.getElementById('requestDescription').value.trim() || null;
    const priority = document.getElementById('requestPriority').value;
    const status = document.getElementById('requestStatus').value;
    const notes = document.getElementById('requestNotes').value.trim() || null;
    const cost_estimate = parseFloat(document.getElementById('requestCostEstimate').value) || null;
    const actual_cost = parseFloat(document.getElementById('requestActualCost').value) || null;

    if (!title) {
        alert('Заголовок обязателен!');
        return;
    }

    if (!window._supabase) return;

    const payload = {
        title,
        vehicle_id: vehicle_id ? parseInt(vehicle_id) : null,
        description,
        priority,
        status,
        notes,
        cost_estimate,
        actual_cost,
        updated_at: new Date().toISOString()
    };

    try {
        if (id) {
            const { error } = await window._supabase
                .from('repair_requests')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
        } else {
            payload.created_by = localStorage.getItem('user_name') || 'Сотрудник';
            const { error } = await window._supabase
                .from('repair_requests')
                .insert([payload]);
            if (error) throw error;
        }
        closeRequestModal();
        await loadRequests();
        renderRequests();
        updateStatusFilterButtons();
    } catch (err) {
        alert('Ошибка сохранения: ' + err.message);
    }
}

async function handleDeleteRequest() {
    const id = document.getElementById('requestId').value;
    if (!id) return;
    if (!confirm('Удалить заявку?')) return;

    try {
        const { error } = await window._supabase
            .from('repair_requests')
            .delete()
            .eq('id', id);
        if (error) throw error;
        closeRequestModal();
        await loadRequests();
        renderRequests();
        updateStatusFilterButtons();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
}

// ===== Фильтры по статусам (динамические) =====
function updateStatusFilterButtons() {
    const container = document.getElementById('statusFilterContainer');
    if (!container) return;

    // Получаем уникальные статусы из заявок
    const statuses = [...new Set(requests.map(r => r.status))].filter(Boolean);
    const allStatusesList = ['all', ...statuses];

    container.innerHTML = statuses.map(s => {
        const display = statusDisplay[s] || s;
        const isActive = currentStatusFilter === s;
        return `<button onclick="window.filterRequests('${s}')" data-status="${s}" class="px-3 py-1 text-xs font-bold rounded-xl border-2 ${isActive ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-300 text-gray-700'}">${display}</button>`;
    }).join('');
}

// ===== Управление кастомными приоритетами/статусами =====
function loadCustomOptions() {
    // Загружаем из localStorage
    const savedStatuses = localStorage.getItem('repair_statuses');
    const savedPriorities = localStorage.getItem('repair_priorities');
    if (savedStatuses) {
        try {
            const parsed = JSON.parse(savedStatuses);
            if (Array.isArray(parsed) && parsed.length) {
                allStatuses = parsed;
                // Обновляем display-маппинг
                parsed.forEach(s => { if (!statusDisplay[s]) statusDisplay[s] = s; });
            }
        } catch(e) {}
    }
    if (savedPriorities) {
        try {
            const parsed = JSON.parse(savedPriorities);
            if (Array.isArray(parsed) && parsed.length) {
                allPriorities = parsed;
                parsed.forEach(p => { if (!priorityDisplay[p]) priorityDisplay[p] = p; });
            }
        } catch(e) {}
    }
}

function saveCustomOptions() {
    localStorage.setItem('repair_statuses', JSON.stringify(allStatuses));
    localStorage.setItem('repair_priorities', JSON.stringify(allPriorities));
}

// ===== Добавление опции через кнопку "+" =====
function addPriorityOption() {
    const newValue = prompt('Введите новый приоритет (на английском, например: urgent):');
    if (!newValue) return;
    const trimmed = newValue.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed) return;
    if (allPriorities.includes(trimmed)) {
        alert('Такой приоритет уже существует');
        return;
    }
    allPriorities.push(trimmed);
    priorityDisplay[trimmed] = newValue.trim();
    saveCustomOptions();
    // Обновляем select
    const select = document.getElementById('requestPriority');
    if (select) {
        const opt = document.createElement('option');
        opt.value = trimmed;
        opt.textContent = priorityDisplay[trimmed];
        select.appendChild(opt);
        select.value = trimmed;
    }
}

function addStatusOption() {
    const newValue = prompt('Введите новый статус (на английском, например: awaiting_parts):');
    if (!newValue) return;
    const trimmed = newValue.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed) return;
    if (allStatuses.includes(trimmed)) {
        alert('Такой статус уже существует');
        return;
    }
    allStatuses.push(trimmed);
    statusDisplay[trimmed] = newValue.trim();
    saveCustomOptions();
    // Обновляем select
    const select = document.getElementById('requestStatus');
    if (select) {
        const opt = document.createElement('option');
        opt.value = trimmed;
        opt.textContent = statusDisplay[trimmed];
        select.appendChild(opt);
        select.value = trimmed;
    }
}

window.addPriorityOption = addPriorityOption;
window.addStatusOption = addStatusOption;

// ===== Модалка управления (для массового добавления) =====
function openStatusManager() {
    document.getElementById('statusManagerModal').classList.remove('hidden');
    renderStatusManagerLists();
}

function closeStatusManager() {
    document.getElementById('statusManagerModal').classList.add('hidden');
}

window.openStatusManager = openStatusManager;
window.closeStatusManager = closeStatusManager;

function renderStatusManagerLists() {
    const statusList = document.getElementById('statusList');
    const priorityList = document.getElementById('priorityList');
    if (!statusList || !priorityList) return;

    statusList.innerHTML = allStatuses.map(s => `
        <div class="flex justify-between items-center p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
            <span>${statusDisplay[s] || s}</span>
            <button onclick="window.removeStatusItem('${s}')" class="text-red-500 hover:text-red-700 text-xs font-bold">Удалить</button>
        </div>
    `).join('');

    priorityList.innerHTML = allPriorities.map(p => `
        <div class="flex justify-between items-center p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
            <span>${priorityDisplay[p] || p}</span>
            <button onclick="window.removePriorityItem('${p}')" class="text-red-500 hover:text-red-700 text-xs font-bold">Удалить</button>
        </div>
    `).join('');
}

window.addStatusItem = () => {
    const input = document.getElementById('newStatusInput');
    const val = input.value.trim();
    if (!val) return;
    const key = val.toLowerCase().replace(/\s+/g, '_');
    if (allStatuses.includes(key)) {
        alert('Уже существует');
        return;
    }
    allStatuses.push(key);
    statusDisplay[key] = val;
    saveCustomOptions();
    input.value = '';
    renderStatusManagerLists();
    // Обновляем селекты в форме
    updateSelectOptions('requestStatus', allStatuses, statusDisplay);
};

window.addPriorityItem = () => {
    const input = document.getElementById('newPriorityInput');
    const val = input.value.trim();
    if (!val) return;
    const key = val.toLowerCase().replace(/\s+/g, '_');
    if (allPriorities.includes(key)) {
        alert('Уже существует');
        return;
    }
    allPriorities.push(key);
    priorityDisplay[key] = val;
    saveCustomOptions();
    input.value = '';
    renderStatusManagerLists();
    updateSelectOptions('requestPriority', allPriorities, priorityDisplay);
};

window.removeStatusItem = (key) => {
    if (!confirm(`Удалить статус "${statusDisplay[key] || key}"?`)) return;
    allStatuses = allStatuses.filter(s => s !== key);
    delete statusDisplay[key];
    saveCustomOptions();
    renderStatusManagerLists();
    updateSelectOptions('requestStatus', allStatuses, statusDisplay);
};

window.removePriorityItem = (key) => {
    if (!confirm(`Удалить приоритет "${priorityDisplay[key] || key}"?`)) return;
    allPriorities = allPriorities.filter(p => p !== key);
    delete priorityDisplay[key];
    saveCustomOptions();
    renderStatusManagerLists();
    updateSelectOptions('requestPriority', allPriorities, priorityDisplay);
};

function updateSelectOptions(selectId, options, displayMap) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = options.map(opt => `<option value="${opt}">${displayMap[opt] || opt}</option>`).join('');
}

// ===== Автообновление фильтров =====
// После загрузки обновляем кнопки фильтров