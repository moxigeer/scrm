/**
 * 认证管理模块
 * 处理用户登录、登出和认证状态管理
 */

const AuthManager = {
    currentUser: null,

    /**
     * 初始化认证状态监听
     */
    async init() {
        // 监听认证状态变化
        SupabaseClient.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null;
            this.handleAuthChange(event, session);
        });

        // 获取当前会话
        const { data: { session } } = await SupabaseClient.auth.getSession();
        this.currentUser = session?.user || null;

        return this.currentUser;
    },

    /**
     * 处理认证状态变化
     */
    handleAuthChange(event, session) {
        console.log('认证状态变化:', event);

        if (event === 'SIGNED_OUT') {
            // 跳转到登录页
            window.location.href = 'login.html';
        }
    },

    /**
     * 邮箱密码登录
     * @param {string} email 邮箱
     * @param {string} password 密码
     */
    async login(email, password) {
        const { data, error } = await SupabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error(error.message);
        }

        this.currentUser = data.user;
        return data.user;
    },

    /**
     * 退出登录
     */
    async logout() {
        const { error } = await SupabaseClient.auth.signOut();

        if (error) {
            throw new Error(error.message);
        }

        this.currentUser = null;
        window.location.href = 'login.html';
    },

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.currentUser;
    },

    /**
     * 检查是否已登录
     */
    isAuthenticated() {
        return this.currentUser !== null;
    },

    /**
     * 获取当前用户邮箱
     */
    getUserEmail() {
        return this.currentUser?.email || '';
    }
};

// 导出供其他模块使用
window.AuthManager = AuthManager;
