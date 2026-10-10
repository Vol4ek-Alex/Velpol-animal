// js/docs/absenceActs.js

export const absenceActsTemplate = `
<div id="subModule_absence_acts" class="hidden space-y-4 fade-in-sub">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 class="text-sm font-extrabold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span>🛑</span> Акты о прогуле (подневно)
            </h3>
            <div class="border-t border-gray-200 pt-3 space-y-3">
                <span class="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Период</span>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 mb-0.5">С какого числа</label>
                        <input type="date" id="actsStartDate" oninput="window.updateActsPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 mb-0.5">По какое число</label>
                        <input type="date" id="actsEndDate" oninput="window.updateActsPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                    </div>
                </div>
                <p class="text-[10px] text-amber-600 font-bold">💡 Будет сгенерирован отдельный акт на каждый день диапазона.</p>
            </div>
            <div class="border-t border-gray-200 pt-3 space-y-3">
                <span class="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Данные сотрудника</span>
                <div>
                    <label class="block text-[10px] font-bold text-gray-600 mb-0.5">ФИО (род. падеж)</label>
                    <input type="text" id="actsEmployeeName" value="Пустельникова А.Ю." oninput="window.updateActsPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Должность</label>
                    <input type="text" id="actsEmployeeJob" value="тракторист-машинист" oninput="window.updateActsPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                </div>
            </div>
            <button onclick="window.printAndSaveActs()" class="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm text-sm flex items-center justify-center gap-2">
                🖨️ Печать пакета актов
            </button>
        </div>

        <div class="lg:col-span-2 bg-gray-50 rounded-2xl p-3 border border-gray-200 flex flex-col min-h-[500px]">
            <div id="actsPreviewWrapper" class="flex-1 flex items-center justify-center overflow-hidden relative">
                <div id="actsPreviewScaler" style="transform-origin: top left; transition: transform 0.2s ease;">
                    <div id="actsLivePreview" class="bg-white shadow-lg" style="width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.5; color: black; overflow: hidden;">
                        <!-- Сюда динамически вставляется содержимое -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

export function initAbsenceActs() {
    function getDatesInRange(startStr, endStr) {
        const dates = [];
        if (!startStr || !endStr) return dates;
        let current = new Date(startStr);
        const end = new Date(endStr);
        if (current > end) return dates;
        while (current <= end) {
            dates.push(new Date(current).toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    function formatRusDate(dateStr) {
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

    function scalePreview() {
        const wrapper = document.getElementById('actsPreviewWrapper');
        const scaler = document.getElementById('actsPreviewScaler');
        const preview = document.getElementById('actsLivePreview');
        if (!wrapper || !scaler || !preview) return;
        const wrapperWidth = wrapper.clientWidth;
        const wrapperHeight = wrapper.clientHeight;
        const previewWidth = preview.offsetWidth;
        const previewHeight = preview.offsetHeight;
        const scaleX = wrapperWidth / previewWidth;
        const scaleY = wrapperHeight / previewHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        scaler.style.transform = `scale(${scale})`;
        scaler.style.transformOrigin = 'top left';
        const offsetX = (wrapperWidth - previewWidth * scale) / 2;
        const offsetY = (wrapperHeight - previewHeight * scale) / 2;
        scaler.style.marginLeft = offsetX + 'px';
        scaler.style.marginTop = offsetY + 'px';
    }

    function generateActHtml(dateStr, empName, empJob) {
        const formattedDate = formatRusDate(dateStr);
        return `
            <div style="font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.5; box-sizing: border-box; background: white; padding: 0; margin-bottom: 0;">
                <div style="text-align: left; margin-bottom: 30px; font-size: 13px;">
                    Филиал СХК «Великополье»<br>ГП «Минсктранс»
                </div>
                <div style="margin-bottom: 25px;">
                    <strong>АКТ</strong><br>
                    ${formattedDate}г.<br>
                    д. Великополье<br>
                    Об отсутствии на рабочем месте
                </div>
                <div style="margin-bottom: 35px; text-align: left;">
                    Составил: Волчек А.А. - инженер Э.М.Т.П.<br>
                    в присутствии: Маковича М.П. – заместителя директора - главного инженера<br>
                    <span style="padding-left: 82px;">Миколенко Ю.С. – заведующего гаражом</span><br>
                    <span style="padding-left: 82px;">Ладутько И.И. – техника</span>
                </div>
                <p style="text-indent: 40px; margin-bottom: 40px;">
                    Мы, нижеподписавшиеся, настоящим актом удостоверяем, что ${empJob} <strong>${empName}</strong> отсутствовал на рабочем месте ${formattedDate}г.
                </p>
                <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 20px; font-family: 'Times New Roman', serif; font-size: 14px;">
                    <tr style="height: 35px;">
                        <td style="width: 40%; text-align: left; border: none; padding: 0;">Волчек А.А.</td>
                        <td style="width: 60%; text-align: right; border: none; padding: 0;">___________________________</td>
                    </tr>
                    <tr style="height: 35px;">
                        <td style="width: 40%; text-align: left; border: none; padding: 0;">Макович М.П.</td>
                        <td style="width: 60%; text-align: right; border: none; padding: 0;">___________________________</td>
                    </tr>
                    <tr style="height: 35px;">
                        <td style="width: 40%; text-align: left; border: none; padding: 0;">Миколенко Ю.С.</td>
                        <td style="width: 60%; text-align: right; border: none; padding: 0;">___________________________</td>
                    </tr>
                    <tr style="height: 35px;">
                        <td style="width: 40%; text-align: left; border: none; padding: 0;">Ладутько И.И.</td>
                        <td style="width: 60%; text-align: right; border: none; padding: 0;">___________________________</td>
                    </tr>
                </table>
            </div>
        `;
    }

    window.generateActsHtmlContent = (isForWord = false) => {
        const empName = document.getElementById('actsEmployeeName')?.value || '';
        const empJob = document.getElementById('actsEmployeeJob')?.value || '';
        const startRaw = document.getElementById('actsStartDate')?.value;
        const endRaw = document.getElementById('actsEndDate')?.value;

        const dateList = getDatesInRange(startRaw, endRaw);
        if (dateList.length === 0) {
            return isForWord ? '' : { combinedHtml: '<div class="p-4 text-center text-gray-400 font-bold">Выберите корректный диапазон дат</div>' };
        }

        if (isForWord) {
            // Для Word и печати – каждый акт с разрывом страницы
            const actsHtml = dateList.map(dateStr => generateActHtml(dateStr, empName, empJob)).join('<br clear="all" style="page-break-before: always; mso-break-type: section-break;">');
            return actsHtml;
        } else {
            // Для превью – карточки с тенью
            const actsPreview = dateList.map(dateStr => {
                const actContent = generateActHtml(dateStr, empName, empJob);
                return `<div style="background: white; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 30px; margin-bottom: 30px; border: 1px solid #eee;">${actContent}</div>`;
            }).join('');
            return { combinedHtml: actsPreview };
        }
    };

    window.updateActsPreview = () => {
        const previewBlock = document.getElementById('actsLivePreview');
        if (!previewBlock) return;
        const { combinedHtml } = window.generateActsHtmlContent(false);
        previewBlock.innerHTML = combinedHtml;
        setTimeout(scalePreview, 50);
    };

    window.printAndSaveActs = async () => {
        const fullHtml = window.generateActsHtmlContent(true);
        if (!fullHtml) return alert('Нет данных для печати.');

        const printBlock = document.getElementById('tripPrintBlock');
        if (printBlock) {
            printBlock.innerHTML = fullHtml;
            window.print();
            printBlock.innerHTML = '';
        }

        const supabase = window._supabase || window.supabase;
        if (!supabase) return alert('Ошибка: Клиент Supabase не найден.');

        const startRaw = document.getElementById('actsStartDate')?.value || 'date';
        const empName = document.getElementById('actsEmployeeName')?.value || 'сотрудник';
        const safeName = translitForFilename(empName);
        const fileName = `acts_${startRaw}_${safeName}.doc`;

        try {
            const wordContent = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta charset="utf-8"></head>
                <body>${fullHtml}</body>
                </html>
            `;
            const fileBlob = new Blob([wordContent], { type: 'application/msword;charset=utf-8' });
            const { error } = await supabase.storage.from('documents-history').upload(fileName, fileBlob, { cacheControl: '3600', upsert: true });
            if (error) throw error;
            alert('Пакет актов успешно сохранён в архив!');
            if (typeof window.loadTripStorageHistory === 'function') window.loadTripStorageHistory();
        } catch (err) {
            alert('Ошибка сохранения: ' + err.message);
        }
    };

    // Инициализация
    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        if (document.getElementById('actsStartDate')) document.getElementById('actsStartDate').value = today;
        if (document.getElementById('actsEndDate')) document.getElementById('actsEndDate').value = today;
        window.updateActsPreview();
        window.addEventListener('resize', scalePreview);
        window.addEventListener('orientationchange', () => setTimeout(scalePreview, 300));
    }, 50);
}