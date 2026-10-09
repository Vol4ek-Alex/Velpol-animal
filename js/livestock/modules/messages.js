(function () {
    'use strict';

    window.MessagesModule = {
        messages: [],
        pollTimer: null,
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

        isAuthenticated() {
            return Boolean(
                window.AuthModule &&
                window.AuthModule.session
            );
        },

        canSendMessages() {
            if (!window.AuthModule) {
                return false;
            }

            if (
                typeof window.AuthModule.isAdmin ===
                'function' &&
                window.AuthModule.isAdmin()
            ) {
                return true;
            }

            return (
                typeof window.AuthModule.hasPermission ===
                'function' &&
                window.AuthModule.hasPermission(
                    'can_send_messages'
                )
            );
        },

        async loadUnread() {
            if (!this.isAuthenticated()) {
                this.messages = [];
                return [];
            }

            const response = await db.rpc(
                'get_my_unread_messages'
            );

            if (response.error) {
                throw response.error;
            }

            this.messages = response.data || [];

            return this.messages;
        },

        startPolling() {
            this.stopPolling();

            if (!this.isAuthenticated()) {
                return;
            }

            this.checkUnread();

            this.pollTimer = setInterval(
                () => {
                    this.checkUnread();
                },
                30000
            );
        },

        stopPolling() {
            if (this.pollTimer) {
                clearInterval(this.pollTimer);
                this.pollTimer = null;
            }
        },

        async checkUnread() {
            try {
                const messages =
                    await this.loadUnread();

                if (messages.length > 0) {
                    this.showNextMessage();
                }
            } catch (error) {
                console.warn(
                    'Ошибка загрузки сообщений:',
                    error
                );
            }
        },

        showNextMessage() {
            if (
                document.querySelector(
                    '.fullscreen-message-overlay'
                )
            ) {
                return;
            }

            const message =
                this.messages[0];

            if (!message) {
                return;
            }

            this.showMessageModal(message);
        },

        showMessageModal(message) {
            const overlay =
                document.createElement('div');

            overlay.className =
                'fullscreen-message-overlay';

            overlay.innerHTML = `
                <div class="fullscreen-message-background">
                </div>

                <div class="fullscreen-message-shade">
                </div>

                <div class="fullscreen-message-card">
                    <div class="fullscreen-message-icon">
                        ✉️
                    </div>

                    <div class="fullscreen-message-label">
                        Новое сообщение
                    </div>

                    <h1 class="fullscreen-message-title">
                        ${this.escape(
                            message.title ||
                            'Сообщение'
                        )}
                    </h1>

                    <div class="fullscreen-message-sender">
                        От:
                        ${this.escape(
                            message.sender_name ||
                            'Администратор'
                        )}
                    </div>

                    <div class="fullscreen-message-text">
                        ${this.escape(
                            message.message || ''
                        ).replace(/\n/g, '<br>')}
                    </div>

                    <textarea
                        class="
                            fullscreen-message-reply
                        "
                        maxlength="1000"
                        placeholder="Ответить необязательно..."
                    ></textarea>

                    <div
                        class="
                            fullscreen-message-error
                        "
                    ></div>

                    <button
                        type="button"
                        class="
                            fullscreen-message-button
                        "
                    >
                        Увидел
                    </button>
                </div>

                <style>
                    .fullscreen-message-overlay {
                        position: fixed;
                        inset: 0;
                        z-index: 70000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 18px;
                        overflow-y: auto;
                    }

                    .fullscreen-message-background {
                        position: absolute;
                        inset: -25px;
                        background:
                            linear-gradient(
                                180deg,
                                rgba(7,18,33,.35),
                                rgba(4,11,22,.78)
                            ),
                            url("assets/bg-farm.jpg")
                            center / cover no-repeat;
                        filter: blur(12px) brightness(.68);
                        transform: scale(1.04);
                    }

                    .fullscreen-message-shade {
                        position: absolute;
                        inset: 0;
                        background:
                            rgba(3,9,18,.72);
                    }

                    .fullscreen-message-card {
                        position: relative;
                        z-index: 1;
                        width: 100%;
                        max-width: 620px;
                        max-height: calc(100dvh - 36px);
                        padding: 30px;
                        overflow-y: auto;
                        border: 1px solid
                            rgba(255,255,255,.22);
                        border-radius: 24px;
                        background:
                            linear-gradient(
                                145deg,
                                rgba(255,255,255,.1),
                                transparent 45%
                            ),
                            rgba(10,27,48,.96);
                        box-shadow:
                            0 25px 90px
                            rgba(0,0,0,.65),
                            inset 0 1px 0
                            rgba(255,255,255,.08);
                        text-align: center;
                    }

                    .fullscreen-message-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 64px;
                        height: 64px;
                        margin: 0 auto 15px;
                        border: 1px solid
                            rgba(52,211,153,.45);
                        border-radius: 20px;
                        background:
                            rgba(16,185,129,.18);
                        font-size: 1.7rem;
                    }

                    .fullscreen-message-label {
                        color: var(--green);
                        font-size: .75rem;
                        font-weight: 800;
                        letter-spacing: .08em;
                        text-transform: uppercase;
                    }

                    .fullscreen-message-title {
                        margin: 10px 0 0;
                        color: #fff;
                        font-size: clamp(
                            1.35rem,
                            4vw,
                            2rem
                        );
                        font-weight: 800;
                        line-height: 1.2;
                    }

                    .fullscreen-message-sender {
                        margin-top: 8px;
                        color: var(--muted);
                        font-size: .8rem;
                    }

                    .fullscreen-message-text {
                        margin-top: 22px;
                        color: #fff;
                        font-size: 1rem;
                        line-height: 1.6;
                        text-align: left;
                        white-space: normal;
                        overflow-wrap: anywhere;
                    }

                    .fullscreen-message-reply {
                        display: block;
                        width: 100%;
                        min-height: 86px;
                        margin-top: 22px;
                        padding: 11px 13px;
                        outline: none;
                        resize: vertical;
                        border: 1px solid var(--line);
                        border-radius: 12px;
                        background: rgba(3,10,20,.62);
                        color: #fff;
                        font: inherit;
                        font-size: 16px;
                        text-align: left;
                    }

                    .fullscreen-message-reply:focus {
                        border-color: var(--green);
                        box-shadow:
                            0 0 0 3px
                            rgba(16,185,129,.12);
                    }

                    .fullscreen-message-error {
                        min-height: 20px;
                        margin-top: 8px;
                        color: var(--red);
                        font-size: .78rem;
                    }

                    .fullscreen-message-button {
                        width: 100%;
                        min-height: 48px;
                        margin-top: 12px;
                        border: 1px solid var(--green-dark);
                        border-radius: 12px;
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

                    .fullscreen-message-button:disabled {
                        cursor: wait;
                        opacity: .55;
                    }

                    @media(max-width:600px) {
                        .fullscreen-message-card {
                            padding: 22px 17px;
                            border-radius: 20px;
                        }
                    }
                </style>
            `;

            document.body.appendChild(overlay);

            const reply =
                overlay.querySelector(
                    '.fullscreen-message-reply'
                );

            const errorNode =
                overlay.querySelector(
                    '.fullscreen-message-error'
                );

            const button =
                overlay.querySelector(
                    '.fullscreen-message-button'
                );

            button.addEventListener(
                'click',
                async () => {
                    button.disabled = true;
                    errorNode.textContent = '';

                    try {
                        const response =
                            await db.rpc(
                                'acknowledge_message',
                                {
                                    p_message_id:
                                        message.id,

                                    p_reply_text:
                                        reply.value.trim() ||
                                        null
                                }
                            );

                        if (response.error) {
                            throw response.error;
                        }

                        this.messages =
                            this.messages.filter(item => {
                                return String(item.id) !==
                                    String(message.id);
                            });

                        overlay.remove();

                        setTimeout(() => {
                            this.showNextMessage();
                        }, 150);
                    } catch (error) {
                        button.disabled = false;
                        errorNode.textContent =
                            error.message ||
                            'Не удалось подтвердить сообщение.';
                    }
                }
            );
        },

        async sendMessage(options) {
            if (!this.canSendMessages()) {
                throw new Error(
                    'Нет разрешения на отправку сообщений.'
                );
            }

            const settings = options || {};

            const response =
                await db.rpc(
                    'admin_send_message',
                    {
                        p_recipient_id:
                            settings.recipientId,

                        p_title:
                            settings.title,

                        p_message:
                            settings.message,

                        p_is_fullscreen:
                            settings.isFullscreen !== false,

                        p_requires_acknowledgement:
                            settings.requiresAcknowledgement !==
                            false,

                        p_expires_at:
                            settings.expiresAt || null
                    }
                );

            if (response.error) {
                throw response.error;
            }

            return response.data;
        },

        async openSendModal(user) {
            if (!this.canSendMessages()) {
                if (
                    typeof window.showSimpleMessage ===
                    'function'
                ) {
                    window.showSimpleMessage(
                        'Нет доступа',
                        'У вас нет разрешения на отправку сообщений.'
                    );
                }

                return null;
            }

            const profile =
                user?.profile || {};

            const overlay =
                document.createElement('div');

            overlay.className =
                'modal-overlay open';

            overlay.innerHTML = `
                <div class="modal-box">
                    <h3 style="
                        margin:0;
                        color:#fff;
                    ">
                        Сообщение пользователю
                    </h3>

                    <p style="
                        margin:8px 0 15px;
                        color:var(--muted);
                        font-size:.8rem;
                    ">
                        Получатель:
                        <strong style="color:#fff">
                            ${this.escape(
                                profile.full_name ||
                                profile.login ||
                                ''
                            )}
                        </strong>
                    </p>

                    <div style="
                        display:flex;
                        flex-direction:column;
                        gap:11px;
                    ">
                        <input
                            type="text"
                            class="
                                modal-input
                                message-title-input
                            "
                            maxlength="150"
                            placeholder="Заголовок сообщения"
                        >

                        <textarea
                            class="
                                modal-input
                                message-body-input
                            "
                            maxlength="3000"
                            placeholder="Текст сообщения"
                            style="
                                min-height:150px;
                                resize:vertical;
                            "
                        ></textarea>
                    </div>

                    <div
                        class="message-send-error"
                        style="
                            min-height:20px;
                            margin-top:8px;
                            color:var(--red);
                            font-size:.78rem;
                        "
                    ></div>

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:14px;
                    ">
                        <button
                            type="button"
                            class="
                                glass-btn
                                message-send-cancel
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                message-send-submit
                            "
                            style="
                                border-color:
                                    var(--green-dark);
                                color:var(--green);
                            "
                        >
                            Отправить
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const titleInput =
                overlay.querySelector(
                    '.message-title-input'
                );

            const bodyInput =
                overlay.querySelector(
                    '.message-body-input'
                );

            const errorNode =
                overlay.querySelector(
                    '.message-send-error'
                );

            const submitButton =
                overlay.querySelector(
                    '.message-send-submit'
                );

            titleInput.focus();

            return new Promise(resolve => {
                let finished = false;

                const close = value => {
                    if (finished) {
                        return;
                    }

                    finished = true;
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector(
                        '.message-send-cancel'
                    )
                    .addEventListener(
                        'click',
                        () => close(null)
                    );

                overlay.addEventListener(
                    'click',
                    event => {
                        if (event.target === overlay) {
                            close(null);
                        }
                    }
                );

                submitButton.addEventListener(
                    'click',
                    async () => {
                        const title =
                            titleInput.value.trim();

                        const message =
                            bodyInput.value.trim();

                        if (!title) {
                            errorNode.textContent =
                                'Введите заголовок.';
                            titleInput.focus();
                            return;
                        }

                        if (!message) {
                            errorNode.textContent =
                                'Введите текст сообщения.';
                            bodyInput.focus();
                            return;
                        }

                        submitButton.disabled = true;
                        errorNode.textContent = '';

                        try {
                            await this.sendMessage({
                                recipientId: profile.id,
                                title,
                                message,
                                isFullscreen: true,
                                requiresAcknowledgement: true
                            });

                            close({
                                success: true
                            });

                            if (
                                typeof window.showSimpleMessage ===
                                'function'
                            ) {
                                window.showSimpleMessage(
                                    'Сообщение отправлено',
                                    'Пользователь увидит его при следующем входе.'
                                );
                            }
                        } catch (error) {
                            submitButton.disabled = false;
                            errorNode.textContent =
                                error.message ||
                                'Не удалось отправить сообщение.';
                        }
                    }
                );
            });
        },

        async initialize() {
            if (this.initialized) {
                return;
            }

            this.initialized = true;

            if (!this.isAuthenticated()) {
                return;
            }

            this.startPolling();

            document.addEventListener(
                'visibilitychange',
                () => {
                    if (
                        document.visibilityState ===
                        'visible'
                    ) {
                        this.checkUnread();
                    }
                }
            );
        },

        destroy() {
            this.stopPolling();
            this.messages = [];
            this.initialized = false;
        }
    };
})();