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

        const { error: accessError } = await db
            .from('module_access')
            .upsert({
                user_id: userId,
                module_name: moduleName,
                has_access: true,
                updated_at: new Date().toISOString()
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

async function handleLogout() {
    await db.auth.signOut();
    window.location.href = '../index.html';
}

function getModuleName(name) {
    const names = {
        'livestock': '🐄 Животноводство',
        'agronomy': '🌾 Агрономия',
        'mechanization': '🚜 Механизация'
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
    if (hasAccess) loadRequests();
});
