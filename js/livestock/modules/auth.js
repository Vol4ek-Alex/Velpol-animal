(function () {
    'use strict';

    const REGISTER_FUNCTION_URL =
        `${SUPABASE_URL}/functions/v1/register-user`;

    window.AuthModule = {
        session: null,
        profile: null,
        permissions: {},
        presenceTimer: null,
        initialized: false,
        resolving: false,

        escape(value) {
            if (typeof window.escapeHtml === 'function') {
                return window.escapeHtml(value);
            }

            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        getLoginEmail(login) {
            return `${String(login || '')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '')}@users.mtf.internal`;
        },

        isAdmin() {
            return (
                this.profile &&
                this.profile.role === 'admin' &&
                this.profile.is_blocked !== true
            );
        },

        hasPermission(permission) {
            if (this.isAdmin()) {
                return true;
            }

            return (
                this.profile &&
                this.profile.is_blocked !== true &&
                this.permissions &&
                this.permissions[permission] === true
            );
        },

        canAccessModule(moduleName) {
            const permissions = {
                dashboard: 'can_view_dashboard',
                herd: 'can_view_herd',
                diets: 'can_view_diets',
                reports: 'can_view_reports',
                history: 'can_view_history',
                users: 'can_view_users'
            };

            const permission =
                permissions[moduleName];

            if (!permission) {
                return false;
            }

            return this.hasPermission(permission);
        },

        async loadProfile() {
            const response = await db.rpc(
                'get_my_profile'
            );

            if (response.error) {
                throw response.error;
            }

            const payload = response.data || {};

            this.profile = payload.profile || null;
            this.permissions =
                payload.permissions || {};

            return payload;
        },

        async updatePresence(moduleName) {
            if (!this.session) {
                return;
            }

            const response = await db.rpc(
                'update_my_presence',
                {
                    p_module: moduleName || null
                }
            );

            if (response.error) {
                console.warn(
                    'Presence error:',
                    response.error.message
                );
            }
        },

        startPresence() {
            if (this.presenceTimer) {
                clearInterval(this.presenceTimer);
            }

            this.updatePresence(
                window.state?.activeModule ||
                'dashboard'
            );

            this.presenceTimer = setInterval(() => {
                this.updatePresence(
                    window.state?.activeModule ||
                    'dashboard'
                );
            }, 30000);
        },

        stopPresence() {
            if (this.presenceTimer) {
                clearInterval(this.presenceTimer);
                this.presenceTimer = null;
            }

            if (this.session) {
                db.rpc('set_my_offline')
                    .catch(error => {
                        console.warn(
                            'Offline status error:',
                            error
                        );
                    });
            }
        },

        async signIn(login, pin) {
            const email =
                this.getLoginEmail(login);

            const response =
                await db.auth.signInWithPassword({
                    email,
                    password: String(pin || '')
                });

            if (response.error) {
                throw new Error(
                    'Неверный логин или PIN-код.'
                );
            }

            this.session = response.data.session;

            await this.loadProfile();

            if (
                this.profile &&
                this.profile.is_blocked
            ) {
                await db.auth.signOut();

                throw new Error(
                    'Пользователь заблокирован.'
                );
            }

            this.startPresence();
            this.hideAuthScreen();

            if (
                typeof window.renderCurrentModule ===
                'function'
            ) {
                window.renderCurrentModule();
            }
        },

        async register(payload) {
            const response = await fetch(
                REGISTER_FUNCTION_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        apikey: SUPABASE_KEY,
                        Authorization:
                            `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            let result = {};

            try {
                result = await response.json();
            } catch (error) {
                result = {};
            }

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    'Не удалось зарегистрировать пользователя.'
                );
            }

            return result;
        },

        async signOut() {
            this.stopPresence();

            await db.auth.signOut();

            this.session = null;
            this.profile = null;
            this.permissions = {};

            this.showAuthScreen();
        },

        setMessage(text, isError = true) {
            const node =
                document.querySelector(
                    '.auth-form-message'
                );

            if (!node) {
                return;
            }

            node.textContent = text || '';
            node.classList.toggle(
                'is-error',
                Boolean(text) && isError
            );
            node.classList.toggle(
                'is-success',
                Boolean(text) && !isError
            );
        },

        renderAuthScreen() {
            if (
                document.getElementById(
                    'auth-screen'
                )
            ) {
                return;
            }

            const screen =
                document.createElement('div');

            screen.id = 'auth-screen';
            screen.className = 'auth-screen';

            screen.innerHTML = `
                <div class="auth-background"></div>
                <div class="auth-overlay"></div>

                <div class="auth-card">
                    <div class="auth-logo">
                        🌾
                    </div>

                    <h1 class="auth-title">
                        Контроль•животноводство
                    </h1>

                    <p class="auth-subtitle">
                        Учет & Рационы
                    </p>

                    <div class="auth-tabs">
                        <button
                            type="button"
                            class="
                                auth-tab
                                is-active
                            "
                            data-auth-tab="login"
                        >
                            Вход
                        </button>

                        <button
                            type="button"
                            class="auth-tab"
                            data-auth-tab="register"
                        >
                            Регистрация
                        </button>
                    </div>

                    <form
                        class="auth-form"
                        data-auth-form="login"
                    >
                        <label class="auth-label">
                            Логин

                            <input
                                class="auth-input"
                                name="login"
                                type="text"
                                autocomplete="username"
                                placeholder="Введите логин"
                                required
                            >
                        </label>

                        <label class="auth-label">
                            Личный PIN

                            <input
                                class="auth-input"
                                name="pin"
                                type="password"
                                inputmode="numeric"
                                autocomplete="current-password"
                                placeholder="Введите PIN"
                                required
                            >
                        </label>

                        <button
                            type="submit"
                            class="auth-submit"
                        >
                            Войти
                        </button>
                    </form>

                    <form
                        class="auth-form is-hidden"
                        data-auth-form="register"
                    >
                        <label class="auth-label">
                            Логин

                            <input
                                class="auth-input"
                                name="login"
                                type="text"
                                autocomplete="username"
                                placeholder="От 3 символов"
                                required
                            >
                        </label>

                        <label class="auth-label">
                            ФИО

                            <input
                                class="auth-input"
                                name="full_name"
                                type="text"
                                placeholder="Иванов Иван Иванович"
                                required
                            >
                        </label>

                        <label class="auth-label">
                            Должность

                            <input
                                class="auth-input"
                                name="position"
                                type="text"
                                placeholder="Зоотехник"
                                required
                            >
                        </label>

                        <label class="auth-label">
                            Желаемый личный PIN

                            <input
                                class="auth-input"
                                name="personal_pin"
                                type="password"
                                inputmode="numeric"
                                placeholder="От 4 до 12 цифр"
                                required
                            >
                        </label>

                        <label class="auth-label">
                            PIN ресурса

                            <input
                                class="auth-input"
                                name="resource_pin"
                                type="password"
                                inputmode="numeric"
                                placeholder="Введите PIN ресурса"
                                required
                            >
                        </label>

                        <button
                            type="submit"
                            class="auth-submit"
                        >
                            Зарегистрироваться
                        </button>
                    </form>

                    <div
                        class="auth-form-message"
                        aria-live="polite"
                    ></div>

                    <div class="auth-loading">
                        Обработка...
                    </div>
                </div>

                <style>
                    #auth-screen {
                        position: fixed;
                        inset: 0;
                        z-index: 60000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 18px;
                        overflow-y: auto;
                        background: #071426;
                    }

                    .auth-background {
                        position: absolute;
                        inset: -25px;
                        background:
                            linear-gradient(
                                180deg,
                                rgba(7,18,33,.42),
                                rgba(4,11,22,.78)
                            ),
                            url("assets/bg-farm.jpg")
                            center / cover no-repeat;
                        filter: blur(12px) brightness(.7);
                        transform: scale(1.04);
                    }

                    .auth-overlay {
                        position: absolute;
                        inset: 0;
                        background:
                            radial-gradient(
                                ellipse at center,
                                rgba(7,23,42,.2),
                                rgba(3,9,18,.72)
                            );
                    }

                    .auth-card {
                        position: relative;
                        z-index: 1;
                        width: 100%;
                        max-width: 430px;
                        padding: 26px;
                        border: 1px solid
                            rgba(255,255,255,.18);
                        border-radius: 24px;
                        background:
                            linear-gradient(
                                145deg,
                                rgba(255,255,255,.09),
                                transparent 45%
                            ),
                            rgba(10,27,48,.94);
                        box-shadow:
                            0 25px 80px
                            rgba(0,0,0,.58),
                            inset 0 1px 0
                            rgba(255,255,255,.08);
                        backdrop-filter: blur(18px);
                    }

                    .auth-logo {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 58px;
                        height: 58px;
                        margin: 0 auto 14px;
                        border: 1px solid
                            rgba(255,255,255,.2);
                        border-radius: 18px;
                        background:
                            linear-gradient(
                                135deg,
                                #34d399,
                                #047857
                            );
                        box-shadow:
                            0 10px 28px
                            rgba(16,185,129,.28);
                        font-size: 1.5rem;
                    }

                    .auth-title {
                        margin: 0;
                        color: #fff;
                        font-size: 1.18rem;
                        font-weight: 800;
                        text-align: center;
                    }

                    .auth-subtitle {
                        margin: 5px 0 20px;
                        color: var(--green);
                        font-size: .72rem;
                        font-weight: 700;
                        letter-spacing: .08em;
                        text-align: center;
                        text-transform: uppercase;
                    }

                    .auth-tabs {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 5px;
                        margin-bottom: 16px;
                        padding: 4px;
                        border: 1px solid var(--line);
                        border-radius: 12px;
                        background: rgba(0,0,0,.22);
                    }

                    .auth-tab {
                        min-height: 38px;
                        border: 1px solid transparent;
                        border-radius: 9px;
                        background: transparent;
                        color: var(--muted);
                        cursor: pointer;
                        font: inherit;
                        font-size: .78rem;
                        font-weight: 700;
                    }

                    .auth-tab.is-active {
                        border-color: var(--line-bright);
                        background: rgba(255,255,255,.1);
                        color: #fff;
                    }

                    .auth-form {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .auth-form.is-hidden {
                        display: none;
                    }

                    .auth-label {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                        color: var(--muted);
                        font-size: .76rem;
                        font-weight: 600;
                    }

                    .auth-input {
                        width: 100%;
                        min-height: 45px;
                        padding: 10px 12px;
                        outline: none;
                        border: 1px solid var(--line);
                        border-radius: 11px;
                        background: rgba(3,10,20,.62);
                        color: #fff;
                        font: inherit;
                        font-size: 16px;
                    }

                    .auth-input:focus {
                        border-color: var(--green);
                        box-shadow:
                            0 0 0 3px
                            rgba(16,185,129,.12);
                    }

                    .auth-submit {
                        min-height: 45px;
                        margin-top: 4px;
                        border: 1px solid var(--green-dark);
                        border-radius: 11px;
                        background:
                            linear-gradient(
                                135deg,
                                #10b981,
                                #047857
                            );
                        color: #fff;
                        cursor: pointer;
                        font: inherit;
                        font-weight: 800;
                    }

                    .auth-submit:disabled {
                        cursor: wait;
                        opacity: .55;
                    }

                    .auth-form-message {
                        min-height: 22px;
                        margin-top: 12px;
                        color: var(--red);
                        font-size: .78rem;
                        line-height: 1.4;
                        text-align: center;
                    }

                    .auth-form-message.is-success {
                        color: var(--green);
                    }

                    .auth-loading {
                        display: none;
                        margin-top: 10px;
                        color: var(--muted);
                        font-size: .75rem;
                        text-align: center;
                    }

                    .auth-card.is-loading
                    .auth-loading {
                        display: block;
                    }

                    @media (max-width: 500px) {
                        .auth-card {
                            padding: 20px 16px;
                            border-radius: 20px;
                        }
                    }
                </style>
            `;

            document.body.appendChild(screen);

            this.bindAuthEvents();
        },

        bindAuthEvents() {
            const screen =
                document.getElementById('auth-screen');

            if (!screen) {
                return;
            }

            const card =
                screen.querySelector('.auth-card');

            const tabs =
                screen.querySelectorAll('.auth-tab');

            const forms =
                screen.querySelectorAll('.auth-form');

            tabs.forEach(tab => {
                tab.addEventListener(
                    'click',
                    () => {
                        const target =
                            tab.dataset.authTab;

                        tabs.forEach(item => {
                            item.classList.toggle(
                                'is-active',
                                item === tab
                            );
                        });

                        forms.forEach(form => {
                            form.classList.toggle(
                                'is-hidden',
                                form.dataset.authForm !==
                                target
                            );
                        });

                        this.setMessage('');
                    }
                );
            });

            const loginForm =
                screen.querySelector(
                    '[data-auth-form="login"]'
                );

            loginForm.addEventListener(
                'submit',
                async event => {
                    event.preventDefault();

                    const formData =
                        new FormData(loginForm);

                    const button =
                        loginForm.querySelector(
                            '.auth-submit'
                        );

                    button.disabled = true;
                    card.classList.add('is-loading');
                    this.setMessage('');

                    try {
                        await this.signIn(
                            formData.get('login'),
                            formData.get('pin')
                        );
                    } catch (error) {
                        this.setMessage(
                            error.message ||
                            'Не удалось выполнить вход.'
                        );

                        button.disabled = false;
                        card.classList.remove(
                            'is-loading'
                        );
                    }
                }
            );

            const registerForm =
                screen.querySelector(
                    '[data-auth-form="register"]'
                );

            registerForm.addEventListener(
                'submit',
                async event => {
                    event.preventDefault();

                    const formData =
                        new FormData(registerForm);

                    const button =
                        registerForm.querySelector(
                            '.auth-submit'
                        );

                    const payload = {
                        login: formData.get('login'),
                        full_name:
                            formData.get('full_name'),
                        position:
                            formData.get('position'),
                        personal_pin:
                            formData.get('personal_pin'),
                        resource_pin:
                            formData.get('resource_pin')
                    };

                    button.disabled = true;
                    card.classList.add('is-loading');
                    this.setMessage('');

                    try {
                        await this.register(payload);

                        this.setMessage(
                            'Регистрация завершена. ' +
                            'Теперь войдите в систему.',
                            false
                        );

                        registerForm.reset();

                        screen
                            .querySelector(
                                '[data-auth-tab="login"]'
                            )
                            .click();
                    } catch (error) {
                        this.setMessage(
                            error.message ||
                            'Не удалось зарегистрироваться.'
                        );
                    } finally {
                        button.disabled = false;
                        card.classList.remove(
                            'is-loading'
                        );
                    }
                }
            );
        },

        showAuthScreen() {
            const screen =
                document.getElementById('auth-screen');

            if (screen) {
                screen.style.display = 'flex';
                return;
            }

            this.renderAuthScreen();
        },

        hideAuthScreen() {
            const screen =
                document.getElementById('auth-screen');

            if (screen) {
                screen.style.display = 'none';
            }
        },

        async initialize() {
            if (this.initialized) {
                return;
            }

            this.initialized = true;
            this.renderAuthScreen();

            const response =
                await db.auth.getSession();

            if (response.error) {
                console.error(
                    'Session error:',
                    response.error
                );

                this.showAuthScreen();
                return;
            }

            const session =
                response.data.session;

            if (!session) {
                this.showAuthScreen();
                return;
            }

            this.session = session;

            try {
                await this.loadProfile();

                if (
                    !this.profile ||
                    this.profile.is_blocked
                ) {
                    await db.auth.signOut();
                    this.showAuthScreen();
                    return;
                }

                this.hideAuthScreen();
                this.startPresence();
            } catch (error) {
                console.error(
                    'Profile error:',
                    error
                );

                await db.auth.signOut();
                this.showAuthScreen();
            }

            db.auth.onAuthStateChange(
                async (_event, sessionValue) => {
                    this.session = sessionValue;

                    if (!sessionValue) {
                        this.stopPresence();
                        this.profile = null;
                        this.permissions = {};
                        this.showAuthScreen();
                        return;
                    }

                    try {
                        await this.loadProfile();

                        if (
                            this.profile &&
                            !this.profile.is_blocked
                        ) {
                            this.hideAuthScreen();
                            this.startPresence();
                        }
                    } catch (error) {
                        console.error(
                            'Auth state error:',
                            error
                        );
                    }
                }
            );
        }
    };

    window.addEventListener(
        'beforeunload',
        () => {
            window.AuthModule.stopPresence();
        }
    );
})();