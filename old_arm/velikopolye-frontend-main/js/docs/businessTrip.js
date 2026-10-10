// js/docs/businessTrip.js

const DRIVERS_DATABASE = [
    "Синицкий В. А.", "Жданович М. С.", "Любецкий А.С.", "Квятковский А.А.", 
    "Судник М.В.", "Сонич С.В.", "Хроленко И.В.", "Кучеров В.В."
];

const TRIP_PURPOSES = [
    "получения запчастей",
    "доставки сельскохозяйственной продукции",
    "прохождения технического осмотра",
    "ремонта оборудования",
    "доставки товарно-материальных ценностей"
];

const TRIP_DESTINATIONS = [
    "город Дзержинск",
    "город Минск",
    "город Борисов",
    "город Жодино",
    "город Фаниполь"
];

const driverOptionsHtml = DRIVERS_DATABASE.map(d => '<option value="' + d + '">' + d + '</option>').join('') + '<option value="CUSTOM">-- Ввести вручную (Новый сотрудник) --</option>';
const destinationsHtml = TRIP_DESTINATIONS.map(dest => '<option value="' + dest + '">').join('');
const purposesHtml = TRIP_PURPOSES.map(p => '<option value="' + p + '">').join('');

export const tripTemplate = `
<div id="subModule_business_trip" class="hidden space-y-4 fade-in-sub">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Левая панель -->
        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 class="text-sm font-extrabold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span>✏️</span> Параметры служебной записки
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Дата документа</label>
                    <input type="date" id="tripDocDate" oninput="window.updateTripPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Дата поездки</label>
                    <input type="date" id="tripTargetDate" oninput="window.updateTripPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Водитель</label>
                <select id="tripDriverSelect" onchange="window.handleTripDriverSelect()" class="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
                    ${driverOptionsHtml}
                </select>
                <input type="text" id="tripDriverCustomInput" oninput="window.updateTripPreview()" class="hidden mt-2 w-full bg-gray-50 border border-indigo-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent" placeholder="Введите ФИО">
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Пункт назначения</label>
                <input type="text" id="tripDestinationInput" list="destinationsList" oninput="window.updateTripPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent" placeholder="Начните ввод...">
                <datalist id="destinationsList">${destinationsHtml}</datalist>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Цель</label>
                <input type="text" id="tripPurposeInput" list="purposesList" oninput="window.updateTripPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent" placeholder="Начните ввод...">
                <datalist id="purposesList">${purposesHtml}</datalist>
            </div>
            <button onclick="window.printAndSaveTrip()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm text-sm flex items-center justify-center gap-2">
                🖨️ Печать и сохранение
            </button>
        </div>

        <!-- Правая панель – превью -->
        <div class="lg:col-span-2 bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col">
            <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex-1 overflow-auto" id="tripLivePreview" style="font-family: 'Times New Roman', serif; min-height: 400px;"></div>
        </div>
    </div>
</div>
`;

export function initBusinessTrip() {
    window.handleTripDriverSelect = () => {
        const select = document.getElementById('tripDriverSelect');
        const customInput = document.getElementById('tripDriverCustomInput');
        if (select && customInput) {
            if (select.value === 'CUSTOM') {
                customInput.classList.remove('hidden');
                customInput.focus();
            } else {
                customInput.classList.add('hidden');
                customInput.value = '';
            }
        }
        window.updateTripPreview();
    };

    function formatTripDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) return parts[2] + '.' + parts[1] + '.' + parts[0];
        return dateStr;
    }

    // Вспомогательная функция для извлечения фамилии (первое слово)
    function extractSurname(fullName) {
        if (!fullName) return 'unknown';
        // Обрезаем лишние пробелы и берём первое слово до пробела или до точки
        const trimmed = fullName.trim();
        const firstWord = trimmed.split(/\s+/)[0].replace(/\.$/, '');
        return firstWord || 'unknown';
    }

    window.generateTripHtmlContent = () => {
        const docDate = formatTripDate(document.getElementById('tripDocDate')?.value);
        const targetDate = formatTripDate(document.getElementById('tripTargetDate')?.value);
        const selectVal = document.getElementById('tripDriverSelect')?.value;
        const customVal = document.getElementById('tripDriverCustomInput')?.value.trim();
        const driverName = selectVal === 'CUSTOM' ? (customVal || '') : selectVal;
        const destination = document.getElementById('tripDestinationInput')?.value.trim() || '';
        const purpose = document.getElementById('tripPurposeInput')?.value.trim() || '';

        return `
            <div style="font-family: 'Times New Roman', serif; color: black; font-size: 15px; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px;">
                    <div style="padding-top: 0px; font-weight: normal; color: black;">${docDate}</div>
                    <div style="width: 280px; text-align: left; line-height: 1.4; padding-left: 15px;">
                        Директору филиала<br>СХК «Великополье»<br>Рунцевичу Д.С.<br>
                        Заместителя директора –<br>главного инженера<br>Маковича М.П.
                    </div>
                </div>
                <h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 35px; letter-spacing: 0.5px;">Служебная записка</h1>
                <p style="text-align: justify; text-indent: 40px; margin-bottom: 70px; font-size: 15px;">
                    Прошу вас, командировать водителя автомобиля ${driverName} в ${destination}, по вопросу ${purpose} ${targetDate}г.
                </p>
                <div style="margin-top: 70px; display: flex; justify-content: space-between; font-size: 15px;">
                    <div style="text-align: left; width: 60%; line-height: 1.4;">Заместитель директора –<br>Главный инженер</div>
                    <div style="text-align: right; width: 40%; display: flex; align-items: flex-end; justify-content: flex-end;">Макович М.П.</div>
                </div>
            </div>
        `;
    };

    window.updateTripPreview = () => {
        const previewBlock = document.getElementById('tripLivePreview');
        if (previewBlock) previewBlock.innerHTML = window.generateTripHtmlContent();
    };

    window.printAndSaveTrip = async () => {
        const htmlContent = window.generateTripHtmlContent();
        const printBlock = document.getElementById('tripPrintBlock');
        if (printBlock) {
            printBlock.innerHTML = htmlContent;
            window.print();
            printBlock.innerHTML = '';
        }

        const supabase = window._supabase || window.supabase;
        if (!supabase) return alert('Ошибка: Клиент Supabase не найден.');

        const docDate = document.getElementById('tripDocDate')?.value || 'unknown-date';
        const selectVal = document.getElementById('tripDriverSelect')?.value;
        const customVal = document.getElementById('tripDriverCustomInput')?.value.trim();
        const driverRaw = selectVal === 'CUSTOM' ? customVal : selectVal;
        const surname = extractSurname(driverRaw || 'unknown');
        
        // Формируем понятное имя файла
        const fileName = `Командировка_${surname}_${docDate}.doc`;

        try {
            const wordContent = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta charset="utf-8"></head>
                <body>${htmlContent}</body>
                </html>
            `;
            const fileBlob = new Blob([wordContent], { type: 'application/msword;charset=utf-8' });
            const { error } = await supabase.storage.from('documents-history').upload(fileName, fileBlob, { cacheControl: '3600', upsert: true });
            if (error) throw error;
            alert('Документ успешно распечатан и сохранён в архив!');
            if (typeof window.loadTripStorageHistory === 'function') window.loadTripStorageHistory();
        } catch (err) {
            alert('Ошибка сохранения в архив: ' + err.message);
        }
    };

    // Установка значений по умолчанию
    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        if (document.getElementById('tripDocDate')) document.getElementById('tripDocDate').value = today;
        if (document.getElementById('tripTargetDate')) document.getElementById('tripTargetDate').value = today;
        if (document.getElementById('tripDestinationInput')) document.getElementById('tripDestinationInput').value = "город Дзержинск";
        if (document.getElementById('tripPurposeInput')) document.getElementById('tripPurposeInput').value = "получения запчастей";
        window.updateTripPreview();
    }, 50);
}