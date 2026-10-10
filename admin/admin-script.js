let currentUser = null;

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
    const { data: requests, error } = await db
        .from('pending_access_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading requests:', error);
        return;
    }

    document.getElementById('loading').style.display = 'none';

    if (!requests || requests.length === 0) {
        document.getElementById('no-requests').style.display = 'block';
        return;
    }

    const container = document.getElementById('requests-container');
    container.innerHTML = requests.map(req => `
        <div class="request-card">
            <div class="request-header">
                <div class="request-info">
                    <h3>${req.user_name}</h3>
                    <p>📧 ${req.user_email}</p>
                    <p>📦 Модуль: <strong>${getModuleName(req.module_name)}</strong></p>
                    <p>📅 ${new Date(req.created_at).toLocaleString('ru-RU')}</p>
                </div>
                <div class="status-badge status-${req.status}">
                    ${getStatusText(req.status)}
                </div>
            </div>
            ${req.status === 'pending' ? `
                <div class="request-actions">
                    <button class="btn btn-approve" onclick="handleApprove('${req.id}', '${req.user_id}', '${req.module_name}')">
                        ✅ Одобрить
                    </button>
                    <button class="btn btn-reject" onclick="handleReject('${req.id}')">
                        ❌ Отклонить
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function handleApprove(requestId, userId, moduleName) {
    if (!confirm('Одобрить заявку на доступ?')) return;

    try {
        const { error: updateError } = await db
            .from('pending_access_requests')
            .update({
                status: 'approved',
                processed_at: new Date().toISOString(),
                processed_by: currentUser.id
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        const { error: accessError } = await db.rpc('admin_set_module_access', {
            p_user_id: userId,
            p_module_name: moduleName,
            p_has_access: true
        });

        if (accessError) throw accessError;

        alert('✅ Заявка одобрена!');
        loadRequests();
    } catch (error) {
        console.error('Approve error:', error);
        alert('Ошибка при одобрении: ' + error.message);
    }
}

async function handleReject(requestId) {
    if (!confirm('Отклонить заявку?')) return;

    try {
        const { error } = await db
            .from('pending_access_requests')
            .update({
                status: 'rejected',
                processed_at: new Date().toISOString(),
                processed_by: currentUser.id
            })
            .eq('id', requestId);

        if (error) throw error;

        alert('❌ Заявка отклонена');
        loadRequests();
    } catch (error) {
        console.error('Reject error:', error);
        alert('Ошибка при отклонении: ' + error.message);
    }
}

async function loadUsers() {
    const { data: users, error } = await db.rpc('admin_get_users_with_access');

    document.getElementById('users-section').style.display = 'block';

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

    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="request-card no-requests">
                <h2>📭 Пользователей нет</h2>
                <p>Профили появятся после первого входа пользователей в систему</p>
            </div>
        `;
        return;
    }

    container.innerHTML = users.map(user => {
        const access = user.access || [];
        const checkbox = (moduleName) => `
            <label class="access-toggle">
                <input type="checkbox"
                    ${access.includes(moduleName) ? 'checked' : ''}
                    onchange="handleModuleAccess('${user.id}', '${moduleName}', this.checked, this)">
                ${getModuleName(moduleName)}
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
                    ${checkbox('livestock')}
                    ${checkbox('agronomy')}
                    ${checkbox('mechanization')}
                    ${checkbox('admin')}
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
    } catch (err) {
        console.error('Module access error:', err);
        input.checked = !hasAccess;
        alert('Ошибка: ' + (err.message || 'не удалось изменить доступ'));
    } finally {
        input.disabled = false;
    }
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
    }

    if (section) section.style.display = 'block';

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
                <div class="suggestion-text">${escapeHtml(item.text)}</div>
                <p class="suggestion-meta">👤 ${escapeHtml(item.user_name || 'Неизвестный')}${item.page ? ' · 📄 ' + escapeHtml(item.page) : ''}</p>
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
    const sections = {
        requests: ['requests-container', 'no-requests', 'loading'],
        users: ['users-section'],
        suggestions: ['suggestions-section']
    };

    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabName}`);
    });

    const allSections = ['users-section', 'suggestions-section'];
    allSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });

    if (tabName === 'users') {
        document.getElementById('users-section').style.display = 'block';
    }

    if (tabName === 'suggestions') {
        document.getElementById('suggestions-section').style.display = 'block';
    }
}

async function handleLogout() {
    await db.auth.signOut();
    window.location.href = '../index.html';
}

function getModuleName(name) {
    const names = {
        'livestock': '🐄 Животноводство',
        'agronomy': '🌾 Агрономия',
        'mechanization': '🚜 Механизация',
        'admin': '⚙️ Администрирование'
    };
    return names[name] || name;
}

function getStatusText(status) {
    const texts = {
        'pending': '⏳ Ожидает',
        'approved': '✅ Одобрено',
        'rejected': '❌ Отклонено'
    };
    return texts[status] || status;
}

checkAdminAccess().then(hasAccess => {
    if (hasAccess) {
        loadRequests();
        loadUsers();
        loadSuggestions();
    }
});
