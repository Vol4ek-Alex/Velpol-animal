(function () {
    'use strict';

    let refreshIntervalId = null;
    let clockIntervalId = null;
    let activeModalVehicleId = null;
    let vehicles = [];
    let tasks = [];

    function getUnitByCategory(type) {
        if (!type) return 'м/ч';
        const lower = String(type).toLowerCase();
        const carKeywords = [
            'легков', 'грузов', 'грузопассажир', 'автобус',
            'микроавтобус', 'пикап', 'фургон', 'тягач', 'седельный'
        ];
        for (let kw of carKeywords) {
            if (lower.includes(kw)) return 'км';
        }
        return 'м/ч';
    }

    function esc(value) {
        return window.escapeHtml(value);
    }

    window.MechDashboardModule = {
        async render() {
            const container =
                document.getElementById('main-content');

            container.innerHTML = `
                <div class="mech-toolbar" style="margin-bottom:15px;">
                    <div class="glass-panel" style="flex:1 1 auto;padding:15px 18px;">
                        <h1 style="margin:0;font-size:1.3rem;font-weight:800;color:#fff;">
                            📊 Статистика
                        </h1>
                        <p style="margin:4px 0 0;color:var(--muted);font-size:0.8rem;font-weight:600;">
                            Оперативная сводка по технике СХК «Великополье»
                        </p>
                    </div>

                    <div class="glass-panel mech-clock">
                        <span style="font-size:1.3rem;">⏰</span>
                        <div>
                            <div class="time" id="mechLiveTime">00:00:00</div>
                            <div class="date" id="mechLiveDate">…</div>
                        </div>
                    </div>
                </div>

                <div class="mech-grid cols-4">
                    <div class="glass-panel stat-card">
                        <div class="stat-header"><span>🚜 Автопарк</span></div>
                        <div class="stat-value" id="mechDashTotal">0</div>
                        <span class="mech-hint">ед. техники</span>
                    </div>

                    <div class="glass-panel stat-card">
                        <div class="stat-header"><span>✅ Готово</span></div>
                        <div class="stat-value" id="mechDashReady">0</div>
                        <span class="mech-hint">к работе</span>
                    </div>

                    <div class="glass-panel stat-card">
                        <div class="stat-header"><span>🏠 Хранение</span></div>
                        <div class="stat-value" id="mechDashStorage">0</div>
                        <span class="mech-hint">на хранении</span>
                    </div>

                    <div class="glass-panel stat-card">
                        <div class="stat-header"><span>🔧 Ремонт</span></div>
                        <div class="stat-value" id="mechDashInRepair">0</div>
                        <span class="mech-hint">в ремонте</span>
                    </div>
                </div>

                <div class="mech-grid cols-3">
                    <div class="glass-panel" style="padding:16px;">
                        <div class="mech-panel-head">
                            <div class="mech-panel-title">📋 Задачи</div>
                            <span class="mech-counter" id="mechTaskCounter">0</span>
                        </div>

                        <select id="mechTaskVehicleSelect" class="mech-select" style="width:100%;margin-bottom:9px;">
                            <option value="">-- Общая заметка --</option>
                        </select>

                        <div class="mech-input-row" style="margin-bottom:11px;">
                            <input
                                type="text"
                                id="mechTaskTextInput"
                                class="mech-search"
                                placeholder="Текст задачи..."
                            >
                            <button
                                type="button"
                                class="glass-btn primary"
                                onclick="MechDashboardModule.addRepairTask()"
                            >＋</button>
                        </div>

                        <div class="mech-scroll" id="mechContainerTasks">
                            <div class="mech-empty">Загрузка...</div>
                        </div>
                    </div>

                    <div class="glass-panel" style="padding:16px;">
                        <div class="mech-panel-head">
                            <div class="mech-panel-title">🛠️ ТО / Гарантия</div>
                            <button
                                type="button"
                                class="glass-btn"
                                style="min-height:32px;padding:5px 10px;font-size:0.72rem;"
                                onclick="MechDashboardModule.toggleFilterDropdown(event)"
                            >⚙️ Фильтр</button>
                        </div>

                        <div
                            id="mechFilterDropdown"
                            class="glass-panel"
                            style="
                                display:none;
                                position:absolute;
                                top:64px;
                                right:16px;
                                z-index:600;
                                width:min(280px, calc(100vw - 40px));
                                padding:13px;
                            "
                        >
                            <div class="mech-row" style="margin-bottom:8px;">
                                <span class="mech-section-label" style="margin:0;">Отображать</span>
                                <button
                                    type="button"
                                    class="glass-btn"
                                    style="min-height:28px;padding:3px 9px;font-size:0.68rem;border-color:var(--green-dark);color:var(--green);"
                                    onclick="MechDashboardModule.resetFilter()"
                                >Показать все</button>
                            </div>
                            <div id="mechFilterCheckboxes" style="display:flex;flex-direction:column;gap:5px;"></div>
                        </div>

                        <div class="mech-scroll" id="mechContainerWarranty">
                            <div class="mech-empty">Загрузка...</div>
                        </div>
                    </div>

                    <div class="glass-panel" style="padding:16px;">
                        <div class="mech-panel-head">
                            <div class="mech-panel-title">📄 Документы</div>
                        </div>

                        <div class="mech-scroll" id="mechContainerDocs">
                            <div class="mech-empty">Загрузка...</div>
                        </div>
                    </div>
                </div>

                <div class="glass-panel" style="padding:16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:1.4rem;">📌</span>
                        <div>
                            <div style="color:#fff;font-size:0.86rem;font-weight:800;">
                                Необходимо внести комплексные изменения?
                            </div>
                            <div style="color:var(--muted);font-size:0.76rem;font-weight:600;">
                                Перейдите в раздел Автопарк для редактирования карточек
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="glass-btn primary"
                        onclick="navigate('fleet', document.querySelector('.menu-item:nth-child(2)'))"
                    >Перейти в Автопарк ➔</button>
                </div>

                <div id="mechDashEditModal" class="modal-overlay">
                    <div class="modal-box">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                            <div>
                                <h4 id="mechModalVehicleTitle" style="margin:0;color:#fff;font-size:1.02rem;font-weight:800;">—</h4>
                                <p id="mechModalVehiclePlate" style="margin:2px 0 0;color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:0.8rem;">[б/н]</p>
                            </div>
                            <button type="button" class="modal-close-x" onclick="MechDashboardModule.closeModal()">✕</button>
                        </div>

                        <div id="mechModalWarrantySection" style="display:none;margin-top:14px;flex-direction:column;gap:12px;">
                            <div>
                                <label class="modal-label">Текущая наработка</label>
                                <input type="number" id="mechInputCurrentHours" class="modal-input">
                            </div>
                            <div class="mech-form-grid">
                                <div>
                                    <label class="modal-label">Нулевая база</label>
                                    <input type="number" id="mechInputZeroHours" class="modal-input">
                                </div>
                                <div>
                                    <label class="modal-label">Периодичность</label>
                                    <input type="number" id="mechInputStepHours" class="modal-input">
                                </div>
                            </div>
                        </div>

                        <div id="mechModalDocsSection" style="display:none;margin-top:14px;flex-direction:column;gap:12px;">
                            <div>
                                <label class="modal-label">Техосмотр до</label>
                                <input type="date" id="mechInputInspectionDate" class="modal-input">
                            </div>
                            <div>
                                <label class="modal-label">Страховка до</label>
                                <input type="date" id="mechInputInsuranceDate" class="modal-input">
                            </div>
                        </div>

                        <button
                            type="button"
                            class="glass-btn primary"
                            style="width:100%;margin-top:16px;"
                            onclick="MechDashboardModule.saveModalData()"
                        >Сохранить изменения</button>
                    </div>
                </div>
            `;

            this.bindEvents();
            this.startClock();
            await this.loadData(true);

            if (refreshIntervalId) clearInterval(refreshIntervalId);
            refreshIntervalId = setInterval(() => this.loadData(false), 8000);
        },

        stopTimers() {
            if (refreshIntervalId) clearInterval(refreshIntervalId);
            if (clockIntervalId) clearInterval(clockIntervalId);
            refreshIntervalId = null;
            clockIntervalId = null;
        },

        bindEvents() {
            document.addEventListener('click', (e) => {
                const drop = document.getElementById('mechFilterDropdown');
                if (
                    drop &&
                    drop.style.display !== 'none' &&
                    !drop.contains(e.target) &&
                    !e.target.closest('[onclick*="toggleFilterDropdown"]')
                ) {
                    drop.style.display = 'none';
                }
            });
        },

        startClock() {
            this.stopTimers();
            const update = () => {
                const now = new Date();
                const timeEl = document.getElementById('mechLiveTime');
                const dateEl = document.getElementById('mechLiveDate');
                if (timeEl) timeEl.innerText = now.toLocaleTimeString('ru-RU');
                if (dateEl) {
                    const options = {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    };
                    dateEl.innerText = now
                        .toLocaleDateString('ru-RU', options)
                        .replace('.', '');
                }
            };
            update();
            clockIntervalId = setInterval(update, 1000);
        },

        async loadData() {
            if (!window.db) return;
            try {
                const [vehiclesRes, tasksRes] = await Promise.all([
                    db.from('vehicles').select('*'),
                    db.from('vehicle_tasks').select('*').eq('is_completed', false)
                ]);

                if (vehiclesRes.error) throw vehiclesRes.error;
                if (tasksRes.error) throw tasksRes.error;

                vehicles = vehiclesRes.data || [];
                tasks = tasksRes.data || [];

                this.renderStats(vehicles);
                this.populateVehicleDropdown(vehicles);
                this.renderFilterCheckboxes(vehicles);
                this.renderAlerts(vehicles, tasks);

                const counter = document.getElementById('mechTaskCounter');
                if (counter) counter.innerText = tasks.length;
            } catch (err) {
                console.error('Ошибка обновления дашборда механизации:', err.message);
            }
        },

        renderStats(list) {
            const stats = {
                mechDashTotal: list.length,
                mechDashReady: list.filter(v => v.tags && v.tags.includes('Готов')).length,
                mechDashStorage: list.filter(v => v.tags && v.tags.includes('На хранении')).length,
                mechDashInRepair: list.filter(v => v.tags && v.tags.includes('В ремонте')).length
            };
            for (const [id, value] of Object.entries(stats)) {
                const el = document.getElementById(id);
                if (el) el.innerText = value;
            }
        },

        populateVehicleDropdown(list) {
            const select = document.getElementById('mechTaskVehicleSelect');
            if (!select || select.options.length > 1) return;
            const sorted = [...list].sort((a, b) =>
                String(a.model || '').localeCompare(String(b.model || ''))
            );
            sorted.forEach(v => {
                const opt = document.createElement('option');
                opt.value = JSON.stringify({ id: v.id, name: v.model });
                opt.innerText = `${v.model} ${v.plate ? '[' + v.plate + ']' : '[б/н]'}`;
                select.appendChild(opt);
            });
        },

        toggleFilterDropdown(e) {
            e.stopPropagation();
            const drop = document.getElementById('mechFilterDropdown');
            if (drop) {
                drop.style.display =
                    drop.style.display === 'none' ? 'block' : 'none';
            }
        },

        renderFilterCheckboxes(list) {
            const container = document.getElementById('mechFilterCheckboxes');
            if (!container) return;

            const hidden = JSON.parse(
                localStorage.getItem('mech_hidden_warranty') || '[]'
            );

            const warranty = list.filter(v => {
                const tags = v.tags
                    ? v.tags.split(',').map(t => t.trim())
                    : [];
                return tags.includes('Гарантия');
            });

            if (warranty.length === 0) {
                container.innerHTML =
                    '<div class="mech-hint" style="text-align:center;">Нет гарантийной техники</div>';
                return;
            }

            warranty.sort((a, b) =>
                String(a.model || '').localeCompare(String(b.model || ''))
            );

            container.innerHTML = warranty.map(v => `
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--text);font-size:0.78rem;font-weight:600;">
                    <input
                        type="checkbox"
                        ${hidden.includes(v.id) ? '' : 'checked'}
                        onchange="MechDashboardModule.toggleVisibility(${v.id}, this.checked)"
                        style="accent-color:#10b981;"
                    >
                    <span>${esc(v.model)} ${v.plate ? '(' + esc(v.plate) + ')' : '(б/н)'}</span>
                </label>
            `).join('');
        },

        toggleVisibility(vehicleId, isChecked) {
            let hidden = JSON.parse(
                localStorage.getItem('mech_hidden_warranty') || '[]'
            );
            if (isChecked) {
                hidden = hidden.filter(id => id !== vehicleId);
            } else if (!hidden.includes(vehicleId)) {
                hidden.push(vehicleId);
            }
            localStorage.setItem(
                'mech_hidden_warranty',
                JSON.stringify(hidden)
            );
            this.renderAlerts(vehicles, tasks);
        },

        resetFilter() {
            localStorage.removeItem('mech_hidden_warranty');
            this.renderFilterCheckboxes(vehicles);
            this.renderAlerts(vehicles, tasks);
        },

        async addRepairTask() {
            const select = document.getElementById('mechTaskVehicleSelect');
            const input = document.getElementById('mechTaskTextInput');

            if (!input || !input.value.trim()) return;

            let vehicleId = null;
            let vehicleName = 'Заметка / Пометка';

            if (select && select.value) {
                const parsed = JSON.parse(select.value);
                vehicleId = parsed.id;
                vehicleName = parsed.name;
            }

            const userRole =
                (window.AuthModule &&
                    window.AuthModule.profile &&
                    window.AuthModule.profile.full_name) ||
                'Сотрудник';

            try {
                const { error } = await db.from('vehicle_tasks').insert([{
                    vehicle_id: vehicleId,
                    vehicle_name: vehicleName,
                    text: `${input.value.trim()} [${userRole}]`,
                    is_completed: false
                }]);
                if (error) throw error;
                input.value = '';
                if (select) select.value = '';
                await this.loadData();
            } catch (err) {
                alert('Ошибка добавления: ' + err.message);
            }
        },

        async completeTask(taskId) {
            try {
                const { error } = await db
                    .from('vehicle_tasks')
                    .update({ is_completed: true })
                    .eq('id', taskId);
                if (error) throw error;
                await this.loadData();
            } catch (err) {
                alert('Ошибка закрытия: ' + err.message);
            }
        },

        openWarrantyModal(v) {
            activeModalVehicleId = v.id;

            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val ?? '';
            };

            document.getElementById('mechModalVehicleTitle').innerText = v.model || '';
            document.getElementById('mechModalVehiclePlate').innerText =
                v.plate ? `[${v.plate}]` : '[б/н]';
            setVal('mechInputCurrentHours', v.current_hours || 0);
            setVal('mechInputZeroHours', v.zero_hours || 0);
            setVal('mechInputStepHours', v.step_hours || 125);
            setVal('mechInputInspectionDate', v.inspection_date);
            setVal('mechInputInsuranceDate', v.insurance_date);

            document.getElementById('mechModalWarrantySection').style.display = 'flex';
            document.getElementById('mechModalDocsSection').style.display = 'none';
            document.getElementById('mechDashEditModal').classList.add('open');
        },

        openDocsModal(v) {
            activeModalVehicleId = v.id;

            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val ?? '';
            };

            document.getElementById('mechModalVehicleTitle').innerText = v.model || '';
            document.getElementById('mechModalVehiclePlate').innerText =
                v.plate ? `[${v.plate}]` : '[б/н]';
            setVal('mechInputInspectionDate', v.inspection_date);
            setVal('mechInputInsuranceDate', v.insurance_date);
            setVal('mechInputCurrentHours', v.current_hours || 0);
            setVal('mechInputZeroHours', v.zero_hours || 0);
            setVal('mechInputStepHours', v.step_hours || 125);

            document.getElementById('mechModalDocsSection').style.display = 'flex';
            document.getElementById('mechModalWarrantySection').style.display = 'none';
            document.getElementById('mechDashEditModal').classList.add('open');
        },

        closeModal() {
            const modal = document.getElementById('mechDashEditModal');
            if (modal) modal.classList.remove('open');
            activeModalVehicleId = null;
        },

        async saveModalData() {
            if (!activeModalVehicleId) return;

            const val = (id) => document.getElementById(id).value;

            try {
                const { error } = await db
                    .from('vehicles')
                    .update({
                        current_hours: parseInt(val('mechInputCurrentHours')) || 0,
                        zero_hours: parseInt(val('mechInputZeroHours')) || 0,
                        step_hours: parseInt(val('mechInputStepHours')) || 125,
                        inspection_date: val('mechInputInspectionDate') || null,
                        insurance_date: val('mechInputInsuranceDate') || null
                    })
                    .eq('id', activeModalVehicleId);

                if (error) throw error;
                this.closeModal();
                await this.loadData();
            } catch (err) {
                alert('Ошибка сохранения: ' + err.message);
            }
        },

        renderAlerts(list, activeTasks) {
            const today = new Date();
            const plateMap = {};
            list.forEach(v => {
                plateMap[v.id] = v.plate ? `[${v.plate}]` : '[б/н]';
            });
            const hidden = JSON.parse(
                localStorage.getItem('mech_hidden_warranty') || '[]'
            );

            const containerTasks = document.getElementById('mechContainerTasks');
            if (containerTasks) {
                if (activeTasks.length > 0) {
                    containerTasks.innerHTML = activeTasks.map(task => `
                        <div class="mech-alert warning">
                            <div style="flex:1 1 auto;min-width:0;">
                                <div class="sub">
                                    ${task.vehicle_id
                                        ? '🚜 ' + esc(task.vehicle_name)
                                        : '📝 Заметка'}
                                    ${plateMap[task.vehicle_id] || ''}
                                </div>
                                <div class="text">${esc(task.text)}</div>
                            </div>
                            <button
                                type="button"
                                class="glass-btn"
                                style="min-height:30px;padding:4px 10px;font-size:0.7rem;border-color:var(--green-dark);color:var(--green);"
                                onclick="MechDashboardModule.completeTask('${task.id}')"
                            >Готово</button>
                        </div>
                    `).join('');
                } else {
                    containerTasks.innerHTML =
                        '<div class="mech-alert ok"><div class="text">✅ Нет активных задач</div></div>';
                }
            }

            const warrantyAlerts = [];
            const docAlerts = [];

            list.forEach(v => {
                const unit = getUnitByCategory(v.type);
                const label = unit === 'км' ? 'Пробег' : 'Наработка';
                const plateStr = v.plate ? ` [${v.plate}]` : ' [б/н]';

                if (v.inspection_date) {
                    const diff = Math.ceil(
                        (new Date(v.inspection_date) - today) /
                            (1000 * 60 * 60 * 24)
                    );
                    if (diff <= 30) {
                        docAlerts.push({
                            vehicle: v,
                            daysLeft: diff,
                            isCritical: diff <= 0,
                            statusText: diff <= 0
                                ? '🛑 Просрочен техосмотр!'
                                : `⚠️ Техосмотр истекает через ${diff} дн.`
                        });
                    }
                }

                if (v.insurance_date) {
                    const diffIns = Math.ceil(
                        (new Date(v.insurance_date) - today) /
                            (1000 * 60 * 60 * 24)
                    );
                    if (diffIns <= 30) {
                        docAlerts.push({
                            vehicle: v,
                            daysLeft: diffIns,
                            isCritical: diffIns <= 0,
                            statusText: diffIns <= 0
                                ? '🛑 Закончилась страховка!'
                                : `⚠️ Страховка истекает через ${diffIns} дн.`
                        });
                    }
                }

                const tags = v.tags
                    ? v.tags.split(',').map(t => t.trim())
                    : [];

                if (tags.includes('Гарантия') && !hidden.includes(v.id)) {
                    const hours = v.current_hours || 0;
                    const zeroHours = v.zero_hours || 0;
                    const stepHours = v.step_hours || 125;
                    const relativeHours = hours - zeroHours;
                    const nextTO =
                        zeroHours +
                        Math.ceil((relativeHours + 1) / stepHours) * stepHours;
                    const hoursLeft = nextTO - hours;

                    let status = 'info';
                    let statusText =
                        `⚙️ ${label} ${hours} ${unit}. До ТО (${nextTO} ${unit}) ещё <b>${hoursLeft} ${unit}</b>.`;
                    if (hoursLeft <= 50) {
                        status = 'danger';
                        statusText =
                            `🚨 Срочно ТО (${nextTO} ${unit})! Осталось <b>${hoursLeft} ${unit}</b>.`;
                    } else if (hoursLeft <= 100) {
                        status = 'warning';
                        statusText =
                            `⚠️ Срок ТО (${nextTO} ${unit}). Осталось <b>${hoursLeft} ${unit}</b>.`;
                    }

                    warrantyAlerts.push({
                        vehicle: v,
                        status,
                        hoursLeft,
                        statusText
                    });
                }
            });

            warrantyAlerts.sort((a, b) => a.hoursLeft - b.hoursLeft);
            docAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

            const containerWarranty = document.getElementById('mechContainerWarranty');
            if (containerWarranty) {
                if (warrantyAlerts.length === 0) {
                    containerWarranty.innerHTML =
                        '<div class="mech-alert ok"><div class="text">✅ Нет техники на контроле</div></div>';
                } else {
                    containerWarranty.innerHTML = warrantyAlerts.map(a => {
                        const cls =
                            a.status === 'danger'
                                ? 'danger'
                                : a.status === 'warning'
                                    ? 'warning'
                                    : '';
                        return `
                            <div class="mech-alert ${cls}">
                                <div style="flex:1 1 auto;min-width:0;">
                                    <div class="sub">
                                        ${esc(a.vehicle.model)}${a.vehicle.plate ? ' [' + esc(a.vehicle.plate) + ']' : ' [б/н]'}
                                    </div>
                                    <div class="text">${a.statusText}</div>
                                </div>
                                <button
                                    type="button"
                                    class="glass-btn"
                                    style="min-height:30px;padding:4px 9px;font-size:0.74rem;"
                                    onclick="MechDashboardModule.openWarrantyModalById(${a.vehicle.id})"
                                    title="Изменить параметры"
                                >✏️</button>
                            </div>
                        `;
                    }).join('');
                }
            }

            const containerDocs = document.getElementById('mechContainerDocs');
            if (containerDocs) {
                if (docAlerts.length === 0) {
                    containerDocs.innerHTML =
                        '<div class="mech-alert ok"><div class="text">✅ Все документы в порядке!</div></div>';
                } else {
                    containerDocs.innerHTML = docAlerts.map(d => `
                        <div class="mech-alert ${d.isCritical ? 'danger' : 'warning'}">
                            <div style="flex:1 1 auto;min-width:0;">
                                <div class="sub">
                                    ${esc(d.vehicle.model)}${d.vehicle.plate ? ' [' + esc(d.vehicle.plate) + ']' : ' [б/н]'}
                                </div>
                                <div class="text">${d.statusText}</div>
                            </div>
                            <button
                                type="button"
                                class="glass-btn"
                                style="min-height:30px;padding:4px 9px;font-size:0.74rem;"
                                onclick="MechDashboardModule.openDocsModalById(${d.vehicle.id})"
                                title="Изменить даты"
                            >✏️</button>
                        </div>
                    `).join('');
                }
            }
        },

        openWarrantyModalById(id) {
            const v = vehicles.find(x => x.id === id);
            if (v) this.openWarrantyModal(v);
        },

        openDocsModalById(id) {
            const v = vehicles.find(x => x.id === id);
            if (v) this.openDocsModal(v);
        }
    };
})();
