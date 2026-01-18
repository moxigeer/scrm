// ==================== 数据中台仪表板 ====================

const Dashboard = {
    charts: {},
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    selectedDay: null, // 日期筛选，null表示今日
    rankingPeriod: 'day', // 'day' 或 'month'
    rankingType: 'score', // 'score', 'phone', 'visit', 'payment'

    render(container) {
        const systemTitle = DataManager.getSystemTitle();
        const mvp = this.getTodayMVP();
        const stats = this.getStatistics();
        const todayStats = this.getTodayStats();
        const yearlyGoals = DataManager.getYearlyGoals();
        const yearlyProgress = DataManager.getYearlyProgress();
        const monthlyGoals = DataManager.getMonthlyGoals();
        const monthlyProgress = DataManager.getMonthlyProgress();

        container.innerHTML = `
            <div class="dashboard-wrapper">
                <!-- 顶部区域 -->
                <div class="dash-header">
                    <div class="dash-title-area">
                        <h1 class="dash-title">${systemTitle}</h1>
                        <span class="dash-date">${this.formatDate()}</span>
                        <span class="status-badge ${DataManager.useLocal ? 'offline' : 'online'}" 
                              style="font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 12px; background: ${DataManager.useLocal ? '#fcd34d' : '#10b981'}; color: #fff; margin-left: 1rem;">
                              ${DataManager.useLocal ? '🟠 离线模式' : '🟢 在线模式'}
                        </span>
                    </div>
                    <div class="dash-controls">
                        <div class="month-picker">
                            <select id="year-select" class="picker-select">
                                ${this.renderYearOptions()}
                            </select>
                            <select id="month-select" class="picker-select">
                                ${this.renderMonthOptions()}
                            </select>
                            <select id="day-select" class="picker-select">
                                ${this.renderDayOptions()}
                            </select>
                        </div>
                        <div class="dropdown">
                            <button class="btn-settings" id="settings-btn"><i class="ri-settings-4-line"></i></button>
                            <div class="dropdown-menu" id="settings-menu">
                                <a href="#" onclick="Dashboard.showGoalModal(); return false;"><i class="ri-focus-3-line"></i> 目标设置</a>
                                <a href="#" onclick="TaskRecords.showConfigModal(); return false;"><i class="ri-equalizer-line"></i> 积分设置</a>
                                <a href="#" onclick="Dashboard.showTitleModal(); return false;"><i class="ri-edit-2-line"></i> 标题设置</a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MVP区域 (3 cards) -->
                <div class="mvp-row">
                    <div class="mvp-card mvp-today">
                        <div class="mvp-icon"><i class="ri-trophy-fill"></i></div>
                        <div class="mvp-content">
                            <div class="mvp-label" id="mvp-today-title">${this.getDateLabel()}积分MVP ${mvp.streak > 1 ? `<span class="streak-badge"><i class="ri-fire-fill"></i> 蝉联${mvp.streak}天</span>` : ''}</div>
                            <div class="mvp-details">
                                <span class="mvp-name" id="mvp-today-name">${mvp.name}</span>
                                <span class="mvp-score" id="mvp-today-score">${mvp.score}分</span>
                            </div>
                        </div>
                    </div>
                    <div class="mvp-card mvp-visit">
                        <div class="mvp-icon"><i class="ri-walk-fill"></i></div>
                        <div class="mvp-content">
                            <div class="mvp-label" id="mvp-visit-title">本月拜访MVP</div>
                            <div class="mvp-details">
                                <span class="mvp-name" id="mvp-visit-name">${this.getMonthVisitMVP().name}</span>
                                <span class="mvp-score" id="mvp-visit-score">${this.getMonthVisitMVP().count}次</span>
                            </div>
                        </div>
                    </div>
                    <div class="mvp-card mvp-month">
                        <div class="mvp-icon"><i class="ri-money-cny-box-fill"></i></div>
                        <div class="mvp-content">
                            <div class="mvp-label" id="mvp-month-title">本月回款MVP</div>
                            <div class="mvp-details">
                                <span class="mvp-name" id="mvp-month-name">${this.getMonthPaymentMVP().name}</span>
                                <span class="mvp-score" id="mvp-month-score">¥${this.formatNumber(this.getMonthPaymentMVP().amount)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mvp-card mvp-year">
                        <div class="mvp-icon"><i class="ri-vip-crown-fill"></i></div>
                        <div class="mvp-content">
                            <div class="mvp-label" id="mvp-year-title">全年回款MVP</div>
                            <div class="mvp-details">
                                <span class="mvp-name" id="mvp-year-name">${this.getYearPaymentMVP().name}</span>
                                <span class="mvp-score" id="mvp-year-score">¥${this.formatNumber(this.getYearPaymentMVP().amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 核心指标 -->
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="ri-team-line"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">团队人数</span>
                            <span class="stat-value">${stats.teamCount}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="ri-phone-line"></i></div>
                        <div class="stat-info">
                            <span class="stat-label" id="stat-phone-label">${this.getDateLabel()}电话</span>
                            <span class="stat-value" id="stat-phone-value">${todayStats.phones}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="ri-shake-hands-line"></i></div>
                        <div class="stat-info">
                            <span class="stat-label" id="stat-visit-label">${this.getDateLabel()}面谈</span>
                            <span class="stat-value" id="stat-visit-value">${todayStats.visits}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="ri-money-cny-circle-line"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">本月回款</span>
                            <span class="stat-value">¥${this.formatNumber(stats.monthPayments)}</span>
                        </div>
                    </div>
                </div>

                <!-- 主内容区 - 使用Grid布局 -->
                <div class="dash-grid">
                    <!-- 左侧列：业绩走势 + 每日电话/面谈 -->
                    <div class="dash-left">
                        <div class="chart-panel">
                            <div class="panel-head">
                                <h3><i class="ri-line-chart-line"></i> ${this.selectedYear}年${this.selectedMonth}月 业绩走势</h3>
                            </div>
                            <div class="chart-box">
                                <canvas id="main-chart"></canvas>
                            </div>
                        </div>
                        <div class="mini-charts-row">
                            <div class="mini-chart">
                                <div class="panel-head"><h4><i class="ri-phone-line"></i> 每日电话</h4></div>
                                <div class="mini-chart-box">
                                    <canvas id="phone-chart"></canvas>
                                </div>
                            </div>
                            <div class="mini-chart">
                                <div class="panel-head"><h4><i class="ri-shake-hands-line"></i> 每日面谈</h4></div>
                                <div class="mini-chart-box">
                                    <canvas id="visit-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 中间列：本月目标 + 全年目标 -->
                    <div class="dash-middle">
                        <div class="goal-panel">
                            <div class="panel-head">
                                <h3><i class="ri-calendar-check-line"></i> 本月目标</h3>
                                <span class="goal-month">${this.selectedMonth}月</span>
                            </div>
                            <div class="goal-list">
                                ${this.renderGoals(monthlyGoals, monthlyProgress)}
                            </div>
                        </div>
                        <div class="goal-panel">
                            <div class="panel-head">
                                <h3><i class="ri-flag-2-line"></i> 全年目标</h3>
                                <span class="goal-month">${this.selectedYear}年</span>
                            </div>
                            <div class="goal-list">
                                ${this.renderYearlyGoals(yearlyGoals, yearlyProgress)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右侧列：排行榜 -->
                    <div class="dash-right">
                        <div class="rank-panel" style="height: 100%;">
                            <div class="panel-head rank-controls">
                                <div class="rank-period-toggle">
                                    <button class="rank-period-btn ${this.rankingPeriod === 'day' ? 'active' : ''}" data-period="day">${this.getDateLabel()}</button>
                                    <button class="rank-period-btn ${this.rankingPeriod === 'month' ? 'active' : ''}" data-period="month">本月</button>
                                </div>
                                <select id="rank-type-select" class="rank-type-select">
                                    <option value="score" ${this.rankingType === 'score' ? 'selected' : ''}>积分</option>
                                    <option value="phone" ${this.rankingType === 'phone' ? 'selected' : ''}>电话</option>
                                    <option value="visit" ${this.rankingType === 'visit' ? 'selected' : ''}>拜访</option>
                                    <option value="payment" ${this.rankingType === 'payment' ? 'selected' : ''}>回款</option>
                                </select>
                            </div>
                            <div class="rank-list" id="rank-list" style="flex: 1; overflow-y: auto;">
                                ${this.renderRanking()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.renderCharts();
    },

    renderYearOptions() {
        const currentYear = new Date().getFullYear();
        let html = '';
        for (let y = currentYear; y >= currentYear - 2; y--) {
            html += `<option value="${y}" ${y === this.selectedYear ? 'selected' : ''}>${y}年</option>`;
        }
        return html;
    },

    renderMonthOptions() {
        let html = '';
        for (let m = 1; m <= 12; m++) {
            html += `<option value="${m}" ${m === this.selectedMonth ? 'selected' : ''}>${m}月</option>`;
        }
        return html;
    },

    renderDayOptions() {
        const today = new Date();
        const isCurrentYearMonth = this.selectedYear === today.getFullYear() && this.selectedMonth === (today.getMonth() + 1);
        const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
        const maxDay = isCurrentYearMonth ? today.getDate() : daysInMonth;

        let html = '<option value="">全部</option>';
        for (let d = 1; d <= maxDay; d++) {
            html += `<option value="${d}" ${d === this.selectedDay ? 'selected' : ''}>${d}日</option>`;
        }
        return html;
    },

    renderGoals(goals, progress) {
        const items = [
            { key: 'visit', label: '面谈', icon: '<i class="ri-shake-hands-line"></i>', unit: '次' },
            { key: 'intent', label: '意向', icon: '<i class="ri-heart-pulse-line"></i>', unit: '个' },
            { key: 'contract', label: '签约', icon: '<i class="ri-quill-pen-line"></i>', unit: '单' },
            { key: 'payment', label: '回款', icon: '<i class="ri-money-cny-circle-line"></i>', unit: '', isAmount: true }
        ];

        return items.map(item => {
            const goal = goals[item.key] || 1;
            const current = progress[item.key] || 0;
            const percent = Math.min(Math.round((current / goal) * 100), 100);
            const done = current >= goal;
            const displayCurrent = item.isAmount ? '¥' + this.formatNumber(current) : current;
            const displayGoal = item.isAmount ? '¥' + this.formatNumber(goal) : goal + item.unit;

            return `
                <div class="goal-row">
                    <div class="goal-info">
                        <span class="goal-icon">${item.icon}</span>
                        <span class="goal-name">${item.label}</span>
                        <span class="goal-nums">${displayCurrent} / ${displayGoal}</span>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-track">
                            <div class="goal-fill ${done ? 'done' : ''}" style="width:${percent}%"></div>
                        </div>
                        <span class="goal-pct ${done ? 'done' : ''}">${percent}%</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Yearly goals without Intent
    renderYearlyGoals(goals, progress) {
        const items = [
            { key: 'visit', label: '面谈', icon: '<i class="ri-shake-hands-line"></i>', unit: '次' },
            { key: 'contract', label: '签约', icon: '<i class="ri-quill-pen-line"></i>', unit: '单' },
            { key: 'payment', label: '回款', icon: '<i class="ri-money-cny-circle-line"></i>', unit: '', isAmount: true }
        ];

        return items.map(item => {
            const goal = goals[item.key] || 1;
            const current = progress[item.key] || 0;
            const percent = Math.min(Math.round((current / goal) * 100), 100);
            const done = current >= goal;
            const displayCurrent = item.isAmount ? '¥' + this.formatNumber(current) : current;
            const displayGoal = item.isAmount ? '¥' + this.formatNumber(goal) : goal + item.unit;

            return `
                <div class="goal-row">
                    <div class="goal-info">
                        <span class="goal-icon">${item.icon}</span>
                        <span class="goal-name">${item.label}</span>
                        <span class="goal-nums">${displayCurrent} / ${displayGoal}</span>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-track">
                            <div class="goal-fill ${done ? 'done' : ''}" style="width:${percent}%"></div>
                        </div>
                        <span class="goal-pct ${done ? 'done' : ''}">${percent}%</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderRanking() {
        const icons = ['<i class="ri-medal-fill" style="color:#ffd700"></i>', '<i class="ri-medal-fill" style="color:#c0c0c0"></i>', '<i class="ri-medal-fill" style="color:#cd7f32"></i>'];
        const type = this.rankingType;
        const period = this.rankingPeriod;

        let rankData = [];
        const periodLabel = period === 'day' ? this.getDateLabel() : '本月';

        if (type === 'payment') {
            // 回款排行
            rankData = this.getPaymentRanking(period);
        } else {
            // 积分/电话/拜访排行
            rankData = this.getTaskRanking(period, type);
        }

        if (!rankData.length) return `<div class="empty">${periodLabel}暂无数据</div>`;

        const unitMap = { score: '分', phone: '通', visit: '次', payment: '' };
        const unit = unitMap[type];

        return rankData.map((r, i) => {
            const posIcon = i < 3 ? icons[i] : (i + 1);
            const displayValue = type === 'payment' ? '¥' + this.formatNumber(r.value) : r.value + unit;
            return `
                <div class="rank-row ${i < 3 ? 'top' : ''}">
                    <span class="rank-pos">${posIcon}</span>
                    <span class="rank-name">${r.name}</span>
                    <span class="rank-score">${displayValue}</span>
                </div>
            `;
        }).join('');
    },

    getTaskRanking(period, type) {
        let records;
        if (period === 'day') {
            const targetDate = this.getSelectedDateString();
            records = DataManager.query('taskRecords', {
                date: d => Utils.formatDate(d, 'date') === targetDate
            });
        } else {
            // 本月
            const monthStr = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
            records = DataManager.getAll('taskRecords').filter(r =>
                Utils.formatDate(r.date, 'date').startsWith(monthStr)
            );
        }

        // 按员工汇总
        const empStats = {};
        records.forEach(r => {
            if (!empStats[r.employeeId]) empStats[r.employeeId] = 0;
            if (type === 'score') empStats[r.employeeId] += r.totalScore || 0;
            else if (type === 'phone') empStats[r.employeeId] += r.phoneCount || 0;
            else if (type === 'visit') empStats[r.employeeId] += r.visitCount || 0;
        });

        return Object.entries(empStats)
            .map(([id, value]) => ({
                name: DataManager.getById('employees', id)?.name || '未知',
                value
            }))
            .sort((a, b) => b.value - a.value);
    },

    getPaymentRanking(period) {
        let payments;
        if (period === 'day') {
            const targetDate = this.getSelectedDateString();
            payments = DataManager.getAll('paymentRecords').filter(p =>
                Utils.formatDate(p.paymentTime, 'date') === targetDate
            );
        } else {
            // 本月
            const monthStr = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
            payments = DataManager.getAll('paymentRecords').filter(p =>
                Utils.formatDate(p.paymentTime, 'date').startsWith(monthStr)
            );
        }

        // 按员工汇总
        const empStats = {};
        payments.forEach(p => {
            if (!empStats[p.employeeId]) empStats[p.employeeId] = 0;
            empStats[p.employeeId] += parseFloat(p.amount) || 0;
        });

        return Object.entries(empStats)
            .map(([id, value]) => ({
                name: DataManager.getById('employees', id)?.name || '未知',
                value
            }))
            .sort((a, b) => b.value - a.value);
    },

    showGoalModal() {
        const yearly = DataManager.getYearlyGoals();
        const monthly = DataManager.getMonthlyGoals();

        Utils.createModal({
            title: '<i class="ri-focus-3-line"></i> 目标设置',
            content: `
                <form id="goal-form">
                    <h4 style="margin: 0 0 1rem; color: var(--text-primary);">📅 本月目标</h4>
                    <div class="grid grid-4" style="gap: 1rem; margin-bottom: 1.5rem;">
                        <div class="form-group" style="margin:0;">
                            <label>🤝 面谈</label>
                            <input type="number" name="mVisit" value="${monthly.visit}" min="0">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>💡 意向</label>
                            <input type="number" name="mIntent" value="${monthly.intent || 0}" min="0">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>✍️ 签约</label>
                            <input type="number" name="mContract" value="${monthly.contract}" min="0">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>💰 回款(元)</label>
                            <input type="number" name="mPayment" value="${monthly.payment}" min="0">
                        </div>
                    </div>
                    <h4 style="margin: 0 0 1rem; color: var(--text-primary);">📆 全年目标</h4>
                    <div class="grid grid-4" style="gap: 1rem;">
                        <div class="form-group" style="margin:0;">
                            <label>🤝 面谈</label>
                            <input type="number" name="yVisit" value="${yearly.visit}" min="0">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>💡 意向</label>
                            <input type="number" name="yIntent" value="${yearly.intent || 0}" min="0">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>✍️ 签约</label>
                            <input type="number" name="yContract" value="${yearly.contract}" min="0">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label>💰 回款(元)</label>
                            <input type="number" name="yPayment" value="${yearly.payment}" min="0">
                        </div>
                    </div>
                </form>
            `,
            size: 'lg',
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                { text: '保存', class: 'btn btn-primary', onClick: () => this.saveGoals() }
            ]
        });
    },

    saveGoals() {
        const form = document.getElementById('goal-form');
        const fd = new FormData(form);
        DataManager.setMonthlyGoals({
            visit: fd.get('mVisit'),
            intent: fd.get('mIntent'),
            contract: fd.get('mContract'),
            payment: fd.get('mPayment')
        });
        DataManager.setYearlyGoals({
            visit: fd.get('yVisit'),
            intent: fd.get('yIntent'),
            contract: fd.get('yContract'),
            payment: fd.get('yPayment')
        });
        Utils.showToast('目标设置成功！', 'success');
        document.querySelector('.modal-overlay').remove();
        App.loadPage('dashboard');
    },

    showTitleModal() {
        const current = DataManager.getSystemTitle();
        Utils.createModal({
            title: '✏️ 系统标题设置',
            content: `
                <form id="title-form">
                    <div class="form-group">
                        <label>系统名称</label>
                        <input type="text" name="title" value="${current}" placeholder="请输入系统名称">
                        <small class="text-muted">此标题将显示在左上角和首页顶部</small>
                    </div>
                </form>
            `,
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                {
                    text: '保存', class: 'btn btn-primary', onClick: () => {
                        const title = document.querySelector('#title-form input[name="title"]').value;
                        DataManager.setSystemTitle(title);
                        Utils.showToast('标题设置成功！', 'success');
                        document.querySelector('.modal-overlay').remove();
                        App.loadPage('dashboard');
                    }
                }
            ]
        });
    },

    formatDate() {
        const d = new Date();
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    },

    // 获取日期标签：如果选择了日期则显示具体日期，否则显示"今日"
    getDateLabel() {
        if (!this.selectedDay) return '今日';
        return `${this.selectedMonth}月${this.selectedDay}日`;
    },

    formatNumber(n) {
        if (n >= 10000) return (n / 10000).toFixed(1) + '万';
        return n.toLocaleString();
    },

    // 获取选中日期的字符串格式 (YYYY-MM-DD)
    getSelectedDateString() {
        if (!this.selectedDay) {
            return Utils.formatDate(new Date(), 'date');
        }
        return `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(this.selectedDay).padStart(2, '0')}`;
    },

    getStatistics() {
        const employees = DataManager.getAll('employees').filter(e => e.status === '在职');
        const payments = DataManager.getAll('paymentRecords');
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthPayments = payments.filter(p => Utils.formatDate(p.paymentTime, 'date').startsWith(monthStr))
            .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        return { teamCount: employees.length, monthPayments };
    },

    getTodayStats() {
        const targetDate = this.getSelectedDateString();
        const records = DataManager.query('taskRecords', { date: d => Utils.formatDate(d, 'date') === targetDate });
        return {
            phones: records.reduce((s, r) => s + (r.phoneCount || 0), 0),
            visits: records.reduce((s, r) => s + (r.visitCount || 0), 0)
        };
    },

    getTodayMVP() {
        const targetDate = this.getSelectedDateString();
        const records = DataManager.query('taskRecords', { date: d => Utils.formatDate(d, 'date') === targetDate });
        if (!records.length) return { name: '暂无', score: 0, isQualified: false, streak: 0 };

        const top = records.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))[0];
        const emp = DataManager.getById('employees', top.employeeId);
        const target = DataManager.getDailyTargetScore();
        const empName = emp?.name || '未知';

        // 计算蝉联次数
        let streak = 1;
        const allRecords = DataManager.getAll('taskRecords');
        const dateSet = [...new Set(allRecords.map(r => Utils.formatDate(r.date, 'date')))].sort().reverse();

        // 从选中日期的前一天开始往前查
        for (let i = 1; i < dateSet.length && i < 30; i++) {
            const prevDate = dateSet[i];
            if (prevDate >= targetDate) continue;

            const prevRecords = allRecords.filter(r => Utils.formatDate(r.date, 'date') === prevDate);
            if (!prevRecords.length) break;

            const prevTop = prevRecords.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))[0];
            const prevEmp = DataManager.getById('employees', prevTop.employeeId);

            if (prevEmp?.name === empName) {
                streak++;
            } else {
                break;
            }
        }

        return { name: empName, score: top.totalScore || 0, isQualified: top.totalScore >= target, streak };
    },

    getMonthPaymentMVP() {
        const year = this.selectedYear;
        const month = this.selectedMonth; // 这里的month已经是1-12了
        // 构造 "YYYY-MM" 格式
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;

        const payments = DataManager.getAll('paymentRecords').filter(p =>
            Utils.formatDate(p.paymentTime, 'date').startsWith(monthStr)
        );

        if (!payments.length) return { name: '暂无', amount: 0 };

        const stats = {};
        payments.forEach(p => {
            stats[p.employeeId] = (stats[p.employeeId] || 0) + (parseFloat(p.amount) || 0);
        });

        const topId = Object.keys(stats).sort((a, b) => stats[b] - stats[a])[0];
        const employee = DataManager.getById('employees', topId);
        return { name: employee?.name || '未知', amount: stats[topId] };
    },

    getYearPaymentMVP() {
        const year = this.selectedYear;
        const payments = DataManager.getAll('paymentRecords').filter(p =>
            new Date(p.paymentTime).getFullYear() === year
        );

        if (!payments.length) return { name: '暂无', amount: 0 };

        const stats = {};
        payments.forEach(p => {
            stats[p.employeeId] = (stats[p.employeeId] || 0) + (parseFloat(p.amount) || 0);
        });

        const topId = Object.keys(stats).sort((a, b) => stats[b] - stats[a])[0];
        const employee = DataManager.getById('employees', topId);
        return { name: employee?.name || '未知', amount: stats[topId] };
    },

    getMonthVisitMVP() {
        const year = this.selectedYear;
        const month = this.selectedMonth;
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;

        const records = DataManager.getAll('taskRecords').filter(r =>
            Utils.formatDate(r.date, 'date').startsWith(monthStr)
        );

        if (!records.length) return { name: '暂无', count: 0 };

        const stats = {};
        records.forEach(r => {
            stats[r.employeeId] = (stats[r.employeeId] || 0) + (r.visitCount || 0);
        });

        const topId = Object.keys(stats).sort((a, b) => stats[b] - stats[a])[0];
        const employee = DataManager.getById('employees', topId);
        return { name: employee?.name || '未知', count: stats[topId] };
    },

    bindEvents() {
        // 年月选择
        document.getElementById('year-select')?.addEventListener('change', e => {
            this.selectedYear = parseInt(e.target.value);
            this.selectedDay = null; // 重置日期选择
            this.updateDayOptions();
            this.updateView();
            this.updateTodaySection();
        });
        document.getElementById('month-select')?.addEventListener('change', e => {
            this.selectedMonth = parseInt(e.target.value);
            this.selectedDay = null; // 重置日期选择
            this.updateDayOptions();
            this.updateView();
            this.updateTodaySection();
        });

        // 日期筛选
        document.getElementById('day-select')?.addEventListener('change', e => {
            this.selectedDay = e.target.value ? parseInt(e.target.value) : null;
            this.updateTodaySection();
        });

        // 设置下拉菜单
        const btn = document.getElementById('settings-btn');
        const menu = document.getElementById('settings-menu');
        btn?.addEventListener('click', e => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });
        document.addEventListener('click', () => menu?.classList.remove('show'));

        // 排行榜时段切换
        document.querySelectorAll('.rank-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.rankingPeriod = btn.dataset.period;
                document.querySelectorAll('.rank-period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('rank-list').innerHTML = this.renderRanking();
            });
        });

        // 排行榜类型切换
        document.getElementById('rank-type-select')?.addEventListener('change', e => {
            this.rankingType = e.target.value;
            document.getElementById('rank-list').innerHTML = this.renderRanking();
        });
    },

    updateView() {
        // Re-calculate stats before rendering
        this.renderCharts();
        this.updateChartTitle();
        this.updateMVPs();

        // Update stats cards as well
        const stats = this.getStatistics();
        const todayStats = this.getTodayStats();
        // (Simplified update logic: In a full app we'd bind these data points to DOM IDs like the MVP section, 
        // but for now the chart fix is priority. The main render() calls these, but updateView() just refreshes charts/MVP)
    },

    // 更新今日相关数据区域（用于日期筛选变化时）
    updateTodaySection() {
        const dateLabel = this.getDateLabel();

        // 更新今日MVP
        const mvp = this.getTodayMVP();
        const mvpTitle = document.getElementById('mvp-today-title');
        const mvpName = document.getElementById('mvp-today-name');
        const mvpScore = document.getElementById('mvp-today-score');

        if (mvpTitle) {
            mvpTitle.innerHTML = `${dateLabel}积分MVP ${mvp.streak > 1 ? `<span class="streak-badge"><i class="ri-fire-fill"></i> 蝉联${mvp.streak}天</span>` : ''}`;
        }
        if (mvpName) mvpName.textContent = mvp.name;
        if (mvpScore) mvpScore.textContent = `${mvp.score}分`;

        // 更新今日电话/面谈
        const todayStats = this.getTodayStats();
        const phoneLabel = document.getElementById('stat-phone-label');
        const phoneValue = document.getElementById('stat-phone-value');
        const visitLabel = document.getElementById('stat-visit-label');
        const visitValue = document.getElementById('stat-visit-value');

        if (phoneLabel) phoneLabel.textContent = `${dateLabel}电话`;
        if (phoneValue) phoneValue.textContent = todayStats.phones;
        if (visitLabel) visitLabel.textContent = `${dateLabel}面谈`;
        if (visitValue) visitValue.textContent = todayStats.visits;

        // 更新排行榜标题和内容
        const rankTitle = document.getElementById('rank-title');
        const rankList = document.getElementById('rank-list');

        if (rankTitle) rankTitle.innerHTML = `<i class="ri-trophy-line"></i> ${dateLabel}排行`;
        if (rankList) rankList.innerHTML = this.renderRanking();
    },

    updateChartTitle() {
        const title = document.querySelector('.chart-panel h3');
        if (title) title.innerHTML = `<i class="ri-line-chart-line"></i> ${this.selectedYear}年${this.selectedMonth}月 业绩走势`;
    },

    // 更新日期下拉选项（当年/月变化时）
    updateDayOptions() {
        const daySelect = document.getElementById('day-select');
        if (daySelect) {
            daySelect.innerHTML = this.renderDayOptions();
        }
    },

    updateMVPs() {
        const monthMVP = this.getMonthPaymentMVP();
        const yearMVP = this.getYearPaymentMVP();

        // 更新本月MVP
        const monthTitle = document.getElementById('mvp-month-title');
        const monthName = document.getElementById('mvp-month-name');
        const monthScore = document.getElementById('mvp-month-score');

        if (monthTitle) monthTitle.textContent = `${this.selectedMonth}月回款MVP`;
        if (monthName) monthName.textContent = monthMVP.name;
        if (monthScore) monthScore.textContent = `¥${this.formatNumber(monthMVP.amount)}`;

        // 更新本月拜访MVP
        const visitMVP = this.getMonthVisitMVP();
        const visitTitle = document.getElementById('mvp-visit-title');
        const visitName = document.getElementById('mvp-visit-name');
        const visitScore = document.getElementById('mvp-visit-score');

        if (visitTitle) visitTitle.textContent = `${this.selectedMonth}月拜访MVP`;
        if (visitName) visitName.textContent = visitMVP.name;
        if (visitScore) visitScore.textContent = `${visitMVP.count}次`;

        // 更新全年MVP
        const yearTitle = document.getElementById('mvp-year-title');
        const yearName = document.getElementById('mvp-year-name');
        const yearScore = document.getElementById('mvp-year-score');

        if (yearTitle) yearTitle.textContent = `${this.selectedYear}年回款MVP`;
        if (yearName) yearName.textContent = yearMVP.name;
        if (yearScore) yearScore.textContent = `¥${this.formatNumber(yearMVP.amount)}`;
    },

    renderCharts() {
        // Destroy existing explicitly
        if (this.charts.main) { this.charts.main.destroy(); this.charts.main = null; }
        if (this.charts.phone) { this.charts.phone.destroy(); this.charts.phone = null; }
        if (this.charts.visit) { this.charts.visit.destroy(); this.charts.visit = null; }

        // Use a timeout to ensure DOM layout is finalized
        setTimeout(() => {
            try {
                this.renderMainChart();
                this.renderPhoneChart();
                this.renderVisitChart();
            } catch (error) {
                console.error("Chart rendering failed:", error);
            }
        }, 100);
    },

    getMonthData() {
        const year = this.selectedYear;
        const month = this.selectedMonth;
        const daysInMonth = new Date(year, month, 0).getDate();
        const dates = [];
        for (let d = 1; d <= daysInMonth; d++) {
            dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }

        const tasks = DataManager.getAll('taskRecords');
        const payments = DataManager.getAll('paymentRecords');

        const scores = dates.map(day => tasks.filter(t => Utils.formatDate(t.date, 'date') === day)
            .reduce((s, t) => s + (t.totalScore || 0), 0));
        const phones = dates.map(day => tasks.filter(t => Utils.formatDate(t.date, 'date') === day)
            .reduce((s, t) => s + (t.phoneCount || 0), 0));
        const visits = dates.map(day => tasks.filter(t => Utils.formatDate(t.date, 'date') === day)
            .reduce((s, t) => s + (t.visitCount || 0), 0));
        const pays = dates.map(day => payments.filter(p => Utils.formatDate(p.paymentTime, 'date') === day)
            .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0));

        return { labels: dates.map(d => d.substring(8) + '日'), scores, phones, visits, pays };
    },

    renderMainChart() {
        const ctx = document.getElementById('main-chart');
        if (!ctx) return;
        const { labels, scores, pays } = this.getMonthData();
        if (this.charts.main) this.charts.main.destroy();

        // 注册插件
        Chart.register(ChartDataLabels);

        this.charts.main = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: '团队得分', data: scores, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.4, fill: true, yAxisID: 'y' },
                    { label: '回款金额', data: pays, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', align: 'end', labels: { color: '#64748b', padding: 15 } },
                    datalabels: {
                        display: 'auto',
                        align: 'top',
                        color: '#64748b',
                        font: { weight: 'bold' },
                        formatter: (value) => value > 0 ? value : ''
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } },
                    y1: { position: 'right', beginAtZero: true, grid: { display: false }, ticks: { color: '#64748b', callback: v => v >= 1000 ? (v / 1000) + 'k' : v } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });
    },

    renderPhoneChart() {
        const ctx = document.getElementById('phone-chart');
        if (!ctx) return;
        const { labels, phones } = this.getMonthData();
        if (this.charts.phone) this.charts.phone.destroy();

        this.charts.phone = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: phones,
                    borderColor: 'rgba(99,102,241,1)',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#6366f1',
                        font: { weight: 'bold' },
                        formatter: (value) => value > 0 ? value : ''
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b', maxRotation: 0 } }
                },
                layout: {
                    padding: {
                        top: 20
                    }
                }
            }
        });
    },

    renderVisitChart() {
        const ctx = document.getElementById('visit-chart');
        if (!ctx) return;
        const { labels, visits } = this.getMonthData();
        if (this.charts.visit) this.charts.visit.destroy();

        this.charts.visit = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: visits,
                    borderColor: 'rgba(16,185,129,1)',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#10b981',
                        font: { weight: 'bold' },
                        formatter: (value) => value > 0 ? value : ''
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b', maxRotation: 0 } }
                },
                layout: {
                    padding: {
                        top: 20
                    }
                }
            }
        });
    },

    destroy() {
        Object.values(this.charts).forEach(c => c?.destroy());
        this.charts = {};
    }
};
