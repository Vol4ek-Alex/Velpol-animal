// js/search.js

export const template = `
    <div class="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in-down">
        <!-- Шапка -->
        <div class="mb-8">
            <h2 class="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <span class="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-2.5 rounded-xl shadow-md">🔍</span>
                Умный поиск
            </h2>
            <p class="text-sm text-gray-500 mt-1 font-medium">Быстрый поиск по всей системе</p>
        </div>

        <!-- Поисковая строка -->
        <div class="relative animate-fade-in-up delay-50">
            <div class="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-gray-400">🔎</div>
            <input type="text" id="searchInput" 
                   placeholder="Поиск: техника, заявки, списки, инспекции, ссылки..." 
                   class="w-full bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 pl-14 text-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition shadow-sm hover:shadow-md">
            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full hidden sm:block">⌘K</div>
        </div>

        <!-- Быстрые фильтры -->
        <div class="flex flex-wrap gap-2 mt-4 animate-fade-in-up delay-100">
            <button onclick="window.searchFilter('all')" id="filter_all" class="px-4 py-1.5 text-xs font-bold rounded-full bg-indigo-600 text-white border border-indigo-600 transition hover-lift">Все</button>
            <button onclick="window.searchFilter('vehicles')" id="filter_vehicles" class="px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition hover-lift">🚜 Техника</button>
            <button onclick="window.searchFilter('repairs')" id="filter_repairs" class="px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition hover-lift">🔧 Заявки</button>
            <button onclick="window.searchFilter('lists')" id="filter_lists" class="px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition hover-lift">📋 Списки</button>
            <button onclick="window.searchFilter('inspections')" id="filter_inspections" class="px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition hover-lift">📄 Инспекции</button>
            <button onclick="window.searchFilter('links')" id="filter_links" class="px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition hover-lift">🔗 Ссылки</button>
        </div>

        <!-- Результаты -->
        <div id="searchResults" class="mt-6 space-y-6 card-stagger">
            <div class="text-center py-16 text-gray-400">
                <span class="text-6xl block mb-4">🔎</span>
                <p class="text-lg font-medium">Начните вводить текст для поиска</p>
                <p class="text-sm mt-1">Ищите по модели, номеру, названию или описанию</p>
            </div>
        </div>

        <!-- Статистика -->
        <div id="searchStats" class="mt-4 text-sm text-gray-500 text-center hidden"></div>
    </div>
`;

// ===== Глобальные переменные =====
let searchResults = [];
let currentFilter = 'all';
let searchTimeout;

// ===== Инициализация =====
export async function init() {
    console.log('🔍 Модуль "Умный поиск" инициализирован');

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            searchTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    performSearch(query);
                } else {
                    showEmptyState();
                }
            }, 300);
        });

        // Обработчик клавиши Escape для очистки
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                showEmptyState();
                searchInput.blur();
            }
        });
    }

    // Горячая клавиша Ctrl+K / Cmd+K
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const input = document.getElementById('searchInput');
            if (input) {
                input.focus();
                input.select();
            }
        }
    });

    // Фильтры
    window.searchFilter = (filter) => {
        currentFilter = filter;
        // Обновляем активную кнопку
        document.querySelectorAll('[id^="filter_"]').forEach(btn => {
            btn.className = 'px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition';
        });
        const activeBtn = document.getElementById('filter_' + filter);
        if (activeBtn) {
            activeBtn.className = 'px-4 py-1.5 text-xs font-bold rounded-full bg-indigo-600 text-white border border-indigo-600 transition';
        }
        // Перерисовываем результаты с фильтром
        renderResults(searchResults);
    };
}

// ===== Поиск по всем модулям =====
async function performSearch(query) {
    const supabase = window._supabase;
    if (!supabase) {
        document.getElementById('searchResults').innerHTML = `<div class="text-red-500 p-4 bg-red-50 rounded-xl">Ошибка: Supabase не инициализирован</div>`;
        return;
    }

    const resultsContainer = document.getElementById('searchResults');
    const statsContainer = document.getElementById('searchStats');
    resultsContainer.innerHTML = `
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
            <p class="text-gray-400 mt-4">Поиск...</p>
        </div>
    `;
    statsContainer.classList.add('hidden');

    try {
        const searchTerm = `%${query}%`;

        // Параллельные запросы ко всем таблицам
        const [
            vehiclesRes,
            repairsRes,
            listsRes,
            inspectionsRes,
            linksRes
        ] = await Promise.all([
            supabase.from('vehicles').select('*').or(`model.ilike.${searchTerm},plate.ilike.${searchTerm},vin_number.ilike.${searchTerm},notes.ilike.${searchTerm}`).limit(10),
            supabase.from('repair_requests').select('*').or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`).limit(10),
            supabase.from('user_lists').select('*').or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`).limit(10),
            supabase.from('inspection_templates').select('*').or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`).limit(10),
            supabase.from('links').select('*').or(`title.ilike.${searchTerm},url.ilike.${searchTerm}`).limit(10)
        ]);

        // Собираем результаты
        searchResults = {
            vehicles: vehiclesRes.data || [],
            repairs: repairsRes.data || [],
            lists: listsRes.data || [],
            inspections: inspectionsRes.data || [],
            links: linksRes.data || []
        };

        renderResults(searchResults);

        // Показываем статистику
        const total = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);
        if (total > 0) {
            statsContainer.textContent = `Найдено ${total} результатов`;
            statsContainer.classList.remove('hidden');
        } else {
            statsContainer.classList.add('hidden');
        }

    } catch (err) {
        resultsContainer.innerHTML = `<div class="text-red-500 p-4 bg-red-50 rounded-xl">Ошибка поиска: ${err.message}</div>`;
        console.error(err);
    }
}

// ===== Рендеринг результатов с фильтром =====
function renderResults(data) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    let filteredData = {};
    if (currentFilter === 'all') {
        filteredData = data;
    } else {
        const key = currentFilter === 'vehicles' ? 'vehicles' :
                    currentFilter === 'repairs' ? 'repairs' :
                    currentFilter === 'lists' ? 'lists' :
                    currentFilter === 'inspections' ? 'inspections' :
                    currentFilter === 'links' ? 'links' : 'vehicles';
        filteredData = { [key]: data[key] || [] };
    }

    const total = Object.values(filteredData).reduce((sum, arr) => sum + arr.length, 0);

    if (total === 0) {
        container.innerHTML = `
            <div class="text-center py-16 text-gray-400">
                <span class="text-6xl block mb-4">😕</span>
                <p class="text-lg font-medium">Ничего не найдено</p>
                <p class="text-sm mt-1">Попробуйте изменить запрос или фильтр</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Группа: Техника
    if (filteredData.vehicles && filteredData.vehicles.length > 0) {
        html += renderGroup('🚜 Техника', filteredData.vehicles, (item) => {
            const plate = item.plate || 'б/н';
            const model = item.model || '—';
            const extra = item.inv_number ? `Инв. №: ${item.inv_number}` : '';
            return {
                title: model,
                subtitle: `${plate} ${extra}`,
                badge: `${item.current_hours || 0} ${getUnit(item.type)}`,
                module: 'fleet'
            };
        });
    }

    // Группа: Заявки
    if (filteredData.repairs && filteredData.repairs.length > 0) {
        html += renderGroup('🔧 Заявки', filteredData.repairs, (item) => {
            const statusMap = {
                'new': '🆕 Новая',
                'in_progress': '⏳ В работе',
                'completed': '✅ Выполнена',
                'cancelled': '❌ Отменена'
            };
            return {
                title: item.title || 'Заявка',
                subtitle: item.description || '',
                badge: statusMap[item.status] || item.status || 'Новая',
                module: 'repair_requests'
            };
        });
    }

    // Группа: Списки
    if (filteredData.lists && filteredData.lists.length > 0) {
        html += renderGroup('📋 Списки', filteredData.lists, (item) => {
            return {
                title: item.title,
                subtitle: item.description || '',
                badge: new Date(item.created_at).toLocaleDateString('ru-RU'),
                module: 'my_lists'
            };
        });
    }

    // Группа: Инспекции
    if (filteredData.inspections && filteredData.inspections.length > 0) {
        html += renderGroup('📄 Инспекции', filteredData.inspections, (item) => {
            const cols = item.columns ? JSON.parse(item.columns) : [];
            return {
                title: item.title,
                subtitle: item.description || `Колонки: ${cols.map(c => c.name).join(', ')}`,
                badge: new Date(item.created_at).toLocaleDateString('ru-RU'),
                module: 'inspection'
            };
        });
    }

    // Группа: Ссылки
    if (filteredData.links && filteredData.links.length > 0) {
        html += renderGroup('🔗 Ссылки', filteredData.links, (item) => {
            return {
                title: item.title,
                subtitle: item.url || '',
                badge: item.category || 'Без категории',
                module: 'links'
            };
        });
    }

    container.innerHTML = html;
}

// ===== Рендеринг одной группы =====
function renderGroup(groupTitle, items, mapFn) {
    return `
        <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="px-5 py-3 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                <span class="text-sm font-extrabold text-gray-700 uppercase tracking-wider">${groupTitle}</span>
                <span class="ml-auto text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">${items.length}</span>
            </div>
            <div class="divide-y divide-gray-100">
                ${items.map(item => {
                    const mapped = mapFn(item);
                    return `
                        <div class="px-5 py-3 hover:bg-gray-50 transition flex items-center justify-between gap-3 cursor-pointer" onclick="window.switchModule('${mapped.module}')">
                            <div class="flex-1 min-w-0">
                                <div class="font-bold text-gray-900 text-sm truncate">${mapped.title}</div>
                                <div class="text-xs text-gray-500 truncate">${mapped.subtitle}</div>
                            </div>
                            <div class="flex items-center gap-3 flex-shrink-0">
                                <span class="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${mapped.badge}</span>
                                <span class="text-gray-400 text-sm">→</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ===== Пустое состояние =====
function showEmptyState() {
    document.getElementById('searchResults').innerHTML = `
        <div class="text-center py-16 text-gray-400">
            <span class="text-6xl block mb-4">🔎</span>
            <p class="text-lg font-medium">Начните вводить текст для поиска</p>
            <p class="text-sm mt-1">Ищите по модели, номеру, названию или описанию</p>
        </div>
    `;
    document.getElementById('searchStats').classList.add('hidden');
}

// ===== Вспомогательная функция =====
function getUnit(type) {
    if (!type) return 'м/ч';
    const lower = type.toLowerCase();
    const carKeywords = ['легковой', 'грузовой', 'грузопассажирский', 'автобус', 'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'];
    for (let kw of carKeywords) {
        if (lower.includes(kw)) return 'км';
    }
    return 'м/ч';
}

// ===== Обновление результатов при изменении фильтра =====
window.searchFilter = (filter) => {
    currentFilter = filter;
    // Обновляем активную кнопку
    document.querySelectorAll('[id^="filter_"]').forEach(btn => {
        btn.className = 'px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition';
    });
    const activeBtn = document.getElementById('filter_' + filter);
    if (activeBtn) {
        activeBtn.className = 'px-4 py-1.5 text-xs font-bold rounded-full bg-indigo-600 text-white border border-indigo-600 transition';
    }
    // Перерисовываем результаты с фильтром
    renderResults(searchResults);
};