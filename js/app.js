// ==================== 应用主控制器 ====================

const App = {
    currentPage: 'dashboard',

    /**
     * 初始化应用
     * 检查认证状态，未登录则跳转到登录页
     */
    async init() {
        // 初始化认证管理器
        const user = await AuthManager.init();

        // 未登录则跳转到登录页
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // 初始化数据管理器
        await DataManager.init();

        // 渲染用户信息
        this.renderUserInfo();

        // 绑定导航事件
        this.bindNavigation();

        // 绑定全局操作
        this.bindGlobalActions();

        // 加载默认页面
        this.loadPage('dashboard');
    },

    /**
     * 渲染用户信息（顶部栏）
     */
    renderUserInfo() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // 在侧边栏底部添加用户信息
        const userSection = document.createElement('div');
        userSection.className = 'user-section';
        userSection.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    <i class="ri-user-line"></i>
                </div>
                <div class="user-details">
                    <span class="user-email">${AuthManager.getUserEmail()}</span>
                </div>
            </div>
            <button class="logout-btn" title="退出登录">
                <i class="ri-logout-box-r-line"></i>
            </button>
        `;

        sidebar.appendChild(userSection);

        // 绑定退出事件
        userSection.querySelector('.logout-btn').addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                await AuthManager.logout();
            }
        });
    },

    // 绑定导航事件
    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;

                // 更新导航状态
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // 加载页面
                this.loadPage(page);
            });
        });
    },

    // 绑定全局操作
    bindGlobalActions() {
        // 全局操作已移除，保留函数占位以免报错
    },

    // 加载页面
    loadPage(pageName) {
        this.currentPage = pageName;
        const content = document.getElementById('page-content');

        // 加载对应模块
        switch (pageName) {
            case 'dashboard':
                Dashboard.render(content);
                break;
            case 'employees':
                Employees.render(content);
                break;
            case 'tasks':
                TaskRecords.render(content);
                break;
            case 'payments':
                Payments.render(content);
                break;
            case 'statistics':
                Statistics.render(content);
                break;
            case 'ai-assistant':
                AIAssistant.render(content);
                break;
            default:
                content.innerHTML = '<p>页面不存在</p>';
        }
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
