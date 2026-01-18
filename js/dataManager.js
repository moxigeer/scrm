// ==================== 数据管理模块 (Supabase版本) ====================

const DataManager = {
    data: {
        employees: [],
        taskRecords: [],
        paymentRecords: []
    },
    settings: {},
    isLoading: false,

    // 表名映射（前端名称 -> 数据库表名）
    tableMap: {
        'employees': 'employees',
        'taskRecords': 'task_records',
        'paymentRecords': 'payment_records'
    },

    // 字段名映射（前端驼峰 -> 数据库下划线）
    fieldMap: {
        'employeeId': 'employee_id',
        'phoneCount': 'phone_count',
        'wechatCount': 'wechat_count',
        'intentionCount': 'intention_count',
        'visitCount': 'visit_count',
        'contractCount': 'contract_count',
        'totalScore': 'total_score',
        'createTime': 'create_time',
        'customerName': 'customer_name',
        'paymentTime': 'payment_time'
    },

    /**
     * 将前端对象转换为数据库格式
     */
    toDbFormat(item) {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            const dbKey = this.fieldMap[key] || key;
            result[dbKey] = value;
        }
        return result;
    },

    /**
     * 将数据库对象转换为前端格式
     */
    fromDbFormat(item) {
        if (!item) return null;
        const reverseMap = {};
        for (const [k, v] of Object.entries(this.fieldMap)) {
            reverseMap[v] = k;
        }
        const result = {};
        for (const [key, value] of Object.entries(item)) {
            const frontKey = reverseMap[key] || key;
            result[frontKey] = value;
        }
        return result;
    },

    /**
     * 初始化 - 从 Supabase 加载数据
     */
    async init() {
        console.log('=== DataManager.init() 开始 ===');

        // 先加载本地保存的设置作为备份
        this.loadSettingsFromLocalStorage();

        try {
            console.log('1. 检查 SupabaseClient:', !!window.SupabaseClient);

            if (!window.SupabaseClient) {
                throw new Error('SupabaseClient 未初始化');
            }

            console.log('2. 开始并行加载数据...');

            // 并行加载所有数据
            const [employeesRes, taskRecordsRes, paymentRecordsRes, settingsRes] = await Promise.all([
                SupabaseClient.from('employees').select('*').order('create_time', { ascending: false }),
                SupabaseClient.from('task_records').select('*').order('date', { ascending: false }),
                SupabaseClient.from('payment_records').select('*').order('payment_time', { ascending: false }),
                SupabaseClient.from('settings').select('*')
            ]);

            console.log('3. 数据库响应:', {
                employees: { error: employeesRes.error, count: employeesRes.data?.length },
                taskRecords: { error: taskRecordsRes.error, count: taskRecordsRes.data?.length },
                paymentRecords: { error: paymentRecordsRes.error, count: paymentRecordsRes.data?.length },
                settings: { error: settingsRes.error, count: settingsRes.data?.length }
            });

            // 检查错误
            if (employeesRes.error) {
                console.error('员工数据加载错误:', employeesRes.error);
                throw employeesRes.error;
            }
            if (taskRecordsRes.error) {
                console.error('任务记录加载错误:', taskRecordsRes.error);
                throw taskRecordsRes.error;
            }
            if (paymentRecordsRes.error) {
                console.error('付款记录加载错误:', paymentRecordsRes.error);
                throw paymentRecordsRes.error;
            }

            // 转换数据格式
            this.data.employees = (employeesRes.data || []).map(item => this.fromDbFormat(item));
            this.data.taskRecords = (taskRecordsRes.data || []).map(item => this.fromDbFormat(item));
            this.data.paymentRecords = (paymentRecordsRes.data || []).map(item => this.fromDbFormat(item));

            console.log('4. 数据加载完成:', {
                employees: this.data.employees.length,
                taskRecords: this.data.taskRecords.length,
                paymentRecords: this.data.paymentRecords.length
            });

            // 加载设置
            if (settingsRes.data) {
                for (const row of settingsRes.data) {
                    this.settings[row.key] = row.value;
                }
            }

            console.log('✓ 数据已从 Supabase 加载成功！');
            return true;
        } catch (error) {
            console.error('=== 加载数据失败 ===');
            console.error('错误详情:', error);
            console.error('错误消息:', error.message);
            console.error('错误代码:', error.code);

            // 降级到 localStorage
            this.loadFromLocalStorage();
            console.log('已降级到 localStorage，本地数据:', this.data);

            Utils.showToast('无法连接数据库，已切换到离线模式', 'warning');
            return false;
        }
    },

    /**
     * 从 localStorage 加载设置
     */
    loadSettingsFromLocalStorage() {
        const prefix = 'setting_';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                const settingKey = key.substring(prefix.length);
                try {
                    this.settings[settingKey] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    this.settings[settingKey] = localStorage.getItem(key);
                }
            }
        }
    },

    /**
     * 降级到 localStorage（服务器不可用时）
     */
    loadFromLocalStorage() {
        const saved = localStorage.getItem('crm_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.data = { ...this.data, ...parsed };
            } catch (e) {
                console.error('本地数据解析失败');
            }
        }
    },

    /**
     * 获取所有数据
     */
    getAll(entity) {
        return this.data[entity] || [];
    },

    /**
     * 根据ID获取单条数据
     */
    getById(entity, id) {
        return this.getAll(entity).find(item => item.id === id);
    },

    /**
     * 添加数据
     */
    async add(entity, item) {
        console.log('=== DataManager.add() 开始 ===');
        console.log('实体:', entity);
        console.log('数据:', item);

        const tableName = this.tableMap[entity];
        if (!tableName) {
            console.error('未知实体:', entity);
            return null;
        }

        // 生成 ID 和创建时间
        if (!item.id) {
            item.id = this.generateId();
        }
        if (!item.createTime) {
            item.createTime = new Date().toISOString();
        }

        try {
            const dbItem = this.toDbFormat(item);
            console.log('转换后的数据库格式:', dbItem);
            console.log('插入到表:', tableName);

            const { data, error } = await SupabaseClient
                .from(tableName)
                .insert(dbItem)
                .select()
                .single();

            console.log('插入结果:', { data, error });

            if (error) {
                console.error('插入错误:', error);
                console.error('错误代码:', error.code);
                console.error('错误消息:', error.message);
                console.error('错误详情:', error.details);
                throw error;
            }

            const result = this.fromDbFormat(data);
            this.data[entity].unshift(result);
            console.log('✓ 数据添加成功:', result);
            return result;
        } catch (error) {
            console.error('保存失败:', error);
            // 降级到本地
            this.data[entity].unshift(item);
            this.saveToLocalStorage();
            return item;
        }
    },

    /**
     * 更新数据
     */
    async update(entity, id, updates) {
        const tableName = this.tableMap[entity];
        const index = this.data[entity].findIndex(item => item.id === id);
        if (index === -1) return null;

        const updated = { ...this.data[entity][index], ...updates };

        try {
            const dbUpdates = this.toDbFormat(updates);
            const { error } = await SupabaseClient
                .from(tableName)
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;

            this.data[entity][index] = updated;
            return updated;
        } catch (error) {
            console.error('更新失败:', error);
            this.data[entity][index] = updated;
            this.saveToLocalStorage();
            return updated;
        }
    },

    /**
     * 删除数据
     */
    async delete(entity, id) {
        const tableName = this.tableMap[entity];

        try {
            const { error } = await SupabaseClient
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.data[entity] = this.data[entity].filter(item => item.id !== id);
            return true;
        } catch (error) {
            console.error('删除失败:', error);
            this.data[entity] = this.data[entity].filter(item => item.id !== id);
            this.saveToLocalStorage();
            return true;
        }
    },

    /**
     * 批量添加
     */
    async batchAdd(entity, items) {
        const tableName = this.tableMap[entity];

        items.forEach(item => {
            if (!item.id) item.id = this.generateId();
            if (!item.createTime) item.createTime = new Date().toISOString();
        });

        try {
            const dbItems = items.map(item => this.toDbFormat(item));
            const { data, error } = await SupabaseClient
                .from(tableName)
                .insert(dbItems)
                .select();

            if (error) throw error;

            const results = (data || []).map(item => this.fromDbFormat(item));
            this.data[entity].unshift(...results);
            return results;
        } catch (error) {
            console.error('批量保存失败:', error);
            this.data[entity].unshift(...items);
            this.saveToLocalStorage();
            return items;
        }
    },

    /**
     * 查询数据
     */
    query(entity, conditions) {
        let results = this.getAll(entity);
        for (const [field, condition] of Object.entries(conditions)) {
            results = results.filter(item => {
                if (typeof condition === 'function') {
                    return condition(item[field], item);
                }
                return item[field] === condition;
            });
        }
        return results;
    },

    /**
     * 生成ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 保存到 localStorage（降级方案）
     */
    saveToLocalStorage() {
        localStorage.setItem('crm_data', JSON.stringify(this.data));
    },

    // ==================== 设置相关方法 ====================

    async saveSetting(key, value) {
        this.settings[key] = value;
        // 始终保存到 localStorage 确保本地持久化
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));

        // 同步到 Supabase
        try {
            const { error } = await SupabaseClient
                .from('settings')
                .upsert({ key, value, updated_at: new Date().toISOString() });

            if (error) throw error;
        } catch (error) {
            console.error('设置保存到数据库失败:', error);
            // localStorage 已保存，静默处理
        }
    },

    getSetting(key, defaultValue) {
        if (this.settings[key] !== undefined) {
            return this.settings[key];
        }
        // 尝试从 localStorage 获取
        const local = localStorage.getItem(`setting_${key}`);
        if (local) {
            try {
                return JSON.parse(local);
            } catch (e) {
                return local;
            }
        }
        return defaultValue;
    },

    // ==================== 积分配置 ====================

    getScoreConfig() {
        return this.getSetting('scoreConfig', {
            phone: 1,
            wechat: 3,
            intention: 5,
            visit: 20,
            contract: 50
        });
    },

    async setScoreConfig(config) {
        await this.saveSetting('scoreConfig', config);
    },

    // ==================== 每日达标线 ====================

    getDailyTargetScore() {
        const val = this.getSetting('dailyTargetScore', 35);
        return parseInt(val) || 35;
    },

    async setDailyTargetScore(score) {
        await this.saveSetting('dailyTargetScore', score);
    },

    // ==================== 目标配置 ====================

    getYearlyGoals() {
        return this.getSetting('yearlyGoals', {
            visit: 500,
            intent: 100,
            contract: 100,
            payment: 1000000
        });
    },

    async setYearlyGoals(goals) {
        await this.saveSetting('yearlyGoals', {
            visit: parseInt(goals.visit) || 500,
            intent: parseInt(goals.intent) || 100,
            contract: parseInt(goals.contract) || 100,
            payment: parseInt(goals.payment) || 1000000
        });
    },

    getMonthlyGoals() {
        return this.getSetting('monthlyGoals', {
            visit: 50,
            intent: 10,
            contract: 10,
            payment: 100000
        });
    },

    async setMonthlyGoals(goals) {
        await this.saveSetting('monthlyGoals', {
            visit: parseInt(goals.visit) || 50,
            intent: parseInt(goals.intent) || 10,
            contract: parseInt(goals.contract) || 10,
            payment: parseInt(goals.payment) || 100000
        });
    },

    // ==================== 系统标题 ====================

    getSystemTitle() {
        return this.getSetting('systemTitle', 'CRM系统');
    },

    async setSystemTitle(title) {
        await this.saveSetting('systemTitle', title || 'CRM系统');
    },

    /**
     * 刷新数据（从数据库重新加载）
     */
    async refreshData() {
        return await this.init();
    },

    // ==================== 积分计算 ====================

    calculateTaskScore(task) {
        const config = this.getScoreConfig();
        let score = 0;
        score += (task.phoneCount || 0) * config.phone;
        score += (task.wechatCount || 0) * config.wechat;
        score += (task.intentionCount || 0) * config.intention;
        score += (task.visitCount || 0) * config.visit;
        score += (task.contractCount || 0) * config.contract;
        return score;
    },

    // ==================== 进度统计 ====================

    getYearlyProgress() {
        const currentYear = new Date().getFullYear();
        const tasks = this.getAll('taskRecords').filter(t =>
            new Date(t.date).getFullYear() === currentYear
        );
        const payments = this.getAll('paymentRecords').filter(p =>
            new Date(p.paymentTime).getFullYear() === currentYear
        );

        return {
            visit: tasks.reduce((sum, t) => sum + (parseInt(t.visitCount) || 0), 0),
            intent: tasks.reduce((sum, t) => sum + (parseInt(t.intentionCount) || 0), 0),
            contract: tasks.reduce((sum, t) => sum + (parseInt(t.contractCount) || 0), 0),
            payment: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        };
    },

    getMonthlyProgress() {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const tasks = this.getAll('taskRecords').filter(t =>
            Utils.formatDate(t.date, 'date').startsWith(currentMonth)
        );
        const payments = this.getAll('paymentRecords').filter(p =>
            Utils.formatDate(p.paymentTime, 'date').startsWith(currentMonth)
        );

        return {
            visit: tasks.reduce((sum, t) => sum + (parseInt(t.visitCount) || 0), 0),
            intent: tasks.reduce((sum, t) => sum + (parseInt(t.intentionCount) || 0), 0),
            contract: tasks.reduce((sum, t) => sum + (parseInt(t.contractCount) || 0), 0),
            payment: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        };
    }
};
