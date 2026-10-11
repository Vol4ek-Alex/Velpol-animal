export async function init() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
        <div style="max-width: 1400px; margin: 0 auto;">
            <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px;">
                <h1 style="margin: 0; color: #fff; font-size: 1.6rem; font-weight: 800; line-height: 1.2;">
                    📊 Панель управления
                </h1>
                <p style="margin: 0; color: var(--muted); font-size: 0.88rem; font-weight: 500;">
                    Оперативная сводка по филиалу СХК «Великополье»
                </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 24px;">
                <div class="glass-panel" style="padding: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: var(--muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">Автопарк</span>
                        <span style="font-size: 1.4rem;">🚜</span>
                    </div>
                    <div id="dashTotal" style="color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 700; line-height: 1;">0</div>
                    <div style="color: var(--subtle); font-size: 0.7rem; font-weight: 600; margin-top: 6px;">ед. техники</div>
                </div>

                <div class="glass-panel" style="padding: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: var(--muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">Готово</span>
                        <span style="font-size: 1.4rem;">✅</span>
                    </div>
                    <div id="dashReady" style="color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 700; line-height: 1;">0</div>
                    <div style="color: var(--subtle); font-size: 0.7rem; font-weight: 600; margin-top: 6px;">единиц</div>
                </div>

                <div class="glass-panel" style="padding: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: var(--muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">Хранение</span>
                        <span style="font-size: 1.4rem;">🏠</span>
                    </div>
                    <div id="dashStorage" style="color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 700; line-height: 1;">0</div>
                    <div style="color: var(--subtle); font-size: 0.7rem; font-weight: 600; margin-top: 6px;">единиц</div>
                </div>

                <div class="glass-panel" style="padding: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: var(--muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">Ремонт</span>
                        <span style="font-size: 1.4rem;">🔧</span>
                    </div>
                    <div id="dashInRepair" style="color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 700; line-height: 1;">0</div>
                    <div style="color: var(--subtle); font-size: 0.7rem; font-weight: 600; margin-top: 6px;">единиц</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px;">
                <div class="glass-panel" style="padding: 22px; display: flex; flex-direction: column;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--line);">
                        <h3 style="margin: 0; color: #fff; font-size: 0.92rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                            <span>📋</span> Задачи
                        </h3>
                        <span id="taskCounter" style="background: rgba(255,255,255,0.08); border: 1px solid var(--line); border-radius: 999px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; color: var(--muted);">0</span>
                    </div>
                    <div style="margin-bottom: 14px;">
                        <select id="taskVehicleSelect" style="width: 100%; min-height: 38px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 11px; background: var(--input-bg); color: #fff; font-size: 0.82rem; font-weight: 500; margin-bottom: 10px;">
                            <option value="">-- Общая заметка --</option>
                        </select>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="taskTextInput" placeholder="Текст задачи..." style="flex: 1; min-height: 38px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 11px; background: var(--input-bg); color: #fff; font-size: 0.82rem;">
                            <button onclick="window.dashAddRepairTask()" class="glass-btn" style="background: rgba(52, 211, 153, 0.15); border-color: var(--green); color: var(--green);">＋</button>
                        </div>
                    </div>
                    <div id="containerTasks" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                        <div style="text-align: center; color: var(--muted); font-size: 0.8rem; padding: 20px;">Загрузка...</div>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 22px; display: flex; flex-direction: column;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--line);">
                        <h3 style="margin: 0; color: #fff; font-size: 0.92rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                            <span>🛠️</span> Гарантия
                        </h3>
                        <button onclick="window.dashToggleFilterDropdown(event)" class="glass-btn" style="min-height: 32px; padding: 6px 11px; font-size: 0.74rem;">⚙️ Фильтр</button>
                    </div>
                    <div id="dashFilterDropdown" style="position: absolute; left: 22px; top: 72px; width: 260px; max-width: calc(100vw - 44px); background: var(--glass-strong); border: 1px solid var(--line-bright); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); padding: 16px; z-index: 50; display: none; max-height: 300px; overflow-y: auto;">
                        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); padding-bottom: 10px; margin-bottom: 12px;">
                            <p style="margin: 0; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--muted); letter-spacing: 0.05em;">Отображать</p>
                            <button onclick="window.dashResetFilter()" style="border: none; background: none; color: var(--green); font-size: 0.76rem; font-weight: 700; cursor: pointer;">Показать все</button>
                        </div>
                        <div id="dashFilterCheckboxes" style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem;"></div>
                        <div id="dashFilterStats" style="font-size: 0.7rem; color: var(--subtle); border-top: 1px solid var(--line); padding-top: 10px; margin-top: 10px; text-align: center;"></div>
                    </div>
                    <div id="containerWarranty" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                        <div style="text-align: center; color: var(--muted); font-size: 0.8rem; padding: 20px;">Загрузка...</div>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 22px; display: flex; flex-direction: column;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--line);">
                        <h3 style="margin: 0; color: #fff; font-size: 0.92rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                            <span>📄</span> Документы
                        </h3>
                    </div>
                    <div id="containerDocs" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                        <div style="text-align: center; color: var(--muted); font-size: 0.8rem; padding: 20px;">Загрузка...</div>
                    </div>
                </div>
            </div>

            <div id="dashEditModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 16px;">
                <div class="glass-panel" style="width: 100%; max-width: 440px; padding: 24px; max-height: calc(100dvh - 32px); overflow-y: auto;">
                    <button onclick="window.dashCloseModal()" style="position: absolute; top: 20px; right: 20px; border: none; background: none; color: var(--muted); font-size: 1.4rem; cursor: pointer;">✕</button>
                    <div style="margin-bottom: 20px;">
                        <h4 id="modalVehicleTitle" style="margin: 0 0 6px 0; color: #fff; font-size: 1.1rem; font-weight: 800;">Модель техники</h4>
                        <p id="modalVehiclePlate" style="margin: 0; color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 0.84rem;">[0000 AA-7]</p>
                    </div>
                    <div id="modalWarrantySection" style="display: none; padding-top: 16px; border-top: 1px solid var(--line);">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: var(--muted); font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Текущая наработка</label>
                            <input type="number" id="inputModalCurrentHours" style="width: 100%; min-height: 42px; padding: 10px 13px; border: 1px solid var(--line); border-radius: 11px; background: var(--input-bg); color: #fff; font-size: 0.88rem; font-weight: 600;">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; margin-bottom: 6px; color: var(--muted); font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Нулевая база</label>
                                <input type="number" id="inputModalZeroHours" style="width: 100%; min-height: 42px; padding: 10px 13px; border: 1px solid var(--line); border-radius: 11px; background: var(--input-bg); color: #fff; font-size: 0.88rem; font-weight: 600;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; color: var(--muted); font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Периодичность</label>
                                <input type="number" id="inputModalStepHours" style="width: 100%; min-height: 42px; padding: 10px 13px; border: 1px solid var(--line); border-radius: 11px; background: var(--input-bg); color: #fff; font-size: 0.88rem; font-weight: 600;">
                            </div>
                        </div>
                    </div>
                    <div id="modalDocsSection" style="display: none; padding-top: 16px; border-top: 1px solid var(--line);">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: var(--muted); font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Дата Гостехосмотра</label>
                            <input type="date" id="inputModalInspectionDate" style="width: 100%; min-height: 42px; padding: 10px 13px; border: 1px solid var(--line); border-radius: 11px; background: var(--input-bg); color: #fff; font-size: 0.88rem; font-weight: 500;">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; color: var(--muted); font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Дата Страховки</label>
                            <input type="date" id="inputModalInsuranceDate" style="width: 100%; min-height: 42px; padding: 10px 13px; border: 1px solid var(--line); border-radius: 11px; background: var(--input-bg); color: #fff; font-size: 0.88rem; font-weight: 500;">
                        </div>
                    </div>
                    <button onclick="window.dashSaveModalData()" class="glass-btn" style="width: 100%; margin-top: 20px; background: rgba(52, 211, 153, 0.18); border-color: var(--green); color: var(--green); font-weight: 700;">Сохранить изменения</button>
                </div>
            </div>
        </div>
    `;

    setupDashboard();
}

let refreshIntervalId = null;
let activeModalVehicleId = null;

function getUnitByCategory(type) {
    if (!type) return 'м/ч';
    const lower = type.toLowerCase();
    const carKeywords = ['легковой', 'грузовой', 'грузопассажирский', 'автобус', 'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'];
    for (let kw of carKeywords) {
        if (lower.includes(kw)) return 'км';
    }
    return 'м/ч';
}

function setupDashboard() {
    window.dashCompleteTask = dashCompleteTask;
    window.dashAddRepairTask = dashAddRepairTask;
    window.dashToggleFilterDropdown = dashToggleFilterDropdown;
    window.dashToggleLocalVisibility = dashToggleLocalVisibility;
    window.dashResetFilter = dashResetFilter;
    window.dashOpenWarrantyModal = dashOpenWarrantyModal;
    window.dashOpenDocsModal = dashOpenDocsModal;
    window.dashCloseModal = dashCloseModal;
    window.dashSaveModalData = dashSaveModalData;

    document.addEventListener('click', function(e) {
        const drop = document.getElementById('dashFilterDropdown');
        if (drop && !drop.contains(e.target) && !e.target.closest('button')) {
            drop.style.display = 'none';
        }
    });

    loadDashboardData();
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(loadDashboardData, 10000);
}

async function loadDashboardData() {
    if (!window._supabase) return;
    try {
        const [vehiclesRes, tasksRes] = await Promise.all([
            window._supabase.from('vehicles').select('*'),
            window._supabase.from('vehicle_tasks').select('*').eq('is_completed', false)
        ]);

        if (vehiclesRes.error) throw vehiclesRes.error;
        if (tasksRes.error) throw tasksRes.error;
        
        const vehiclesList = vehiclesRes.data || [];
        const activeTasks = tasksRes.data || [];

        window.dashCachedVehicles = vehiclesList;
        window.dashCachedTasks = activeTasks;

        renderStats(vehiclesList);
        populateVehicleDropdown(vehiclesList);
        renderFilterCheckboxes(vehiclesList);
        renderSeparatedAlerts(vehiclesList, activeTasks);
        updateTaskCounter(activeTasks.length);
    } catch (err) {
        console.error("Ошибка обновления Dashboard:", err.message);
    }
}

function updateTaskCounter(count) {
    const el = document.getElementById('taskCounter');
    if (el) el.innerText = count;
}

function renderStats(list) {
    const stats = {
        'dashTotal': list.length,
        'dashReady': list.filter(v => v.tags && v.tags.includes('Готов')).length,
        'dashStorage': list.filter(v => v.tags && v.tags.includes('На хранении')).length,
        'dashInRepair': list.filter(v => v.tags && v.tags.includes('В ремонте')).length
    };
    for (const [id, value] of Object.entries(stats)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }
}

function populateVehicleDropdown(vehicles) {
    const select = document.getElementById('taskVehicleSelect');
    if (!select || select.options.length > 1) return;
    const sorted = [...vehicles].sort((a,b) => a.model.localeCompare(b.model));
    sorted.forEach(v => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ id: v.id, name: v.model });
        opt.innerText = `${v.model} ${v.plate ? '['+v.plate+']' : '[б/н]'}`;
        select.appendChild(opt);
    });
}

function dashToggleFilterDropdown(e) {
    e.stopPropagation();
    const drop = document.getElementById('dashFilterDropdown');
    if (drop) {
        drop.style.display = drop.style.display === 'none' ? 'block' : 'none';
    }
}

function renderFilterCheckboxes(vehicles) {
    const container = document.getElementById('dashFilterCheckboxes');
    if (!container) return;
    const hiddenVehicles = JSON.parse(localStorage.getItem('dash_hidden_warranty') || '[]');
    const warrantyVehicles = vehicles.filter(v => {
        const tags = v.tags ? v.tags.split(',').map(t => t.trim()) : [];
        return tags.includes('Гарантия');
    });
    const statsEl = document.getElementById('dashFilterStats');
    if (warrantyVehicles.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--muted); font-size: 0.8rem; padding: 12px 0;">Нет гарантийной техники</p>`;
        if (statsEl) statsEl.innerText = '';
        return;
    }
    warrantyVehicles.sort((a,b) => a.model.localeCompare(b.model));
    container.innerHTML = warrantyVehicles.map(v => {
        const isChecked = !hiddenVehicles.includes(v.id) ? 'checked' : '';
        return `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 8px; border-radius: 8px; transition: background 150ms ease;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                <input type="checkbox" ${isChecked} onchange="window.dashToggleLocalVisibility(${v.id}, this.checked)" style="width: 16px; height: 16px; cursor: pointer;">
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v.model} ${v.plate ? '('+v.plate+')' : '(б/н)'}</span>
            </label>
        `;
    }).join('');
    const visibleCount = warrantyVehicles.filter(v => !hiddenVehicles.includes(v.id)).length;
    if (statsEl) statsEl.innerText = `Показано ${visibleCount} из ${warrantyVehicles.length}`;
}

function dashToggleLocalVisibility(vehicleId, isChecked) {
    let hiddenVehicles = JSON.parse(localStorage.getItem('dash_hidden_warranty') || '[]');
    if (isChecked) {
        hiddenVehicles = hiddenVehicles.filter(id => id !== vehicleId);
    } else {
        if (!hiddenVehicles.includes(vehicleId)) hiddenVehicles.push(vehicleId);
    }
    localStorage.setItem('dash_hidden_warranty', JSON.stringify(hiddenVehicles));
    if (window.dashCachedVehicles && window.dashCachedTasks) {
        renderSeparatedAlerts(window.dashCachedVehicles, window.dashCachedTasks);
    }
}

function dashResetFilter() {
    localStorage.removeItem('dash_hidden_warranty');
    loadDashboardData();
}

function dashOpenWarrantyModal(id, model, plate, current, zero, step, inspectDate, insDate) {
    activeModalVehicleId = id;
    document.getElementById('modalVehicleTitle').innerText = model;
    document.getElementById('modalVehiclePlate').innerText = plate ? `[${plate}]` : '[б/н]';
    document.getElementById('inputModalCurrentHours').value = current;
    document.getElementById('inputModalZeroHours').value = zero;
    document.getElementById('inputModalStepHours').value = step;
    document.getElementById('inputModalInspectionDate').value = inspectDate || '';
    document.getElementById('inputModalInsuranceDate').value = insDate || '';
    document.getElementById('modalWarrantySection').style.display = 'block';
    document.getElementById('modalDocsSection').style.display = 'none';
    document.getElementById('dashEditModal').style.display = 'flex';
}

function dashOpenDocsModal(id, model, plate, inspectDate, insDate, current, zero, step) {
    activeModalVehicleId = id;
    document.getElementById('modalVehicleTitle').innerText = model;
    document.getElementById('modalVehiclePlate').innerText = plate ? `[${plate}]` : '[б/н]';
    document.getElementById('inputModalInspectionDate').value = inspectDate || '';
    document.getElementById('inputModalInsuranceDate').value = insDate || '';
    document.getElementById('inputModalCurrentHours').value = current;
    document.getElementById('inputModalZeroHours').value = zero;
    document.getElementById('inputModalStepHours').value = step;
    document.getElementById('modalDocsSection').style.display = 'block';
    document.getElementById('modalWarrantySection').style.display = 'none';
    document.getElementById('dashEditModal').style.display = 'flex';
}

function dashCloseModal() {
    document.getElementById('dashEditModal').style.display = 'none';
    activeModalVehicleId = null;
}

async function dashSaveModalData() {
    if (!activeModalVehicleId) return;
    const curHrs = parseInt(document.getElementById('inputModalCurrentHours').value) || 0;
    const zeroHrs = parseInt(document.getElementById('inputModalZeroHours').value) || 0;
    const stepHrs = parseInt(document.getElementById('inputModalStepHours').value) || 125;
    const inspectDt = document.getElementById('inputModalInspectionDate').value || null;
    const insDt = document.getElementById('inputModalInsuranceDate').value || null;

    try {
        const { error } = await window._supabase
            .from('vehicles')
            .update({
                current_hours: curHrs,
                zero_hours: zeroHrs,
                step_hours: stepHrs,
                inspection_date: inspectDt,
                insurance_date: insDt
            })
            .eq('id', activeModalVehicleId);
        if (error) throw error;
        dashCloseModal();
        await loadDashboardData();
    } catch (err) {
        alert("Ошибка сохранения: " + err.message);
    }
}

async function dashAddRepairTask() {
    const select = document.getElementById('taskVehicleSelect');
    const input = document.getElementById('taskTextInput');
    if (!input || !input.value.trim()) return;
    let vehicleId = null;
    let vehicleName = "Заметка / Пометка";
    if (select && select.value) {
        const parsed = JSON.parse(select.value);
        vehicleId = parsed.id;
        vehicleName = parsed.name;
    }
    const userRole = localStorage.getItem('user_role') || 'Сотрудник';
    const finalTaskText = `${input.value.trim()} [${userRole}]`;
    try {
        const { error } = await window._supabase.from('vehicle_tasks').insert([{
            vehicle_id: vehicleId,
            vehicle_name: vehicleName,
            text: finalTaskText,
            is_completed: false
        }]);
        if (error) throw error;
        input.value = '';
        if (select) select.value = '';
        await loadDashboardData();
    } catch (err) {
        alert("Ошибка добавления: " + err.message);
    }
}

async function dashCompleteTask(taskId) {
    try {
        const { error } = await window._supabase.from('vehicle_tasks').update({ is_completed: true }).eq('id', taskId);
        if (error) throw error;
        await loadDashboardData();
    } catch (err) {
        alert("Ошибка закрытия: " + err.message);
    }
}

function renderSeparatedAlerts(list, activeTasks) {
    const today = new Date();
    const plateMap = {};
    list.forEach(v => { plateMap[v.id] = v.plate ? `[${v.plate}]` : '[б/н]'; });
    const hiddenVehicles = JSON.parse(localStorage.getItem('dash_hidden_warranty') || '[]');

    const containerTasks = document.getElementById('containerTasks');
    if (containerTasks) {
        if (activeTasks.length > 0) {
            containerTasks.innerHTML = activeTasks.map(task => {
                const plateStr = plateMap[task.vehicle_id] || '';
                return `
                    <div style="background: rgba(251, 191, 36, 0.12); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 12px; padding: 12px; display: flex; align-items: start; justify-content: space-between; gap: 10px;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 4px;">
                                <span style="font-size: 0.72rem; font-weight: 800; color: rgba(251, 191, 36, 1); text-transform: uppercase; letter-spacing: 0.05em;">${task.vehicle_id ? '🚜 ' + task.vehicle_name : '📝 Заметка'}</span>
                                <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--subtle);">${plateStr}</span>
                            </div>
                            <p style="margin: 0; font-size: 0.84rem; font-weight: 600; color: #fff; word-break: break-word;">${task.text}</p>
                        </div>
                        <button onclick="window.dashCompleteTask('${task.id}')" class="glass-btn" style="flex-shrink: 0; min-height: 32px; padding: 6px 10px; font-size: 0.74rem; background: rgba(52, 211, 153, 0.15); border-color: var(--green); color: var(--green);">Готово</button>
                    </div>
                `;
            }).join('');
        } else {
            containerTasks.innerHTML = `<div style="background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 16px; text-align: center; font-size: 0.84rem; font-weight: 700; color: var(--green);">✅ Нет активных задач</div>`;
        }
    }

    const warrantyAlerts = [];
    const docAlerts = [];

    list.forEach(v => {
        const cleanPlate = v.plate || '';
        const plateStr = v.plate ? ` [${v.plate}]` : ' [б/н]';
        const unit = getUnitByCategory(v.type);
        const label = unit === 'км' ? 'Пробег' : 'Наработка';

        if (v.inspection_date) {
            const diff = Math.ceil((new Date(v.inspection_date) - today) / (1000 * 60 * 60 * 24));
            if (diff <= 30) {
                docAlerts.push({
                    id: v.id,
                    model: v.model,
                    plate: cleanPlate,
                    plateLabel: plateStr,
                    daysLeft: diff,
                    isCritical: diff <= 0,
                    inspectDate: v.inspection_date,
                    insDate: v.insurance_date,
                    current: v.current_hours || 0,
                    zero: v.zero_hours || 0,
                    step: v.step_hours || 125,
                    statusText: diff <= 0 ? `🛑 Просрочен Гостехосмотр!` : `⚠️ Техосмотр истекает через ${diff} дн.`
                });
            }
        }
        if (v.insurance_date) {
            const diffIns = Math.ceil((new Date(v.insurance_date) - today) / (1000 * 60 * 60 * 24));
            if (diffIns <= 30) {
                docAlerts.push({
                    id: v.id,
                    model: v.model,
                    plate: cleanPlate,
                    plateLabel: plateStr,
                    daysLeft: diffIns,
                    isCritical: diffIns <= 0,
                    inspectDate: v.inspection_date,
                    insDate: v.insurance_date,
                    current: v.current_hours || 0,
                    zero: v.zero_hours || 0,
                    step: v.step_hours || 125,
                    statusText: diffIns <= 0 ? `🛑 Закончилась страховка!` : `⚠️ Страховка истекает через ${diffIns} дн.`
                });
            }
        }

        const vehicleTagsArray = v.tags ? v.tags.split(',').map(t => t.trim()) : [];
        if (vehicleTagsArray.includes('Гарантия') && !hiddenVehicles.includes(v.id)) {
            const hours = v.current_hours || 0;
            const zeroHours = v.zero_hours || 0;
            const stepHours = v.step_hours || 125;
            const relativeHours = hours - zeroHours;
            const nextTO = zeroHours + (Math.ceil((relativeHours + 1) / stepHours) * stepHours);
            const hoursLeft = nextTO - hours;

            let status = 'info';
            let statusText = `⚙️ ${label} ${hours} ${unit}. До ТО (${nextTO} ${unit}) ещё <b>${hoursLeft} ${unit}</b>.`;
            if (hoursLeft <= 50) {
                status = 'danger';
                statusText = `🚨 <span style="color: var(--red); font-weight: 800;">Срочно ТО (${nextTO} ${unit})!</span> Осталось <b>${hoursLeft} ${unit}</b>.`;
            } else if (hoursLeft <= 100) {
                status = 'warning';
                statusText = `⚠️ Срок ТО (${nextTO} ${unit}). Осталось <b>${hoursLeft} ${unit}</b>.`;
            }

            warrantyAlerts.push({
                id: v.id,
                status: status,
                hoursLeft: hoursLeft,
                model: v.model,
                plate: cleanPlate,
                plateLabel: plateStr,
                hours: hours,
                zeroHours: zeroHours,
                stepHours: stepHours,
                inspectDate: v.inspection_date,
                insDate: v.insurance_date,
                text: statusText,
                unit: unit,
                label: label
            });
        }
    });

    warrantyAlerts.sort((a, b) => a.hoursLeft - b.hoursLeft);
    docAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    const containerWarranty = document.getElementById('containerWarranty');
    if (containerWarranty) {
        if (warrantyAlerts.length === 0) {
            containerWarranty.innerHTML = `<div style="background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 16px; text-align: center; font-size: 0.84rem; font-weight: 700; color: var(--green);">✅ Нет техники на контроле</div>`;
        } else {
            containerWarranty.innerHTML = warrantyAlerts.map(a => {
                let cardBg = 'rgba(125, 211, 252, 0.08)';
                let cardBorder = 'rgba(125, 211, 252, 0.3)';
                let textColor = 'var(--blue)';
                if (a.status === 'danger') {
                    cardBg = 'rgba(251, 113, 133, 0.1)';
                    cardBorder = 'rgba(251, 113, 133, 0.4)';
                    textColor = 'var(--red)';
                } else if (a.status === 'warning') {
                    cardBg = 'rgba(251, 191, 36, 0.1)';
                    cardBorder = 'rgba(251, 191, 36, 0.4)';
                    textColor = 'var(--amber)';
                }
                return `
                    <div style="background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 12px; padding: 12px; display: flex; align-items: start; justify-content: space-between; gap: 10px;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 4px;">
                                <span style="font-size: 0.84rem; font-weight: 800; color: ${textColor};">${a.model}</span>
                                <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--subtle);">${a.plateLabel}</span>
                            </div>
                            <p style="margin: 0; font-size: 0.82rem; font-weight: 500; color: var(--muted);">${a.text}</p>
                        </div>
                        <button onclick="window.dashOpenWarrantyModal(${a.id}, '${a.model.replace(/'/g, "\\'")}', '${a.plate}', ${a.hours}, ${a.zeroHours}, ${a.stepHours}, '${a.inspectDate || ''}', '${a.insDate || ''}')" style="flex-shrink: 0; border: none; background: rgba(255,255,255,0.08); border-radius: 8px; padding: 6px; color: var(--muted); cursor: pointer; font-size: 1rem; transition: all 150ms ease;" onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.color='#fff'" onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.color='var(--muted)'" title="Изменить параметры">✏️</button>
                    </div>
                `;
            }).join('');
        }
    }

    const containerDocs = document.getElementById('containerDocs');
    if (containerDocs) {
        if (docAlerts.length === 0) {
            containerDocs.innerHTML = `<div style="background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 16px; text-align: center; font-size: 0.84rem; font-weight: 700; color: var(--green);">✅ Все документы в порядке!</div>`;
        } else {
            containerDocs.innerHTML = docAlerts.map(d => {
                const cardBg = d.isCritical ? 'rgba(251, 113, 133, 0.1)' : 'rgba(251, 191, 36, 0.1)';
                const cardBorder = d.isCritical ? 'rgba(251, 113, 133, 0.4)' : 'rgba(251, 191, 36, 0.4)';
                const textColor = d.isCritical ? 'var(--red)' : 'var(--amber)';
                return `
                    <div style="background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 12px; padding: 12px; display: flex; align-items: start; justify-content: space-between; gap: 10px;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 4px;">
                                <span style="font-size: 0.84rem; font-weight: 800; color: ${textColor};">${d.model}</span>
                                <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--subtle);">${d.plateLabel}</span>
                            </div>
                            <p style="margin: 0; font-size: 0.82rem; font-weight: 500; color: var(--muted);">${d.statusText}</p>
                        </div>
                        <button onclick="window.dashOpenDocsModal(${d.id}, '${d.model.replace(/'/g, "\\'")}', '${d.plate}', '${d.inspectDate || ''}', '${d.insDate || ''}', ${d.current}, ${d.zero}, ${d.step})" style="flex-shrink: 0; border: none; background: rgba(255,255,255,0.08); border-radius: 8px; padding: 6px; color: var(--muted); cursor: pointer; font-size: 1rem; transition: all 150ms ease;" onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.color='#fff'" onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.color='var(--muted)'" title="Изменить даты">✏️</button>
                    </div>
                `;
            }).join('');
        }
    }
}
