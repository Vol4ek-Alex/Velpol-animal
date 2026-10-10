// js/orders.js

import { tripTemplate, initBusinessTrip } from './docs/businessTrip.js';
import { batteryTemplate, initBatteryAct } from './docs/batteryAct.js';
import { absenceActsTemplate, initAbsenceActs } from './docs/absenceActs.js';
import { absenceReportTemplate, initAbsenceReport } from './docs/absenceReport.js';

const ALL_DOC_CARDS = [
    { id: 'business_trip', title: 'Командировки', desc: 'Оформление приказов и служебных записок.', icon: '💼', category: 'personal' },
    { id: 'absence_acts', title: 'Акты о прогуле', desc: 'Подневные акты об отсутствии на рабочем месте.', icon: '🛑', category: 'acts' },
    { id: 'absence_report', title: 'Служебная записка (прогул)', desc: 'Докладная записка о прогуле сотрудника.', icon: '📝', category: 'personal' }, // <-- перенесли в personal
    { id: 'battery_act', title: 'Списание АКБ', desc: 'Акт на списание аккумуляторных батарей с расчетом лома свинца.', icon: '🔋', category: 'acts' },
    { id: 'inventory_act', title: 'Акт инвентаризации', desc: 'Списание, проверка и учет ТМЦ.', icon: '📊', category: 'sklad' }
];

let currentCategory = 'all';
let currentSubModule = "menu";

export const template = `
<style>
.fade-in-sub { animation: fadeInSub 0.25s ease-out forwards; }
@keyframes fadeInSub { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@media print {
    body * { visibility: hidden !important; }
    #tripPrintBlock, #tripPrintBlock * { visibility: visible !important; }
    #tripPrintBlock { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
    .no-print-section { display: none !important; }
}
</style>

<div class="space-y-6 no-print-section animate-fade-in-down">
    <!-- Верхняя панель -->
    <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span class="bg-indigo-100 p-1.5 rounded-lg">📁</span> Центр документооборота
            </h2>
            <p class="text-sm text-gray-500 font-medium">Управление внутренней документацией и общий архив документов</p>
        </div>
        <button id="docBackToMenuBtn" onclick="window.switchDocSubModule('menu')" class="hidden bg-gray-100 hover:bg-gray-200 border border-gray-300 font-bold text-xs text-gray-700 px-4 py-2 rounded-xl transition shadow-sm hover-lift">
            ⬅ Назад в каталог
        </button>
    </div>

    <!-- Основной контейнер -->
    <div id="docHubMainContainer" class="space-y-6">
        <!-- Вкладки категорий -->
        <div class="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            <button onclick="window.filterDocByCategory('all')" id="catTab_all" class="px-4 py-2 text-sm font-bold border-b-2 border-indigo-600 text-indigo-600 transition hover-lift">Все документы</button>
            <button onclick="window.filterDocByCategory('personal')" id="catTab_personal" class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition hover-lift">🧑‍💻 Служебные записки</button>
            <button onclick="window.filterDocByCategory('acts')" id="catTab_acts" class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition hover-lift">📝 Акты</button>
            <button onclick="window.filterDocByCategory('sklad')" id="catTab_sklad" class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition hover-lift">📊 Склад</button>
        </div>

        <!-- Поиск -->
        <div class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-3 items-center animate-fade-in-up delay-50">
            <div class="relative flex-1">
                <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
                <input type="text" id="docCardsSearchInput" oninput="window.filterDocCards()" class="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:bg-white transition" placeholder="Поиск среди документов...">
            </div>
        </div>

        <!-- Сетка карточек документов -->
        <div id="docHubMainMenu" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 fade-in-sub card-stagger"></div>

        <!-- Архив документов (карточки) -->
        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm fade-in-sub animate-fade-in-up delay-100">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h3 class="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <span>🗄️</span> Архив сгенерированных документов
                </h3>
                <div class="flex gap-2">
                    <input type="text" id="archiveSearchInput" placeholder="Фильтр по имени..." oninput="window.filterArchive()" class="text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
                    <button onclick="window.loadTripStorageHistory()" class="text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl transition hover-lift">🔄 Обновить</button>
                </div>
            </div>
            <div id="archiveGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1 card-stagger">
                <!-- Карточки будут вставлены динамически -->
            </div>
        </div>
    </div>

    <!-- Подмодули -->
    ${tripTemplate}
    ${absenceActsTemplate}
    ${absenceReportTemplate}
    ${batteryTemplate}
</div>

<div id="tripPrintBlock"></div>
`;

export function init() {
    setupSubModuleNavigation();
    initBusinessTrip();
    initBatteryAct();
    initAbsenceActs();
    initAbsenceReport();
    renderDocCards(ALL_DOC_CARDS);
    window.switchDocSubModule('menu');
}

// ---------- Фильтрация категорий ----------
window.filterDocByCategory = (cat) => {
    currentCategory = cat;
    ['all', 'personal', 'acts', 'sklad'].forEach(c => {
        const btn = document.getElementById('catTab_' + c);
        if (btn) {
            btn.classList.remove('border-indigo-600', 'text-indigo-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        }
    });
    const activeBtn = document.getElementById('catTab_' + cat);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('border-indigo-600', 'text-indigo-600');
    }
    window.filterDocCards();
};

// ---------- Рендеринг карточек документов ----------
function renderDocCards(cardsList) {
    const container = document.getElementById('docHubMainMenu');
    if (!container) return;
    if (cardsList.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-10 text-sm font-medium text-gray-400">Ничего не найдено</div>';
        return;
    }
    container.innerHTML = cardsList.map(card => {
        const isReady = card.id === 'business_trip' || card.id === 'battery_act' || card.id === 'absence_acts' || card.id === 'absence_report';
        const clickAction = isReady ? "window.switchDocSubModule('" + card.id + "')" : "alert('Данный тип документа находится в разработке')";
        const cardClasses = isReady ? "border-gray-200 hover:border-indigo-400 hover:shadow-md cursor-pointer" : "opacity-60 border-gray-200 bg-gray-50 cursor-not-allowed";
        return `
            <div onclick="${clickAction}" class="bg-white border rounded-2xl p-5 shadow-sm transition flex items-start gap-4 group ${cardClasses}">
                <div class="bg-indigo-50 text-indigo-700 p-3 rounded-xl text-2xl group-hover:bg-indigo-600 group-hover:text-white transition">${card.icon}</div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-gray-900 text-base">${card.title}</h4>
                        ${!isReady ? '<span class="text-[10px] bg-gray-200 text-gray-600 font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wider">План</span>' : ''}
                    </div>
                    <p class="text-sm text-gray-500 mt-1 leading-relaxed">${card.desc}</p>
                </div>
            </div>
        `;
    }).join('');
}

window.filterDocCards = () => {
    const query = document.getElementById('docCardsSearchInput')?.value.toLowerCase().trim() || "";
    const filtered = ALL_DOC_CARDS.filter(card => {
        const matchesSearch = card.title.toLowerCase().includes(query) || card.desc.toLowerCase().includes(query);
        const matchesCategory = currentCategory === 'all' || card.category === currentCategory;
        return matchesSearch && matchesCategory;
    });
    renderDocCards(filtered);
};

// ---------- Навигация между подмодулями ----------
function setupSubModuleNavigation() {
    window.switchDocSubModule = (targetModule) => {
        currentSubModule = targetModule;
        const mainContainer = document.getElementById('docHubMainContainer');
        const backBtn = document.getElementById('docBackToMenuBtn');
        const subContainers = {
            business_trip: document.getElementById('subModule_business_trip'),
            battery_act: document.getElementById('subModule_battery_act'),
            absence_acts: document.getElementById('subModule_absence_acts'),
            absence_report: document.getElementById('subModule_absence_report')
        };

        if (mainContainer) mainContainer.classList.add('hidden');
        if (backBtn) backBtn.classList.add('hidden');
        Object.values(subContainers).forEach(el => { if (el) el.classList.add('hidden'); });

        if (targetModule === 'menu') {
            if (mainContainer) mainContainer.classList.remove('hidden');
            if (document.getElementById('docCardsSearchInput')) document.getElementById('docCardsSearchInput').value = "";
            window.filterDocByCategory(currentCategory);
            window.loadTripStorageHistory();
        } else {
            if (backBtn) backBtn.classList.remove('hidden');
            if (subContainers[targetModule]) subContainers[targetModule].classList.remove('hidden');
            // Вызов функций обновления превью для каждого модуля
            if (targetModule === 'business_trip' && typeof window.updateTripPreview === 'function') {
                const today = new Date().toISOString().split('T')[0];
                if (document.getElementById('tripDocDate')) document.getElementById('tripDocDate').value = today;
                if (document.getElementById('tripTargetDate')) document.getElementById('tripTargetDate').value = today;
                window.updateTripPreview();
            }
            if (targetModule === 'battery_act' && typeof window.updateBatteryPreview === 'function') {
                const today = new Date().toISOString().split('T')[0];
                if (document.getElementById('batteryDocDate')) document.getElementById('batteryDocDate').value = today;
                window.updateBatteryPreview();
            }
            if (targetModule === 'absence_acts' && typeof window.updateActsPreview === 'function') {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('actsStartDate').value = today;
                document.getElementById('actsEndDate').value = today;
                window.updateActsPreview();
            }
            if (targetModule === 'absence_report' && typeof window.updateReportPreview === 'function') {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('reportStartDate').value = today;
                document.getElementById('reportEndDate').value = today;
                // Чекбокс "по настоящее время" выключаем при открытии
                const checkbox = document.getElementById('reportOngoing');
                if (checkbox) checkbox.checked = false;
                window.updateReportPreview();
            }
        }
    };

    // ---------- Работа с архивом (карточки) ----------
    let archiveFiles = [];

    window.loadTripStorageHistory = async () => {
        const grid = document.getElementById('archiveGrid');
        if (!grid) return;
        grid.innerHTML = '<div class="col-span-full text-center py-6 text-sm text-gray-400 font-medium">Загрузка архива...</div>';

        const supabase = window._supabase || window.supabase;
        if (!supabase) {
            grid.innerHTML = '<div class="col-span-full text-center py-6 text-red-500 font-bold">Supabase недоступен.</div>';
            return;
        }

        try {
            const { data: files, error } = await supabase.storage.from('documents-history').list('', { sortBy: { column: 'name', order: 'desc' } });
            if (error) throw error;
            archiveFiles = files ? files.filter(f => f.name !== '.emptyFolderPlaceholder') : [];
            renderArchiveCards(archiveFiles);
        } catch (err) {
            grid.innerHTML = '<div class="col-span-full text-center py-6 text-red-500 font-bold">Ошибка загрузки архива: ' + err.message + '</div>';
        }
    };

    function renderArchiveCards(files) {
        const grid = document.getElementById('archiveGrid');
        if (!grid) return;
        if (files.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-6 text-gray-400 font-medium">Архив документов пуст.</div>';
            return;
        }
        grid.innerHTML = files.map(f => {
            let icon = '📄';
            let typeLabel = 'Документ';
            let bgColor = 'bg-gray-100';
            let textColor = 'text-gray-700';
            if (f.name.startsWith('trip_') || f.name.includes('Командировка')) {
                icon = '💼';
                typeLabel = 'Командировка';
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
            } else if (f.name.startsWith('battery_') || f.name.includes('СписаниеАКБ')) {
                icon = '🔋';
                typeLabel = 'Списание АКБ';
                bgColor = 'bg-amber-100';
                textColor = 'text-amber-800';
            } else if (f.name.startsWith('acts_') || f.name.includes('Акты о прогуле')) {
                icon = '🛑';
                typeLabel = 'Акты о прогуле';
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
            } else if (f.name.startsWith('report_') || f.name.includes('Служебная записка')) {
                icon = '📝';
                typeLabel = 'Служебная записка';
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
            }
            // Извлекаем дату
            const dateMatch = f.name.match(/\d{4}-\d{2}-\d{2}/);
            const displayDate = dateMatch ? dateMatch[0] : '—';

            // Извлекаем имя
            let namePart = f.name.replace(/^[^_]*_/, '').replace(/\d{4}-\d{2}-\d{2}_/, '').replace(/\.doc$/, '');
            if (namePart.length > 30) namePart = namePart.slice(0, 28) + '…';

            return `
                <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-2xl">${icon}</span>
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-gray-800 text-sm truncate" title="${f.name}">${f.name}</div>
                            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${bgColor} ${textColor}">${typeLabel}</span>
                                <span class="text-[10px] text-gray-400">📅 ${displayDate}</span>
                                <span class="text-[10px] text-gray-500 truncate">${namePart}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        <button onclick="window.downloadStorageFile('${f.name}')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 rounded-lg transition shadow-sm">📥 Скачать</button>
                        <button onclick="window.deleteStorageFile('${f.name}')" class="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-1.5 rounded-lg border border-red-200 transition">🗑️ Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Фильтрация архива
    window.filterArchive = () => {
        const query = document.getElementById('archiveSearchInput')?.value.toLowerCase().trim() || '';
        const filtered = archiveFiles.filter(f => f.name.toLowerCase().includes(query));
        renderArchiveCards(filtered);
    };

    // Скачивание файла из Storage
    window.downloadStorageFile = async (filePath) => {
        const supabase = window._supabase || window.supabase;
        if (!supabase) return alert('Supabase клиент недоступен');
        try {
            const { data, error } = await supabase.storage.from('documents-history').createSignedUrl(filePath, 60, { download: true });
            if (error) throw error;
            const a = document.createElement('a');
            a.href = data.signedUrl;
            a.download = filePath;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            alert('Не удалось скачать файл: ' + err.message);
        }
    };

    // Удаление файла
    window.deleteStorageFile = async (filePath) => {
        if (!confirm('Вы уверены, что хотите безвозвратно удалить этот документ из архива?')) return;
        const supabase = window._supabase || window.supabase;
        if (!supabase) return alert('Supabase клиент недоступен');
        try {
            const { error } = await supabase.storage.from('documents-history').remove([filePath]);
            if (error) throw error;
            alert('Файл успешно удален.');
            window.loadTripStorageHistory();
        } catch (err) {
            alert('Не удалось удалить файл: ' + err.message);
        }
    };

    // Загружаем архив при старте
    setTimeout(() => { window.loadTripStorageHistory(); }, 100);
}