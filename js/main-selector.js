let selectedModule = null;
let authMode = 'login';
let currentUser = null;
let accessCache = null;
let profileCache = null;

function getCachedAccess() {
    try {
        const raw = localStorage.getItem('velpol_access_cache');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.expiresAt || parsed.expiresAt < Date.now()) {
            localStorage.removeItem('velpol_access_cache');
            return null;
        }
        return parsed.data || null;
    } catch (e) {
        return null;
    }
}

function setCachedAccess(data) {
    try {
        localStorage.setItem('velpol_access_cache', JSON.stringify({
            data: data,
            expiresAt: Date.now() + 5 * 60 * 1000
        }));
    } catch (e) {
        console.warn('Не удалось сохранить кэш доступов', e);
    }
}

async function checkAuth() {
    const { data } = await db.auth.getSession();

    if (data.session) {
        currentUser = data.session.user;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('modules-section').style.display = 'grid';
        document.getElementById('modules-footer').style.display = 'flex';
        document.getElementById('logout-container').style.display = 'block';

        // Проверка прав администратора — параллельно с профилем
        checkAdminAccess();
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('modules-section').style.display = 'none';
        document.getElementById('modules-footer').style.display = 'none';
        document.getElementById('logout-container').style.display = 'none';
        document.body.classList.remove('has-admin');
        accessCache = null;
        localStorage.removeItem('velpol_access_cache');
    }
}

async function loadAccessOnce() {
    if (accessCache) return accessCache;
    const cached = getCachedAccess();
    if (cached) {
        accessCache = cached;
        return cached;
    }
    if (!currentUser) return {};

    const { data, error } = await db
        .from('module_access')
        .select('module_name, has_access')
        .eq('user_id', currentUser.id)
        .eq('has_access', true);

    if (error) throw error;

    const result = {};
    (data || []).forEach(row => {
        result[row.module_name] = true;
    });

    accessCache = result;
    setCachedAccess(result);
    return result;
}

async function loadProfileOnce() {
    if (profileCache) return profileCache;
    const { data, error } = await db.rpc('get_my_profile');
    if (!error && data && data.profile) {
        profileCache = data.profile;
    }
    return profileCache;
}

async function checkAdminAccess() {
    if (!currentUser) return;

    try {
        const access = await loadAccessOnce();
        if (access.admin) {
            document.body.classList.add('has-admin');
        } else {
            document.body.classList.remove('has-admin');
        }
    } catch (error) {
        console.error('Admin access check error:', error);
    }
}

async function checkAdminAccess() {
    if (!currentUser) return;

    const { data, error } = await db
        .from('module_access')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('module_name', 'admin')
        .eq('has_access', true)
        .maybeSingle();

    if (!error && data) {
        document.body.classList.add('has-admin');
    }
}

async function handleLogout() {
    await db.auth.signOut();
    localStorage.removeItem('velpol_user');
    localStorage.removeItem('velpol_module');
    checkAuth();
}

async function selectModule(module) {
    if (module === 'agronomy') {
        return; // Модуль в разработке
    }
    selectedModule = module;

    if (module === 'admin') {
        window.location.href = 'admin/index.html';
        return;
    }

    try {
        const access = await loadAccessOnce();

        if (!access[module]) {
            alert('У вас нет доступа к данному модулю. Обратитесь к администратору.');
            return;
        }

        localStorage.setItem('velpol_user', JSON.stringify(currentUser));
        localStorage.setItem('velpol_module', module);

        const moduleUrls = {
            'livestock': 'js/livestock/index.html',
            'mechanization': 'js/mechanization/index.html'
        };

        if (moduleUrls[module]) {
            window.location.href = moduleUrls[module];
        }
    } catch (error) {
        console.error('Module access error:', error);
        alert('Произошла ошибка при проверке доступа.');
    }
}

function prefetchModule(module) {
    const urls = {
        'livestock': 'js/livestock/index.html',
        'mechanization': 'js/mechanization/index.html',
        'admin': 'admin/index.html'
    };
    const url = urls[module];
    if (!url) return;

    try {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        document.head.appendChild(link);
    } catch (e) {
        // prefetch не критичен
    }
}

function switchAuthMode(mode) {
    authMode = mode;
    const fullNameInput = document.getElementById('full-name');
    const passwordConfirm = document.getElementById('password-confirm');
    const authButton = document.getElementById('auth-button');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    clearMessages();

    if (mode === 'register') {
        fullNameInput.style.display = 'block';
        fullNameInput.required = true;
        passwordConfirm.style.display = 'block';
        passwordConfirm.required = true;
        authButton.textContent = 'Зарегистрироваться';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    } else {
        fullNameInput.style.display = 'none';
        fullNameInput.required = false;
        passwordConfirm.style.display = 'none';
        passwordConfirm.required = false;
        authButton.textContent = 'Войти';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    }
    
    updateAuthTitle();
}

function updateAuthTitle() {
    const loginTitle = document.getElementById('login-title');
    loginTitle.textContent = authMode === 'register' ? 'Регистрация' : 'Вход в систему';
}

async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    clearMessages();

    try {
        if (authMode === 'register') {
            await handleRegister(email, password);
        } else {
            await handleLogin(email, password);
        }
    } catch (error) {
        showError(error.message || 'Произошла ошибка. Попробуйте снова.');
        console.error('Auth error:', error);
    }
}

async function handleRegister(email, password) {
    const fullName = document.getElementById('full-name').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    if (password !== passwordConfirm) {
        throw new Error('Пароли не совпадают');
    }

    if (password.length < 6) {
        throw new Error('Пароль должен быть не менее 6 символов');
    }

    try {
        const { data, error } = await db.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) {
            throw new Error(`Ошибка регистрации: ${error.message}`);
        }

        showSuccess('✅ Регистрация успешна! Проверьте email для подтверждения.');
        document.getElementById('auth-form').reset();
        
        setTimeout(() => {
            document.getElementById('success-container').innerHTML = 
                '<div class="success-message">📧 Письмо отправлено! Обратитесь к администратору для получения доступа.</div>';
        }, 2000);

    } catch (error) {
        throw error;
    }
}

async function handleLogin(email, password) {
    const authButton = document.getElementById('auth-button');
    if (authButton) authButton.disabled = true;

    try {
        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Параллельно грузим доступы и профиль, пока рендерится форма
        currentUser = data.session ? data.session.user : data.user;
        await Promise.all([
            loadAccessOnce().catch(e => console.warn('Access preload error:', e)),
            loadProfileOnce().catch(e => console.warn('Profile preload error:', e))
        ]);

        await checkAuth();
    } finally {
        if (authButton) authButton.disabled = false;
    }
}

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `<div class="error-message">❌ ${message}</div>`;
}

function showSuccess(message) {
    const successContainer = document.getElementById('success-container');
    successContainer.innerHTML = `<div class="success-message">${message}</div>`;
}

function clearMessages() {
    document.getElementById('error-container').innerHTML = '';
    document.getElementById('success-container').innerHTML = '';
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg))
            .catch(err => console.log('SW registration failed:', err));

        // Если новый SW ожидает активации — сразу
        // переключаемся на него, чтобы обновления
        // применялись быстрее.
        navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => console.log('SW controller changed')
        );
    });
}

// Запускаем проверку при загрузке
checkAuth();

// Плавная смена фона при наведении на карточки отраслей
document.querySelectorAll('.module-card[data-module]').forEach(function (card) {
    const module = card.getAttribute('data-module');

    card.addEventListener('mouseenter', function () {
        if (module === 'livestock') {
            document.body.setAttribute('data-hover-bg', 'farm');
        } else if (module === 'mechanization') {
            document.body.setAttribute('data-hover-bg', 'mech');
        } else if (module === 'agronomy') {
            document.body.setAttribute('data-hover-bg', 'agro');
        }

        prefetchModule(module);
    });

    card.addEventListener('mouseleave', function () {
        document.body.setAttribute('data-hover-bg', 'none');
    });
});
