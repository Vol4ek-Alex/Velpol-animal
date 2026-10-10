// Модуль дашборда агрономии с графиками
window.AgroDashboard = {
    data: { crops: [], fields: [], plantings: [] },
    chartInstance: null,

    async loadData() {
        try {
            const { data: crops, error: cropsError } = await db.from('agro_crops').select('*').order('name');
            if (cropsError) throw cropsError;
            this.data.crops = crops || [];

            const { data: fields, error: fieldsError } = await db.from('agro_fields').select('*').order('name');
            if (fieldsError) throw fieldsError;
            this.data.fields = fields || [];

            const currentYear = new Date().getFullYear();
            const { data: plantings, error: plantingsError} = await db
                .from('agro_planting')
                .select('*, field:agro_fields(*), crop:agro_crops(*)')
                .eq('year', currentYear);
            if (plantingsError) throw plantingsError;
            this.data.plantings = plantings || [];
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.data = { crops: [], fields: [], plantings: [] };
        }
    },

    calculateStats() {
        const stats = { totalArea: 0, cropsCount: this.data.crops.length, fieldsCount: this.data.fields.length, plantedArea: 0, freeArea: 0, cropStats: {} };

        this.data.fields.forEach(field => { stats.totalArea += parseFloat(field.area_ha || 0); });

        this.data.plantings.forEach(planting => {
            const area = parseFloat(planting.area_ha || 0);
            stats.plantedArea += area;
            const cropName = planting.crop?.name || 'Неизвестная культура';

            if (!stats.cropStats[cropName]) {
                stats.cropStats[cropName] = { name: cropName, totalArea: 0, fieldsCount: 0, fields: [] };
            }
            stats.cropStats[cropName].totalArea += area;
            stats.cropStats[cropName].fieldsCount++;
            stats.cropStats[cropName].fields.push({ name: planting.field?.name || 'Поле', area: area });
        });

        stats.freeArea = stats.totalArea - stats.plantedArea;
        return stats;
    },

    render(container) {
        container.innerHTML = `
            <div class="header-bar">
                <h1 class="page-title">📊 Дашборд Агрономии</h1>
                <div class="user-info"><span style="color: var(--muted);">${new Date().getFullYear()} год</span></div>
            </div>
            <div id="stats-container"><div style="text-align: center; padding: 40px; color: var(--muted);"><div style="font-size: 2rem; margin-bottom: 12px;">⏳</div><div>Загрузка данных...</div></div></div>
        `;
        this.loadData().then(() => this.renderStats(this.calculateStats()));
    },

