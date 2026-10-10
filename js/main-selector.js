let selectedModule = null;
let authMode = 'login';
let currentUser = null;

async function checkAuth() {
    const { data } = await db.auth.getSession();
    
    if (data.session) {
        currentUser = data.session.user;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('modules-section').style.display = 'grid';
        document.getElementById('logout-container').style.display = 'block';

        // Проверка прав администратора
        checkAdminAccess();
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('modules-section').style.display = 'none';
        document.getElementById('logout-container').style.display = 'none';
        document.getElementById('admin-module').style.display = 'none';
    }}

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
        document.getElementById('admin-module').style.display = 'flex';
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
        // Проверить доступ к модулю
        const { data: accessData, error: accessError } = await db
            .from('module_access')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('module_name', module)
            .eq('has_access', true)
            .maybeSingle();

        if (accessError && accessError.code !== 'PGRST116') {
            throw accessError;
        }

        if (!accessData) {
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
                '<div class="success-message">📧 Письмо отправлено! Проверьте почту и подтвердите email. После подтверждения обратитесь к администратору для получения доступа.</div>';
        }, 2000);

    } catch (error) {
        throw error;
    }
}

async function handleLogin(email, password) {
    const { data, error } = await db.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) throw error;
    
    // После успешного входа проверяем статус
    checkAuth();
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
    });
}

// Запускаем проверку при загрузке
checkAuth();
