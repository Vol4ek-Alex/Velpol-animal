// Модуль управления полями
window.AgroFields = {
    data: {
        fields: [],
        plantings: []
    },

    async loadData() {
        try {
            const currentYear = new Date().getFullYear();

            const { data: fields, error: fieldsError } = await db
                .from('agro_fields')
                .select('*')
                .order('name');

            if (fieldsError) throw fieldsError;
            this.data.fields = fields || [];

            const { data: plantings, error: plantingsError } = await db
                .from('agro_planting')
                .select('*, crop:agro_crops(*)')
                .eq('year', currentYear);

            if (plantingsError) throw plantingsError;
            this.data.plantings = plantings || [];

        } catch (error) {
            console.error('Ошибка загрузки полей:', error);
            this.data = { fields: [], plantings: [] };
        }
    },

    getCropForField(fieldId) {
        const planting = this.data.plantings.find(p => p.field_id === fieldId);
        return planting?.crop?.name || '-';
    },

    getAreaForField(fieldId) {
        const planting = this.data.plantings.find(p => p.field_id === fieldId);
        return planting?.area_ha || 0;
    },

    render(container) {
        container.innerHTML = `
            <div class="header-bar">
                <h1 class="page-title">🗺️ Поля хозяйства</h1>
            </div>
            <div id="fields-container">
                <div style="text-align: center; padding: 40px; color: var(--muted);">
                    <div style="font-size: 2rem; margin-bottom: 12px;">⏳</div>
                    <div>Загрузка данных...</div>
                </div>
            </div>
        `;

        this.loadData().then(() => {
            this.renderFields();
        });
    },

    renderFields() {
        const container = document.getElementById('fields-container');

        if (this.data.fields.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🗺️</div>
                    <div class="empty-state-text">Нет зарегистрированных полей</div>
                </div>
            `;
            return;
        }

        const currentYear = new Date().getFullYear();

        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Название поля</th>
                            <th>Площадь (га)</th>
                            <th>Культура ${currentYear}</th>
                            <th>Посажено (га)</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.data.fields.forEach(field => {
            const crop = this.getCropForField(field.id);
            const plantedArea = this.getAreaForField(field.id);
            const totalArea = parseFloat(field.area_ha || 0);
            const isPlanted = crop !== '-';
            const percentage = totalArea > 0 ? (plantedArea / totalArea * 100).toFixed(1) : 0;

            html += `
                <tr>
                    <td style="font-weight: 600; color: #fff;">
                        ${window.CommonUtils.escapeHtml(field.name)}
                    </td>
                    <td>${totalArea.toFixed(2)} га</td>
                    <td>${window.CommonUtils.escapeHtml(crop)}</td>
                    <td>${plantedArea > 0 ? plantedArea.toFixed(2) + ' га (' + percentage + '%)' : '-'}</td>
                    <td>
                        ${isPlanted 
                            ? '<span class="badge badge-green">Засеяно</span>' 
                            : '<span class="badge badge-blue">Свободно</span>'
                        }
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
