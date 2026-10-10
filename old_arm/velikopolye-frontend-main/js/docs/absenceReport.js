// js/docs/absenceReport.js

export const absenceReportTemplate = `
<div id="subModule_absence_report" class="hidden space-y-4 fade-in-sub">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 class="text-sm font-extrabold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span>📝</span> Служебная записка (прогул)
            </h3>
            <div class="border-t border-gray-200 pt-3 space-y-3">
                <span class="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Период отсутствия</span>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 mb-0.5">С какого числа</label>
                        <input type="date" id="reportStartDate" oninput="window.updateReportPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 mb-0.5">По какое число</label>
                        <input type="date" id="reportEndDate" oninput="window.updateReportPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                    </div>
                </div>
                <div class="flex items-center gap-2 mt-1">
                    <input type="checkbox" id="reportOngoing" onchange="window.updateReportPreview()" class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500">
                    <label for="reportOngoing" class="text-xs font-bold text-gray-700">По настоящее время</label>
                </div>
            </div>
            <div class="border-t border-gray-200 pt-3 space-y-3">
                <span class="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Данные сотрудника</span>
                <div>
                    <label class="block text-[10px] font-bold text-gray-600 mb-0.5">ФИО (им. падеж)</label>
                    <input type="text" id="reportEmployeeName" value="Алексей Юрьевич" oninput="window.updateReportPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Должность</label>
                    <input type="text" id="reportEmployeeJob" value="тракторист-машинист" oninput="window.updateReportPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                </div>
            </div>
            <div class="border-t border-gray-200 pt-3">
                <label class="block text-[10px] font-bold text-gray-600 mb-1">Размер шрифта (pt)</label>
                <select id="reportFontSize" onchange="window.updateReportPreview()" class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:border-transparent">
                    <option value="12">12</option>
                    <option value="14" selected>14</option>
                    <option value="16">16</option>
                    <option value="18">18</option>
                </select>
            </div>
            <button onclick="window.printAndSaveReport()" class="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold transition shadow-sm text-sm flex items-center justify-center gap-2">
                🖨️ Печать служебной
            </button>
        </div>

        <div class="lg:col-span-2 bg-gray-50 rounded-2xl p-3 border border-gray-200 flex flex-col min-h-[500px]">
            <div id="reportPreviewWrapper" class="flex-1 flex items-center justify-center overflow-hidden relative">
                <div id="reportPreviewScaler" style="transform-origin: top left; transition: transform 0.2s ease;">
                    <div id="reportLivePreview" class="bg-white shadow-lg" style="width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; font-family: 'Times New Roman', serif; color: black; overflow: hidden;">
                        <!-- Сюда динамически вставляется содержимое -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

export function initAbsenceReport() {
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
        const wrapper = document.getElementById('reportPreviewWrapper');
        const scaler = document.getElementById('reportPreviewScaler');
        const preview = document.getElementById('reportLivePreview');
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

    function generateReportHtml(empName, empJob, startDate, endDate, isOngoing, fontSize) {
        const formattedStart = formatRusDate(startDate);
        let dateRange;
        let docDate;
        if (isOngoing) {
            dateRange = `с ${formattedStart} по настоящее время`;
            docDate = formattedStart;
        } else {
            const formattedEnd = formatRusDate(endDate);
            dateRange = `с ${formattedStart} по ${formattedEnd}гг.`;
            docDate = formattedEnd;
        }

        const style = `
            font-family: 'Times New Roman', serif;
            font-size: ${fontSize}pt;
            line-height: 1.5;
            box-sizing: border-box;
            background: white;
            padding: 0;
            margin: 0;
        `;

        return `
            <div style="${style}">
                <!-- Дата слева -->
                <div style="text-align: left; margin-bottom: 20px; font-size: ${fontSize}pt;">
                    ${docDate}г.
                </div>

                <!-- Адресат (справа) -->
                <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 30px;">
                    <tr>
                        <td style="width: 45%; border: none;"></td>
                        <td style="width: 55%; text-align: left; font-size: ${fontSize}pt; line-height: 1.3; border: none; padding: 0;">
                            Директору филиала СХК<br>
                            «Великополье»<br>
                            Рунцевичу Д.С.<br>
                            Инженера по ЭМТП<br>
                            Волчка А.А.
                        </td>
                    </tr>
                </table>

                <!-- Заголовок -->
                <div style="text-align: center; font-weight: bold; font-size: ${fontSize}pt; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 25px;">
                    Докладная записка
                </div>

                <!-- Текст -->
                <p style="text-indent: 40px; margin-bottom: 40px; font-size: ${fontSize}pt; line-height: 1.5;">
                    Довожу до Вашего сведения, что ${empJob} ${empName} отсутствовал на рабочем месте ${dateRange}, что повлияло на рабочий процесс. Прошу признать его отсутствие, как отсутствие без уважительной причины, и принять соответствующие меры.
                </p>

                <!-- Подпись -->
                <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 20px; font-size: ${fontSize}pt;">
                    <tr>
                        <td style="width: 50%; text-align: left; border: none; padding: 0;">Инженер по ЭМТП</td>
                        <td style="width: 50%; text-align: right; border: none; padding: 0;">Волчек А.А.</td>
                    </tr>
                </table>
            </div>
        `;
    }

    window.generateReportHtmlContent = (isForWord = false) => {
        const empName = document.getElementById('reportEmployeeName')?.value || '';
        const empJob = document.getElementById('reportEmployeeJob')?.value || '';
        const startRaw = document.getElementById('reportStartDate')?.value;
        const endRaw = document.getElementById('reportEndDate')?.value;
        const isOngoing = document.getElementById('reportOngoing')?.checked || false;
        const fontSize = document.getElementById('reportFontSize')?.value || '14';

        if (!startRaw) {
            return isForWord ? '' : { combinedHtml: '<div class="p-4 text-center text-gray-400 font-bold">Выберите дату начала</div>' };
        }
        if (!isOngoing && !endRaw) {
            return isForWord ? '' : { combinedHtml: '<div class="p-4 text-center text-gray-400 font-bold">Укажите конечную дату или включите "по настоящее время"</div>' };
        }

        const html = generateReportHtml(empName, empJob, startRaw, endRaw, isOngoing, fontSize);

        if (isForWord) {
            return `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta charset="utf-8">
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: ${fontSize}pt; line-height: 1.5; }
                    p { margin: 0 0 10px 0; text-indent: 40px; }
                </style>
                </head>
                <body>${html}</body>
                </html>
            `;
        }

        return { combinedHtml: `<div style="background: white; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 30px; border: 1px solid #eee;">${html}</div>` };
    };

    window.updateReportPreview = () => {
        const previewBlock = document.getElementById('reportLivePreview');
        if (!previewBlock) return;
        const { combinedHtml } = window.generateReportHtmlContent(false);
        previewBlock.innerHTML = combinedHtml;
        setTimeout(scalePreview, 50);
    };

    window.printAndSaveReport = async () => {
        const fullHtml = window.generateReportHtmlContent(true);
        if (!fullHtml) return alert('Нет данных для печати.');

        const printBlock = document.getElementById('tripPrintBlock');
        if (printBlock) {
            printBlock.innerHTML = fullHtml;
            window.print();
            printBlock.innerHTML = '';
        }

        const supabase = window._supabase || window.supabase;
        if (!supabase) return alert('Ошибка: Клиент Supabase не найден.');

        const startRaw = document.getElementById('reportStartDate')?.value || 'date';
        const empName = document.getElementById('reportEmployeeName')?.value || 'сотрудник';
        const safeName = translitForFilename(empName);
        const fileName = `report_${startRaw}_${safeName}.doc`;

        try {
            const fileBlob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
            const { error } = await supabase.storage.from('documents-history').upload(fileName, fileBlob, { cacheControl: '3600', upsert: true });
            if (error) throw error;
            alert('Служебная записка сохранена в архив!');
            if (typeof window.loadTripStorageHistory === 'function') window.loadTripStorageHistory();
        } catch (err) {
            alert('Ошибка сохранения: ' + err.message);
        }
    };

    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        if (document.getElementById('reportStartDate')) document.getElementById('reportStartDate').value = today;
        if (document.getElementById('reportEndDate')) document.getElementById('reportEndDate').value = today;
        window.updateReportPreview();
        window.addEventListener('resize', scalePreview);
        window.addEventListener('orientationchange', () => setTimeout(scalePreview, 300));
    }, 50);
}