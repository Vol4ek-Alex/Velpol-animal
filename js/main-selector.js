let selectedModule = null;
let authMode = 'login'; // 'login' или 'register'

function selectModule(module) {
    if (module === 'mechanization') {
        return;
    }

    selectedModule = module;
    const loginSection = document.getElementById('login-section');
    updateAuthTitle();
    loginSection.style.display = 'block';
    loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    document.querySelectorAll('.module-card').forEach(card => {
        card.style.opacity = card.dataset.module === module ? '1' : '0.5';
    });
}

function switchAuthMode(mode) {
    authMode = mode;
    const fullNameInput = document.getElementById('full-name');
    const passwordConfirm = document.getElementById('password-confirm');
    const authButton = document.getElementById('auth-button');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    document.getElementById('error-container').innerHTML = '';
    document.getElementById('success-container').innerHTML = '';

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
    const moduleTitles = {
        'livestock': '🐄 Животноводство',
        'agronomy': '🌾 Агрономия'
    };
    
    if (selectedModule) {
        const prefix = authMode === 'register' ? 'Регистрация для модуля' : 'Вход в модуль';
        loginTitle.textContent = `${prefix} ${moduleTitles[selectedModule]}`;
    }
}

async function handleAuth(event) {
    event.preventDefault();

    if (!selectedModule) {
        showError('Выберите модуль');
        return;
    }

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

    const { data, error } = await db.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName
            }
        }
    });

    if (error) throw error;

    // Создать заявку на доступ
    const { error: requestError } = await db
        .from('pending_access_requests')
        .insert({
            user_id: data.user.id,
            user_email: email,
            user_name: fullName,
            module_name: selectedModule,
            status: 'pending'
        });

    if (requestError && requestError.code !== '23505') { // Ignore duplicate key error
        console.error('Request creation error:', requestError);
    }

    showSuccess('✅ Регистрация успешна! Проверьте email для подтверждения. После подтверждения администратор рассмотрит вашу заявку.');
    
    // Очистить форму
    document.getElementById('auth-form').reset();
    
    // Перенаправить на страницу подтверждения через 2 секунды
    setTimeout(() => {
        window.location.href = 'confirm-email.html';
    }, 2000);
}

async function handleLogin(email, password) {
    const { data, error } = await db.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) throw error;

    // Проверить доступ к модулю
    const { data: accessData, error: accessError } = await db
        .from('module_access')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('module_name', selectedModule)
        .eq('has_access', true)
        .maybeSingle();

    if (accessError && accessError.code !== 'PGRST116') {
        throw accessError;
    }

    if (!accessData) {
        throw new Error('У вас нет доступа к данному модулю. Обратитесь к администратору.');
    }

    localStorage.setItem('velpol_user', JSON.stringify(data.user));
    localStorage.setItem('velpol_module', selectedModule);

    const moduleUrls = {
        'livestock': 'js/livestock/index.html',
        'agronomy': 'js/agronomy/index.html'
    };

    window.location.href = moduleUrls[selectedModule];
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

async function checkAuth() {
    const { data } = await db.auth.getSession();

    if (data.session) {
        const savedModule = localStorage.getItem('velpol_module');

        if (savedModule && savedModule !== 'mechanization') {
            const moduleUrls = {
                'livestock': 'js/livestock/index.html',
                'agronomy': 'js/agronomy/index.html'
            };

            window.location.href = moduleUrls[savedModule];
        }
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg))
            .catch(err => console.log('SW registration failed:', err));
    });
}

checkAuth();
