// ==================== 任务配置模块 ====================

const TaskConfig = {
    showConfigModal() {
        const config = DataManager.getAll('taskConfig');

        const content = `
            <form id="task-config-form">
                <p class="text-muted" style="margin-bottom: 1rem;">配置每个任务类型的分值和达标线</p>
                ${config.map((cfg, index) => `
                    <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.75rem;">${cfg.taskType}</h4>
                        <div class="grid grid-2">
                            <div class="form-group">
                                <label>单位分值</label>
                                <input type="number" name="score_${index}" value="${cfg.score}" min="0" step="0.5">
                            </div>
                            <div class="form-group">
                                <label>达标线</label>
                                <input type="number" name="targetLine_${index}" value="${cfg.targetLine}" min="0">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </form>
        `;

        Utils.createModal({
            title: '任务评分配置',
            content: content,
            size: 'lg',
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '保存配置',
                    class: 'btn btn-primary',
                    onClick: () => this.saveConfig()
                }
            ]
        });
    },

    saveConfig() {
        const form = document.getElementById('task-config-form');
        const formData = new FormData(form);
        const config = DataManager.getAll('taskConfig');

        config.forEach((cfg, index) => {
            cfg.score = parseFloat(formData.get(`score_${index}`)) || 0;
            cfg.targetLine = parseInt(formData.get(`targetLine_${index}`)) || 0;
        });

        DataManager.data.taskConfig = config;
        DataManager.saveToStorage();

        Utils.showToast('任务配置保存成功！', 'success');
        document.querySelector('.modal-overlay').remove();
    }
};
