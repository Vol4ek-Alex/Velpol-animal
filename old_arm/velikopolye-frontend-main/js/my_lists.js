// js/my_lists.js

export const template = `
    <div class="animate-fade-in-down mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
            <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span class="bg-cyan-100 p-1.5 rounded-lg">📋</span> Мои списки
            </h2>
            <p class="text-sm text-gray-500 font-medium">Создавайте чек-листы, заметки, инспекционные листы для работы</p>
        </div>
        <button onclick="window.openListModal()" class="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-2 hover-lift">
            ➕ Новый список
        </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 card-stagger" id="listsGrid">
        <div class="col-span-full text-center py-12 text-sm text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">Загрузка списков...</div>
    </div>

    <div id="listFormModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-200 shadow-2xl space-y-5 relative modal-enter">
            <button onclick="window.closeListModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 id="listModalTitle" class="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">Новый список</h3>
            <form id="listForm" class="space-y-4 text-sm">
                <input type="hidden" id="listId">
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Название *</label>
                    <input type="text" id="listTitle" required class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-cyan-400 focus:border-transparent" placeholder="Например: Обход двор 13.07">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Описание (необязательно)</label>
                    <input type="text" id="listDescription" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-cyan-400 focus:border-transparent" placeholder="Краткий комментарий">
                </div>
                <div class="flex gap-3 pt-3 border-t border-gray-100">
                    <button type="button" onclick="window.closeListModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Отмена</button>
                    <button type="submit" class="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-xl font-bold transition shadow-md hover-lift">Сохранить</button>
                </div>
                <button type="button" id="listDeleteBtn" class="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition border border-red-300 hidden hover-lift">Удалить список</button>
            </form>
        </div>
    </div>

    <div id="listViewModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-lg p-6 border border-gray-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button onclick="window.closeListViewModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <div>
                <h3 id="viewListTitle" class="text-xl font-extrabold text-gray-900">Название списка</h3>
                <p id="viewListDescription" class="text-sm text-gray-500"></p>
            </div>
            <div id="viewItemsContainer" class="space-y-3">
                <div class="text-gray-400 text-sm py-4 text-center">Нет элементов. Добавьте первый!</div>
            </div>
            <div class="border-t border-gray-200 pt-4 space-y-3">
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="window.addItem('text')" class="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-bold text-sm transition border border-gray-300 hover-lift">📝 Текст</button>
                    <button onclick="window.addItem('checkbox')" class="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-bold text-sm transition border border-gray-300 hover-lift">☑️ Чекбокс</button>
                </div>
                <button onclick="window.addItem('vehicle')" class="w-full bg-cyan-50 hover:bg-cyan-100 text-cyan-700 py-2 rounded-xl font-bold text-sm transition border border-cyan-300 hover-lift">🚜 Выбрать технику</button>
            </div>
        </div>
    </div>

    <div id="itemFormModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-200 shadow-2xl space-y-5 relative modal-enter">
            <button onclick="window.closeItemModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 id="itemModalTitle" class="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">Редактирование</h3>
            <form id="itemForm" class="space-y-4 text-sm">
                <input type="hidden" id="itemId">
                <input type="hidden" id="itemType">
                <div id="itemContentGroup">
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Текст</label>
                    <input type="text" id="itemContent" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-cyan-400 focus:border-transparent" placeholder="Введите текст...">
                </div>
                <div id="itemVehicleGroup" class="hidden">
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Выберите технику</label>
                    <select id="itemVehicleSelect" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-cyan-400 focus:border-transparent">
                        <option value="">-- Выберите технику --</option>
                    </select>
                </div>
                <div id="itemCheckboxGroup" class="hidden">
                    <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input type="checkbox" id="itemChecked" class="w-4 h-4 rounded text-cyan-600 border-gray-300 focus:ring-cyan-500">
                        Отмечено
                    </label>
                </div>
                <div class="flex gap-3 pt-3 border-t border-gray-100">
                    <button type="button" onclick="window.closeItemModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Отмена</button>
                    <button type="submit" class="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-xl font-bold transition shadow-md hover-lift">Сохранить</button>
                </div>
                <button type="button" id="itemDeleteBtn" class="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition border border-red-300 hidden hover-lift">Удалить элемент</button>
            </form>
        </div>
    </div>
`;

// ===== Глобальные переменные =====
let lists = [];
let currentViewListId = null;
let editingItemId = null;
let allVehicles = [];

// ===== Инициализация модуля =====
export async function init() {
    console.log('📋 Модуль "Мои списки" инициализирован');

    window.openListModal = openListModal;
    window.closeListModal = closeListModal;
    window.openListViewModal = openListViewModal;
    window.closeListViewModal = closeListViewModal;
    window.addItem = addItem;
    window.closeItemModal = closeItemModal;
    window.editItem = editItem;

    // Загружаем технику для селектов
    await loadVehicles();

    // Загружаем списки
    await loadLists();
    renderLists();

    // Обработчики форм
    const listForm = document.getElementById('listForm');
    if (listForm) {
        listForm.addEventListener('submit', handleListSubmit);
    }

    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', handleItemSubmit);
    }

    const deleteListBtn = document.getElementById('listDeleteBtn');
    if (deleteListBtn) {
        deleteListBtn.addEventListener('click', handleDeleteList);
    }

    const deleteItemBtn = document.getElementById('itemDeleteBtn');
    if (deleteItemBtn) {
        deleteItemBtn.addEventListener('click', handleDeleteItem);
    }
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
        allVehicles = data || [];
        console.log(`✅ Загружено ${allVehicles.length} единиц техники`);
    } catch (err) {
        console.error('Ошибка загрузки техники:', err);
    }
}

// ===== Загрузка списков =====
async function loadLists() {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('user_lists')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        lists = data || [];
        console.log(`✅ Загружено ${lists.length} списков`);
    } catch (err) {
        console.error('Ошибка загрузки списков:', err);
    }
}

// ===== Рендеринг карточек списков =====
function renderLists() {
    const grid = document.getElementById('listsGrid');
    if (!grid) return;

    if (lists.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-sm text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">Нет списков. Создайте первый!</div>`;
        return;
    }

    grid.innerHTML = lists.map(list => {
        const date = new Date(list.created_at).toLocaleDateString('ru-RU');
        return `
            <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer" onclick="window.openListViewModal('${list.id}')">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-gray-900 text-base">${list.title}</h3>
                        ${list.description ? `<p class="text-sm text-gray-500 mt-0.5">${list.description}</p>` : ''}
                    </div>
                    <button onclick="event.stopPropagation(); window.openListModal('${list.id}')" class="text-gray-400 hover:text-gray-700 transition text-xs">✏️</button>
                </div>
                <div class="text-xs text-gray-400 mt-3">📅 ${date}</div>
            </div>
        `;
    }).join('');
}

// ===== Модалка создания/редактирования списка =====
let editingListId = null;

function openListModal(id = null) {
    const modal = document.getElementById('listFormModal');
    const title = document.getElementById('listModalTitle');
    const deleteBtn = document.getElementById('listDeleteBtn');

    if (id) {
        const list = lists.find(l => l.id === id);
        if (!list) return;
        editingListId = id;
        title.textContent = 'Редактирование списка';
        document.getElementById('listId').value = list.id;
        document.getElementById('listTitle').value = list.title;
        document.getElementById('listDescription').value = list.description || '';
        deleteBtn.classList.remove('hidden');
    } else {
        editingListId = null;
        title.textContent = 'Новый список';
        document.getElementById('listForm').reset();
        document.getElementById('listId').value = '';
        deleteBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeListModal() {
    document.getElementById('listFormModal').classList.add('hidden');
    editingListId = null;
}

window.closeListModal = closeListModal;
window.openListModal = openListModal;

async function handleListSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('listId').value;
    const title = document.getElementById('listTitle').value.trim();
    const description = document.getElementById('listDescription').value.trim() || null;

    if (!title) {
        alert('Название обязательно!');
        return;
    }

    if (!window._supabase) return;

    const payload = { title, description };

    try {
        if (id) {
            const { error } = await window._supabase
                .from('user_lists')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await window._supabase
                .from('user_lists')
                .insert([payload]);
            if (error) throw error;
        }
        closeListModal();
        await loadLists();
        renderLists();
    } catch (err) {
        alert('Ошибка сохранения: ' + err.message);
    }
}

async function handleDeleteList() {
    const id = document.getElementById('listId').value;
    if (!id) return;
    if (!confirm('Удалить список со всеми элементами?')) return;

    try {
        const { error } = await window._supabase
            .from('user_lists')
            .delete()
            .eq('id', id);
        if (error) throw error;
        closeListModal();
        await loadLists();
        renderLists();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
}

// ===== Просмотр списка (строки) =====
let viewItems = [];

async function openListViewModal(listId) {
    const modal = document.getElementById('listViewModal');
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    currentViewListId = listId;
    document.getElementById('viewListTitle').textContent = list.title;
    document.getElementById('viewListDescription').textContent = list.description || '';

    // Загружаем элементы этого списка
    await loadItems(listId);
    renderItems();

    modal.classList.remove('hidden');
}

function closeListViewModal() {
    document.getElementById('listViewModal').classList.add('hidden');
    currentViewListId = null;
    viewItems = [];
}

window.closeListViewModal = closeListViewModal;
window.openListViewModal = openListViewModal;

async function loadItems(listId) {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('list_items')
            .select('*')
            .eq('list_id', listId)
            .order('display_order', { ascending: true });
        if (error) throw error;
        viewItems = data || [];
        console.log(`✅ Загружено ${viewItems.length} элементов`);
    } catch (err) {
        console.error('Ошибка загрузки элементов:', err);
    }
}

function renderItems() {
    const container = document.getElementById('viewItemsContainer');
    if (!container) return;

    if (viewItems.length === 0) {
        container.innerHTML = '<div class="text-gray-400 text-sm py-4 text-center">Нет элементов. Добавьте первый!</div>';
        return;
    }

    container.innerHTML = viewItems.map((item, index) => {
        let contentHtml = '';
        if (item.type === 'text') {
            contentHtml = `<span class="text-gray-800 font-medium">${item.content || ''}</span>`;
        } else if (item.type === 'checkbox') {
            const checked = item.checked ? 'checked' : '';
            contentHtml = `
                <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" ${checked} onchange="window.toggleItemCheck('${item.id}', this.checked)" class="w-5 h-5 rounded text-cyan-600 border-gray-300 focus:ring-cyan-500">
                    <span class="text-gray-800 font-medium ${item.checked ? 'line-through text-gray-400' : ''}">${item.content || ''}</span>
                </label>
            `;
        } else if (item.type === 'vehicle') {
            const vehicle = allVehicles.find(v => v.id === item.vehicle_id);
            const displayName = vehicle ? `${vehicle.model} ${vehicle.plate ? '['+vehicle.plate+']' : ''}` : 'Техника не найдена';
            contentHtml = `<span class="text-gray-800 font-medium">🚜 ${displayName}</span>`;
        }

        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div class="flex-1">${contentHtml}</div>
                <div class="flex gap-1 ml-2">
                    <button onclick="window.editItem('${item.id}')" class="text-gray-400 hover:text-gray-700 transition text-xs">✏️</button>
                    <button onclick="window.deleteItem('${item.id}')" class="text-red-400 hover:text-red-600 transition text-xs">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Добавление элемента =====
async function addItem(type) {
    if (!currentViewListId) return;

    // Для vehicle – открываем модалку выбора техники
    if (type === 'vehicle') {
        // Просто создаём элемент с vehicle_id = null, потом редактируем
        const newItem = {
            list_id: currentViewListId,
            type: 'vehicle',
            content: '',
            vehicle_id: null,
            checked: false,
            display_order: viewItems.length
        };

        try {
            const { data, error } = await window._supabase
                .from('list_items')
                .insert([newItem])
                .select();
            if (error) throw error;
            await loadItems(currentViewListId);
            renderItems();
            // Открываем редактирование нового элемента
            if (data && data[0]) {
                editItem(data[0].id);
            }
        } catch (err) {
            alert('Ошибка добавления: ' + err.message);
        }
        return;
    }

    // Для text и checkbox
    const content = type === 'checkbox' ? 'Новый пункт' : 'Введите текст...';
    const newItem = {
        list_id: currentViewListId,
        type: type,
        content: content,
        vehicle_id: null,
        checked: false,
        display_order: viewItems.length
    };

    try {
        const { data, error } = await window._supabase
            .from('list_items')
            .insert([newItem])
            .select();
        if (error) throw error;
        await loadItems(currentViewListId);
        renderItems();
        // Открываем редактирование нового элемента
        if (data && data[0]) {
            editItem(data[0].id);
        }
    } catch (err) {
        alert('Ошибка добавления: ' + err.message);
    }
}

window.addItem = addItem;

// ===== Переключение чекбокса =====
window.toggleItemCheck = async (itemId, checked) => {
    try {
        const { error } = await window._supabase
            .from('list_items')
            .update({ checked })
            .eq('id', itemId);
        if (error) throw error;
        // Обновляем локальный массив
        const item = viewItems.find(i => i.id === itemId);
        if (item) item.checked = checked;
        renderItems();
    } catch (err) {
        alert('Ошибка обновления: ' + err.message);
    }
};

// ===== Редактирование элемента =====
function editItem(itemId) {
    const item = viewItems.find(i => i.id === itemId);
    if (!item) return;

    editingItemId = itemId;
    const modal = document.getElementById('itemFormModal');
    const title = document.getElementById('itemModalTitle');
    const deleteBtn = document.getElementById('itemDeleteBtn');

    document.getElementById('itemId').value = item.id;
    document.getElementById('itemType').value = item.type;

    // Показываем нужные группы
    document.getElementById('itemContentGroup').classList.add('hidden');
    document.getElementById('itemVehicleGroup').classList.add('hidden');
    document.getElementById('itemCheckboxGroup').classList.add('hidden');

    if (item.type === 'text' || item.type === 'checkbox') {
        document.getElementById('itemContentGroup').classList.remove('hidden');
        document.getElementById('itemContent').value = item.content || '';
        if (item.type === 'checkbox') {
            document.getElementById('itemCheckboxGroup').classList.remove('hidden');
            document.getElementById('itemChecked').checked = item.checked || false;
        }
    } else if (item.type === 'vehicle') {
        document.getElementById('itemVehicleGroup').classList.remove('hidden');
        // Заполняем select
        const select = document.getElementById('itemVehicleSelect');
        select.innerHTML = `<option value="">-- Выберите технику --</option>` +
            allVehicles.map(v =>
                `<option value="${v.id}" ${v.id === item.vehicle_id ? 'selected' : ''}>${v.model} ${v.plate ? '['+v.plate+']' : ''}</option>`
            ).join('');
    }

    deleteBtn.classList.remove('hidden');
    title.textContent = 'Редактирование элемента';
    modal.classList.remove('hidden');
}

function closeItemModal() {
    document.getElementById('itemFormModal').classList.add('hidden');
    editingItemId = null;
}

window.closeItemModal = closeItemModal;
window.editItem = editItem;

async function handleItemSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('itemId').value;
    const type = document.getElementById('itemType').value;

    let payload = {};

    if (type === 'text') {
        const content = document.getElementById('itemContent').value.trim();
        if (!content) {
            alert('Введите текст!');
            return;
        }
        payload = { content };
    } else if (type === 'checkbox') {
        const content = document.getElementById('itemContent').value.trim();
        if (!content) {
            alert('Введите текст!');
            return;
        }
        const checked = document.getElementById('itemChecked').checked;
        payload = { content, checked };
    } else if (type === 'vehicle') {
        const vehicleId = document.getElementById('itemVehicleSelect').value;
        if (!vehicleId) {
            alert('Выберите технику!');
            return;
        }
        payload = { vehicle_id: vehicleId, content: '' };
    }

    try {
        const { error } = await window._supabase
            .from('list_items')
            .update(payload)
            .eq('id', id);
        if (error) throw error;
        closeItemModal();
        await loadItems(currentViewListId);
        renderItems();
    } catch (err) {
        alert('Ошибка сохранения: ' + err.message);
    }
}

async function handleDeleteItem() {
    const id = document.getElementById('itemId').value;
    if (!id) return;
    if (!confirm('Удалить элемент?')) return;

    try {
        const { error } = await window._supabase
            .from('list_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
        closeItemModal();
        await loadItems(currentViewListId);
        renderItems();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
}

window.deleteItem = async (itemId) => {
    if (!confirm('Удалить элемент?')) return;
    try {
        const { error } = await window._supabase
            .from('list_items')
            .delete()
            .eq('id', itemId);
        if (error) throw error;
        await loadItems(currentViewListId);
        renderItems();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
};