let currentUser = null;
let currentTab = 'requests';

async function checkAdminAccess() {
    const { data: { session }, error } = await db.auth.getSession();
    
    if (error || !session) {
        window.location.href = '../index.html';
        return false;
    }

    currentUser = session.user;

    const { data: accessData, error: accessError } = await db
        .from('module_access')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('module_name', 'admin')
        .eq('has_access', true)
        .maybeSingle();

    if (accessError || !accessData) {
        alert('У вас нет прав администратора');
        window.location.href = '../index.html';
        return false;
    }

    return true;
}

async function loadRequests() {
    const { data: accounts, error } = await db
        .from('account_verification')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading verification:', error);
        const container = document.getElementById('requests-container');
        document.getElementById('loading').style.display = 'none';
        if (container) {
            container.innerHTML = `
                <div class="request-card">
                    <p style="color:#fb7185;">Не удалось загрузить верификацию: ${escapeHtml(error.message)}</p>
                </div>
            `;
        }
        return;
    }

    document.getElementById('loading').style.display = 'none';

    const container = document.getElementById('requests-container');
    if (!container) return;

    if (!accounts || accounts.length === 0) {
        container.innerHTML = '';
        document.getElementById('no-requests').style.display = 'block';
        return;
    }

    document.getElementById('no-requests').style.display = 'none';

    container.innerHTML = accounts.map(acc => `
        <div class="request-card">
            <div class="request-header">
                <div class="request-info">
                    <h3>${escapeHtml(acc.full_name || 'Без имени')}</h3>
                    ${acc.email ? `<p>📧 ${escapeHtml(acc.email)}</p>` : ''}
                    <p>📅 Регистрация: ${new Date(acc.created_at).toLocaleString('ru-RU')}</p>
                </div>
                <div class="status-badge status-${acc.status}">
                    ${getVerificationStatusText(acc.status)}
                </div>
            </div>
            <div class="request-actions">
                    <button class="btn btn-approve" onclick="handleVerify('${acc.user_id}')">
                        ✅ Подтвердить аккаунт
                    </button>
                    <button class="btn btn-reject" onclick="handleRejectAccount('${acc.user_id}', '${escapeHtml(acc.full_name || '')}')">
                        🗑 Удалить из базы
                    </button>
                </div>
        </div>
    `).join('');
}

function getVerificationStatusText(status) {
    const texts = {
        'pending': '⏳ Ожидает подтверждения',
        'approved': '✅ Подтверждён',
        'rejected': '❌ Отклонён'
    };
    return texts[status] || status;
}

async function handleVerify(userId) {
    if (!confirm('Подтвердить аккаунт?')) return;

    try {
        const { error } = await db.rpc('admin_verify_account', {
            p_user_id: userId
        });

        if (error) throw error;

        alert('✅ Аккаунт подтверждён!');
        loadRequests();
    } catch (error) {
        console.error('Verify error:', error);
        alert('Ошибка: ' + error.message);
    }
}

async function handleRejectAccount(userId, fullName) {
    if (!confirm('Удалить аккаунт ' + (fullName || 'пользователя') + ' из базы?\n\nДоступы и профиль будут удалены безвозвратно.')) return;

    try {
        const { error } = await db.rpc('admin_reject_account', {
            p_user_id: userId
        });

        if (error) throw error;

        alert('🗑 Аккаунт удалён из базы');
        loadRequests();
        loadUsers();
    } catch (error) {
        console.error('Reject account error:', error);
        alert('Ошибка: ' + error.message);
    }
}

let usersSearchQuery = '';
let usersData = [];

async function loadUsers() {
    const { data: users, error } = await db.rpc('admin_get_users_with_access');

    /*
     * П.2: секция показывается только если
     * вкладка «Доступы» активна — иначе после
     * загрузки видны все три вкладки сразу.
     */
    if (currentTab === 'users') {
        document.getElementById('users-section').style.display = 'block';
    }

    const container = document.getElementById('users-container');

    if (error) {
        console.error('Error loading users:', error);
        container.innerHTML = `
            <div class="request-card">
                <p style="color:#fb7185;">Не удалось загрузить пользователей: ${error.message}</p>
                <p style="color:#cbd5e1; font-size:.85rem;">Выполните docs/fix-admin-panel.sql в Supabase SQL Editor.</p>
            </div>
        `;
        return;
    }

    usersData = users || [];
    renderUsers();
}

function renderUsers() {
    const container = document.getElementById('users-container');

    const query = usersSearchQuery.trim().toLowerCase();
    const users = usersData.filter(user => {
        if (!query) return true;

        const fullName = String(user.full_name || '').toLowerCase();
        const login = String(user.login || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();

        return (
            fullName.includes(query) ||
            login.includes(query) ||
            email.includes(query)
        );
    });

    if (users.length === 0) {
        if (!usersData.length) {
            container.innerHTML = `
                <div class="request-card no-requests">
                    <h2>📭 Пользователей нет</h2>
                    <p>Профили появятся после первого входа пользователей в систему</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="request-card no-requests">
                    <h2>🔍 Ничего не найдено</h2>
                    <p>По запросу «${escapeHtml(query)}» нет совпадений</p>
                </div>
            `;
        }
        return;
    }

    container.innerHTML = users.map(user => {
        const access = user.access || [];

        // Гранулярные уровни доступа
        const level = {
            livestock: access.includes('livestock')
                ? (access.includes('livestock_edit') ? 'edit' : 'view')
                : 'none',
            mechanization: access.includes('mechanization')
                ? (access.includes('mechanization_edit') ? 'edit' : 'view')
                : 'none',
            agronomy: access.includes('agronomy') ? 'view' : 'none',
            admin: access.includes('admin')
        };

        const moduleSelect = (moduleName, options) => `
            <label class="access-select-wrapper">
                <span class="access-select-label">${getModuleName(moduleName)}</span>
                <select class="access-select"
                    onchange="handleModuleLevel('${user.id}', '${moduleName}', this.value, this)"
                    ${user.id === currentUser.id && moduleName === 'admin' ? 'disabled title="Нельзя изменить свои права администратора"' : ''}>
                    ${options.map(opt => `
                        <option value="${opt.value}" ${level[moduleName] === opt.value ? 'selected' : ''}>
                            ${opt.label}
                        </option>
                    `).join('')}
                </select>
            </label>
        `;

        return `
            <div class="request-card user-card ${user.is_blocked ? 'is-blocked' : ''}">
                <div class="user-info">
                    <h3>${escapeHtml(user.full_name || 'Без имени')}${user.is_blocked ? ' 🚫' : ''}</h3>
                    <p>👤 ${escapeHtml(user.login || '—')}${user.position ? ' · ' + escapeHtml(user.position) : ''}</p>
                    <p>Роль: ${escapeHtml(user.role || 'user')}${user.id === currentUser.id ? ' · это вы' : ''}</p>
                </div>
                <div class="user-access">
                    <label class="access-toggle access-admin">
                        <input type="checkbox"
                            ${level.admin ? 'checked' : ''}
                            onchange="handleAdminAccess('${user.id}', this.checked, this)"
                            ${user.id === currentUser.id ? 'disabled title="Нельзя снять с себя права администратора"' : ''}>
                        ⚙️ Администрирование
                    </label>

                    ${moduleSelect('livestock', [
                        { value: 'none', label: '❌ Нет доступа' },
                        { value: 'view', label: '🐄 Животноводство · просмотр' },
                        { value: 'edit', label: '🐄 Животноводство · редактирование' }
                    ])}

                    ${moduleSelect('mechanization', [
                        { value: 'none', label: '❌ Нет доступа' },
                        { value: 'view', label: '🚜 Механизация · просмотр' },
                        { value: 'edit', label: '🚜 Механизация · редактирование' }
                    ])}

                    <label class="access-toggle">
                        <input type="checkbox"
                            ${level.agronomy === 'view' ? 'checked' : ''}
                            onchange="handleModuleAccess('${user.id}', 'agronomy', this.checked, this)">
                        🌾 Агрономия
                    </label>

                    <button
                        type="button"
                        class="btn btn-reject"
                        style="grid-column: 1 / -1;"
                        onclick="handleRevokeVerification('${user.id}', '${escapeHtml(user.full_name || '')}')"
                        ${user.id === currentUser.id ? 'disabled title="Нельзя снять верификацию с себя"' : ''}
                    >
                        ↩️ Снять верификацию
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function handleUsersSearch(query) {
    usersSearchQuery = query;
    renderUsers();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function handleAdminAccess(userId, hasAccess, input) {
    input.disabled = true;

    try {
        const { error } = await db.rpc('admin_set_module_access', {
            p_user_id: userId,
            p_module_name: 'admin',
            p_has_access: hasAccess
        });

        if (error) throw error;

        // При выдаче админ-прав автоматически разрешаем
        // редактирование остальных модулей; при снятии —
        // оставляем текущие отраслевые доступы.
        await refreshUserAccess(userId);
    } catch (err) {
        console.error('Admin access error:', err);
        input.checked = !hasAccess;
        alert('Ошибка: ' + (err.message || 'не удалось изменить доступ'));
    } finally {
        input.disabled = false;
    }
}

async function handleModuleLevel(userId, moduleName, level, select) {
    select.disabled = true;

    try {
        await db.rpc('admin_set_module_access', {
            p_user_id: userId,
            p_module_name: moduleName,
            p_has_access: level !== 'none'
        });

        await db.rpc('admin_set_module_access', {
            p_user_id: userId,
            p_module_name: moduleName + '_edit',
            p_has_access: level === 'edit'
        });

        await refreshUserAccess(userId);
    } catch (err) {
        console.error('Module level error:', err);
        alert('Ошибка: ' + (err.message || 'не удалось изменить доступ'));
    } finally {
        select.disabled = false;
    }
}

async function handleModuleAccess(userId, moduleName, hasAccess, input) {
    input.disabled = true;

    try {
        const { error } = await db.rpc('admin_set_module_access', {
            p_user_id: userId,
            p_module_name: moduleName,
            p_has_access: hasAccess
        });

        if (error) throw error;

        await refreshUserAccess(userId);
    } catch (err) {
        console.error('Module access error:', err);
        input.checked = !hasAccess;
        alert('Ошибка: ' + (err.message || 'не удалось изменить доступ'));
    } finally {
        input.disabled = false;
    }
}

async function refreshUserAccess(userId) {
    const { data, error } = await db.rpc('admin_get_user_access', {
        p_user_id: userId
    });

    if (error) {
        console.error('Refresh access error:', error);
        return;
    }

    const index = usersData.findIndex(u => u.id === userId);
    if (index !== -1) {
        usersData[index].access = data || [];
        renderUsers();
    }
}

async function handleRevokeVerification(userId, fullName) {
    if (!confirm('Снять верификацию с ' + (fullName || 'пользователя') + '?\n\nВсе доступы будут отозваны, пользователь вернётся в очередь верификации.')) return;

    try {
        const { error } = await db.rpc('admin_reject_account', {
            p_user_id: userId
        });

        if (error) throw error;

        alert('🗑 Аккаунт удалён из базы');
        loadRequests();
        loadUsers();
    } catch (error) {
        console.error('Reject account error:', error);
        alert('Ошибка: ' + error.message);
    }
}

function getModuleName(name) {
    const names = {
        'livestock': '🐄 Животноводство',
        'livestock_edit': '🐄 Животноводство · редактирование',
        'agronomy': '🌾 Агрономия',
        'mechanization': '🚜 Механизация',
        'mechanization_edit': '🚜 Механизация · редактирование',
        'admin': '⚙️ Администрирование'
    };
    return names[name] || name;
}

async function loadSuggestions() {
    const { data: items, error } = await db
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });


    const section = document.getElementById('suggestions-section');
    const container = document.getElementById('suggestions-container');
    const counter = document.getElementById('suggestions-counter');

    if (error) {
        console.error('Error loading suggestions:', error);
        if (container) {
            container.innerHTML = `
                <div class="request-card">
                    <p style="color:#fb7185;">Не удалось загрузить предложения: ${escapeHtml(error.message)}</p>
                    <p style="color:#cbd5e1; font-size:.85rem;">Выполните блок «suggestions» из docs/restore-functions.sql в Supabase SQL Editor.</p>
                </div>
            `;
        }
        if (section) section.style.display = 'block';
        return;
    }

    const open = (items || []).filter(item => !item.is_done);

    if (counter) {
        counter.hidden = open.length === 0;
        counter.textContent = open.length;
    }    if (section && currentTab === 'suggestions') {
        section.style.display = 'block';
    }

    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="request-card no-requests">
                <h2>💡 Предложений пока нет</h2>
                <p>Здесь появятся идеи от пользователей приложения</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="request-card suggestion-card ${item.is_done ? 'is-blocked' : ''}">
            <div class="suggestion-body">
                <div class="suggestion-author-row">
                    <span class="suggestion-author" title="Автор предложения">👤 ${escapeHtml(item.user_name || 'Неизвестный')}</span>
                    ${item.page ? `<span class="suggestion-page">📄 ${escapeHtml(item.page)}</span>` : ''}
                </div>
                <div class="suggestion-text">${escapeHtml(item.text)}</div>
                <p class="suggestion-meta">📅 ${new Date(item.created_at).toLocaleString('ru-RU')}</p>
            </div>
            <div class="suggestion-actions">
                ${item.is_done
                    ? `<span class="status-badge status-approved">✅ Обработано</span>`
                    : `<button class="btn btn-done" onclick="markSuggestionDone('${item.id}')">✔ Обработано</button>`
                }
                <button class="btn btn-delete" onclick="deleteSuggestion('${item.id}')">🗑</button>
            </div>
        </div>
    `).join('');
}

async function markSuggestionDone(id) {
    try {
        const { error } = await db
            .from('suggestions')
            .update({ is_done: true })
            .eq('id', id);

        if (error) throw error;
        loadSuggestions();
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

async function deleteSuggestion(id) {
    if (!confirm('Удалить предложение?')) return;

    try {
        const { error } = await db
            .from('suggestions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        loadSuggestions();
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

function switchTab(tabName) {
    currentTab = tabName;

    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabName}`);
    });

    const requestsIds = ['loading', 'no-requests', 'requests-container', 'requests-section-header'];
    const usersSection = document.getElementById('users-section');
    const suggestionsSection = document.getElementById('suggestions-section');

    requestsIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });

    if (usersSection) usersSection.style.display = 'none';
    if (suggestionsSection) suggestionsSection.style.display = 'none';

    if (tabName === 'requests') {
        requestsIds.forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;

            if (id === 'loading') {
                element.style.display = 'none';
            } else if (id === 'no-requests') {
                const container =
                    document.getElementById('requests-container');
                const hasCards =
                    container && container.children.length > 0;

                element.style.display =
                    hasCards ? 'none' : 'block';
            } else {
                element.style.display =
                    id === 'requests-section-header' ? 'block' : 'grid';
            }
        });
    }

    if (tabName === 'users' && usersSection) {
        usersSection.style.display = 'block';
    }

    if (tabName === 'suggestions' && suggestionsSection) {
        suggestionsSection.style.display = 'block';
    }
}

async function handleLogout() {
    await db.auth.signOut();
    window.location.href = '../index.html';
}

checkAdminAccess().then(hasAccess => {
    if (hasAccess) {
        loadRequests();
        loadUsers();
        loadSuggestions();
        switchTab('requests');
    }
});
