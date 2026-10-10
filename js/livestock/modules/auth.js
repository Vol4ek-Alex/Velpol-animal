(function () {
    'use strict';

    window.AuthModule = {
        session: null,
        user: null,
        profile: null,
        access: {},
        presenceTimer: null,
        initialized: false,

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

        isAdmin() {
            return Boolean(this.access && this.access.admin === true);
        },

        hasPermission() {
            // Упрощённая модель прав: админ может всё,
            // остальные пользователи с доступом к модулю
            // могут только просматривать данные.
            return this.isAdmin();
        },

        canAccessModule(moduleName) {
            if (!moduleName) {
                return false;
            }

            if (this.isAdmin()) {
                return true;
            }

            return Boolean(this.access && this.access[moduleName] === true);
        },

        async loadAccess() {
            if (!this.user) {
                this.access = {};
                this.profile = null;
                return this.access;
            }

            const response = await db
                .from('module_access')
                .select('module_name, has_access')
                .eq('user_id', this.user.id)
                .eq('has_access', true);

            if (response.error) {
                throw response.error;
            }

            const access = {};

            (response.data || []).forEach(row => {
                access[row.module_name] = true;
            });

            this.access = access;

            // Эмуляция объекта profile для обратной совместимости с UsersModule
            this.profile = {
                id: this.user.id,
                email: this.user.email,
                role: access.admin ? 'admin' : 'user',
                is_blocked: false
            };

            return access;
        },

        async updatePresence() {
            // Присутствие больше не отслеживается без
            // отдельной таблицы профилей — функция
            // оставлена как no-op для совместимости
            // с остальными модулями.
        },

        startPresence() {
            // no-op: presence отключён в упрощённой схеме авторизации
        },

        stopPresence() {
            if (this.presenceTimer) {
                clearInterval(this.presenceTimer);
                this.presenceTimer = null;
            }
        },

        redirectToHome() {
            window.location.href = '/';
        },

        async initialize() {
            if (this.initialized) {
                return;
            }

            this.initialized = true;

            const response = await db.auth.getSession();

            if (response.error || !response.data.session) {
                this.redirectToHome();
                return;
            }

            this.session = response.data.session;
            this.user = response.data.session.user;

            try {
                // Создаёт профиль текущего пользователя,
                // если его ещё нет (нужно для UsersModule).
                const profileResponse = await db.rpc(
                    'get_my_profile'
                );

                if (!profileResponse.error) {
                    this.profile =
                        profileResponse.data?.profile ||
                        this.profile;
                }

                await this.loadAccess();

                if (!this.canAccessModule('livestock')) {
                    window.showSimpleMessage
                        ? window.showSimpleMessage(
                            'Нет доступа',
                            'У вас нет доступа к модулю животноводства. Обратитесь к администратору.'
                        )
                        : alert('У вас нет доступа к модулю животноводства.');

                    await db.auth.signOut();
                    this.redirectToHome();
                    return;
                }
            } catch (error) {
                console.error('Access check error:', error);
                this.redirectToHome();
                return;
            }

            db.auth.onAuthStateChange(async (_event, sessionValue) => {
                this.session = sessionValue;
                this.user = sessionValue ? sessionValue.user : null;

                if (!sessionValue) {
                    this.stopPresence();
                    this.access = {};
                    this.redirectToHome();
                }
            });
        }
    };

    window.addEventListener('beforeunload', () => {
        window.AuthModule.stopPresence();
    });
})();
