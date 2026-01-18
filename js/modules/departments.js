// ==================== 部门管理模块 ====================

const Departments = {
    render(container) {
        const departments = DataManager.getAll('departments');

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">部门列表</h3>
                    <button class="btn btn-primary" onclick="Departments.showAddModal()">
                        ➕ 添加部门
                    </button>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>部门名称</th>
                                <th>描述</th>
                                <th>员工数量</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${departments.map(dept => this.renderDepartmentRow(dept)).join('')}
                        </tbody>
                    </table>
                    ${departments.length === 0 ? '<p class="text-center text-muted" style="padding: 2rem;">暂无部门数据</p>' : ''}
                </div>
            </div>
        `;
    },

    renderDepartmentRow(dept) {
        const employeeCount = DataManager.query('employees', { departmentId: dept.id }).length;

        return `
            <tr>
                <td><strong>${dept.name}</strong></td>
                <td>${dept.description || '-'}</td>
                <td>${employeeCount} 人</td>
                <td>${Utils.formatDate(dept.createTime, 'datetime')}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Departments.showEditModal('${dept.id}')">
                        编辑
                    </button>
                    <button class="btn btn-danger" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;" 
                            onclick="Departments.deleteDepartment('${dept.id}')">
                        删除
                    </button>
                </td>
            </tr>
        `;
    },

    showAddModal() {
        const content = `
            <form id="dept-form">
                <div class="form-group">
                    <label>部门名称 <span style="color: var(--error-color);">*</span></label>
                    <input type="text" name="name" required placeholder="请输入部门名称">
                </div>
                <div class="form-group">
                    <label>部门描述</label>
                    <textarea name="description" placeholder="请输入部门描述"></textarea>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '添加部门',
            content: content,
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '确认添加',
                    class: 'btn btn-primary',
                    onClick: () => this.saveDepartment()
                }
            ]
        });
    },

    showEditModal(deptId) {
        const dept = DataManager.getById('departments', deptId);
        if (!dept) return;

        const content = `
            <form id="dept-form">
                <input type="hidden" name="id" value="${dept.id}">
                <div class="form-group">
                    <label>部门名称 <span style="color: var(--error-color);">*</span></label>
                    <input type="text" name="name" value="${dept.name}" required>
                </div>
                <div class="form-group">
                    <label>部门描述</label>
                    <textarea name="description">${dept.description || ''}</textarea>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '编辑部门',
            content: content,
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '保存修改',
                    class: 'btn btn-primary',
                    onClick: () => this.saveDepartment()
                }
            ]
        });
    },

    saveDepartment() {
        const form = document.getElementById('dept-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (!data.name?.trim()) {
            Utils.showToast('请输入部门名称', 'error');
            return;
        }

        if (data.id) {
            // 更新
            DataManager.update('departments', data.id, {
                name: data.name.trim(),
                description: data.description?.trim() || ''
            });
            Utils.showToast('部门更新成功！', 'success');
        } else {
            // 添加
            DataManager.add('departments', {
                name: data.name.trim(),
                description: data.description?.trim() || ''
            });
            Utils.showToast('部门添加成功！', 'success');
        }

        // 关闭模态框
        document.querySelector('.modal-overlay').remove();

        // 刷新页面
        App.loadPage('departments');
    },

    async deleteDepartment(deptId) {
        const employeeCount = DataManager.query('employees', { departmentId: deptId }).length;

        if (employeeCount > 0) {
            Utils.showToast(`该部门下还有 ${employeeCount} 名员工，无法删除！`, 'warning');
            return;
        }

        const confirmed = await Utils.confirm('确定要删除这个部门吗？此操作无法撤销。');
        if (!confirmed) return;

        DataManager.delete('departments', deptId);
        Utils.showToast('部门删除成功！', 'success');
        App.loadPage('departments');
    }
};
