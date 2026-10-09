(function () {
    'use strict';

    window.CategoriesModule = {
        escape(value) {
            return typeof window.escapeHtml === 'function'
                ? window.escapeHtml(value)
                : String(value ?? '');
        },

        async getAll() {
            const response =
                await db
                    .from('herd_categories')
                    .select('*')
                    .order('sort_order')
                    .order('name');

            if (response.error) {
                throw response.error;
            }

            return response.data || [];
        },

        async getDistributionMap(groupId) {
            const response =
                await db
                    .from('group_category_heads')
                    .select('category_id, heads')
                    .eq('group_id', groupId);

            if (response.error) {
                throw response.error;
            }

            const result = {};

            (response.data || []).forEach(row => {
                result[row.category_id] =
                    Number(row.heads) || 0;
            });

            return result;
        },

        async openDistributionModal(options) {
            const settings = options || {};
            const group = settings.group || {};
            const headCount = Math.max(
                0,
                parseInt(settings.headCount, 10) || 0
            );

            const categories = await this.getAll();

            if (!categories.length) {
                alert('Сначала создайте категорию.');
                return null;
            }

            if (categories.length === 1) {
                return [{
                    category_id: categories[0].id,
                    heads: headCount
                }];
            }

            const current =
                await this.getDistributionMap(group.id);

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
                        ${this.escape(
                            settings.title ||
                            'Распределение по категориям'
                        )}
                    </h3>

                    <p style="
                        margin:8px 0 14px;
                        color:var(--muted);
                    ">
                        Группа:
                        <b>${this.escape(
                            group.group_name || ''
                        )}</b>
                        <br>
                        Всего голов:
                        <b>${headCount}</b>
                    </p>

                    <div class="category-distribution-list">
                        ${categories.map(category => `
                            <label
                                class="
                                    category-distribution-row
                                "
                            >
                                <span>
                                    ${this.escape(
                                        category.name
                                    )}
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="
                                        modal-input
                                        category-head-input
                                    "
                                    data-category-id="${
                                        category.id
                                    }"
                                    value="${
                                        Number(
                                            current[
                                                category.id
                                            ] || 0
                                        )
                                    }"
                                >
                            </label>
                        `).join('')}
                    </div>

                    <div
                        class="
                            category-distribution-total
                        "
                    >
                        Сумма: 0 из ${headCount}
                    </div>

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:18px;
                    ">
                        <button
                            type="button"
                            class="
                                glass-btn
                                distribution-cancel
                            "
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="
                                glass-btn
                                distribution-submit
                            "
                            disabled
                            style="
                                border-color:
                                    var(--green-dark);
                                color:var(--green);
                            "
                        >
                            Сохранить
                        </button>
                    </div>
                </div>

                <style>
                    .category-distribution-list {
                        display:flex;
                        flex-direction:column;
                        gap:7px;
                        max-height:330px;
                        overflow-y:auto;
                    }

                    .category-distribution-row {
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                        min-height:46px;
                        padding:7px 0;
                        border-bottom:1px solid var(--line);
                        color:var(--text);
                        font-weight:600;
                    }

                    .category-head-input {
                        width:100px;
                        min-height:38px;
                    }

                    .category-distribution-total {
                        margin-top:12px;
                        color:var(--amber);
                        font-family:
                            "JetBrains Mono",
                            monospace;
                        font-size:.82rem;
                        font-weight:700;
                    }
                </style>
            `;

            document.body.appendChild(overlay);

            const inputs = [
                ...overlay.querySelectorAll(
                    '.category-head-input'
                )
            ];

            const totalNode =
                overlay.querySelector(
                    '.category-distribution-total'
                );

            const submitButton =
                overlay.querySelector(
                    '.distribution-submit'
                );

            const update = () => {
                const total = inputs.reduce(
                    (sum, input) => {
                        return sum + Math.max(
                            0,
                            parseInt(input.value, 10) || 0
                        );
                    },
                    0
                );

                const valid = total === headCount;

                totalNode.textContent =
                    `Сумма: ${total} из ${headCount}`;

                totalNode.style.color =
                    valid
                        ? 'var(--green)'
                        : 'var(--amber)';

                submitButton.disabled = !valid;
            };

            inputs.forEach(input => {
                input.addEventListener('input', update);
                input.addEventListener('change', update);
            });

            update();

            return new Promise(resolve => {
                let finished = false;

                const close = value => {
                    if (finished) return;

                    finished = true;
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector('.distribution-cancel')
                    .addEventListener(
                        'click',
                        () => close(null)
                    );

                submitButton.addEventListener(
                    'click',
                    () => {
                        const distribution =
                            inputs.map(input => ({
                                category_id:
                                    input.dataset.categoryId,
                                heads: Math.max(
                                    0,
                                    parseInt(
                                        input.value,
                                        10
                                    ) || 0
                                )
                            }));

                        close(distribution);
                    }
                );
            });
        },

        async createCategory(name) {
            const value =
                String(name || '').trim();

            if (!value) {
                throw new Error(
                    'Введите название категории.'
                );
            }

            const response =
                await db
                    .from('herd_categories')
                    .insert({
                        name: value
                    });

            if (response.error) {
                throw response.error;
            }
        },

        async renameCategory(id, name) {
            const value =
                String(name || '').trim();

            if (!value) {
                throw new Error(
                    'Введите название категории.'
                );
            }

            const response =
                await db
                    .from('herd_categories')
                    .update({
                        name: value
                    })
                    .eq('id', id);

            if (response.error) {
                throw response.error;
            }
        },

        async deleteCategory(id) {
            const usage =
                await db
                    .from('group_category_heads')
                    .select('group_id', {
                        count: 'exact',
                        head: true
                    })
                    .eq('category_id', id);

            if (usage.error) {
                throw usage.error;
            }

            if (Number(usage.count || 0) > 0) {
                throw new Error(
                    'Категория используется группами.'
                );
            }

            const categories =
                await this.getAll();

            if (categories.length <= 1) {
                throw new Error(
                    'Нельзя удалить последнюю категорию.'
                );
            }

            const response =
                await db
                    .from('herd_categories')
                    .delete()
                    .eq('id', id);

            if (response.error) {
                throw response.error;
            }
        },

        async textModal(title, initialValue) {
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
                        ${this.escape(title)}
                    </h3>

                    <input
                        type="text"
                        class="modal-input text-modal-input"
                        value="${this.escape(
                            initialValue || ''
                        )}"
                        style="margin-top:15px"
                    >

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:16px;
                    ">
                        <button
                            type="button"
                            class="glass-btn text-cancel"
                        >
                            Отмена
                        </button>

                        <button
                            type="button"
                            class="glass-btn text-submit"
                            style="
                                border-color:
                                    var(--green-dark);
                                color:var(--green);
                            "
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const input =
                overlay.querySelector(
                    '.text-modal-input'
                );

            input.focus();
            input.select();

            return new Promise(resolve => {
                const close = value => {
                    overlay.remove();
                    resolve(value);
                };

                overlay
                    .querySelector('.text-cancel')
                    .addEventListener(
                        'click',
                        () => close(null)
                    );

                overlay
                    .querySelector('.text-submit')
                    .addEventListener(
                        'click',
                        () => close(input.value)
                    );

                input.addEventListener(
                    'keydown',
                    event => {
                        if (event.key === 'Enter') {
                            close(input.value);
                        }

                        if (event.key === 'Escape') {
                            close(null);
                        }
                    }
                );
            });
        },

        async openManager() {
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
                        Управление категориями
                    </h3>

                    <div style="
                        display:flex;
                        gap:8px;
                        margin-top:15px;
                    ">
                        <input
                            type="text"
                            class="
                                modal-input
                                category-new-input
                            "
                            placeholder="Название категории"
                        >

                        <button
                            type="button"
                            class="
                                glass-btn
                                category-add-button
                            "
                            style="color:var(--green)"
                        >
                            Добавить
                        </button>
                    </div>

                    <div
                        class="
                            category-manager-error
                        "
                        style="
                            min-height:20px;
                            margin-top:8px;
                            color:var(--amber);
                            font-size:.78rem;
                        "
                    ></div>

                    <div
                        class="
                            category-manager-list
                        "
                        style="
                            display:flex;
                            flex-direction:column;
                            gap:8px;
                            max-height:320px;
                            margin-top:5px;
                            overflow-y:auto;
                        "
                    ></div>

                    <button
                        type="button"
                        class="
                            glass-btn
                            category-manager-close
                        "
                        style="
                            width:100%;
                            margin-top:16px;
                        "
                    >
                        Закрыть
                    </button>
                </div>
            `;

            document.body.appendChild(overlay);

            const list =
                overlay.querySelector(
                    '.category-manager-list'
                );

            const errorNode =
                overlay.querySelector(
                    '.category-manager-error'
                );

            const renderList = async () => {
                const categories =
                    await this.getAll();

                list.innerHTML =
                    categories.map(category => `
                        <div style="
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:8px;
                            padding:9px;
                            border:1px solid var(--line);
                            border-radius:10px;
                        ">
                            <span>
                                ${this.escape(
                                    category.name
                                )}
                            </span>

                            <span style="
                                display:flex;
                                gap:5px;
                            ">
                                <button
                                    type="button"
                                    class="
                                        glass-btn
                                        category-rename-button
                                    "
                                    data-id="${category.id}"
                                >
                                    ✏️
                                </button>

                                <button
                                    type="button"
                                    class="
                                        glass-btn
                                        category-delete-button
                                    "
                                    data-id="${category.id}"
                                >
                                    🗑
                                </button>
                            </span>
                        </div>
                    `).join('');

                list
                    .querySelectorAll(
                        '.category-rename-button'
                    )
                    .forEach(button => {
                        button.addEventListener(
                            'click',
                            async () => {
                                const category =
                                    categories.find(item => {
                                        return String(
                                            item.id
                                        ) === String(
                                            button.dataset.id
                                        );
                                    });

                                const name =
                                    await this.textModal(
                                        'Новое название категории',
                                        category.name
                                    );

                                if (name === null) {
                                    return;
                                }

                                try {
                                    await this.renameCategory(
                                        category.id,
                                        name
                                    );

                                    errorNode.textContent =
                                        '';

                                    await renderList();
                                } catch (error) {
                                    errorNode.textContent =
                                        error.message;
                                }
                            }
                        );
                    });

                list
                    .querySelectorAll(
                        '.category-delete-button'
                    )
                    .forEach(button => {
                        button.addEventListener(
                            'click',
                            async () => {
                                try {
                                    await this.deleteCategory(
                                        button.dataset.id
                                    );

                                    errorNode.textContent =
                                        '';

                                    await renderList();
                                } catch (error) {
                                    errorNode.textContent =
                                        error.message;
                                }
                            }
                        );
                    });
            };

            await renderList();

            return new Promise(resolve => {
                const close = () => {
                    overlay.remove();
                    resolve();
                };

                overlay
                    .querySelector(
                        '.category-manager-close'
                    )
                    .addEventListener(
                        'click',
                        close
                    );

                overlay
                    .querySelector(
                        '.category-add-button'
                    )
                    .addEventListener(
                        'click',
                        async () => {
                            const input =
                                overlay.querySelector(
                                    '.category-new-input'
                                );

                            try {
                                await this.createCategory(
                                    input.value
                                );

                                input.value = '';
                                errorNode.textContent = '';

                                /*
                                 * Список обновляется сразу,
                                 * без перезапуска модуля.
                                 */
                                await renderList();
                            } catch (error) {
                                errorNode.textContent =
                                    error.message;
                            }
                        }
                    );

                overlay
                    .querySelector(
                        '.category-new-input'
                    )
                    .addEventListener(
                        'keydown',
                        event => {
                            if (event.key === 'Enter') {
                                overlay
                                    .querySelector(
                                        '.category-add-button'
                                    )
                                    .click();
                            }
                        }
                    );
            });
        }
    };
})();