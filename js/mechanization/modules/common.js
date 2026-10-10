// Общие утилиты и функции
window.CommonUtils = {
    debounce: function(func, wait) {
        let timeout = null;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    escapeHtml: function(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    getCurrentUser: function() {
        const user = localStorage.getItem('velpol_user');
        return user ? JSON.parse(user) : null;
    },

    getCurrentModule: function() {
        return localStorage.getItem('velpol_module') || 'mech';
    },

    logout: function() {
        db.auth.signOut();
        localStorage.removeItem('velpol_user');
        localStorage.removeItem('velpol_module');
        window.location.href = '/';
    }
};

// Проверка авторизации при загрузке модуля
async function checkModuleAuth() {
    const user = window.CommonUtils.getCurrentUser();
    if (!user) {
        window.location.href = '/';
        return false;
    }
    return true;
}
