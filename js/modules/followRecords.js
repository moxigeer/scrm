// ==================== 跟进记录模块 ====================

const FollowRecords = {
    showAddModal(customerId) {
        const customer = DataManager.getById('customers', customerId);
        const employees = DataManager.query('employees', { status: '在职' });

        const content = `
            <form id="follow-form">
                <input type="hidden" name="customerId" value="${customerId}">
                <div class="form-group">
                    <label>客户名称</label>
                    <input type="text" value="${customer.companyName}" disabled>
                </div>
                <div class="form-group">
                    <label>跟进人员 <span style="color: var(--error-color);">*</span></label>
                    <select name="employeeId" required>
                        <option value="">请选择跟进人员</option>
                        ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>跟进时间 <span style="color: var(--error-color);">*</span></label>
                    <input type="datetime-local" name="followTime" value="${Utils.formatDate(new Date(), 'datetime').replace(' ', 'T')}" required>
                </div>
                <div class="form-group">
                    <label>跟进内容 <span style="color: var(--error-color);">*</span></label>
                    <textarea name="content" required placeholder="请输入跟进内容"></textarea>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '添加跟进记录',
            content: content,
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '确认添加',
                    class: 'btn btn-primary',
                    onClick: () => this.saveFollow()
                }
            ]
        });
    },

    saveFollow() {
        const form = document.getElementById('follow-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (!data.employeeId) {
            Utils.showToast('请选择跟进人员', 'error');
            return;
        }

        if (!data.content?.trim()) {
            Utils.showToast('请输入跟进内容', 'error');
            return;
        }

        DataManager.add('followRecords', {
            customerId: data.customerId,
            employeeId: data.employeeId,
            content: data.content.trim(),
            followTime: new Date(data.followTime).toISOString()
        });

        Utils.showToast('跟进记录添加成功！', 'success');
        document.querySelector('.modal-overlay').remove();

        // 如果在客户详情页，重新打开详情
        if (Customers.currentCustomerId) {
            Customers.showDetailModal(Customers.currentCustomerId);
        }
    }
};
