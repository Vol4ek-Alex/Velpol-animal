// Модуль управления культурами
window.AgroCrops = {
    data: {
        crops: []
    },

    async loadData() {
        try {
            const { data: crops, error } = await db
                .from('agro_crops')
                .select('*')
                .order('name');

            if (error) throw error;
            this.data.crops = crops || [];

        } catch (error) {
            console.error('Ошибка загрузки культур:', error);
            this.data.crops = [];
        }
    },

    render(container) {
        container.innerHTML = `
            <div class="header-bar">
                <h1 class="page-title">🌱 Справочник культур</h1>
            </div>
            <div id="crops-container">
                <div style="text-align: center; padding: 40px; color: var(--muted);">
                    <div style="font-size: 2rem; margin-bottom: 12px;">⏳</div>
                    <div>Загрузка данных...</div>
                </div>
            </div>
        `;

        this.loadData().then(() => {
            this.renderCrops();
        });
    },

    renderCrops() {
        const container = document.getElementById('crops-container');

        if (this.data.crops.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🌱</div>
                    <div class="empty-state-text">Нет культур в справочнике</div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Культура</th>
                            <th>Название</th>
                            <th>Категория</th>
                            <th>Описание</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.data.crops.forEach(crop => {
            html += `
                <tr>
                    <td style="font-size: 1.5rem;">${crop.icon || '🌱'}</td>
                    <td style="font-weight: 600; color: #fff;">
                        ${window.CommonUtils.escapeHtml(crop.name)}
                    </td>
                    <td>${window.CommonUtils.escapeHtml(crop.category || '-')}</td>
                    <td style="color: var(--muted);">
                        ${window.CommonUtils.escapeHtml(crop.description || 'Нет описания')}
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }
};
