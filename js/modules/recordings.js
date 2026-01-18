// ==================== 录音文件管理模块 ====================

const Recordings = {
    showUploadModal(customerId) {
        const customer = DataManager.getById('customers', customerId);

        const content = `
            <form id="recording-form">
                <input type="hidden" name="customerId" value="${customerId}">
                <div class="form-group">
                    <label>客户名称</label>
                    <input type="text" value="${customer.companyName}" disabled>
                </div>
                <div class="form-group">
                    <label>选择录音文件 <span style="color: var(--error-color);">*</span></label>
                    <input type="file" id="recording-file" accept="audio/*" required 
                           style="padding: 0.5rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); width: 100%; color: var(--text-primary);">
                </div>
                <div class="form-group">
                    <label>说明</label>
                    <textarea name="description" placeholder="请输入录音说明"></textarea>
                </div>
            </form>
        `;

        Utils.createModal({
            title: '上传录音文件',
            content: content,
            buttons: [
                {
                    text: '取消',
                    class: 'btn btn-secondary'
                },
                {
                    text: '确认上传',
                    class: 'btn btn-primary',
                    onClick: () => this.uploadRecording()
                }
            ]
        });
    },

    async uploadRecording() {
        const form = document.getElementById('recording-form');
        const formData = new FormData(form);
        const fileInput = document.getElementById('recording-file');
        const file = fileInput.files[0];

        if (!file) {
            Utils.showToast('请选择录音文件', 'error');
            return;
        }

        Utils.showLoading();

        try {
            // 读取文件为base64
            const base64 = await this.readFileAsBase64(file);

            DataManager.add('recordings', {
                customerId: formData.get('customerId'),
                filename: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileData: base64, // 存储base64数据
                description: formData.get('description')?.trim() || '',
                uploadTime: new Date().toISOString()
            });

            Utils.hideLoading();
            Utils.showToast('录音文件上传成功！', 'success');
            document.querySelector('.modal-overlay').remove();

            // 如果在客户详情页，重新打开详情
            if (Customers.currentCustomerId) {
                Customers.showDetailModal(Customers.currentCustomerId);
            }
        } catch (error) {
            Utils.hideLoading();
            console.error('上传失败:', error);
            Utils.showToast('录音文件上传失败！', 'error');
        }
    },

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};
