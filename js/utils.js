// ==================== 工具函数库 ====================

const Utils = {
    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 格式化日期时间
     * @param {Date|string} date - 日期对象或字符串
     * @param {string} format - 格式类型: 'date', 'datetime', 'time'
     */
    formatDate(date, format = 'datetime') {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        switch (format) {
            case 'date':
                return `${year}-${month}-${day}`;
            case 'time':
                return `${hours}:${minutes}:${seconds}`;
            case 'datetime':
            default:
                return `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    },

    /**
     * 显示提示框
     * @param {string} message - 提示信息
     * @param {string} type - 类型: success, error, warning, info
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span style="font-size: 1.25rem;">${icons[type]}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * 显示确认对话框
     * @param {string} message - 提示信息
     * @returns {Promise<boolean>}
     */
    confirm(message) {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title: '确认操作',
                content: `<p style="line-height: 1.8;">${message}</p>`,
                buttons: [
                    {
                        text: '取消',
                        class: 'btn btn-secondary',
                        onClick: () => {
                            modal.close();
                            resolve(false);
                        }
                    },
                    {
                        text: '确认',
                        class: 'btn btn-primary',
                        onClick: () => {
                            modal.close();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    },

    /**
     * 创建模态框
     * @param {Object} options - 配置选项
     */
    createModal(options) {
        const { title, content, buttons = [], size = 'md' } = options;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'modal';
        if (size === 'lg') modal.style.maxWidth = '900px';
        if (size === 'sm') modal.style.maxWidth = '400px';

        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${buttons.length > 0 ? `
                <div class="modal-footer">
                    ${buttons.map((btn, idx) =>
            `<button class="modal-btn-${idx} ${btn.class || 'btn btn-secondary'}">${btn.text}</button>`
        ).join('')}
                </div>
            ` : ''}
        `;

        overlay.appendChild(modal);
        document.getElementById('modal-container').appendChild(overlay);

        // 关闭按钮
        const closeBtn = modal.querySelector('.modal-close');
        const close = () => {
            overlay.remove();
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // 自定义按钮
        buttons.forEach((btn, idx) => {
            const btnEl = modal.querySelector(`.modal-btn-${idx}`);
            if (btnEl) {
                btnEl.addEventListener('click', () => {
                    if (btn.onClick) {
                        btn.onClick();
                    } else {
                        // 没有onClick的按钮（如取消）点击时关闭弹窗
                        close();
                    }
                });
            }
        });

        return { element: overlay, close };
    },

    /**
     * 显示加载指示器
     */
    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    },

    /**
     * 隐藏加载指示器
     */
    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    },

    /**
     * 验证邮箱格式
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * 验证手机号格式
     */
    validatePhone(phone) {
        const re = /^1[3-9]\d{9}$/;
        return re.test(phone);
    },

    /**
     * 数字格式化（添加千位分隔符）
     */
    formatNumber(num) {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * 货币格式化
     */
    formatCurrency(amount) {
        if (!amount && amount !== 0) return '¥0.00';
        return '¥' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * 文件大小格式化
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 深拷贝对象
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * 导出为Excel文件
     */
    exportToExcel(data, filename) {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, filename);
    },

    /**
     * 读取Excel文件
     */
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
