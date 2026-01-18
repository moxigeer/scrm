// ==================== 回款记录模块 ====================

const Payments = {
    // 筛选状态
    selectedYear: new Date().getFullYear(),
    selectedMonth: 'all',
    selectedDay: 'all',
    selectedEmployeeId: 'all',
    searchCompany: '',
    isInitialized: false, // 新增：标记是否已初始化框架

    render(container) {
        // 如果未初始化，渲染骨架
        if (!this.isInitialized || !document.getElementById('pay-table-body')) {
            container.innerHTML = `
                <div class="card mb-2">
                    <div style="display: flex; justify-content: space-around; padding: 1.5rem; text-align: center;">
                        <div>
                            <div class="text-muted" style="font-size: 1rem;">当前筛选回款总额</div>
                            <div style="font-size: 2.5rem; font-weight: 700; color: var(--warning-color); margin: 0.5rem 0;" id="pay-total-amount">
                                0.00
                            </div>
                            <div class="text-muted" style="font-size: 0.9rem;" id="pay-record-count">共 0 笔记录</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">回款记录</h3>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                            <!-- 年份 -->
                            <select id="pay-year-select" class="picker-select" style="padding: 0.4rem 0.75rem;">
                                ${this.renderYearOptions()}
                            </select>
                            <!-- 月份 -->
                            <select id="pay-month-select" class="picker-select" style="padding: 0.4rem 0.75rem;">
                                ${this.renderMonthOptions()}
                            </select>
                            <!-- 日期 -->
                            <select id="pay-day-select" class="picker-select" style="padding: 0.4rem 0.75rem;">
                                ${this.renderDayOptions()}
                            </select>
                            <!-- 员工 -->
                            <select id="pay-emp-select" class="picker-select" style="padding: 0.4rem 0.75rem; max-width: 120px;">
                                ${this.renderEmployeeOptions()}
                            </select>
                            <!-- 公司搜索 -->
                            <div style="position:relative;">
                                <input type="text" id="pay-company-search" placeholder="搜索公司..." 
                                    value="${this.searchCompany}"
                                    style="padding: 0.4rem 0.75rem; padding-left: 2rem; border: 1px solid #ddd; border-radius: 6px; width: 140px;">
                                <i class="ri-search-line" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #999;"></i>
                            </div>

                            <button class="btn btn-primary btn-sm" onclick="Payments.showAddModal()">
                                <i class="ri-add-line"></i> 录入
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>公司名称</th>
                                    <th>回款金额</th>
                                    <th>负责人</th>
                                    <th>回款时间</th>
                                    <th>备注</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="pay-table-body">
                                <!-- 数据行由 updateList 渲染 -->
                            </tbody>
                        </table>
                        <p id="pay-empty-msg" class="text-center text-muted" style="padding: 2rem; display: none;">暂无回款记录</p>
                    </div>
                </div>
            `;
            this.bindFilterEvents();
            this.isInitialized = true;
        }

        // 更新数据列表
        this.updateList();
    },

    updateList() {
        // 1. 获取并筛选数据
        let filteredPayments = DataManager.getAll('paymentRecords');

        // 筛选年份 (必须)
        filteredPayments = filteredPayments.filter(p => {
            return new Date(p.paymentTime).getFullYear() === this.selectedYear;
        });

        // 筛选月份
        if (this.selectedMonth !== 'all') {
            filteredPayments = filteredPayments.filter(p => {
                return (new Date(p.paymentTime).getMonth() + 1) === this.selectedMonth;
            });
        }

        // 筛选日期
        if (this.selectedDay !== 'all') {
            filteredPayments = filteredPayments.filter(p => {
                return new Date(p.paymentTime).getDate() === this.selectedDay;
            });
        }

        // 筛选员工
        if (this.selectedEmployeeId !== 'all') {
            filteredPayments = filteredPayments.filter(p => p.employeeId === this.selectedEmployeeId);
        }

        // 筛选公司名称
        if (this.searchCompany.trim()) {
            const keyword = this.searchCompany.trim().toLowerCase();
            filteredPayments = filteredPayments.filter(p =>
                (p.customerName || '').toLowerCase().includes(keyword)
            );
        }

        // 排序：时间倒序
        filteredPayments.sort((a, b) => new Date(b.paymentTime) - new Date(a.paymentTime));

        // 2. 计算统计数据
        const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        // 3. 更新 DOM
        const tbody = document.getElementById('pay-table-body');
        const emptyMsg = document.getElementById('pay-empty-msg');
        const totalAmountEl = document.getElementById('pay-total-amount');
        const countEl = document.getElementById('pay-record-count');

        if (totalAmountEl) totalAmountEl.innerText = Utils.formatCurrency(totalAmount);
        if (countEl) countEl.innerText = `共 ${filteredPayments.length} 笔记录`;

        if (filteredPayments.length === 0) {
            if (tbody) tbody.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
        } else {
            if (emptyMsg) emptyMsg.style.display = 'none';
            if (tbody) {
                tbody.innerHTML = filteredPayments.map(p => this.renderPaymentRow(p)).join('');
            }
        }
    },

    renderYearOptions() {
        const currentYear = new Date().getFullYear();
        let html = '';
        for (let y = currentYear; y >= currentYear - 3; y--) {
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
        document.getElementById('pay-year-select')?.addEventListener('change', e => {
            this.selectedYear = parseInt(e.target.value);
            this.updateList();
        });
        document.getElementById('pay-month-select')?.addEventListener('change', e => {
            const val = e.target.value;
            this.selectedMonth = val === 'all' ? 'all' : parseInt(val);
            this.updateList();
        });
        document.getElementById('pay-day-select')?.addEventListener('change', e => {
            const val = e.target.value;
            this.selectedDay = val === 'all' ? 'all' : parseInt(val);
            this.updateList();
        });
        document.getElementById('pay-emp-select')?.addEventListener('change', e => {
            this.selectedEmployeeId = e.target.value;
            this.updateList();
        });
        document.getElementById('pay-company-search')?.addEventListener('input', e => {
            this.searchCompany = e.target.value;
            this.updateList();
        });
    },

    renderPaymentRow(payment) {
        const employee = DataManager.getById('employees', payment.employeeId);

        return `
            <tr>
                <td><strong>${payment.customerName || '-'}</strong></td>
                <td><strong style="color: var(--warning-color);">${Utils.formatCurrency(payment.amount)}</strong></td>
                <td>${employee?.name || '未知'}</td>
                <td>${Utils.formatDate(payment.paymentTime)}</td>
                <td>
                    ${payment.remark ?
                `<span title="${payment.remark}">${payment.remark.length > 10 ? payment.remark.substring(0, 10) + '...' : payment.remark}</span>`
                : '-'}
                </td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Payments.showEditModal('${payment.id}')">
                        <i class="ri-edit-line"></i> 编辑
                    </button>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Payments.deletePayment('${payment.id}')">
                        <i class="ri-delete-bin-line"></i> 删除
                    </button>
                </td>
            </tr>
        `;
    },

    showAddModal() {
        const employees = DataManager.query('employees', { status: '在职' });

        const content = `
            <form id="payment-form">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>公司名称 <span style="color: var(--error-color);">*</span></label>
                        <input type="text" name="customerName" required placeholder="请输入公司名称">
                    </div>
                    <div class="form-group">
                        <label>负责人 <span style="color: var(--error-color);">*</span></label>
                        <select name="employeeId" required>
                            <option value="">请选择负责人</option>
                            ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>回款金额 <span style="color: var(--error-color);">*</span></label>
                        <input type="number" name="amount" step="0.01" min="0" required placeholder="请输入金额">
                    </div>
                    <div class="form-group">
                        <label>回款时间 <span style="color: var(--error-color);">*</span></label>
                        <input type="datetime-local" name="paymentTime" 
                               value="${Utils.formatDate(new Date(), 'datetime').replace(' ', 'T')}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" placeholder="请输入备注信息"></textarea>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '录入回款',
            content: content,
            size: 'lg',
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                { text: '确认录入', class: 'btn btn-primary', onClick: () => this.savePayment() }
            ]
        });
    },

    showEditModal(paymentId) {
        const payment = DataManager.getById('paymentRecords', paymentId);
        const employees = DataManager.query('employees', { status: '在职' });
        if (!payment) return;

        const content = `
            <form id="payment-form">
                <input type="hidden" name="id" value="${payment.id}">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>公司名称 <span style="color: var(--error-color);">*</span></label>
                        <input type="text" name="customerName" value="${payment.customerName || ''}" required placeholder="请输入公司名称">
                    </div>
                    <div class="form-group">
                        <label>负责人 <span style="color: var(--error-color);">*</span></label>
                        <select name="employeeId" required>
                            <option value="">请选择负责人</option>
                            ${employees.map(e =>
            `<option value="${e.id}" ${e.id === payment.employeeId ? 'selected' : ''}>${e.name}</option>`
        ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>回款金额 <span style="color: var(--error-color);">*</span></label>
                        <input type="number" name="amount" step="0.01" min="0" value="${payment.amount}" required>
                    </div>
                    <div class="form-group">
                        <label>回款时间 <span style="color: var(--error-color);">*</span></label>
                        <input type="datetime-local" name="paymentTime" 
                               value="${Utils.formatDate(payment.paymentTime, 'datetime').replace(' ', 'T')}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark">${payment.remark || ''}</textarea>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '编辑回款',
            content: content,
            size: 'lg',
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                { text: '保存修改', class: 'btn btn-primary', onClick: () => this.savePayment() }
            ]
        });
    },

    async savePayment() {
        const form = document.getElementById('payment-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (!data.customerName?.trim()) {
            Utils.showToast('请输入公司名称', 'error');
            return;
        }

        if (!data.employeeId) {
            Utils.showToast('请选择负责人', 'error');
            return;
        }

        if (!data.amount || parseFloat(data.amount) <= 0) {
            Utils.showToast('请输入有效的回款金额', 'error');
            return;
        }

        const paymentData = {
            customerName: data.customerName.trim(),
            employeeId: data.employeeId,
            amount: parseFloat(data.amount),
            paymentTime: new Date(data.paymentTime).toISOString(),
            remark: data.remark?.trim() || ''
        };

        if (data.id) {
            await DataManager.update('paymentRecords', data.id, paymentData);
            Utils.showToast('回款记录更新成功！', 'success');
        } else {
            await DataManager.add('paymentRecords', paymentData);
            Utils.showToast('回款录入成功！', 'success');
        }

        document.querySelector('.modal-overlay').remove();
        App.loadPage('payments');
    },

    async deletePayment(paymentId) {
        const confirmed = await Utils.confirm('确定要删除这条回款记录吗？');
        if (!confirmed) return;

        await DataManager.delete('paymentRecords', paymentId);
        Utils.showToast('回款记录删除成功！', 'success');
        App.loadPage('payments');
    }
};
