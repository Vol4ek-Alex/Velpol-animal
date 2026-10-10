export const template = `
    <div class="animate-fade-in-down mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
            <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span class="bg-purple-100 p-1.5 rounded-lg">🔗</span> Полезные ссылки
            </h2>
            <p class="text-sm text-gray-500 font-medium">Быстрый доступ к нужным ресурсам</p>
        </div>
        <button onclick="window.openLinkModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-2 hover-lift">
            ➕ Добавить ссылку
        </button>
    </div>

    <div class="animate-fade-in-up delay-50 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Категории:</span>
            <button onclick="window.filterLinks('all')" id="linkCat_all" class="px-3 py-1.5 text-xs font-bold rounded-xl transition border-2 border-purple-600 bg-purple-600 text-white">Все</button>
            <div id="linkCategoriesContainer" class="flex flex-wrap gap-2"></div>
            <button onclick="window.openCategoryModal()" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl border border-gray-300 transition hover-lift">+ Управлять</button>
        </div>
    </div>

    <div id="linksGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 card-stagger">
        <div class="col-span-full text-center py-12 text-sm text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">Загрузка ссылок...</div>
    </div>

    <div id="linkFormModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-200 shadow-2xl space-y-5 relative modal-enter">
            <button onclick="window.closeLinkModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 id="linkModalTitle" class="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">Добавление ссылки</h3>
            <form id="linkForm" class="space-y-4 text-sm">
                <input type="hidden" id="linkId">
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Название *</label>
                    <input type="text" id="linkTitle" required class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="Например: Яндекс">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">URL *</label>
                    <input type="url" id="linkUrl" required class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="https://example.com">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Категория</label>
                    <select id="linkCategory" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-purple-400 focus:border-transparent">
                        <option value="">Без категории</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Иконка (URL картинки или эмодзи)</label>
                    <input type="text" id="linkIcon" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="https://... или 🚜">
                </div>
                <div class="flex gap-3 pt-3 border-t border-gray-100">
                    <button type="button" onclick="window.closeLinkModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Отмена</button>
                    <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold transition shadow-md hover-lift">Сохранить</button>
                </div>
                <button type="button" id="linkDeleteBtn" class="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition border border-red-300 hidden hover-lift">Удалить ссылку</button>
            </form>
        </div>
    </div>

    <div id="categoryModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-sm p-6 border border-gray-200 shadow-2xl space-y-4 relative modal-enter">
            <button onclick="window.closeCategoryModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 class="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">Управление категориями</h3>
            <div id="categoryList" class="space-y-2 max-h-48 overflow-y-auto"></div>
            <div class="pt-3 border-t border-gray-100 flex gap-2">
                <input type="text" id="newCategoryInput" placeholder="Новая категория..." class="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-400 focus:border-transparent">
                <button onclick="window.addCategory()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm hover-lift">Добавить</button>
            </div>
            <button onclick="window.closeCategoryModal()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Закрыть</button>
        </div>
    </div>
`;

// ===== Глобальные переменные =====
let links = [];
let categories = [];
let currentCategory = 'all';
let refreshIntervalId = null;

// ===== Инициализация модуля =====
export async function init() {
    console.log('🔗 Модуль "Ссылки" инициализирован');

    window.openLinkModal = openLinkModal;
    window.closeLinkModal = closeLinkModal;
    window.openCategoryModal = openCategoryModal;
    window.closeCategoryModal = closeCategoryModal;
    window.filterLinks = filterLinks;
    window.addCategory = addCategory;
    window.deleteCategory = deleteCategory;
    window.deleteLink = deleteLink;

    // Привязываем обработчик формы (чтобы не было перезагрузки)
    const form = document.getElementById('linkForm');
    if (form) {
        // Убираем старые обработчики, чтобы не дублировать
        form.removeEventListener('submit', handleFormSubmit);
        form.addEventListener('submit', handleFormSubmit);
    }

    // Кнопка удаления
    const deleteBtn = document.getElementById('linkDeleteBtn');
    if (deleteBtn) {
        deleteBtn.removeEventListener('click', handleDelete);
        deleteBtn.addEventListener('click', handleDelete);
    }

    if (!window._supabase) {
        console.error('❌ Supabase не инициализирован');
        document.getElementById('linksGrid').innerHTML = `<div class="col-span-full text-center py-12 text-red-500 font-medium">Ошибка: Supabase не инициализирован</div>`;
        return;
    }

    await loadLinks();
    await loadCategories();
    renderCategories();
    renderLinks();

    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(async () => {
        await loadLinks();
        renderLinks();
    }, 30000);
}

// ===== Загрузка ссылок =====
async function loadLinks() {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('links')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        links = data || [];
        console.log(`✅ Загружено ${links.length} ссылок`);
    } catch (err) {
        console.error('❌ Ошибка загрузки ссылок:', err);
    }
}

// ===== Загрузка категорий =====
async function loadCategories() {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('links')
            .select('category')
            .not('category', 'is', null);
        if (error) throw error;
        const cats = data.map(item => item.category).filter(Boolean);
        categories = [...new Set(cats)].sort();
        console.log(`✅ Загружено ${categories.length} категорий`);
    } catch (err) {
        console.error('Ошибка загрузки категорий:', err);
    }
}

// ===== Рендеринг категорий =====
function renderCategories() {
    const container = document.getElementById('linkCategoriesContainer');
    if (!container) return;
    container.innerHTML = categories.map(cat =>
        `<button onclick="window.filterLinks('${cat}')" id="linkCat_${cat}" class="px-3 py-1.5 text-xs font-bold rounded-xl transition border-2 border-gray-300 text-gray-700 hover:border-purple-400">${cat}</button>`
    ).join('');
    updateActiveCategory();
}

function updateActiveCategory() {
    document.querySelectorAll('#linkCategoriesContainer button, #linkCat_all').forEach(btn => {
        btn.classList.remove('border-purple-600', 'bg-purple-600', 'text-white');
        btn.classList.add('border-gray-300', 'text-gray-700');
        if (btn.id === 'linkCat_all' && currentCategory === 'all') {
            btn.classList.add('border-purple-600', 'bg-purple-600', 'text-white');
        } else if (btn.id === 'linkCat_' + currentCategory) {
            btn.classList.add('border-purple-600', 'bg-purple-600', 'text-white');
        }
    });
}

// ===== Фильтр =====
window.filterLinks = (cat) => {
    currentCategory = cat;
    updateActiveCategory();
    renderLinks();
};

// ===== Рендеринг карточек =====
function renderLinks() {
    const grid = document.getElementById('linksGrid');
    if (!grid) return;

    let filtered = links;
    if (currentCategory !== 'all') {
        filtered = links.filter(link => link.category === currentCategory);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-sm text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">Нет ссылок. Добавьте первую!</div>`;
        return;
    }

    grid.innerHTML = filtered.map(link => {
        let iconHtml = '';
        if (link.icon) {
            if (link.icon.startsWith('http') || link.icon.startsWith('data:')) {
                iconHtml = `<img src="${link.icon}" class="w-8 h-8 rounded-lg object-contain" onerror="this.style.display='none'" alt="">`;
            } else {
                iconHtml = `<span class="text-2xl">${link.icon}</span>`;
            }
        } else {
            try {
                const url = new URL(link.url);
                const domain = url.hostname;
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                iconHtml = `<img src="${faviconUrl}" class="w-8 h-8 rounded-lg object-contain" onerror="this.style.display='none'" alt="">`;
            } catch (e) {
                iconHtml = `<span class="text-2xl">🔗</span>`;
            }
        }

        return `
            <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col">
                <div class="flex items-center gap-3 mb-2">
                    <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                        ${iconHtml}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-bold text-gray-900 text-sm truncate" title="${link.title}">${link.title}</div>
                        <div class="text-xs text-gray-500 truncate" title="${link.url}">${link.url}</div>
                    </div>
                    <button onclick="event.stopPropagation(); window.openLinkModal('${link.id}')" class="text-gray-400 hover:text-gray-700 transition text-xs">✏️</button>
                </div>
                <div class="flex justify-between items-center mt-1 pt-2 border-t border-gray-100">
                    <span class="text-[10px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">${link.category || 'Без категории'}</span>
                    <div class="flex gap-1">
                        <a href="${link.url}" target="_blank" class="text-purple-600 hover:text-purple-800 text-xs font-bold transition">Открыть →</a>
                        <button onclick="event.stopPropagation(); window.deleteLink('${link.id}')" class="text-red-400 hover:text-red-600 transition text-xs ml-2">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Модалка добавления/редактирования =====
let editingLinkId = null;

function openLinkModal(id = null) {
    const modal = document.getElementById('linkFormModal');
    const title = document.getElementById('linkModalTitle');
    const deleteBtn = document.getElementById('linkDeleteBtn');
    const categorySelect = document.getElementById('linkCategory');

    const allCats = ['', ...categories];
    categorySelect.innerHTML = allCats.map(c => `<option value="${c}">${c || 'Без категории'}</option>`).join('');

    if (id) {
        const link = links.find(l => l.id === id);
        if (!link) return;
        editingLinkId = id;
        title.textContent = 'Редактирование ссылки';
        document.getElementById('linkId').value = link.id;
        document.getElementById('linkTitle').value = link.title;
        document.getElementById('linkUrl').value = link.url;
        document.getElementById('linkCategory').value = link.category || '';
        document.getElementById('linkIcon').value = link.icon || '';
        deleteBtn.classList.remove('hidden');
    } else {
        editingLinkId = null;
        title.textContent = 'Добавление ссылки';
        document.getElementById('linkForm').reset();
        document.getElementById('linkId').value = '';
        deleteBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeLinkModal() {
    document.getElementById('linkFormModal').classList.add('hidden');
    editingLinkId = null;
}

window.closeLinkModal = closeLinkModal;
window.openLinkModal = openLinkModal;

// ===== Обработчик отправки формы =====
async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Форма отправлена');
    const id = document.getElementById('linkId').value;
    const title = document.getElementById('linkTitle').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const category = document.getElementById('linkCategory').value || null;
    const icon = document.getElementById('linkIcon').value.trim() || null;

    if (!title || !url) {
        alert('Название и URL обязательны!');
        return;
    }

    if (!window._supabase) {
        alert('Ошибка: Supabase не инициализирован');
        return;
    }

    const payload = { title, url, category, icon };

    try {
        let result;
        if (id) {
            result = await window._supabase
                .from('links')
                .update(payload)
                .eq('id', id);
        } else {
            result = await window._supabase
                .from('links')
                .insert([payload]);
        }
        if (result.error) throw result.error;

        console.log('✅ Ссылка сохранена');
        closeLinkModal();
        await loadLinks();
        await loadCategories();
        renderCategories();
        renderLinks();
    } catch (err) {
        console.error('❌ Ошибка сохранения:', err);
        alert('Ошибка сохранения: ' + err.message);
    }
}

// ===== Обработчик удаления из модалки =====
async function handleDelete() {
    const id = document.getElementById('linkId').value;
    if (!id) return;
    if (!confirm('Удалить ссылку?')) return;
    try {
        const { error } = await window._supabase
            .from('links')
            .delete()
            .eq('id', id);
        if (error) throw error;
        closeLinkModal();
        await loadLinks();
        await loadCategories();
        renderCategories();
        renderLinks();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
}

// ===== Удаление ссылки через кнопку на карточке =====
window.deleteLink = async (id) => {
    if (!confirm('Удалить ссылку?')) return;
    try {
        const { error } = await window._supabase
            .from('links')
            .delete()
            .eq('id', id);
        if (error) throw error;
        await loadLinks();
        await loadCategories();
        renderCategories();
        renderLinks();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
};

// ===== Управление категориями =====
function openCategoryModal() {
    document.getElementById('categoryModal').classList.remove('hidden');
    renderCategoryList();
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.add('hidden');
}

window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;

function renderCategoryList() {
    const list = document.getElementById('categoryList');
    if (!list) return;
    if (categories.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-400 text-sm py-2">Нет категорий</div>';
        return;
    }
    list.innerHTML = categories.map(cat =>
        `<div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
            <span class="text-sm font-medium">${cat}</span>
            <button onclick="window.deleteCategory('${cat}')" class="text-red-500 hover:text-red-700 text-xs font-bold">Удалить</button>
        </div>`
    ).join('');
}

window.addCategory = async () => {
    const input = document.getElementById('newCategoryInput');
    const newCat = input.value.trim();
    if (!newCat) return;
    if (categories.includes(newCat)) {
        alert('Такая категория уже существует');
        return;
    }
    categories.push(newCat);
    input.value = '';
    renderCategoryList();
    renderCategories();
    const select = document.getElementById('linkCategory');
    if (select) {
        const option = document.createElement('option');
        option.value = newCat;
        option.textContent = newCat;
        select.appendChild(option);
    }
};

window.deleteCategory = async (cat) => {
    if (!confirm(`Удалить категорию "${cat}"? Все ссылки с этой категорией станут без категории.`)) return;
    try {
        const { error } = await window._supabase
            .from('links')
            .update({ category: null })
            .eq('category', cat);
        if (error) throw error;
        await loadLinks();
        await loadCategories();
        renderCategories();
        renderLinks();
        renderCategoryList();
        const select = document.getElementById('linkCategory');
        if (select) {
            select.querySelectorAll('option').forEach(opt => {
                if (opt.value === cat) opt.remove();
            });
        }
    } catch (err) {
        alert('Ошибка удаления категории: ' + err.message);
    }
};