// ==================== 任务记录模块 ====================

const TaskRecords = {
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    selectedDay: 'all',  // 新增：具体日期 or 'all'
    selectedEmployeeId: 'all', // 新增：员工ID or 'all'

    render(container) {
        // 基础筛选：年份必须
        let filteredRecords = DataManager.getAll('taskRecords').filter(r => {
            const date = new Date(r.date);
            return date.getFullYear() === this.selectedYear;
        });

        // 筛选月份
        if (this.selectedMonth !== 'all') {
            const m = String(this.selectedMonth).padStart(2, '0');
            filteredRecords = filteredRecords.filter(r => Utils.formatDate(r.date, 'date').substring(5, 7) === m);
        }

        // 筛选日期
        if (this.selectedDay !== 'all') {
            const d = String(this.selectedDay).padStart(2, '0');
            filteredRecords = filteredRecords.filter(r => Utils.formatDate(r.date, 'date').substring(8, 10) === d);
        }

        // 筛选员工
        if (this.selectedEmployeeId !== 'all') {
            filteredRecords = filteredRecords.filter(r => r.employeeId === this.selectedEmployeeId);
        }

        // 排序
        const records = filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 按日期分组
        const groupedRecords = {};
        records.forEach(r => {
            const date = Utils.formatDate(r.date, 'date');
            if (!groupedRecords[date]) groupedRecords[date] = [];
            groupedRecords[date].push(r);
        });

        // 生成表格内容
        let tableRows = '';
        const dates = Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a)); // 日期倒序

        dates.forEach(date => {
            const dayRecords = groupedRecords[date];
            // 计算当日总计
            const totals = dayRecords.reduce((acc, r) => ({
                phone: acc.phone + (r.phoneCount || 0),
                wechat: acc.wechat + (r.wechatCount || 0),
                intention: acc.intention + (r.intentionCount || 0),
                visit: acc.visit + (r.visitCount || 0),
                contract: acc.contract + (r.contractCount || 0),
                score: acc.score + (r.totalScore || 0)
            }), { phone: 0, wechat: 0, intention: 0, visit: 0, contract: 0, score: 0 });

            // 日期表头行
            tableRows += `
                <tr style="background-color: #f1f8ff; font-weight: bold; border-top: 2px solid #cce5ff;">
                    <td colspan="2" style="color: #0366d6;">📅 ${date} (当日汇总)</td>
                    <td style="color: #0366d6;">${totals.phone}</td>
                    <td style="color: #0366d6;">${totals.wechat}</td>
                    <td style="color: #0366d6;">${totals.intention}</td>
                    <td style="color: #0366d6;">${totals.visit}</td>
                    <td style="color: #0366d6;">${totals.contract}</td>
                    <td style="color: #0366d6;">${totals.score}</td>
                    <td colspan="2"></td>
                </tr>
            `;

            // 员工记录行
            dayRecords.forEach(r => {
                tableRows += this.renderRecordRow(r);
            });
        });

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">任务记录</h3>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <select id="task-year-select" class="picker-select" style="padding: 0.4rem 0.75rem;">
                            ${this.renderYearOptions()}
                        </select>
                        <select id="task-month-select" class="picker-select" style="padding: 0.4rem 0.75rem;">
                            ${this.renderMonthOptions()}
                        </select>
                        <select id="task-day-select" class="picker-select" style="padding: 0.4rem 0.75rem;">
                            ${this.renderDayOptions()}
                        </select>
                        <select id="task-emp-select" class="picker-select" style="padding: 0.4rem 0.75rem; max-width: 120px;">
                            ${this.renderEmployeeOptions()}
                        </select>
                        <button class="btn btn-secondary" onclick="TaskRecords.showConfigModal()">
                            ⚙️ 达标线
                        </button>
                        <button class="btn btn-secondary" onclick="TaskRecords.showSingleAddModal()">
                            ➕ 单人录入
                        </button>
                        <button class="btn btn-primary" onclick="TaskRecords.showBatchAddModal()">
                            📋 批量录入
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>员工姓名</th>
                                <th>日期</th>
                                <th>电话</th>
                                <th>微信</th>
                                <th>意向</th>
                                <th>面谈</th>
                                <th>签约</th>
                                <th>总得分</th>
                                <th>是否达标</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows || '<tr><td colspan="10" class="text-center text-muted" style="padding: 2rem;">该月暂无任务记录</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.bindFilterEvents();
    },

    renderYearOptions() {
        const currentYear = new Date().getFullYear();
        let html = '';
        for (let y = currentYear; y >= currentYear - 2; y--) {
            html += `<option value="${y}" ${y === this.selectedYear ? 'selected' : ''}>${y}年</option>`;
        }
        return html;
    },

    renderMonthOptions() {
        let html = `<option value="all" ${this.selectedMonth === 'all' ? 'selected' : ''}>全年</option>`;
        for (let m = 1; m <= 12; m++) {
            html += `<option value="${m}" ${m === this.selectedMonth ? 'selected' : ''}>${m}月</option>`;
        }
        return html;
    },

    renderDayOptions() {
        let html = `<option value="all" ${this.selectedDay === 'all' ? 'selected' : ''}>不限日期</option>`;
        // 如果没选月份，日期也没法具体（或者可以显示1-31），这里显示1-31
        for (let d = 1; d <= 31; d++) {
            html += `<option value="${d}" ${d === this.selectedDay ? 'selected' : ''}>${d}日</option>`;
        }
        return html;
    },

    renderEmployeeOptions() {
        const employees = DataManager.getAll('employees');
        let html = `<option value="all" ${this.selectedEmployeeId === 'all' ? 'selected' : ''}>全部员工</option>`;
        employees.forEach(emp => {
            html += `<option value="${emp.id}" ${emp.id === this.selectedEmployeeId ? 'selected' : ''}>${emp.name}</option>`;
        });
        return html;
    },

    bindFilterEvents() {
        document.getElementById('task-year-select')?.addEventListener('change', e => {
            this.selectedYear = parseInt(e.target.value);
            App.loadPage('tasks');
        });
        document.getElementById('task-month-select')?.addEventListener('change', e => {
            const val = e.target.value;
            this.selectedMonth = val === 'all' ? 'all' : parseInt(val);
            App.loadPage('tasks');
        });
        document.getElementById('task-day-select')?.addEventListener('change', e => {
            const val = e.target.value;
            this.selectedDay = val === 'all' ? 'all' : parseInt(val);
            App.loadPage('tasks');
        });
        document.getElementById('task-emp-select')?.addEventListener('change', e => {
            this.selectedEmployeeId = e.target.value;
            App.loadPage('tasks');
        });
    },

    // 单人录入
    showSingleAddModal() {
        const employees = DataManager.query('employees', { status: '在职' });
        const today = Utils.formatDate(new Date(), 'date');
        const scoreConfig = DataManager.getScoreConfig();
        const targetScore = DataManager.getDailyTargetScore();

        if (employees.length === 0) {
            Utils.showToast('请先添加员工', 'error');
            return;
        }

        const content = `
            <form id="single-task-form">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>员工 <span style="color: var(--error-color);">*</span></label>
                        <select name="employeeId" required>
                            <option value="">请选择员工</option>
                            ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>日期 <span style="color: var(--error-color);">*</span></label>
                        <input type="date" name="date" value="${today}" required>
                    </div>
                    <div class="form-group">
                        <label>📞 电话 <small style="color: var(--text-muted);">(${scoreConfig.phone}分)</small></label>
                        <input type="number" name="phoneCount" value="0" min="0" class="single-input">
                    </div>
                    <div class="form-group">
                        <label>💬 微信 <small style="color: var(--text-muted);">(${scoreConfig.wechat}分)</small></label>
                        <input type="number" name="wechatCount" value="0" min="0" class="single-input">
                    </div>
                    <div class="form-group">
                        <label>⭐ 意向 <small style="color: var(--text-muted);">(${scoreConfig.intention}分)</small></label>
                        <input type="number" name="intentionCount" value="0" min="0" class="single-input">
                    </div>
                    <div class="form-group">
                        <label>🤝 面谈 <small style="color: var(--text-muted);">(${scoreConfig.visit}分)</small></label>
                        <input type="number" name="visitCount" value="0" min="0" class="single-input">
                    </div>
                    <div class="form-group">
                        <label>✍️ 签约 <small style="color: var(--text-muted);">(${scoreConfig.contract}分)</small></label>
                        <input type="number" name="contractCount" value="0" min="0" class="single-input">
                    </div>
                </div>
                
                <div id="single-score-preview" style="margin-top: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md); text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-muted);">预计得分</div>
                    <div style="font-size: 2rem; font-weight: 700;" id="single-live-score">0</div>
                    <div style="font-size: 0.8rem;">达标线：${targetScore}分</div>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '单人录入任务',
            content: content,
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                { text: '确认录入', class: 'btn btn-primary', onClick: () => this.saveSingleRecord() }
            ]
        });

        // 实时计算得分
        setTimeout(() => {
            document.querySelectorAll('.single-input').forEach(input => {
                input.addEventListener('input', () => this.updateSingleScore());
            });
        }, 100);
    },

    updateSingleScore() {
        const form = document.getElementById('single-task-form');
        const scoreConfig = DataManager.getScoreConfig();
        const targetScore = DataManager.getDailyTargetScore();

        const phone = parseInt(form.querySelector('[name="phoneCount"]').value) || 0;
        const wechat = parseInt(form.querySelector('[name="wechatCount"]').value) || 0;
        const intention = parseInt(form.querySelector('[name="intentionCount"]').value) || 0;
        const visit = parseInt(form.querySelector('[name="visitCount"]').value) || 0;
        const contract = parseInt(form.querySelector('[name="contractCount"]').value) || 0;

        const score = phone * scoreConfig.phone + wechat * scoreConfig.wechat +
            intention * scoreConfig.intention + visit * scoreConfig.visit +
            contract * scoreConfig.contract;

        const scoreEl = document.getElementById('single-live-score');
        scoreEl.textContent = score;
        scoreEl.style.color = score >= targetScore ? 'var(--success-color)' : 'var(--primary-light)';
    },

    async saveSingleRecord() {
        const form = document.getElementById('single-task-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (!data.employeeId) {
            Utils.showToast('请选择员工', 'error');
            return;
        }

        const recordData = {
            employeeId: data.employeeId,
            date: data.date,
            phoneCount: parseInt(data.phoneCount) || 0,
            wechatCount: parseInt(data.wechatCount) || 0,
            intentionCount: parseInt(data.intentionCount) || 0,
            visitCount: parseInt(data.visitCount) || 0,
            contractCount: parseInt(data.contractCount) || 0
        };
        recordData.totalScore = DataManager.calculateTaskScore(recordData);

        await DataManager.add('taskRecords', recordData);
        Utils.showToast('录入成功！', 'success');
        document.querySelector('.modal-overlay').remove();
        App.loadPage('tasks');
    },

    renderRecordRow(record) {
        const employee = DataManager.getById('employees', record.employeeId);
        const targetLine = DataManager.getDailyTargetScore();
        const isQualified = (record.totalScore || 0) >= targetLine;

        return `
            <tr>
                <td><strong>${employee?.name || '未知'}</strong></td>
                <td>${Utils.formatDate(record.date, 'date')}</td>
                <td>${record.phoneCount || 0}</td>
                <td>${record.wechatCount || 0}</td>
                <td>${record.intentionCount || 0}</td>
                <td>${record.visitCount || 0}</td>
                <td>${record.contractCount || 0}</td>
                <td><strong>${record.totalScore || 0}</strong></td>
                <td>
                    ${isQualified
                ? '<span class="badge badge-success">✓ 已达标</span>'
                : '<span class="badge badge-warning">未达标</span>'}
                </td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="TaskRecords.showEditModal('${record.id}')">
                        编辑
                    </button>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="TaskRecords.deleteRecord('${record.id}')">
                        删除
                    </button>
                </td>
            </tr>
        `;
    },

    // 批量录入 - 显示所有员工
    showBatchAddModal() {
        const employees = DataManager.query('employees', { status: '在职' });
        const today = Utils.formatDate(new Date(), 'date');
        const targetScore = DataManager.getDailyTargetScore();
        const scoreConfig = DataManager.getScoreConfig();

        if (employees.length === 0) {
            Utils.showToast('请先添加员工', 'error');
            return;
        }

        const content = `
            <form id="batch-task-form">
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label>日期 <span style="color: var(--error-color);">*</span></label>
                    <input type="date" name="date" value="${today}" required style="max-width: 200px;">
                </div>
                
                <div style="background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <span>积分规则：电话${scoreConfig.phone}分 | 微信${scoreConfig.wechat}分 | 意向${scoreConfig.intention}分 | 面谈${scoreConfig.visit}分 | 签约${scoreConfig.contract}分</span>
                    <span>达标线：<strong>${targetScore}分</strong></span>
                </div>

                <div class="batch-table-container" style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%;">
                        <thead style="position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;">
                            <tr>
                                <th style="width: 120px;">员工</th>
                                <th>📞电话</th>
                                <th>💬微信</th>
                                <th>⭐意向</th>
                                <th>🤝面谈</th>
                                <th>✍️签约</th>
                                <th style="width: 80px;">得分</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employees.map((emp, i) => `
                                <tr class="emp-row" data-index="${i}">
                                    <td>
                                        <strong>${emp.name}</strong>
                                        <input type="hidden" name="empId_${i}" value="${emp.id}">
                                    </td>
                                    <td><input type="number" name="phone_${i}" value="0" min="0" class="task-input" style="width: 60px;"></td>
                                    <td><input type="number" name="wechat_${i}" value="0" min="0" class="task-input" style="width: 60px;"></td>
                                    <td><input type="number" name="intention_${i}" value="0" min="0" class="task-input" style="width: 60px;"></td>
                                    <td><input type="number" name="visit_${i}" value="0" min="0" class="task-input" style="width: 60px;"></td>
                                    <td><input type="number" name="contract_${i}" value="0" min="0" class="task-input" style="width: 60px;"></td>
                                    <td class="score-cell" id="score_${i}" style="font-weight: bold; text-align: center;">0</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '批量录入任务',
            content: content,
            size: 'lg',
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                { text: '保存全部', class: 'btn btn-primary', onClick: () => this.saveBatchRecords(employees.length) }
            ]
        });

        // 绑定实时计算事件
        setTimeout(() => {
            document.querySelectorAll('.task-input').forEach(input => {
                input.addEventListener('input', () => this.updateRowScore(input));
            });
        }, 100);
    },

    updateRowScore(input) {
        const row = input.closest('tr');
        const index = row.dataset.index;
        const scoreConfig = DataManager.getScoreConfig();
        const targetScore = DataManager.getDailyTargetScore();

        const phone = parseInt(row.querySelector(`input[name="phone_${index}"]`).value) || 0;
        const wechat = parseInt(row.querySelector(`input[name="wechat_${index}"]`).value) || 0;
        const intention = parseInt(row.querySelector(`input[name="intention_${index}"]`).value) || 0;
        const visit = parseInt(row.querySelector(`input[name="visit_${index}"]`).value) || 0;
        const contract = parseInt(row.querySelector(`input[name="contract_${index}"]`).value) || 0;

        const score = phone * scoreConfig.phone + wechat * scoreConfig.wechat +
            intention * scoreConfig.intention + visit * scoreConfig.visit +
            contract * scoreConfig.contract;

        const scoreCell = document.getElementById(`score_${index}`);
        scoreCell.textContent = score;
        scoreCell.style.color = score >= targetScore ? 'var(--success-color)' : 'var(--text-muted)';
    },

    async saveBatchRecords(count) {
        const form = document.getElementById('batch-task-form');
        const formData = new FormData(form);
        const date = formData.get('date');

        if (!date) {
            Utils.showToast('请选择日期', 'error');
            return;
        }

        const records = [];

        for (let i = 0; i < count; i++) {
            const empId = formData.get(`empId_${i}`);
            const phone = parseInt(formData.get(`phone_${i}`)) || 0;
            const wechat = parseInt(formData.get(`wechat_${i}`)) || 0;
            const intention = parseInt(formData.get(`intention_${i}`)) || 0;
            const visit = parseInt(formData.get(`visit_${i}`)) || 0;
            const contract = parseInt(formData.get(`contract_${i}`)) || 0;

            // 只保存有数据的记录
            if (phone > 0 || wechat > 0 || intention > 0 || visit > 0 || contract > 0) {
                const record = {
                    employeeId: empId,
                    date: date,
                    phoneCount: phone,
                    wechatCount: wechat,
                    intentionCount: intention,
                    visitCount: visit,
                    contractCount: contract
                };
                record.totalScore = DataManager.calculateTaskScore(record);
                records.push(record);
            }
        }

        if (records.length === 0) {
            Utils.showToast('请至少填写一条任务数据', 'warning');
            return;
        }

        // 保存所有记录
        for (const record of records) {
            await DataManager.add('taskRecords', record);
        }

        Utils.showToast(`成功录入 ${records.length} 条任务记录！`, 'success');
        document.querySelector('.modal-overlay').remove();

        // 自动刷新页面
        App.loadPage('tasks');
    },

    showEditModal(recordId) {
        const record = DataManager.getById('taskRecords', recordId);
        const employees = DataManager.query('employees', { status: '在职' });
        const scoreConfig = DataManager.getScoreConfig();
        const targetScore = DataManager.getDailyTargetScore();
        if (!record) return;

        const content = `
            <form id="task-record-form">
                <input type="hidden" name="id" value="${record.id}">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>员工</label>
                        <select name="employeeId" required>
                            ${employees.map(e =>
            `<option value="${e.id}" ${e.id === record.employeeId ? 'selected' : ''}>${e.name}</option>`
        ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>日期</label>
                        <input type="date" name="date" value="${Utils.formatDate(record.date, 'date')}" required>
                    </div>
                    <div class="form-group">
                        <label>📞 电话 (${scoreConfig.phone}分)</label>
                        <input type="number" name="phoneCount" value="${record.phoneCount || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>💬 微信 (${scoreConfig.wechat}分)</label>
                        <input type="number" name="wechatCount" value="${record.wechatCount || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>⭐ 意向 (${scoreConfig.intention}分)</label>
                        <input type="number" name="intentionCount" value="${record.intentionCount || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>🤝 面谈 (${scoreConfig.visit}分)</label>
                        <input type="number" name="visitCount" value="${record.visitCount || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>✍️ 签约 (${scoreConfig.contract}分)</label>
                        <input type="number" name="contractCount" value="${record.contractCount || 0}" min="0">
                    </div>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '编辑任务',
            content: content,
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                { text: '保存', class: 'btn btn-primary', onClick: () => this.saveRecord() }
            ]
        });
    },

    async saveRecord() {
        const form = document.getElementById('task-record-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        const recordData = {
            employeeId: data.employeeId,
            date: data.date,
            phoneCount: parseInt(data.phoneCount) || 0,
            wechatCount: parseInt(data.wechatCount) || 0,
            intentionCount: parseInt(data.intentionCount) || 0,
            visitCount: parseInt(data.visitCount) || 0,
            contractCount: parseInt(data.contractCount) || 0
        };
        recordData.totalScore = DataManager.calculateTaskScore(recordData);

        if (data.id) {
            await DataManager.update('taskRecords', data.id, recordData);
            Utils.showToast('更新成功！', 'success');
        } else {
            await DataManager.add('taskRecords', recordData);
            Utils.showToast('录入成功！', 'success');
        }

        document.querySelector('.modal-overlay').remove();
        App.loadPage('tasks');
    },

    async deleteRecord(recordId) {
        const confirmed = await Utils.confirm('确定要删除这条任务记录吗？');
        if (!confirmed) return;

        await DataManager.delete('taskRecords', recordId);
        Utils.showToast('删除成功！', 'success');
        App.loadPage('tasks');
    },

    // 积分配置弹窗
    showConfigModal() {
        const scoreConfig = DataManager.getScoreConfig();
        const targetScore = DataManager.getDailyTargetScore();

        const content = `
            <form id="config-form">
                <div class="form-group">
                    <label>每日达标分数 <span style="color: var(--error-color);">*</span></label>
                    <input type="number" name="targetScore" value="${targetScore}" min="1" required>
                </div>
                
                <h4 style="margin: 1.5rem 0 1rem;">积分规则设置</h4>
                
                <div class="grid grid-2" style="gap: 1rem;">
                    <div class="form-group" style="margin: 0;">
                        <label>📞 电话</label>
                        <input type="number" name="phone" value="${scoreConfig.phone}" min="0"> 分/个
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>💬 微信</label>
                        <input type="number" name="wechat" value="${scoreConfig.wechat}" min="0"> 分/个
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>⭐ 意向</label>
                        <input type="number" name="intention" value="${scoreConfig.intention}" min="0"> 分/个
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>🤝 面谈</label>
                        <input type="number" name="visit" value="${scoreConfig.visit}" min="0"> 分/个
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>✍️ 签约</label>
                        <input type="number" name="contract" value="${scoreConfig.contract}" min="0"> 分/个
                    </div>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '积分规则设置',
            content: content,
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                { text: '保存', class: 'btn btn-primary', onClick: () => this.saveConfig() }
            ]
        });
    },

    async saveConfig() {
        const form = document.getElementById('config-form');
        const formData = new FormData(form);

        await DataManager.setDailyTargetScore(parseInt(formData.get('targetScore')) || 35);
        await DataManager.setScoreConfig({
            phone: parseInt(formData.get('phone')) || 1,
            wechat: parseInt(formData.get('wechat')) || 3,
            intention: parseInt(formData.get('intention')) || 5,
            visit: parseInt(formData.get('visit')) || 20,
            contract: parseInt(formData.get('contract')) || 50
        });

        Utils.showToast('设置保存成功！', 'success');
        document.querySelector('.modal-overlay').remove();
        App.loadPage('tasks');
    }
};
