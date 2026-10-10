// Инициализация авторизации
async function initAuth() {
    if (window.AuthModule && typeof window.AuthModule.initialize === 'function') {
        await window.AuthModule.initialize();
    }
}

// Проверка авторизации (старая функция для совместимости)
function checkModuleAuth() {
    const user = window.CommonUtils.getCurrentUser();
    if (!user) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Навигация
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        loadPage(page);
    });
});

function loadPage(page) {
    const content = document.getElementById('main-content');
    
    switch(page) {
        case 'dashboard':
            AgroDashboard.render(content);
            break;
        case 'fields':
            AgroFields.render(content);
            break;
        case 'crops':
            AgroCrops.render(content);
            break;
    }
}

function logout() {
    db.auth.signOut();
    localStorage.removeItem('velpol_user');
    localStorage.removeItem('velpol_module');
    window.location.href = '/';
}

// Запуск приложения
initAuth().then(() => {
    if (window.AuthModule && window.AuthModule.session) {
        loadPage('dashboard');
    }
});

