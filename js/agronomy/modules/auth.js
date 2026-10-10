(function () {
    'use strict';

    window.AuthModule = {
        session: null,
        user: null,
        profile: null,
        access: {},
        initialized: false,

        isAdmin() {
            return Boolean(this.access && this.access.admin === true);
        },

        hasPermission() {
            return this.isAdmin();
        },

        canAccessModule(moduleName) {
            if (!moduleName) return false;
            if (this.isAdmin()) return true;
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

            if (response.error) throw response.error;

            const access = {};
            (response.data || []).forEach(row => {
                access[row.module_name] = true;
            });

            this.access = access;
            this.profile = {
                id: this.user.id,
                email: this.user.email,
                role: access.admin ? 'admin' : 'user',
                is_blocked: false
            };

            return access;
        },

        redirectToHome() {
            window.location.href = '/';
        },

        async initialize() {
            if (this.initialized) return;
            this.initialized = true;

            const response = await db.auth.getSession();

            if (response.error || !response.data.session) {
                this.redirectToHome();
                return;
            }

            this.session = response.data.session;
            this.user = response.data.session.user;

            try {
                await this.loadAccess();

                if (!this.canAccessModule('agronomy')) {
                    window.showSimpleMessage
                        ? window.showSimpleMessage(
                            'Нет доступа',
                            'У вас нет доступа к модулю агрономии. Обратитесь к администратору.'
                        )
                        : alert('У вас нет доступа к модулю агрономии.');

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
                    this.access = {};
                    this.redirectToHome();
                }
            });
        }
    };
})();
