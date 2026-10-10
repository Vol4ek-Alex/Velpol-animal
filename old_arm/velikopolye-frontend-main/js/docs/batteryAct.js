// js/docs/batteryAct.js

export const batteryTemplate = `
<div id="subModule_battery_act" class="hidden space-y-4 fade-in-sub">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Левая панель -->
        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 class="text-sm font-extrabold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span>🔋</span> Параметры акта списания
            </h3>
            <div>
                <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Дата акта</label>
                <input type="date" id="batteryDocDate" oninput="window.updateBatteryPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:border-transparent">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Автомобиль</label>
                    <input type="text" id="batteryCarDoc" value="МАЗ-533702" oninput="window.updateBatteryPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Инв. №</label>
                    <input type="text" id="batteryInvNo" value="№ 347" oninput="window.updateBatteryPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                </div>
            </div>
            <div class="border-t border-b border-gray-200 py-3 space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Список АКБ</span>
                    <button onclick="window.addBatteryRow()" class="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1 rounded-xl font-bold transition">➕ Добавить</button>
                </div>
                <div id="batteryRowsContainer" class="space-y-3 max-h-[220px] overflow-y-auto pr-1"></div>
            </div>
            <button onclick="window.printAndSaveBattery()" class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm text-sm flex items-center justify-center gap-2">
                🖨️ Печать и сохранение
            </button>
        </div>

        <!-- Правая панель – превью -->
        <div class="lg:col-span-2 bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col">
            <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex-1 overflow-auto" id="batteryLivePreview" style="font-family: 'Times New Roman', serif; min-height: 400px;"></div>
        </div>
    </div>
</div>
`;

export function initBatteryAct() {
    // Каждый элемент: { id, name, count, period, weightPerOne } – вес одной АКБ
    let batteryItems = [
        { id: Date.now(), name: "6СТ-190 АБ-3 URA6AH", count: 2, period: 30, weightPerOne: 40 }
    ];

    window.addBatteryRow = () => {
        batteryItems.push({ id: Date.now(), name: "6СТ-190", count: 1, period: 24, weightPerOne: 40 });
        window.renderBatteryInputs();
        window.updateBatteryPreview();
    };

    window.removeBatteryRow = (id) => {
        if (batteryItems.length <= 1) {
            alert("В акте должна быть как минимум одна аккумуляторная батарея!");
            return;
        }
        batteryItems = batteryItems.filter(item => item.id !== id);
        window.renderBatteryInputs();
        window.updateBatteryPreview();
    };

    window.handleBatteryInputChange = (id, field, value) => {
        const item = batteryItems.find(i => i.id === id);
        if (item) {
            if (field === 'name') item.name = value;
            if (field === 'count') item.count = parseInt(value) || 0;
            if (field === 'period') item.period = value;
            if (field === 'weightPerOne') item.weightPerOne = parseFloat(value) || 0;
        }
        window.updateBatteryPreview();
    };

    window.renderBatteryInputs = () => {
        const container = document.getElementById('batteryRowsContainer');
        if (!container) return;
        container.innerHTML = batteryItems.map((item, index) => {
            // Общий вес = вес_одной * количество
            const totalWeight = (item.weightPerOne || 0) * (item.count || 0);
            return `
            <div class="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 relative">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-500">АКБ #${index + 1}</span>
                    <button onclick="window.removeBatteryRow(${item.id})" class="text-red-500 hover:text-red-700 text-xs font-bold">Удалить</button>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Наименование</label>
                    <input type="text" value="${item.name}" oninput="window.handleBatteryInputChange(${item.id}, 'name', this.value)" class="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Кол-во</label>
                        <input type="number" value="${item.count}" min="1" oninput="window.handleBatteryInputChange(${item.id}, 'count', this.value)" class="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Срок (мес)</label>
                        <input type="number" value="${item.period}" oninput="window.handleBatteryInputChange(${item.id}, 'period', this.value)" class="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Вес 1 шт (кг)</label>
                        <input type="number" value="${item.weightPerOne}" step="0.1" oninput="window.handleBatteryInputChange(${item.id}, 'weightPerOne', this.value)" class="w-full bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                    </div>
                </div>
                <div class="text-xs text-gray-500 font-bold">Общий вес: ${totalWeight.toFixed(1)} кг</div>
            </div>`;
        }).join('');
    };

    function formatBatteryDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) return parts[2] + '.' + parts[1] + '.' + parts[0];
        return dateStr;
    }

    function translitForFilename(str) {
        const ru = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z',
            'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
            'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'shch',
            'ы':'y','э':'e','ю':'yu','я':'ya',' ':'_','.':''
        };
        return str.toLowerCase().split('').map(c => ru[c] || (/[a-z0-9_-]/.test(c) ? c : '')).join('');
    }

    window.generateBatteryHtmlContent = () => {
        const actDate = formatBatteryDate(document.getElementById('batteryDocDate')?.value);
        const car = document.getElementById('batteryCarDoc')?.value || '';
        const invNo = document.getElementById('batteryInvNo')?.value || '';

        // Рассчитываем общий вес для каждой АКБ и суммарный
        let totalWeightAll = 0;
        const linesHtml = batteryItems.map(item => {
            const totalWeight = (item.weightPerOne || 0) * (item.count || 0);
            totalWeightAll += totalWeight;
            return `<strong>${item.name}</strong> в количестве ${item.count} шт. в процессе эксплуатации (${item.period} месяцев) пришла в негодность (общий вес ${totalWeight.toFixed(1)} кг)`;
        }).join(', а также ');

        const listDetailsHtml = batteryItems.map(item => {
            const totalWeight = (item.weightPerOne || 0) * (item.count || 0);
            return `• ${item.name} - ${item.count} шт. (общий вес ${totalWeight.toFixed(1)} кг);`;
        }).join('<br>');

        return `
            <div style="font-family: 'Times New Roman', serif; color: black; font-size: 14px; line-height: 1.5; max-width: 650px; margin: 0 auto; padding: 10px;">
                <div style="text-align: left; margin-bottom: 30px; font-size: 13px;">
                    Филиал СХК «Великополье»<br>ГП «Минсктранс»
                </div>
                <div style="margin-bottom: 25px;">
                    <strong>АКТ</strong><br>
                    ${actDate}г.<br>
                    д. Великополье<br>
                    О списании аккумуляторной батареи
                </div>
                <div style="margin-bottom: 25px; text-align: justify;">
                    <u>Составил: Волчек</u> А.А. – Инженер по ЭМТП<br>
                    в присутствии: Макович М.П. – Заместитель директора – главный инженер<br>
                    <span style="padding-left: 82px;">Манулик Е.И. - Кладовщик</span><br>
                    <span style="padding-left: 82px;">Ладутько И.И. - Техник</span>
                </div>
                <p style="text-align: justify; text-indent: 40px; margin-bottom: 20px;">
                    Мы, <u>нижеподписавшиеся</u>, настоящим актом удостоверяем, что следующие аккумуляторная батарея: ${linesHtml} и подлежит списанию с последующим <u>оприходованием</u> на склад в качестве лома свинца суммарным весом ${totalWeightAll.toFixed(1)} кг:
                </p>
                <div style="margin-bottom: 40px; padding-left: 40px; font-weight: bold; line-height: 1.6;">
                    ${listDetailsHtml}<br>
                    Автомобиль: ${car}, инв. ${invNo}
                </div>
                <div style="margin-top: 50px; font-size: 14px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><div>Волчек А.А.</div><div>___________________________</div></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><div>Макович М.П.</div><div>___________________________</div></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><div>Манулик Е.И.</div><div>___________________________</div></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><div>Ладутько И.И.</div><div>___________________________</div></div>
                </div>
            </div>
        `;
    };

    window.updateBatteryPreview = () => {
        const previewBlock = document.getElementById('batteryLivePreview');
        if (previewBlock) previewBlock.innerHTML = window.generateBatteryHtmlContent();
    };

    window.printAndSaveBattery = async () => {
        const htmlContent = window.generateBatteryHtmlContent();
        const printBlock = document.getElementById('tripPrintBlock');
        if (printBlock) {
            printBlock.innerHTML = htmlContent;
            window.print();
            printBlock.innerHTML = '';
        }

        const supabase = window._supabase || window.supabase;
        if (!supabase) return alert('Ошибка: Клиент Supabase не найден.');

        const docDate = document.getElementById('batteryDocDate')?.value || 'unknown-date';
        const car = document.getElementById('batteryCarDoc')?.value || 'unknown';
        const safeCar = translitForFilename(car);
        const fileName = `СписаниеАКБ_${docDate}_${safeCar}.doc`;

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
            alert('Акт успешно сохранён в архив!');
            if (typeof window.loadTripStorageHistory === 'function') window.loadTripStorageHistory();
        } catch (err) {
            alert('Ошибка сохранения: ' + err.message);
        }
    };

    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        if (document.getElementById('batteryDocDate')) document.getElementById('batteryDocDate').value = today;
        window.renderBatteryInputs();
        window.updateBatteryPreview();
    }, 50);
}