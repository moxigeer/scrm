// ==================== 员工管理模块 ====================

const Employees = {
    render(container) {
        const employees = DataManager.getAll('employees');

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">员工列表</h3>
                    <button class="btn btn-primary" onclick="Employees.showAddModal()">
                        ➕ 添加员工
                    </button>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>姓名</th>
                                <th>职位</th>
                                <th>电话</th>
                                <th>邮箱</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employees.map(emp => this.renderEmployeeRow(emp)).join('')}
                        </tbody>
                    </table>
                    ${employees.length === 0 ? '<p class="text-center text-muted" style="padding: 2rem;">暂无员工数据</p>' : ''}
                </div>
            </div>
        `;
    },

    renderEmployeeRow(emp) {
        const statusBadge = emp.status === '在职'
            ? '<span class="badge badge-success">在职</span>'
            : '<span class="badge badge-error">离职</span>';

        return `
            <tr>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.position || '-'}</td>
                <td>${emp.phone || '-'}</td>
                <td>${emp.email || '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Employees.showEditModal('${emp.id}')">
                        编辑
                    </button>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Employees.deleteEmployee('${emp.id}')">
                        删除
                    </button>
                </td>
            </tr>
        `;
    },

    showAddModal() {
        const content = `
            <form id="employee-form">
                <div class="form-group">
                    <label>姓名 <span style="color: var(--error-color);">*</span></label>
                    <input type="text" name="name" required placeholder="请输入姓名">
                </div>
                <div class="form-group">
                    <label>职位</label>
                    <input type="text" name="position" placeholder="请输入职位">
                </div>
                <div class="form-group">
                    <label>电话</label>
                    <input type="tel" name="phone" placeholder="请输入电话">
                </div>
                <div class="form-group">
                    <label>邮箱</label>
                    <input type="email" name="email" placeholder="请输入邮箱">
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="在职">在职</option>
                        <option value="离职">离职</option>
                    </select>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '添加员工',
            content: content,
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '确认添加',
                    class: 'btn btn-primary',
                    onClick: () => this.saveEmployee()
                }
            ]
        });
    },

    showEditModal(empId) {
        const emp = DataManager.getById('employees', empId);
        if (!emp) return;

        const content = `
            <form id="employee-form">
                <input type="hidden" name="id" value="${emp.id}">
                <div class="form-group">
                    <label>姓名 <span style="color: var(--error-color);">*</span></label>
                    <input type="text" name="name" value="${emp.name}" required>
                </div>
                <div class="form-group">
                    <label>职位</label>
                    <input type="text" name="position" value="${emp.position || ''}">
                </div>
                <div class="form-group">
                    <label>电话</label>
                    <input type="tel" name="phone" value="${emp.phone || ''}">
                </div>
                <div class="form-group">
                    <label>邮箱</label>
                    <input type="email" name="email" value="${emp.email || ''}">
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="在职" ${emp.status === '在职' ? 'selected' : ''}>在职</option>
                        <option value="离职" ${emp.status === '离职' ? 'selected' : ''}>离职</option>
                    </select>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '编辑员工',
            content: content,
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '保存修改',
                    class: 'btn btn-primary',
                    onClick: () => this.saveEmployee()
                }
            ]
        });
    },

    async saveEmployee() {
        const form = document.getElementById('employee-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // 验证
        if (!data.name?.trim()) {
            Utils.showToast('请输入员工姓名', 'error');
            return;
        }

        if (data.phone && !Utils.validatePhone(data.phone)) {
            Utils.showToast('请输入正确的手机号', 'error');
            return;
        }

        if (data.email && !Utils.validateEmail(data.email)) {
            Utils.showToast('请输入正确的邮箱地址', 'error');
            return;
        }

        if (data.id) {
            // 更新
            await DataManager.update('employees', data.id, {
                name: data.name.trim(),
                position: data.position?.trim() || '',
                phone: data.phone?.trim() || '',
                email: data.email?.trim() || '',
                status: data.status || '在职'
            });
            Utils.showToast('员工信息更新成功！', 'success');
        } else {
            // 添加
            await DataManager.add('employees', {
                name: data.name.trim(),
                position: data.position?.trim() || '',
                phone: data.phone?.trim() || '',
                email: data.email?.trim() || '',
                status: data.status || '在职'
            });
            Utils.showToast('员工添加成功！', 'success');
        }

        // 关闭模态框
        document.querySelector('.modal-overlay').remove();

        // 刷新页面
        App.loadPage('employees');
    },

    async deleteEmployee(empId) {
        const confirmed = await Utils.confirm('确定要删除这名员工吗？此操作无法撤销。');
        if (!confirmed) return;

        await DataManager.delete('employees', empId);
        Utils.showToast('员工删除成功！', 'success');
        App.loadPage('employees');
    }
};
