// ==================== 拜访记录模块 ====================

const VisitRecords = {
    showAddModal(customerId) {
        const customer = DataManager.getById('customers', customerId);
        const employees = DataManager.query('employees', { status: '在职' });

        const content = `
            <form id="visit-form">
                <input type="hidden" name="customerId" value="${customerId}">
                <div class="form-group">
                    <label>客户名称</label>
                    <input type="text" value="${customer.companyName}" disabled>
                </div>
                <div class="form-group">
                    <label>拜访人员 <span style="color: var(--error-color);">*</span></label>
                    <select name="employeeId" required>
                        <option value="">请选择拜访人员</option>
                        ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>拜访时间 <span style="color: var(--error-color);">*</span></label>
                    <input type="datetime-local" name="visitTime" value="${Utils.formatDate(new Date(), 'datetime').replace(' ', 'T')}" required>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="notes" placeholder="请输入拜访备注"></textarea>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '添加拜访记录',
            content: content,
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '确认添加',
                    class: 'btn btn-primary',
                    onClick: () => this.saveVisit()
                }
            ]
        });
    },

    saveVisit() {
        const form = document.getElementById('visit-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (!data.employeeId) {
            Utils.showToast('请选择拜访人员', 'error');
            return;
        }

        DataManager.add('visitRecords', {
            customerId: data.customerId,
            employeeId: data.employeeId,
            visitTime: new Date(data.visitTime).toISOString(),
            notes: data.notes?.trim() || ''
        });

        Utils.showToast('拜访记录添加成功！', 'success');
        document.querySelector('.modal-overlay').remove();

        // 如果在客户详情页，重新打开详情
        if (Customers.currentCustomerId) {
            Customers.showDetailModal(Customers.currentCustomerId);
        }
    }
};
