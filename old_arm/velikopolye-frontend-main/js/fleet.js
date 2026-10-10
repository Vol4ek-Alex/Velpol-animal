export const template = `
    <!-- Верхняя панель -->
    <div class="animate-fade-in-down mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
            <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span class="bg-blue-100 p-1.5 rounded-lg">🚜</span> Управление автопарком
            </h2>
            <p class="text-sm text-gray-500 font-medium">Учет техники, закрепление водителей и механизаторов, контроль документов и ремонтов</p>
        </div>
        <div class="flex flex-wrap gap-2">
            <button onclick="window.openDriversModal()" class="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-1.5 hover-lift">👤 Вод/Мех</button>
            <button onclick="window.openTagsModal()" class="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-1.5 hover-lift">🏷️ Теги</button>
            <button onclick="window.openCategoriesModal()" class="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-1.5 hover-lift">📂 Категории</button>
            <button onclick="window.openHoursModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-1.5 hover-lift">⏱️ Добавить часы</button>
            <button onclick="window.openVehicleModalForm()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-1.5 hover-lift">➕ Карта</button>
        </div>
    </div>

    <!-- Поиск и сортировка -->
    <div class="animate-fade-in-up delay-50 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-3">
            <input type="text" id="vehicleSearchInput" class="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus:bg-white font-medium transition" placeholder="🔍 Поиск по модели, номеру, VIN, водителю или тегу...">
            <select id="sortSelect" onchange="window.handleSortChange(this.value)" class="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-400 focus:border-transparent">
                <option value="name_asc">По названию (А–Я)</option>
                <option value="name_desc">По названию (Я–А)</option>
                <option value="hours_desc">По наработке (сначала max)</option>
            </select>
        </div>
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100" id="fleetCategoriesBar">
            <span class="text-xs text-gray-400 font-bold">Категории:</span>
            <div class="flex flex-wrap items-center gap-1.5" id="categoriesInner"></div>
        </div>
    </div>

    <!-- Сетка карточек -->
    <div id="fleetGridContainer" class="space-y-6">
        <div class="text-center text-gray-400 py-12 text-sm font-medium bg-white rounded-2xl border border-gray-200">Загрузка данных...</div>
    </div>

    <!-- Модалка редактирования техники -->
    <div id="vFormModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-lg p-6 border border-gray-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button onclick="window.closeVModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 id="vModalTitle" class="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">Карточка техники</h3>
            <form id="vForm" class="space-y-4 text-sm">
                <input type="hidden" id="vId">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Категория</label>
                        <select id="vCategory" required class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent"></select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Модель</label>
                        <input type="text" id="vName" required class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="МТЗ-3522">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Вод/Мех</label>
                        <select id="vDriver" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent"></select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Наработка (м/ч)</label>
                        <input type="number" id="vHours" required class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="0">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Госномер</label>
                        <input type="text" id="vPlate" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-mono font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="1234 AB-7">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Инв. №</label>
                        <input type="text" id="vInv" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-mono font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="00125">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">VIN / Заводской номер</label>
                    <input type="text" id="vVin" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-mono font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="Номер рамы">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Техосмотр до</label>
                        <input type="date" id="vToDate" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Страховка до</label>
                        <input type="date" id="vInsuranceDate" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Теги статусов</label>
                    <div id="tagsCheckboxContainer" class="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-32 overflow-y-auto"></div>
                </div>
                <div class="flex gap-3 pt-3 border-t border-gray-100">
                    <button type="submit" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition shadow-md hover-lift">Сохранить</button>
                </div>
                <button type="button" id="vDeleteBtn" class="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition border border-red-300 hidden">Удалить из базы</button>
            </form>
        </div>
    </div>

    <!-- Модалка водителей -->
    <div id="driversManagementModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-sm p-6 border border-gray-200 shadow-2xl space-y-4 relative modal-enter">
            <button onclick="document.getElementById('driversManagementModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 class="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">👤 Водители и механизаторы</h3>
            <div class="space-y-2 max-h-48 overflow-y-auto" id="modalDriversList"></div>
            <div class="pt-3 border-t border-gray-100 space-y-3">
                <input type="text" id="newDriverNameInput" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="ФИО...">
                <button onclick="window.addCustomDriver()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm hover-lift">Добавить</button>
            </div>
            <button onclick="document.getElementById('driversManagementModal').classList.add('hidden')" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Закрыть</button>
        </div>
    </div>

    <!-- Модалка тегов -->
    <div id="tagsManagementModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-sm p-6 border border-gray-200 shadow-2xl space-y-4 relative modal-enter">
            <button onclick="document.getElementById('tagsManagementModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 class="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">🏷️ Управление тегами</h3>
            <div class="space-y-2 max-h-48 overflow-y-auto" id="modalTagsList"></div>
            <div class="pt-3 border-t border-gray-100 space-y-3">
                <input type="text" id="newTagNameInput" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="Название статуса...">
                <div class="flex items-center gap-3">
                    <label class="text-xs font-bold text-gray-600 uppercase tracking-wider">Цвет:</label>
                    <input type="color" id="newTagColorInput" value="#e2e8f0" class="w-10 h-10 rounded-xl border border-gray-300 cursor-pointer">
                </div>
                <button onclick="window.addCustomTag()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm hover-lift">Создать тег</button>
            </div>
            <button onclick="document.getElementById('tagsManagementModal').classList.add('hidden')" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Закрыть</button>
        </div>
    </div>

    <!-- Модалка категорий -->
    <div id="categoriesModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-sm p-6 border border-gray-200 shadow-2xl space-y-4 relative modal-enter">
            <button onclick="document.getElementById('categoriesModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 class="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">📂 Категории</h3>
            <div class="space-y-2 max-h-48 overflow-y-auto" id="modalCategoriesList"></div>
            <div class="pt-3 border-t border-gray-100 space-y-3">
                <input type="text" id="newCatInput" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="Новая категория...">
                <button onclick="window.addCustomCategory()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm hover-lift">Добавить</button>
            </div>
            <button onclick="document.getElementById('categoriesModal').classList.add('hidden')" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Закрыть</button>
        </div>
    </div>

    <!-- Модалка задач -->
    <div id="tasksModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-200 shadow-2xl space-y-4 relative modal-enter">
            <button onclick="document.getElementById('tasksModal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <div>
                <h3 id="tasksModalTitle" class="text-lg font-extrabold text-gray-900">Задачи по технике</h3>
                <p class="text-sm text-gray-500 font-medium" id="tasksModalSubtitle"></p>
            </div>
            <input type="hidden" id="taskVehicleId">
            <input type="hidden" id="taskVehicleName">
            <div class="space-y-2 max-h-48 overflow-y-auto" id="vehicleTasksList"></div>
            <div class="pt-3 border-t border-gray-100 space-y-3">
                <textarea id="newTaskText" rows="2" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="Текст задачи..."></textarea>
                <button onclick="window.addVehicleTask()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm hover-lift">Добавить задачу</button>
            </div>
            <button onclick="document.getElementById('tasksModal').classList.add('hidden')" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Закрыть</button>
        </div>
    </div>

    <!-- Модалка добавления часов -->
    <div id="hoursModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-sm p-6 border border-gray-200 shadow-2xl space-y-4 relative modal-enter">
            <button onclick="window.closeHoursModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 class="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">⏱️ Добавить наработку</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Выберите технику</label>
                    <select id="hoursVehicleSelect" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent">
                        <option value="">-- Загрузка --</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Количество часов</label>
                    <input type="number" id="hoursInput" min="0" step="0.5" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-400 focus:border-transparent" placeholder="Например, 8.5">
                </div>
            </div>
            <div class="flex gap-3 pt-3 border-t border-gray-100">
                <button onclick="window.closeHoursModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Отмена</button>
                <button onclick="window.submitHours()" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition shadow-md hover-lift">Добавить</button>
            </div>
        </div>
    </div>
`;

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

// ===== Инициализация модуля =====
export async function init() {
    // Поиск
    const searchInput = document.getElementById('vehicleSearchInput');
    if (searchInput) {
        searchInput.value = searchQuery;
        searchInput.oninput = (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderFleet();
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
    window.closeVModal = () => document.getElementById('vFormModal').classList.add('hidden');
    window.openCategoriesModal = () => renderCategoriesModalList();
    window.openTagsModal = () => renderTagsModalList();
    window.openDriversModal = () => renderDriversModalList();
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

    // Автообновление каждые 10 секунд (увеличил, чтобы реже мигало)
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(() => loadAllData(false), 10000);
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

        // Обновление открытых модалок, если они видны (с проверкой на существование)
        if (!isFirstLoad) {
            const driversModal = document.getElementById('driversManagementModal');
            const tagsModal = document.getElementById('tagsManagementModal');
            const categoriesModal = document.getElementById('categoriesModal');

            if (driversModal && !driversModal.classList.contains('hidden')) updateDriversDOMList();
            if (tagsModal && !tagsModal.classList.contains('hidden')) updateTagsDOMList();
            if (categoriesModal && !categoriesModal.classList.contains('hidden')) updateCategoriesDOMList();
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

    const menu = document.getElementById('customCategoryDropdownMenu');
    let savedScrollTop = 0;
    if (menu && !menu.classList.contains('hidden')) {
        savedScrollTop = menu.scrollTop;
    }

    const isAllActive = selectedCategory === 'all';
    const isNoCatActive = selectedCategory.toLowerCase() === 'без категории';
    const isOtherActive = !isAllActive && !isNoCatActive;

    const otherCats = categories.filter(c => c !== 'Без категории');

    let html = `
        <button onclick="window.filterCategory('all')" class="px-3 py-1 text-xs font-bold rounded-md transition border-2 ${isAllActive ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 border-gray-400 text-gray-900 hover:bg-gray-100'}">Все</button>
        <button onclick="window.filterCategory('Без категории')" class="px-3 py-1 text-xs font-bold rounded-md transition border-2 ${isNoCatActive ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-50 border-gray-400 text-gray-900 hover:bg-gray-100'}">Без категории</button>
        
        <div class="relative inline-block text-left" id="customCategoryDropdownContainer">
            <button onclick="window.toggleCategoryDropdown(event)" class="px-3 py-1 text-xs font-bold rounded-md transition border-2 flex items-center gap-1 bg-gray-50 ${isOtherActive ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black' : 'border-gray-400 text-gray-900 hover:bg-gray-100'}">
                <span>${isOtherActive ? selectedCategory : `— Другие категории (${otherCats.length}) —`}</span>
                <svg class="w-3 h-3 transition-transform ${window._isCategoriesDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            <div class="absolute left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-white border-2 border-gray-400 rounded-lg shadow-xl z-50 py-1 ${window._isCategoriesDropdownOpen ? '' : 'hidden'}" id="customCategoryDropdownMenu">
                ${otherCats.map(c => `
                    <button onclick="window.filterCategory('${c.replace(/'/g, "\\'")}')" class="w-full text-left px-3 py-2 text-xs font-bold transition hover:bg-gray-100 ${selectedCategory === c ? 'text-emerald-700 bg-emerald-50 font-black' : 'text-gray-700'}">
                        ${c}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    bar.innerHTML = html;

    const newMenu = document.getElementById('customCategoryDropdownMenu');
    if (newMenu && !newMenu.classList.contains('hidden') && savedScrollTop > 0) {
        newMenu.scrollTop = savedScrollTop;
    }

    window.toggleCategoryDropdown = (e) => {
        e.stopPropagation();
        window._isCategoriesDropdownOpen = !window._isCategoriesDropdownOpen;
        const menu = document.getElementById('customCategoryDropdownMenu');
        if (menu) menu.classList.toggle('hidden', !window._isCategoriesDropdownOpen);
        const svg = e.currentTarget.querySelector('svg');
        if (svg) svg.classList.toggle('rotate-180', window._isCategoriesDropdownOpen);
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
            if (menu) menu.classList.add('hidden');
        }
    });
    window._categoryDropdownClickSetup = true;
}

// ===== Рендеринг карточек с улучшенным дизайном и кликабельностью =====
function renderFleet(isFirstLoad = false) {
    const container = document.getElementById('fleetGridContainer');
    if (!container) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    const searchInput = document.getElementById('vehicleSearchInput');
    if (searchInput) {
        searchQuery = searchInput.value.toLowerCase().trim();
    }

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            // выполнить поиск
            renderFleet();
        }, 300);
    });

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

    uniqueTypesInFiltered.forEach(cat => {
        const catList = filtered.filter(v => (v.type || "Без категории").toLowerCase() === cat.toLowerCase());
        if (catList.length === 0) return;

        html += `
            <div class="space-y-2">
                <h3 class="text-xs font-black text-gray-600 uppercase tracking-wider pl-0.5">${cat} — ${catList.length} ед.</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${catList.map(v => {
                        const now = new Date();
                        
                        const formatDocStatus = (dateStr) => {
                            if (!dateStr) return { text: '—', classes: 'text-gray-500 font-bold' };
                            const diffDays = Math.ceil((new Date(dateStr) - now) / (1000 * 60 * 60 * 24));
                            const formattedDate = new Date(dateStr).toLocaleDateString('ru-RU');
                            if (diffDays <= 0) {
                                return { text: `${formattedDate} (Просрочено)`, classes: 'text-red-700 bg-red-50 border border-red-300 px-2 py-0.5 rounded font-black text-[11px]' };
                            }
                            if (diffDays <= 30) {
                                return { text: `${formattedDate} (${diffDays} дн.)`, classes: 'text-amber-900 bg-amber-50 border border-amber-400 px-2 py-0.5 rounded font-black text-[11px]' };
                            }
                            return { text: formattedDate, classes: 'text-gray-900 bg-gray-50 border border-gray-300 px-2 py-0.5 rounded font-bold text-[11px]' };
                        };

                        const toInfo = formatDocStatus(v.inspection_date);
                        const insInfo = formatDocStatus(v.insurance_date);
                        const vehicleTagsArray = v.tags ? v.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                        const vTasks = tasks.filter(t => t.vehicle_id === v.id);
                        const safeVehicleJson = JSON.stringify(v).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                        const unit = getUnitByCategory(v.type);
                        const label = unit === 'км' ? 'Пробег' : 'Наработка';
                        const role = getDriverRole(v.type);

                        // Определяем цветовую схему для карточки (по статусу)
                        let cardBorder = 'border-gray-200';
                        let cardShadow = 'shadow-sm';
                        let statusColor = 'text-gray-600';
                        if (vehicleTagsArray.includes('Неисправен')) {
                            cardBorder = 'border-red-300';
                            cardShadow = 'shadow-red-100';
                            statusColor = 'text-red-700';
                        } else if (vehicleTagsArray.includes('Гарантия')) {
                            cardBorder = 'border-blue-300';
                            cardShadow = 'shadow-blue-100';
                            statusColor = 'text-blue-700';
                        }

                        return `
                            <div onclick="window.openVehicleModalForm(${safeVehicleJson})" class="relative bg-white border-2 rounded-xl p-4 ${cardBorder} ${cardShadow} hover:shadow-lg transition cursor-pointer flex flex-col justify-between">
                                <div class="flex justify-between items-start">
                                    <h4 class="font-bold text-gray-900 text-sm tracking-tight">${v.model}</h4>
                                    <button onclick="event.stopPropagation(); window.openVehicleModalForm(${safeVehicleJson})" class="text-gray-400 hover:text-gray-700 transition text-xs" title="Редактировать">✏️</button>
                                </div>
                                
                                <div class="text-xs text-gray-600 font-medium mt-1 flex items-center gap-1.5">
                                    <span>👤 ${role}:</span>
                                    <span class="text-gray-900 font-black">${v.notes || 'Не закреплен'}</span>
                                </div>

                                <div class="mt-2 flex flex-wrap gap-1">
                                    ${vehicleTagsArray.map(t => {
                                        const knownTag = baseTags.find(bt => bt.name.toLowerCase() === t.toLowerCase());
                                        const badgeBg = knownTag ? knownTag.color : '#e2e8f0';
                                        return `<span style="background-color: ${badgeBg}" class="border border-gray-300 text-gray-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider shadow-3xs">${t}</span>`;
                                    }).join('')}
                                </div>

                                <div class="mt-3 flex items-center gap-2">
                                    <div class="text-sm font-mono font-black text-gray-900 bg-gray-50 border border-gray-400 inline-block px-3 py-1 rounded-md tracking-wider">
                                        ${v.plate || 'БЕЗ ГОСНОМЕРА'}
                                    </div>
                                    ${v.inv_number ? `
                                        <span class="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                                            Инв. №: ${v.inv_number}
                                        </span>
                                    ` : ''}
                                </div>
                                ${v.vin_number ? `
                                    <div class="text-[10px] font-mono font-bold text-gray-500 truncate mt-1" title="${v.vin_number}">
                                        VIN: ${v.vin_number}
                                    </div>
                                ` : ''}

                                <div class="pt-3 mt-3 border-t border-gray-200 text-xs space-y-1.5">
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600 font-bold">${label}:</span>
                                        <span class="font-black text-gray-900">${v.current_hours || 0} ${unit}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600 font-bold">Техосмотр:</span>
                                        <span class="${toInfo.classes}">${toInfo.text}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600 font-bold">Страховка:</span>
                                        <span class="${insInfo.classes}">${insInfo.text}</span>
                                    </div>
                                </div>

                                <button onclick="event.stopPropagation(); window.openTasksModalForm(${v.id}, '${v.model.replace(/'/g, "\\'")}')" class="mt-3 w-full text-xs text-center font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition py-1.5">
                                    📋 Задачи (${vTasks.length})
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `<div class="text-center text-gray-500 py-10 text-xs font-bold">Техника не найдена</div>`;
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
            <label style="background-color: ${t.color}" class="flex items-center gap-1.5 px-2.5 py-1 rounded border-2 border-gray-400 text-[11px] font-black text-gray-900 cursor-pointer select-none shadow-3xs">
                <input type="checkbox" name="vTags" value="${t.name}" class="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5">
                ${t.name}
            </label>
        `).join('');
    }

    document.getElementById('vForm').reset();
    modal.classList.remove('hidden');

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
        if (id) {
            await window._supabase.from('vehicles').update(payload).eq('id', id);
        } else {
            await window._supabase.from('vehicles').insert([payload]);
        }
        window.closeVModal();
        await loadAllData(true);
    } catch (e) { alert(e.message); }
}

async function handleDeleteVehicle() {
    const id = document.getElementById('vId').value;
    if (!id || !window._supabase) return;
    if (confirm("Вы точно хотите удалить технику?")) {
        try {
            await window._supabase.from('vehicles').delete().eq('id', id);
            window.closeVModal();
            await loadAllData(true);
        } catch (e) { alert(e.message); }
    }
}

// ===== Управление водителями =====
function renderDriversModalList() {
    document.getElementById('driversManagementModal').classList.remove('hidden');
    updateDriversDOMList();
}

function updateDriversDOMList() {
    const list = document.getElementById('modalDriversList');
    if (!list) return;
    list.innerHTML = drivers.map(d => `
        <div class="flex items-center justify-between p-2 rounded-lg border-2 border-gray-300 text-xs font-bold bg-white shadow-3xs">
            <span class="text-gray-900">👤 ${d}</span>
            <button onclick="window.deleteCustomDriver('${d.replace(/'/g, "\\'")}')" class="text-red-600 hover:underline">Удалить</button>
        </div>
    `).join('');
}

async function addCustomDriver() {
    const input = document.getElementById('newDriverNameInput');
    if (!window._supabase || !input || !input.value.trim()) return;
    try {
        await window._supabase.from('fleet_drivers').insert([{ name: input.value.trim() }]);
        input.value = "";
        await loadAllData(false);
    } catch (e) { console.error(e); }
}

async function deleteCustomDriver(driverName) {
    if (!window._supabase) return;
    if (confirm(`Удалить вод/мех-а "${driverName}" из базы данных?`)) {
        try {
            await window._supabase.from('fleet_drivers').delete().eq('name', driverName);
            await loadAllData(false);
        } catch (e) { console.error(e); }
    }
}

// ===== Управление тегами =====
function renderTagsModalList() {
    document.getElementById('tagsManagementModal').classList.remove('hidden');
    updateTagsDOMList();
}

function updateTagsDOMList() {
    const list = document.getElementById('modalTagsList');
    if (!list) return;
    list.innerHTML = baseTags.map(t => `
        <div class="flex items-center justify-between p-2 rounded-lg border-2 border-gray-300 text-xs font-bold bg-white shadow-3xs">
            <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded-full border border-gray-400" style="background-color: ${t.color}"></span>
                <span class="text-gray-900">${t.name}</span>
            </div>
            <button onclick="window.deleteCustomTag(${t.id})" class="text-red-600 hover:underline">Удалить</button>
        </div>
    `).join('');
}

async function addCustomTag() {
    const nameInput = document.getElementById('newTagNameInput');
    const colorInput = document.getElementById('newTagColorInput');
    if (!window._supabase || !nameInput || !nameInput.value.trim()) return;
    try {
        await window._supabase.from('fleet_tags').insert([{
            name: nameInput.value.trim(),
            color: colorInput.value
        }]);
        nameInput.value = "";
        await loadAllData(false);
    } catch (e) { console.error(e); }
}

async function deleteCustomTag(tagId) {
    if (!window._supabase) return;
    const target = baseTags.find(t => t.id === tagId);
    if (target && confirm(`Удалить тег "${target.name}" из базы данных?`)) {
        try {
            await window._supabase.from('fleet_tags').delete().eq('id', tagId);
            await loadAllData(false);
        } catch (e) { console.error(e); }
    }
}

// ===== Управление категориями =====
function renderCategoriesModalList() {
    document.getElementById('categoriesModal').classList.remove('hidden');
    updateCategoriesDOMList();
}

function updateCategoriesDOMList() {
    const list = document.getElementById('modalCategoriesList');
    if (!list) return;
    list.innerHTML = categories.map(c => `
        <div class="flex items-center justify-between bg-gray-50 p-2 rounded-lg border-2 border-gray-300 text-xs font-bold">
            <span class="text-gray-900">${c}</span>
            ${c !== 'Без категории' ? `<button onclick="window.deleteCustomCategory('${c.replace(/'/g, "\\'")}')" class="text-red-600 hover:underline">Удалить</button>` : ''}
        </div>
    `).join('');
}

async function addCustomCategory() {
    const input = document.getElementById('newCatInput');
    if (!window._supabase || !input || !input.value.trim()) return;
    try {
        await window._supabase.from('fleet_categories').insert([{ name: input.value.trim() }]);
        input.value = "";
        await loadAllData(false);
    } catch (e) { console.error(e); }
}

async function deleteCustomCategory(catName) {
    if (!window._supabase) return;
    if (confirm(`Удалить категорию "${catName}"? Все машины из неё будут переведены в "Без категории".`)) {
        try {
            await window._supabase.from('vehicles').update({ type: 'Без категории' }).eq('type', catName);
            await window._supabase.from('fleet_categories').delete().eq('name', catName);
            await loadAllData(false);
        } catch(err) { console.error("Ошибка удаления категории:", err); }
    }
}

// ===== Задачи по технике =====
function openTasksModalForm(vehicleId, vehicleName) {
    const modal = document.getElementById('tasksModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.getElementById('taskVehicleId').value = vehicleId;
    document.getElementById('taskVehicleName').value = vehicleName;
    document.getElementById('tasksModalSubtitle').innerText = `Техника: ${vehicleName}`;
    document.getElementById('newTaskText').value = "";
    renderTasksListInsideModal();
}

function renderTasksListInsideModal() {
    const vId = parseInt(document.getElementById('taskVehicleId').value);
    const list = document.getElementById('vehicleTasksList');
    if (!list) return;
    const vTasks = tasks.filter(t => t.vehicle_id === vId);
    if (vTasks.length === 0) {
        list.innerHTML = `<div class="text-center text-gray-500 py-3 text-xs font-bold">Нет активных задач</div>`;
        return;
    }
    list.innerHTML = vTasks.map(t => `
        <div class="flex items-center justify-between bg-amber-50 border-2 border-amber-300 p-2 rounded-lg text-xs text-amber-950 font-bold">
            <span>${t.text}</span>
            <button onclick="window.completeTask(${t.id})" class="text-emerald-700 font-bold hover:underline">Готово</button>
        </div>
    `).join('');
}

async function addVehicleTask() {
    const vId = document.getElementById('taskVehicleId').value;
    const vName = document.getElementById('taskVehicleName').value;
    const textInput = document.getElementById('newTaskText');
    if (!textInput || !textInput.value.trim() || !window._supabase) return;
    try {
        await window._supabase.from('vehicle_tasks').insert([{ vehicle_id: parseInt(vId), vehicle_name: vName, text: textInput.value.trim(), is_completed: false }]);
        textInput.value = "";
        await loadAllData(true);
        renderTasksListInsideModal();
    } catch (e) { console.error(e); }
}

async function completeTask(taskId) {
    if (!window._supabase) return;
    try {
        await window._supabase.from('vehicle_tasks').update({ is_completed: true }).eq('id', taskId);
        await loadAllData(true);
        const modal = document.getElementById('tasksModal');
        if (modal && !modal.classList.contains('hidden')) renderTasksListInsideModal();
    } catch (e) { console.error(e); }
}

// ===== Добавление часов через модалку =====
async function openHoursModal() {
    const modal = document.getElementById('hoursModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    
    const select = document.getElementById('hoursVehicleSelect');
    if (!select) return;
    if (vehicles.length === 0) await loadAllData(false);
    const sorted = [...vehicles].sort((a, b) => a.model.localeCompare(b.model));
    select.innerHTML = sorted.map(v => `
        <option value="${v.id}">${v.model} ${v.plate ? '['+v.plate+']' : '[б/н]'} (${v.current_hours || 0} м/ч)</option>
    `).join('');
    document.getElementById('hoursInput').value = '';
}

function closeHoursModal() {
    document.getElementById('hoursModal').classList.add('hidden');
}

async function submitHours() {
    const select = document.getElementById('hoursVehicleSelect');
    const input = document.getElementById('hoursInput');
    const vehicleId = select.value;
    const hours = parseFloat(input.value);
    if (!vehicleId) { alert('Выберите технику'); return; }
    if (isNaN(hours) || hours <= 0) { alert('Введите положительное число часов'); return; }
    if (!window._supabase) return;
    try {
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