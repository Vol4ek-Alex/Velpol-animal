(function () {
    'use strict';

    window.MovementsModule = {
        types: {
            realization: {
                title: 'Реализация',
                icon: '💰'
            },

            mortality: {
                title: 'Падёж',
                icon: '⚠️'
            },

            transfer: {
                title: 'Перевод',
                icon: '↔️'
            }
        },

        escape(value) {
            if (typeof window.escapeHtml === 'function') {
                return window.escapeHtml(value);
            }

            return String(
                value === null || value === undefined
                    ? ''
                    : value
            )
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        async getGroups() {
            const response = await db
                .from('farms_and_groups')
                .select('*')
                .order('farm_name')
                .order('group_name');

            if (response.error) {
                throw response.error;
            }

            return response.data || [];
        },

        async getCategories() {
            if (
                window.CategoriesModule &&
                typeof CategoriesModule.getAll === 'function'
            ) {
                return CategoriesModule.getAll();
            }

            const response = await db
                .from('herd_categories')
                .select('*')
                .order('sort_order')
                .order('name');

            if (response.error) {
                throw response.error;
            }

            return response.data || [];
        },

        createOverlay() {
            const overlay =
                document.createElement('div');

            overlay.className =
                'modal-overlay open herd-movement-overlay';

            overlay.innerHTML = `
                <div class="modal-box herd-movement-box">
                    <div class="herd-movement-header">
                        <div>
                            <h3 class="herd-movement-title">
                                Операция с поголовьем
                            </h3>

                            <p
                                class="
                                    herd-movement-subtitle
                                "
                            ></p>
                        </div>

                        <button
                            type="button"
                            class="
                                herd-movement-close
                            "
                            aria-label="Закрыть"
                        >
                            ✕
                        </button>
                    </div>

                    <div
                        class="
                            herd-movement-types
                        "
                    >
                        <button
                            type="button"
                            class="
                                glass-btn
                                herd-movement-type
                            "
                            data-type="realization"
                        >
                            <span>💰</span>
                            <span>Реализация</span>
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                herd-movement-type
                            "
                            data-type="mortality"
                        >
                            <span>⚠️</span>
                            <span>Падёж</span>
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                herd-movement-type
                            "
                            data-type="transfer"
                        >
                            <span>↔️</span>
                            <span>Перевод</span>
                        </button>
                    </div>

                    <div
                        class="
                            herd-movement-extra
                        "
                    ></div>

                    <div
                        class="
                            herd-movement-error
                        "
                        role="alert"
                    ></div>

                    <div
                        class="
                            herd-movement-actions
                        "
                    >
                        <button
                            type="button"
                            class="
                                glass-btn
                                herd-movement-cancel
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                herd-movement-submit
                            "
                            disabled
                        >
                            Продолжить
                        </button>
                    </div>
                </div>

                <style>
                    .herd-movement-box {
                        max-width: 520px;
                    }

                    .herd-movement-header {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 12px;
                        margin-bottom: 15px;
                    }

                    .herd-movement-title {
                        margin: 0;
                        color: #fff;
                        font-size: 1.1rem;
                        font-weight: 800;
                    }

                    .herd-movement-subtitle {
                        margin: 6px 0 0;
                        color: var(--muted);
                        font-size: .82rem;
                        line-height: 1.45;
                    }

                    .herd-movement-close {
                        flex: 0 0 auto;
                        width: 34px;
                        height: 34px;
                        border: 1px solid var(--line);
                        border-radius: 9px;
                        background: transparent;
                        color: var(--muted);
                        cursor: pointer;
                        font-size: 1rem;
                    }

                    .herd-movement-close:hover {
                        border-color: var(--line-bright);
                        color: #fff;
                    }

                    .herd-movement-types {
                        display: grid;
                        grid-template-columns:
                            repeat(3, minmax(0, 1fr));
                        gap: 8px;
                    }

                    .herd-movement-type {
                        flex-direction: column;
                        min-height: 72px;
                        padding: 9px 6px;
                        color: var(--muted);
                        font-size: .74rem;
                    }

                    .herd-movement-type span:first-child {
                        font-size: 1.25rem;
                    }

                    .herd-movement-type.is-selected {
                        border-color: var(--green);
                        background:
                            rgba(16, 185, 129, .18);
                        color: #fff;
                    }

                    .herd-movement-extra {
                        display: flex;
                        flex-direction: column;
                        gap: 9px;
                        margin-top: 15px;
                    }

                    .herd-movement-label {
                        display: block;
                        margin-bottom: 5px;
                        color: var(--muted);
                        font-size: .76rem;
                        font-weight: 600;
                    }

                    .herd-movement-error {
                        min-height: 20px;
                        margin-top: 10px;
                        color: var(--red);
                        font-size: .78rem;
                        line-height: 1.4;
                    }

                    .herd-movement-actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 8px;
                        margin-top: 4px;
                    }

                    .herd-movement-submit:not(:disabled) {
                        border-color: var(--green-dark);
                        color: var(--green);
                    }

                    @media (max-width: 460px) {
                        .herd-movement-types {
                            grid-template-columns: 1fr;
                        }

                        .herd-movement-type {
                            flex-direction: row;
                            justify-content: center;
                            gap: 8px;
                            min-height: 46px;
                        }

                        .herd-movement-actions {
                            flex-direction: column-reverse;
                        }

                        .herd-movement-actions .glass-btn {
                            width: 100%;
                        }
                    }
                </style>
            `;

            document.body.appendChild(overlay);

            return overlay;
        },

        renderTransferFields(
            container,
            groups,
            categories
        ) {
            container.innerHTML = `
                <div>
                    <label
                        class="herd-movement-label"
                        for="movement-destination-group"
                    >
                        Перевести в группу
                    </label>

                    <select
                        id="movement-destination-group"
                        class="modal-input"
                    >
                        <option value="">
                            Выберите группу назначения
                        </option>

                        ${groups.map(group => `
                            <option value="${this.escape(
                                group.id
                            )}">
                                ${this.escape(
                                    cleanFarmName(
                                        group.farm_name
                                    )
                                )}
                                — ${this.escape(
                                    group.group_name
                                )}
                                (${Number(
                                    group.head_count || 0
                                )} гол.)
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div>
                    <label
                        class="herd-movement-label"
                        for="movement-destination-category"
                    >
                        Категория назначения
                    </label>

                    <select
                        id="movement-destination-category"
                        class="modal-input"
                    >
                        <option value="">
                            Выберите категорию
                        </option>

                        ${categories.map(category => `
                            <option value="${this.escape(
                                category.id
                            )}">
                                ${this.escape(
                                    category.name
                                )}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div>
                    <label
                        class="herd-movement-label"
                        for="movement-transfer-comment"
                    >
                        Комментарий
                    </label>

                    <input
                        id="movement-transfer-comment"
                        class="modal-input"
                        type="text"
                        maxlength="500"
                        placeholder="Необязательно"
                    >
                </div>
            `;
        },

        renderCommentField(
            container,
            type
        ) {
            const isMortality =
                type === 'mortality';

            container.innerHTML = `
                <div>
                    <label
                        class="herd-movement-label"
                        for="movement-comment"
                    >
                        ${
                            isMortality
                                ? 'Причина падежа'
                                : 'Комментарий'
                        }
                    </label>

                    <input
                        id="movement-comment"
                        class="modal-input"
                        type="text"
                        maxlength="500"
                        placeholder="${
                            isMortality
                                ? 'Например: заболевание'
                                : 'Необязательно'
                        }"
                    >
                </div>
            `;
        },

        async open(options) {
            const settings = options || {};
            const group = settings.group || {};
            const quantity = Math.max(
                1,
                parseInt(settings.quantity, 10) || 0
            );

            if (!group.id || !quantity) {
                throw new Error(
                    'Не переданы данные операции.'
                );
            }

            const [
                allGroups,
                categories
            ] = await Promise.all([
                this.getGroups(),
                this.getCategories()
            ]);

            const destinationGroups =
                allGroups.filter(item => {
                    return String(item.id) !==
                        String(group.id);
                });

            const overlay = this.createOverlay();

            const subtitle =
                overlay.querySelector(
                    '.herd-movement-subtitle'
                );

            subtitle.innerHTML = `
                Объект:
                <strong>${this.escape(
                    cleanFarmName(group.farm_name)
                )}</strong>
                <br>
                Группа:
                <strong>${this.escape(
                    group.group_name
                )}</strong>
                <br>
                Количество:
                <strong>${quantity} гол.</strong>
            `;

            const extra =
                overlay.querySelector(
                    '.herd-movement-extra'
                );

            const errorNode =
                overlay.querySelector(
                    '.herd-movement-error'
                );

            const submitButton =
                overlay.querySelector(
                    '.herd-movement-submit'
                );

            const typeButtons = Array.from(
                overlay.querySelectorAll(
                    '.herd-movement-type'
                )
            );

            let selectedType = null;
            let finished = false;

            const showError = message => {
                errorNode.textContent =
                    message || '';
            };

            const close = value => {
                if (finished) {
                    return;
                }

                finished = true;
                overlay.remove();
                resolvePromise(value);
            };

            const getFormValue = selector => {
                const node =
                    extra.querySelector(selector);

                return node ? node.value.trim() : '';
            };

            const updateSubmitState = () => {
                let valid =
                    selectedType !== null;

                if (selectedType === 'transfer') {
                    valid =
                        valid &&
                        Boolean(
                            getFormValue(
                                '#movement-destination-group'
                            )
                        ) &&
                        Boolean(
                            getFormValue(
                                '#movement-destination-category'
                            )
                        );
                }

                submitButton.disabled = !valid;
            };

            const selectType = type => {
                selectedType = type;
                showError('');

                typeButtons.forEach(button => {
                    button.classList.toggle(
                        'is-selected',
                        button.dataset.type === type
                    );
                });

                if (type === 'transfer') {
                    this.renderTransferFields(
                        extra,
                        destinationGroups,
                        categories
                    );
                } else {
                    this.renderCommentField(
                        extra,
                        type
                    );
                }

                extra
                    .querySelectorAll(
                        'input, select'
                    )
                    .forEach(node => {
                        node.addEventListener(
                            'input',
                            updateSubmitState
                        );

                        node.addEventListener(
                            'change',
                            updateSubmitState
                        );
                    });

                updateSubmitState();
            };

            typeButtons.forEach(button => {
                button.addEventListener(
                    'click',
                    () => {
                        selectType(
                            button.dataset.type
                        );
                    }
                );
            });

            overlay
                .querySelector(
                    '.herd-movement-close'
                )
                .addEventListener(
                    'click',
                    () => close(null)
                );

            overlay
                .querySelector(
                    '.herd-movement-cancel'
                )
                .addEventListener(
                    'click',
                    () => close(null)
                );

            let resolvePromise;

            const resultPromise = new Promise(
                resolve => {
                    resolvePromise = resolve;
                }
            );

            submitButton.addEventListener(
                'click',
                () => {
                    if (!selectedType) {
                        return;
                    }

                    let destinationGroupId = null;
                    let destinationCategoryId = null;
                    let comment = '';
                    let reason = null;

                    if (
                        selectedType === 'transfer'
                    ) {
                        destinationGroupId =
                            getFormValue(
                                '#movement-destination-group'
                            );

                        destinationCategoryId =
                            getFormValue(
                                '#movement-destination-category'
                            );

                        comment =
                            getFormValue(
                                '#movement-transfer-comment'
                            );

                        if (
                            !destinationGroupId ||
                            !destinationCategoryId
                        ) {
                            showError(
                                'Выберите группу и категорию назначения.'
                            );
                            return;
                        }
                    } else {
                        comment =
                            getFormValue(
                                '#movement-comment'
                            );

                        if (
                            selectedType === 'mortality'
                        ) {
                            reason =
                                comment || 'Падёж';
                        }
                    }

                    close({
                        type: selectedType,
                        quantity,
                        destinationGroupId,
                        destinationCategoryId,
                        reason,
                        comment
                    });
                }
            );

            return resultPromise;
        }
    };
})();