// ==================== 数据统计模块 ====================

const Statistics = {
    currentStartDate: '',
    currentEndDate: '',

    render(container) {
        // 设置默认时间范围为本月
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        this.currentStartDate = Utils.formatDate(firstDay, 'date');
        this.currentEndDate = Utils.formatDate(lastDay, 'date');

        container.innerHTML = `
            <div class="card mb-2">
                <div class="card-header">
                    <h3 class="card-title">筛选条件</h3>
                </div>
                <div style="padding: 1.5rem;">
                    <div class="grid grid-3">
                        <div class="form-group">
                            <label>开始日期</label>
                            <input type="date" id="stat-start-date" value="${this.currentStartDate}">
                        </div>
                        <div class="form-group">
                            <label>结束日期</label>
                            <input type="date" id="stat-end-date" value="${this.currentEndDate}">
                        </div>
                        <div class="form-group">
                            <label style="visibility: hidden;">操作</label>
                            <button class="btn btn-primary" onclick="Statistics.applyFilter()" style="width: 100%;">
                                🔍 查询统计
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="statistics-content"></div>
        `;

        this.renderStatistics();
    },

    applyFilter() {
        this.currentStartDate = document.getElementById('stat-start-date').value;
        this.currentEndDate = document.getElementById('stat-end-date').value;

        if (!this.currentStartDate || !this.currentEndDate) {
            Utils.showToast('请选择开始和结束日期', 'warning');
            return;
        }

        if (this.currentStartDate > this.currentEndDate) {
            Utils.showToast('开始日期不能晚于结束日期', 'error');
            return;
        }

        this.renderStatistics();
    },

    renderStatistics() {
        const stats = this.getFilteredStatistics();
        const container = document.getElementById('statistics-content');

        container.innerHTML = `
            <!-- 总览统计卡片 -->
            <div class="grid grid-4 mb-2">
                <div class="card stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">📞</div>
                    <div class="stat-info">
                        <div class="stat-label">总电话数</div>
                        <div class="stat-value">${stats.totalPhoneCalls}</div>
                    </div>
                </div>
                
                <div class="card stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">💬</div>
                    <div class="stat-info">
                        <div class="stat-label">总微信数</div>
                        <div class="stat-value">${stats.totalWechat}</div>
                    </div>
                </div>
                
                <div class="card stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">⭐</div>
                    <div class="stat-info">
                        <div class="stat-label">总意向数</div>
                        <div class="stat-value">${stats.totalIntentions}</div>
                    </div>
                </div>
                
                <div class="card stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">🤝</div>
                    <div class="stat-info">
                        <div class="stat-label">总面谈数</div>
                        <div class="stat-value">${stats.totalVisits}</div>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-2 mb-2">
                <div class="card stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">✍️</div>
                    <div class="stat-info">
                        <div class="stat-label">总签约数</div>
                        <div class="stat-value">${stats.totalContracts}</div>
                    </div>
                </div>
                
                <div class="card stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">💰</div>
                    <div class="stat-info">
                        <div class="stat-label">总回款金额</div>
                        <div class="stat-value" style="font-size: 1.5rem;">${Utils.formatCurrency(stats.totalPayments)}</div>
                    </div>
                </div>
            </div>
            
            <!-- 员工业绩排行 -->
            <div class="card mb-2">
                <div class="card-header">
                    <h3 class="card-title">员工任务完成情况</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>员工姓名</th>
                                <th>电话</th>
                                <th>微信</th>
                                <th>意向</th>
                                <th>面谈</th>
                                <th>签约</th>
                                <th>总得分</th>
                                <th>回款金额</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderEmployeeRanking(stats.employeeStats)}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 图表展示 -->
            <div class="grid grid-2">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">任务完成趋势</h3>
                    </div>
                    <canvas id="task-trend-chart"></canvas>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">员工得分对比</h3>
                    </div>
                    <canvas id="employee-score-chart"></canvas>
                </div>
            </div>
        `;

        // 渲染图表
        setTimeout(() => {
            this.renderTaskTrendChart(stats.dailyStats);
            this.renderEmployeeScoreChart(stats.employeeStats);
        }, 100);
    },

    getFilteredStatistics() {
        const startDate = new Date(this.currentStartDate);
        const endDate = new Date(this.currentEndDate);

        // 获取时间范围内的任务记录
        const tasks = DataManager.getAll('taskRecords').filter(t => {
            const taskDate = new Date(t.date);
            return taskDate >= startDate && taskDate <= endDate;
        });

        // 获取时间范围内的回款记录
        const payments = DataManager.getAll('paymentRecords').filter(p => {
            const paymentDate = new Date(p.paymentTime);
            return paymentDate >= startDate && paymentDate <= endDate;
        });

        // 总计统计
        const totalStats = {
            总电话数: tasks.reduce((sum, t) => sum + (t.phoneCount || 0), 0),
            totalWechat: tasks.reduce((sum, t) => sum + (t.wechatCount || 0), 0),
            totalIntentions: tasks.reduce((sum, t) => sum + (t.intentionCount || 0), 0),
            totalVisits: tasks.reduce((sum, t) => sum + (t.visitCount || 0), 0),
            totalContracts: tasks.reduce((sum, t) => sum + (t.contractCount || 0), 0),
            totalPayments: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        };

        // 按员工统计
        const employees = DataManager.getAll('employees');
        const employeeStats = employees.map(emp => {
            const empTasks = tasks.filter(t => t.employeeId === emp.id);
            const empPayments = payments.filter(p => p.employeeId === emp.id);

            return {
                employeeId: emp.id,
                employeeName: emp.name,
                phoneCount: empTasks.reduce((sum, t) => sum + (t.phoneCount || 0), 0),
                wechatCount: empTasks.reduce((sum, t) => sum + (t.wechatCount || 0), 0),
                intentionCount: empTasks.reduce((sum, t) => sum + (t.intentionCount || 0), 0),
                visitCount: empTasks.reduce((sum, t) => sum + (t.visitCount || 0), 0),
                contractCount: empTasks.reduce((sum, t) => sum + (t.contractCount || 0), 0),
                totalScore: empTasks.reduce((sum, t) => sum + (t.totalScore || 0), 0),
                paymentAmount: empPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
            };
        }).sort((a, b) => b.totalScore - a.totalScore);

        // 按日期统计（用于趋势图）
        const dailyStats = {};
        tasks.forEach(t => {
            const date = t.date;
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    phoneCount: 0,
                    wechatCount: 0,
                    intentionCount: 0,
                    visitCount: 0,
                    contractCount: 0
                };
            }
            dailyStats[date].phoneCount += t.phoneCount || 0;
            dailyStats[date].wechatCount += t.wechatCount || 0;
            dailyStats[date].intentionCount += t.intentionCount || 0;
            dailyStats[date].visitCount += t.visitCount || 0;
            dailyStats[date].contractCount += t.contractCount || 0;
        });

        return {
            ...totalStats,
            employeeStats,
            dailyStats
        };
    },

    renderEmployeeRanking(employeeStats) {
        if (employeeStats.length === 0) {
            return '<tr><td colspan="9" class="text-center text-muted">暂无数据</td></tr>';
        }

        return employeeStats.map((emp, index) => `
            <tr>
                <td><strong style="color: ${index < 3 ? 'var(--warning-color)' : 'inherit'};">${index + 1}</strong></td>
                <td><strong>${emp.employeeName}</strong></td>
                <td>${emp.phoneCount}</td>
                <td>${emp.wechatCount}</td>
                <td>${emp.intentionCount}</td>
                <td>${emp.visitCount}</td>
                <td>${emp.contractCount}</td>
                <td><strong style="color: var(--primary-light);">${emp.totalScore}</strong></td>
                <td>${Utils.formatCurrency(emp.paymentAmount)}</td>
            </tr>
        `).join('');
    },

    renderTaskTrendChart(dailyStats) {
        const ctx = document.getElementById('task-trend-chart');
        if (!ctx) return;

        const dates = Object.keys(dailyStats).sort();
        const phoneData = dates.map(d => dailyStats[d].phoneCount);
        const wechatData = dates.map(d => dailyStats[d].wechatCount);
        const intentionData = dates.map(d => dailyStats[d].intentionCount);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: '电话',
                        data: phoneData,
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: '微信',
                        data: wechatData,
                        borderColor: 'rgb(245, 158, 11)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: '意向',
                        data: intentionData,
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#cbd5e1'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#cbd5e1'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    },

    renderEmployeeScoreChart(employeeStats) {
        const ctx = document.getElementById('employee-score-chart');
        if (!ctx) return;

        const top10 = employeeStats.slice(0, 10);
        const names = top10.map(e => e.employeeName);
        const scores = top10.map(e => e.totalScore);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: names,
                datasets: [{
                    label: '总得分',
                    data: scores,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#cbd5e1'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#cbd5e1'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
};
