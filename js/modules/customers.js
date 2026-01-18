// ==================== 客户管理模块 ====================

const Customers = {
    currentCustomerId: null,

    render(container) {
        const customers = DataManager.getAll('customers');

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">客户列表</h3>
                    <button class="btn btn-primary" onclick="Customers.showAddModal()">
                        ➕ 添加客户
                    </button>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>公司名称</th>
                                <th>联系人</th>
                                <th>联系方式</th>
                                <th>销售人员</th>
                                <th>意向等级</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customers.map(c => this.renderCustomerRow(c)).join('')}
                        </tbody>
                    </table>
                    ${customers.length === 0 ? '<p class="text-center text-muted" style="padding: 2rem;">暂无客户数据</p>' : ''}
                </div>
            </div>
        `;
    },

    renderCustomerRow(customer) {
        const salesPerson = DataManager.getEmployeeName(customer.salesPersonId);
        const levelBadge = {
            '高': '<span class="badge badge-success">高</span>',
            '中': '<span class="badge badge-warning">中</span>',
            '低': '<span class="badge badge-info">低</span>'
        };

        return `
            <tr>
                <td><strong>${customer.companyName}</strong></td>
                <td>${customer.contactPerson || '-'}</td>
                <td>${customer.contactPhone || '-'}</td>
                <td>${salesPerson}</td>
                <td>${levelBadge[customer.intentionLevel] || customer.intentionLevel}</td>
                <td>${Utils.formatDate(customer.createTime, 'date')}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Customers.showDetailModal('${customer.id}')">
                        详情
                    </button>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Customers.showEditModal('${customer.id}')">
                        编辑
                    </button>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Customers.deleteCustomer('${customer.id}')">
                        删除
                    </button>
                </td>
            </tr>
        `;
    },

    showAddModal() {
        const employees = DataManager.query('employees', { status: '在职' });

        const content = `
            <form id="customer-form">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>公司名称 <span style="color: var(--error-color);">*</span></label>
                        <input type="text" name="companyName" required placeholder="请输入公司名称">
                    </div>
                    <div class="form-group">
                        <label>联系人 <span style="color: var(--error-color);">*</span></label>
                        <input type="text" name="contactPerson" required placeholder="请输入联系人">
                    </div>
                    <div class="form-group">
                        <label>联系方式 <span style="color: var(--error-color);">*</span></label>
                        <input type="tel" name="contactPhone" required placeholder="请输入联系方式">
                    </div>
                    <div class="form-group">
                        <label>销售人员 <span style="color: var(--error-color);">*</span></label>
                        <select name="salesPersonId" required>
                            <option value="">请选择销售人员</option>
                            ${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>意向等级 <span style="color: var(--error-color);">*</span></label>
                        <select name="intentionLevel" required>
                            <option value="高">高</option>
                            <option value="中" selected>中</option>
                            <option value="低">低</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '添加客户',
            content: content,
            size: 'lg',
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '确认添加',
                    class: 'btn btn-primary',
                    onClick: () => this.saveCustomer()
                }
            ]
        });
    },

    showEditModal(customerId) {
        const customer = DataManager.getById('customers', customerId);
        const employees = DataManager.query('employees', { status: '在职' });
        if (!customer) return;

        const content = `
            <form id="customer-form">
                <input type="hidden" name="id" value="${customer.id}">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>公司名称 <span style="color: var(--error-color);">*</span></label>
                        <input type="text" name="companyName" value="${customer.companyName}" required>
                    </div>
                    <div class="form-group">
                        <label>联系人 <span style="color: var(--error-color);">*</span></label>
                        <input type="text" name="contactPerson" value="${customer.contactPerson || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>联系方式 <span style="color: var(--error-color);">*</span></label>
                        <input type="tel" name="contactPhone" value="${customer.contactPhone || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>销售人员 <span style="color: var(--error-color);">*</span></label>
                        <select name="salesPersonId" required>
                            <option value="">请选择销售人员</option>
                            ${employees.map(e =>
            `<option value="${e.id}" ${e.id === customer.salesPersonId ? 'selected' : ''}>${e.name}</option>`
        ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>意向等级 <span style="color: var(--error-color);">*</span></label>
                        <select name="intentionLevel" required>
                            <option value="高" ${customer.intentionLevel === '高' ? 'selected' : ''}>高</option>
                            <option value="中" ${customer.intentionLevel === '中' ? 'selected' : ''}>中</option>
                            <option value="低" ${customer.intentionLevel === '低' ? 'selected' : ''}>低</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '编辑客户',
            content: content,
            size: 'lg',
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '保存修改',
                    class: 'btn btn-primary',
                    onClick: () => this.saveCustomer()
                }
            ]
        });
    },

    showDetailModal(customerId) {
        const customer = DataManager.getById('customers', customerId);
        if (!customer) return;

        this.currentCustomerId = customerId;
        const salesPerson = DataManager.getEmployeeName(customer.salesPersonId);
        const followRecords = DataManager.getCustomerFollowRecords(customerId);
        const visitRecords = DataManager.getCustomerVisitRecords(customerId);
        const recordings = DataManager.getCustomerRecordings(customerId);

        const content = `
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 1rem;">基本信息</h4>
                <div class="grid grid-2" style="gap: 0.5rem;">
                    <div><strong>公司名称：</strong>${customer.companyName}</div>
                    <div><strong>联系人：</strong>${customer.contactPerson}</div>
                    <div><strong>联系方式：</strong>${customer.contactPhone}</div>
                    <div><strong>销售人员：</strong>${salesPerson}</div>
                    <div><strong>意向等级：</strong>${customer.intentionLevel}</div>
                    <div><strong>创建时间：</strong>${Utils.formatDate(customer.createTime)}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4>跟进记录 (${followRecords.length})</h4>
                    <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="FollowRecords.showAddModal('${customerId}')">
                        ➕ 添加跟进
                    </button>
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${followRecords.length === 0 ? '<p class="text-muted">暂无跟进记录</p>' :
                followRecords.map(f => `
                            <div style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <strong>${DataManager.getEmployeeName(f.employeeId)}</strong>
                                    <span class="text-muted">${Utils.formatDate(f.followTime)}</span>
                                </div>
                                <div>${f.content}</div>
                            </div>
                        `).join('')
            }
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4>拜访记录 (${visitRecords.length})</h4>
                    <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="VisitRecords.showAddModal('${customerId}')">
                        ➕ 添加拜访
                    </button>
                </div>
                <div style="max-height: 150px; overflow-y: auto;">
                    ${visitRecords.length === 0 ? '<p class="text-muted">暂无拜访记录</p>' :
                visitRecords.map(v => `
                            <div style="padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                <strong>${DataManager.getEmployeeName(v.employeeId)}</strong> - 
                                ${Utils.formatDate(v.visitTime)}
                                ${v.notes ? `<div class="text-muted" style="font-size: 0.9rem;">${v.notes}</div>` : ''}
                            </div>
                        `).join('')
            }
                </div>
            </div>

            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4>录音文件 (${recordings.length})</h4>
                    <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Recordings.showUploadModal('${customerId}')">
                        ➕ 上传录音
                    </button>
                </div>
                <div style="max-height: 150px; overflow-y: auto;">
                    ${recordings.length === 0 ? '<p class="text-muted">暂无录音文件</p>' :
                recordings.map(r => `
                            <div style="padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div>${r.filename}</div>
                                    <div class="text-muted" style="font-size: 0.85rem;">
                                        ${Utils.formatDate(r.uploadTime)} - ${Utils.formatFileSize(r.fileSize || 0)}
                                    </div>
                                </div>
                                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;">
                                    播放
                                </button>
                            </div>
                        `).join('')
            }
                </div>
            </div>
        `;

        Utils.createModal({
            title: '客户详情',
            content: content,
            size: 'lg',
            buttons: [
                {
                    text: '关闭',
                    class: 'btn btn-secondary'
                }
            ]
        });
    },

    saveCustomer() {
        const form = document.getElementById('customer-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // 验证
        if (!data.companyName?.trim()) {
            Utils.showToast('请输入公司名称', 'error');
            return;
        }

        if (!data.contactPerson?.trim()) {
            Utils.showToast('请输入联系人', 'error');
            return;
        }

        if (!data.contactPhone?.trim()) {
            Utils.showToast('请输入联系方式', 'error');
            return;
        }

        if (!data.salesPersonId) {
            Utils.showToast('请选择销售人员', 'error');
            return;
        }

        if (data.id) {
            // 更新
            DataManager.update('customers', data.id, {
                companyName: data.companyName.trim(),
                contactPerson: data.contactPerson.trim(),
                contactPhone: data.contactPhone.trim(),
                salesPersonId: data.salesPersonId,
                intentionLevel: data.intentionLevel
            });
            Utils.showToast('客户信息更新成功！', 'success');
        } else {
            // 添加
            DataManager.add('customers', {
                companyName: data.companyName.trim(),
                contactPerson: data.contactPerson.trim(),
                contactPhone: data.contactPhone.trim(),
                salesPersonId: data.salesPersonId,
                intentionLevel: data.intentionLevel
            });
            Utils.showToast('客户添加成功！', 'success');
        }

        // 关闭模态框
        document.querySelector('.modal-overlay').remove();

        // 刷新页面
        App.loadPage('customers');
    },

    async deleteCustomer(customerId) {
        const confirmed = await Utils.confirm('确定要删除这个客户吗？相关的跟进记录、拜访记录等也会被删除，此操作无法撤销。');
        if (!confirmed) return;

        // 删除相关数据
        const followRecords = DataManager.query('followRecords', { customerId });
        followRecords.forEach(r => DataManager.delete('followRecords', r.id));

        const visitRecords = DataManager.query('visitRecords', { customerId });
        visitRecords.forEach(r => DataManager.delete('visitRecords', r.id));

        const recordings = DataManager.query('recordings', { customerId });
        recordings.forEach(r => DataManager.delete('recordings', r.id));

        DataManager.delete('customers', customerId);
        Utils.showToast('客户及相关数据删除成功！', 'success');
        App.loadPage('customers');
    }
};
