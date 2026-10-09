// Проверка авторизации
if (!checkModuleAuth()) {
    window.location.href = '/';
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
    window.CommonUtils.logout();
}

// Загрузить дашборд при старте
loadPage('dashboard');
