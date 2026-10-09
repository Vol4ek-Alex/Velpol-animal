let selectedModule = null;

function selectModule(module) {
    if (module === 'mechanization') {
        return;
    }

    selectedModule = module;
    const loginSection = document.getElementById('login-section');
    const loginTitle = document.getElementById('login-title');

    const moduleTitles = {
        'livestock': '🐄 Вход в модуль Животноводство',
        'agronomy': '🌾 Вход в модуль Агрономия'
    };

    loginTitle.textContent = moduleTitles[module];
    loginSection.style.display = 'block';
    loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    document.querySelectorAll('.module-card').forEach(card => {
        card.style.opacity = card.dataset.module === module ? '1' : '0.5';
    });
}

async function handleLogin(event) {
    event.preventDefault();

    if (!selectedModule) {
        showError('Выберите модуль для входа');
        return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorContainer = document.getElementById('error-container');

    errorContainer.innerHTML = '';

    try {
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
            throw new Error('У вас нет доступа к данному модулю');
        }

        localStorage.setItem('velpol_user', JSON.stringify(data.user));
        localStorage.setItem('velpol_module', selectedModule);

        const moduleUrls = {
            'livestock': 'js/livestock/index.html',
            'agronomy': 'js/agronomy/index.html'
        };

        window.location.href = moduleUrls[selectedModule];

    } catch (error) {
        showError(error.message || 'Ошибка входа. Проверьте email и пароль.');
        console.error('Login error:', error);
    }
}

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
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
