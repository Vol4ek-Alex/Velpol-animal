// js/inspection.js

export const template = `
    <div class="animate-fade-in-down mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
            <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span class="bg-amber-100 p-1.5 rounded-lg">📋</span> Инспекционные листы
            </h2>
            <p class="text-sm text-gray-500 font-medium">Создавайте кастомные таблицы для обхода техники</p>
        </div>
        <button onclick="window.openTemplateModal()" class="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md flex items-center gap-2 hover-lift">
            ➕ Новый шаблон
        </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 card-stagger" id="templatesGrid">
        <div class="col-span-full text-center py-12 text-sm text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">Загрузка шаблонов...</div>
    </div>

    <div id="templateModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-lg p-6 border border-gray-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button onclick="window.closeTemplateModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <h3 id="templateModalTitle" class="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">Новый шаблон</h3>
            <form id="templateForm" class="space-y-4 text-sm">
                <input type="hidden" id="templateId">
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Название *</label>
                    <input type="text" id="templateTitle" required class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-amber-400 focus:border-transparent" placeholder="Обход двора 13.07">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Описание</label>
                    <input type="text" id="templateDescription" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 font-medium focus:ring-2 focus:ring-amber-400 focus:border-transparent" placeholder="Краткое описание">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Колонки</label>
                    <div class="space-y-2">
                        <div id="columnsContainer" class="space-y-2 max-h-48 overflow-y-auto"></div>
                        <button type="button" onclick="window.addColumn()" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl border border-gray-300 transition hover-lift">➕ Добавить колонку</button>
                    </div>
                </div>
                <div class="flex gap-3 pt-3 border-t border-gray-100">
                    <button type="button" onclick="window.closeTemplateModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold transition border border-gray-300 hover-lift">Отмена</button>
                    <button type="submit" class="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold transition shadow-md hover-lift">Сохранить</button>
                </div>
                <button type="button" id="templateDeleteBtn" class="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition border border-red-300 hidden hover-lift">Удалить шаблон</button>
            </form>
        </div>
    </div>

    <div id="dataModal" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-4xl p-6 border border-gray-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button onclick="window.closeDataModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl transition">✕</button>
            <div>
                <h3 id="dataModalTitle" class="text-xl font-extrabold text-gray-900">Название шаблона</h3>
                <p id="dataModalDesc" class="text-sm text-gray-500"></p>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm border-collapse">
                    <thead id="dataTableHead" class="bg-gray-50 border-b border-gray-200"></thead>
                    <tbody id="dataTableBody"></tbody>
                </table>
            </div>
            <div class="flex gap-3">
                <button onclick="window.addRow()" class="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm text-sm flex items-center justify-center gap-2 hover-lift">
                    ➕ Добавить строку
                </button>
                <button onclick="window.downloadExcel()" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm text-sm flex items-center justify-center gap-2 hover-lift">
                    📥 Скачать Excel
                </button>
                <button onclick="window.reloadData()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition border border-gray-300 text-sm flex items-center justify-center gap-2 hover-lift">
                    🔄 Обновить
                </button>
            </div>
        </div>
    </div>
`;

// ===== Глобальные переменные =====
let templates = [];
let currentTemplateId = null;
let currentColumns = [];
let currentRows = [];
let allVehicles = [];
let currentPage = 1;
const PAGE_SIZE = 20;

// ===== Инициализация =====
export async function init() {
    console.log('📋 Модуль "Инспекционные листы" инициализирован');

    window.openTemplateModal = openTemplateModal;
    window.closeTemplateModal = closeTemplateModal;
    window.openDataModal = openDataModal;
    window.closeDataModal = closeDataModal;
    window.addRow = addRow;
    window.addColumn = addColumn;
    window.deleteTemplate = deleteTemplate;
    window.downloadExcel = downloadExcel;
    window.reloadData = reloadData;

    await loadVehicles();
    await loadTemplates();
    renderTemplates();

    document.getElementById('templateForm').addEventListener('submit', handleTemplateSubmit);
    document.getElementById('templateDeleteBtn').addEventListener('click', handleDeleteTemplate);
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
    } catch (err) {
        console.error('Ошибка загрузки техники:', err);
    }
}

// ===== Загрузка шаблонов =====
async function loadTemplates() {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('inspection_templates')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        templates = data || [];
    } catch (err) {
        console.error('Ошибка загрузки шаблонов:', err);
    }
}

// ===== Рендеринг шаблонов =====
function renderTemplates() {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;
    if (templates.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-sm text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">Нет шаблонов. Создайте первый!</div>`;
        return;
    }
    grid.innerHTML = templates.map(t => {
        const date = new Date(t.created_at).toLocaleDateString('ru-RU');
        const cols = t.columns ? JSON.parse(t.columns) : [];
        return `
            <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer" onclick="window.openDataModal('${t.id}')">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-gray-900 text-base">${t.title}</h3>
                        ${t.description ? `<p class="text-sm text-gray-500 mt-0.5">${t.description}</p>` : ''}
                        <p class="text-xs text-gray-400 mt-2">Колонки: ${cols.map(c => c.name).join(', ')}</p>
                    </div>
                    <button onclick="event.stopPropagation(); window.openTemplateModal('${t.id}')" class="text-gray-400 hover:text-gray-700 transition text-xs">✏️</button>
                </div>
                <div class="text-xs text-gray-400 mt-3">📅 ${date}</div>
            </div>
        `;
    }).join('');
}

// ===== Модалка шаблона =====
let editingTemplateId = null;

function openTemplateModal(id = null) {
    const modal = document.getElementById('templateModal');
    const title = document.getElementById('templateModalTitle');
    const deleteBtn = document.getElementById('templateDeleteBtn');

    if (id) {
        const t = templates.find(t => t.id === id);
        if (!t) return;
        editingTemplateId = id;
        title.textContent = 'Редактирование шаблона';
        document.getElementById('templateId').value = t.id;
        document.getElementById('templateTitle').value = t.title;
        document.getElementById('templateDescription').value = t.description || '';
        const cols = t.columns ? JSON.parse(t.columns) : [];
        renderColumns(cols);
        deleteBtn.classList.remove('hidden');
    } else {
        editingTemplateId = null;
        title.textContent = 'Новый шаблон';
        document.getElementById('templateForm').reset();
        document.getElementById('templateId').value = '';
        renderColumns([]);
        deleteBtn.classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.add('hidden');
    editingTemplateId = null;
}

window.closeTemplateModal = closeTemplateModal;
window.openTemplateModal = openTemplateModal;

function renderColumns(cols) {
    const container = document.getElementById('columnsContainer');
    if (!container) return;
    container.innerHTML = cols.map((col, index) => `
        <div class="flex items-center gap-2">
            <input type="text" value="${col.name}" placeholder="Название колонки" class="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:border-transparent" data-index="${index}" oninput="window.updateColumn(${index}, this.value)">
            <select class="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:border-transparent" data-index="${index}" onchange="window.updateColumnType(${index}, this.value)">
                <option value="text" ${col.type === 'text' ? 'selected' : ''}>Текст</option>
                <option value="checkbox" ${col.type === 'checkbox' ? 'selected' : ''}>Чекбокс</option>
                <option value="vehicle" ${col.type === 'vehicle' ? 'selected' : ''}>Техника</option>
            </select>
            <button type="button" onclick="window.removeColumn(${index})" class="text-red-500 hover:text-red-700 text-sm">✕</button>
        </div>
    `).join('');
}

window.addColumn = () => {
    const cols = getColumnsFromDOM();
    cols.push({ name: 'Новая колонка', type: 'text' });
    renderColumns(cols);
};

window.removeColumn = (index) => {
    const cols = getColumnsFromDOM();
    cols.splice(index, 1);
    renderColumns(cols);
};

window.updateColumn = (index, value) => {
    const cols = getColumnsFromDOM();
    cols[index].name = value;
};

window.updateColumnType = (index, value) => {
    const cols = getColumnsFromDOM();
    cols[index].type = value;
};

function getColumnsFromDOM() {
    const container = document.getElementById('columnsContainer');
    if (!container) return [];
    const inputs = container.querySelectorAll('input[type="text"]');
    const selects = container.querySelectorAll('select');
    const cols = [];
    inputs.forEach((input, i) => {
        cols.push({
            name: input.value.trim() || 'Колонка ' + (i+1),
            type: selects[i] ? selects[i].value : 'text'
        });
    });
    return cols;
}

async function handleTemplateSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('templateId').value;
    const title = document.getElementById('templateTitle').value.trim();
    const description = document.getElementById('templateDescription').value.trim() || null;
    const columns = getColumnsFromDOM();

    if (!title) { alert('Название обязательно!'); return; }
    if (columns.length === 0) { alert('Добавьте хотя бы одну колонку!'); return; }

    const payload = { title, description, columns: JSON.stringify(columns) };

    try {
        if (id) {
            await window._supabase.from('inspection_templates').update(payload).eq('id', id);
        } else {
            await window._supabase.from('inspection_templates').insert([payload]);
        }
        closeTemplateModal();
        await loadTemplates();
        renderTemplates();
    } catch (err) {
        alert('Ошибка сохранения: ' + err.message);
    }
}

async function handleDeleteTemplate() {
    const id = document.getElementById('templateId').value;
    if (!id) return;
    if (!confirm('Удалить шаблон и все данные?')) return;
    try {
        await window._supabase.from('inspection_templates').delete().eq('id', id);
        closeTemplateModal();
        await loadTemplates();
        renderTemplates();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
}

// ===== Модалка данных =====
async function openDataModal(templateId) {
    const t = templates.find(t => t.id === templateId);
    if (!t) return;
    currentTemplateId = templateId;
    currentColumns = JSON.parse(t.columns);
    document.getElementById('dataModalTitle').textContent = t.title;
    document.getElementById('dataModalDesc').textContent = t.description || '';

    await loadRows(templateId);
    renderTable();
    document.getElementById('dataModal').classList.remove('hidden');
}

function closeDataModal() {
    document.getElementById('dataModal').classList.add('hidden');
    currentTemplateId = null;
    currentRows = [];
    currentPage = 1;
}

window.closeDataModal = closeDataModal;
window.openDataModal = openDataModal;

async function loadRows(templateId) {
    if (!window._supabase) return;
    try {
        const { data, error } = await window._supabase
            .from('inspection_rows')
            .select('*')
            .eq('template_id', templateId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        currentRows = data || [];
        currentPage = 1;
    } catch (err) {
        console.error('Ошибка загрузки строк:', err);
    }
}

// ===== Рендеринг таблицы с пагинацией =====
function renderTable() {
    const thead = document.getElementById('dataTableHead');
    const tbody = document.getElementById('dataTableBody');
    if (!thead || !tbody) return;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, currentRows.length);
    const pageRows = currentRows.slice(start, end);

    thead.innerHTML = `
        <th class="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b whitespace-nowrap">#</th>
        ${currentColumns.map(col => `<th class="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b whitespace-nowrap">${col.name}</th>`).join('')}
        <th class="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-b whitespace-nowrap">Действия</th>
    `;

    if (currentRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${currentColumns.length + 2}" class="text-center py-6 text-gray-400">Нет данных. Добавьте строку!</td></tr>`;
        return;
    }

    let html = '';
    pageRows.forEach((row, index) => {
        const globalIndex = start + index + 1;
        const rowData = row.row_data || {};
        html += `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition" data-row-id="${row.id}">
                <td class="px-3 py-2 text-sm font-medium text-gray-500 whitespace-nowrap">${globalIndex}</td>
                ${currentColumns.map(col => {
                    const value = rowData[col.name];
                    let cellContent = '';
                    if (col.type === 'checkbox') {
                        const checked = value ? 'checked' : '';
                        cellContent = `<input type="checkbox" ${checked} onchange="window.updateCell('${row.id}', '${col.name}', this.checked)" class="w-5 h-5 rounded text-amber-600 border-gray-300 focus:ring-amber-500">`;
                    } else if (col.type === 'vehicle') {
                        const selectedId = value || '';
                        cellContent = `
                            <select onchange="window.updateCell('${row.id}', '${col.name}', this.value)" class="w-full bg-transparent border-0 focus:ring-2 focus:ring-amber-400 rounded-lg p-1 text-sm">
                                <option value="">—</option>
                                ${allVehicles.map(v => `<option value="${v.id}" ${String(v.id) === String(selectedId) ? 'selected' : ''}>${v.model} ${v.plate ? '['+v.plate+']' : ''}</option>`).join('')}
                            </select>
                        `;
                    } else {
                        cellContent = `
                            <input type="text" value="${value || ''}" onchange="window.updateCell('${row.id}', '${col.name}', this.value)" class="w-full bg-transparent border-0 focus:ring-2 focus:ring-amber-400 rounded-lg p-1 text-sm" placeholder="—">
                        `;
                    }
                    return `<td class="px-3 py-2 text-sm text-gray-800">${cellContent}</td>`;
                }).join('')}
                <td class="px-3 py-2 text-center whitespace-nowrap">
                    <button onclick="window.deleteRow('${row.id}')" class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                </td>
            </tr>
        `;
    });

    // Добавляем пагинацию, если строк больше PAGE_SIZE
    if (currentRows.length > PAGE_SIZE) {
        const totalPages = Math.ceil(currentRows.length / PAGE_SIZE);
        html += `
            <tr>
                <td colspan="${currentColumns.length + 2}" class="px-3 py-3 text-center border-t">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="window.changePage('prev')" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage <= 1 ? 'disabled' : ''}>◀</button>
                        <span class="text-sm font-medium text-gray-700">Стр. ${currentPage} из ${totalPages}</span>
                        <button onclick="window.changePage('next')" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage >= totalPages ? 'disabled' : ''}>▶</button>
                    </div>
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
}

// ===== Пагинация =====
window.changePage = (direction) => {
    const totalPages = Math.ceil(currentRows.length / PAGE_SIZE);
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    } else {
        return;
    }
    renderTable();
};

// ===== Обновление ячейки =====
window.updateCell = async (rowId, colName, value) => {
    const row = currentRows.find(r => r.id === rowId);
    if (!row) return;
    const rowData = row.row_data || {};

    const col = currentColumns.find(c => c.name === colName);
    if (col && col.type === 'vehicle') {
        if (value === '') {
            rowData[colName] = null;
        } else {
            const numValue = Number(value);
            rowData[colName] = isNaN(numValue) ? value : numValue;
        }
    } else {
        rowData[colName] = value;
    }

    row.row_data = rowData;

    try {
        const { error } = await window._supabase
            .from('inspection_rows')
            .update({ row_data: rowData })
            .eq('id', rowId);
        if (error) throw error;
        // Перерисовываем только текущую страницу
        renderTable();
    } catch (err) {
        alert('Ошибка сохранения: ' + err.message);
    }
};

// ===== Добавление строки =====
window.addRow = async () => {
    if (!currentTemplateId) return;
    const rowData = {};
    currentColumns.forEach(col => {
        if (col.type === 'checkbox') rowData[col.name] = false;
        else if (col.type === 'vehicle') rowData[col.name] = null;
        else rowData[col.name] = '';
    });
    try {
        const { error } = await window._supabase
            .from('inspection_rows')
            .insert([{ template_id: currentTemplateId, row_data: rowData }]);
        if (error) throw error;
        await loadRows(currentTemplateId);
        renderTable();
    } catch (err) {
        alert('Ошибка добавления: ' + err.message);
    }
};

// ===== Удаление строки =====
window.deleteRow = async (rowId) => {
    if (!confirm('Удалить строку?')) return;
    try {
        await window._supabase.from('inspection_rows').delete().eq('id', rowId);
        await loadRows(currentTemplateId);
        renderTable();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
};

// ===== Обновить данные =====
window.reloadData = async () => {
    if (!currentTemplateId) return;
    await loadRows(currentTemplateId);
    renderTable();
};

// ===== Экспорт в Excel =====
window.downloadExcel = () => {
    if (currentRows.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('Библиотека XLSX не загружена. Проверьте подключение скрипта.');
        return;
    }

    const headers = ['#', ...currentColumns.map(c => c.name)];
    const dataRows = currentRows.map((row, index) => {
        const rowData = row.row_data || {};
        const rowValues = [index + 1];
        currentColumns.forEach(col => {
            const value = rowData[col.name];
            let display = '';
            if (col.type === 'checkbox') {
                display = value ? '✅' : '❌';
            } else if (col.type === 'vehicle') {
                const vehicle = allVehicles.find(v => String(v.id) === String(value));
                display = vehicle ? `${vehicle.model} ${vehicle.plate ? '['+vehicle.plate+']' : ''}` : '—';
            } else {
                display = value || '—';
            }
            rowValues.push(display);
        });
        return rowValues;
    });

    const wsData = [headers, ...dataRows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Инспекция');
    XLSX.writeFile(wb, `Инспекция_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// ===== Удаление шаблона =====
window.deleteTemplate = async (templateId) => {
    if (!confirm('Удалить шаблон и все данные?')) return;
    try {
        await window._supabase.from('inspection_templates').delete().eq('id', templateId);
        await loadTemplates();
        renderTemplates();
    } catch (err) {
        alert('Ошибка удаления: ' + err.message);
    }
};