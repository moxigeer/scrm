// ==================== AI助手模块 (Premium) ====================

const AIAssistant = {
    // 状态管理
    state: {
        reports: [], // { id, name, content, extractedData: {}, aiComment: '' }
        generatedResult: null, // { reportText: '' }
        isGenerated: false,
        loadingTimer: null,
        loadingSeconds: 0
    },

    render(container) {
        // 同步员工列表：确保 AI 助手中的名单与员工管理模块一致
        const currentEmployees = DataManager.getAll('employees').filter(e => e.status === '在职');

        // 创建一个 ID -> Report 的映射，方便查找现有的输入状态
        const existingReportMap = new Map(this.state.reports.map(r => [r.id, r]));

        // 重新构建 reports 数组
        this.state.reports = currentEmployees.map(emp => {
            const existing = existingReportMap.get(emp.id);
            if (existing) {
                return { ...existing, name: emp.name };
            } else {
                return {
                    id: emp.id,
                    name: emp.name,
                    content: '',
                    extractedData: null,
                    aiComment: ''
                };
            }
        });

        this.renderUI(container);
    },

    renderUI(container) {
        container.innerHTML = `


            <!-- Header Section -->
            <div class="dash-header" style="margin-bottom: 2rem;">
                <div class="dash-title-area">
                    <h2 class="dash-title">AI 智能助理</h2>
                    <span class="dash-date">全自动化的团队日报与数据提取引擎</span>
                </div>
                <div class="dash-controls">
                    <div class="dropdown">
                        <button class="btn-settings" onclick="document.getElementById('ai-settings-menu').classList.toggle('show')">
                            <i class="ri-settings-3-line"></i>
                        </button>
                        <div class="dropdown-menu" id="ai-settings-menu">
                            <a href="#" id="ai-config-trigger"><i class="ri-equalizer-line"></i> 参数配置</a>
                            <a href="#" id="ai-key-trigger"><i class="ri-key-2-line"></i> API Key</a>
                 </div>
                    </div>
                </div>
            </div>

            <!-- 数据概览 (Dashboard Style) -->
            <div class="stats-row" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon"><i class="ri-quill-pen-line"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">本月目标进度 (签约)</span>
                        <span class="stat-value" id="stats-contract">加载中...</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="ri-shake-hands-line"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">本月目标进度 (访量)</span>
                        <span class="stat-value" id="stats-visit">加载中...</span>
                    </div>
                </div>
            </div>

            <!-- 员工输入区域 -->
            <div class="card" style="background: rgba(255,255,255,0.6);">
                <div class="card-header">
                    <h3 class="card-title"><i class="ri-edit-circle-line"></i> 员工日报录入</h3>
                    <button class="btn btn-secondary btn-sm" id="reset-reports"><i class="ri-delete-bin-line"></i> 清空重置</button>
                </div>
                <div class="card-body" style="padding: 1.5rem;">
                    ${this.renderReportList()}
                </div>
            </div>

            <!-- 底部操作栏 -->
            <div style="margin-top: 2rem; display: flex; justify-content: center; gap: 1.5rem;">
                <button class="btn btn-primary" id="generate-report-btn" style="padding: 1rem 3rem; font-size: 1.1rem; border-radius: 50px;">
                    <i class="ri-sparkling-fill"></i> 求 AI 帮帮我
                </button>
                
                <button class="btn btn-success" id="import-data-btn" style="padding: 1rem 3rem; font-size: 1.1rem; border-radius: 50px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <i class="ri-database-2-line"></i> 确认并导入数据
                </button>
            </div>

            <!-- 生成结果区域 -->
            <div class="card animate-up" id="result-card" style="margin-top: 2rem; display: ${this.state.generatedResult ? 'block' : 'none'};">
                <div class="card-header">
                    <h3 class="card-title"><i class="ri-article-line"></i> 智能生成结果</h3>
                    <button class="btn btn-secondary" id="copy-result"><i class="ri-file-copy-line"></i> 复制结果</button>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div id="ai-result" style="padding: 2rem; min-height: 200px; background: #fff; font-family: 'PingFang SC', sans-serif; line-height: 1.8; color: #374151;">
                        ${this.state.generatedResult ? this.state.generatedResult.reportText : ''}
                    </div>
                </div>
            </div>
        `;

        this.updateStatsPreview();
        this.bindEvents(container);

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('ai-settings-menu');
            const btn = e.target.closest('.btn-settings');
            if (!btn && menu && menu.classList.contains('show')) {
                menu.classList.remove('show');
            }
        });
    },

    renderReportList() {
        if (this.state.reports.length === 0) {
            return '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">暂无在职员工，请先在员工管理中添加。</div>';
        }
        return `
            <div class="report-list">
                ${this.state.reports.map((item, index) => `
                    <div class="report-row" style="display: flex; gap: 20px; padding: 20px; border-bottom: 1px solid #eee; background: ${index % 2 === 0 ? '#fff' : '#fafafa'}; align-items: flex-start;">
                        
                        <!-- Col 1: Report Input (1.2) -->
                        <div style="flex: 1.2; min-width: 300px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 1.05rem;">
                                <span style="display:inline-block; width:24px; height:24px; background:var(--primary-color); color:#fff; text-align:center; border-radius:50%; line-height:24px; font-size:0.9rem; margin-right:8px;">${index + 1}</span>
                                ${item.name}
                            </label>
                            <textarea class="form-control emp-content" data-idx="${index}" rows="5" placeholder="在此输入${item.name}的今日工作总结..." style="width: 100%; resize: vertical; border: 1px solid #ddd; border-radius: 8px; padding: 10px;">${item.content || ''}</textarea>
                        </div>
                        
                        <!-- Col 2: Extracted Data (1.0) -->
                        <div style="flex: 1; background: #e3f2fd; padding: 15px; border-radius: 8px; border: 1px solid #bbdefb;">
                            <label style="font-weight: bold; color: #1976d2; display: flex; align-items: center; gap: 5px; margin-bottom: 12px;">
                                <i class="ri-bar-chart-groupped-line"></i> 业务数据 (AI提取/手动)
                            </label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="input-group">
                                    <span class="input-addon">电话</span>
                                    <input type="number" class="form-control data-input" data-idx="${index}" data-field="phoneCount" value="${item.extractedData?.phoneCount || 0}" style="text-align: center;">
                                </div>
                                <div class="input-group">
                                    <span class="input-addon">微信</span>
                                    <input type="number" class="form-control data-input" data-idx="${index}" data-field="wechatCount" value="${item.extractedData?.wechatCount || 0}" style="text-align: center;">
                                </div>
                                <div class="input-group">
                                    <span class="input-addon">意向</span>
                                    <input type="number" class="form-control data-input" data-idx="${index}" data-field="intentionCount" value="${item.extractedData?.intentionCount || 0}" style="text-align: center;">
                                </div>
                                <div class="input-group">
                                    <span class="input-addon">拜访</span>
                                    <input type="number" class="form-control data-input" data-idx="${index}" data-field="visitCount" value="${item.extractedData?.visitCount || 0}" style="text-align: center;">
                                </div>
                                <div class="input-group">
                                    <span class="input-addon">签约</span>
                                    <input type="number" class="form-control data-input" data-idx="${index}" data-field="contractCount" value="${item.extractedData?.contractCount || 0}" style="text-align: center;">
                                </div>
                            </div>
                        </div>

                        <!-- Col 3: AI Comment (1.0) -->
                        <div style="flex: 1; background: #fff3e0; padding: 15px; border-radius: 8px; border: 1px solid #ffe0b2;">
                            <label style="font-weight: bold; color: #f57c00; display: flex; align-items: center; gap: 5px; margin-bottom: 12px;">
                                <i class="ri-lightbulb-flash-line"></i> AI 点评
                            </label>
                            <div style="font-size: 0.95em; line-height: 1.6; color: #555; background: rgba(255,255,255,0.5); padding: 10px; border-radius: 4px; min-height: 115px;">
                                ${item.aiComment || '<span style="color:#aaa;">(点击生成后显示点评)</span>'}
                            </div>
                        </div>

                    </div>
                `).join('')}
            </div>
            <style>
                .input-addon { font-size: 0.85em; color: #555; margin-right: 5px; min-width: 32px; display: inline-block; font-weight: 500;}
                .input-group { display: flex; align-items: center; background: #fff; padding: 4px 8px; border-radius: 4px; border: 1px solid #daeaf6; }
                .input-group:focus-within { border-color: #2196f3; }
                .data-input { border: none !important; padding: 0 !important; height: auto !important; box-shadow: none !important; }
            </style>
        `;
    },

    bindEvents(container) {
        // 配置入口
        document.getElementById('ai-config-trigger')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showConfigModal();
        });

        // API Key 入口
        document.getElementById('ai-key-trigger')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showKeyModal();
        });

        // 输入监听
        container.querySelectorAll('.emp-content').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                this.state.reports[idx].content = e.target.value;
            });
        });

        container.querySelectorAll('.data-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                const field = e.target.dataset.field;
                if (!this.state.reports[idx].extractedData) this.state.reports[idx].extractedData = {};
                this.state.reports[idx].extractedData[field] = parseInt(e.target.value) || 0;
            });
        });

        // 按钮事件
        document.getElementById('generate-report-btn').addEventListener('click', () => this.generateReport());
        document.getElementById('import-data-btn').addEventListener('click', () => this.handleImport());
        document.getElementById('reset-reports').addEventListener('click', () => this.resetReports(container));

        const copyBtn = document.getElementById('copy-result');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const text = document.getElementById('ai-result').innerText;
                navigator.clipboard.writeText(text).then(() => Utils.showToast('已复制结果', 'success'));
            });
        }
    },

    updateStatsPreview() {
        const goals = DataManager.getMonthlyGoals();
        const progress = DataManager.getMonthlyProgress();

        const contractEl = document.getElementById('stats-contract');
        const visitEl = document.getElementById('stats-visit');

        if (contractEl) contractEl.innerHTML = `${progress.contract} <span style="font-size:0.6em; color:var(--text-muted);">/ ${goals.contract}</span>`;
        if (visitEl) visitEl.innerHTML = `${progress.visit} <span style="font-size:0.6em; color:var(--text-muted);">/ ${goals.visit}</span>`;
    },

    stopLoading() {
        // No-op: Loading overlay removed as per user request
    },

    async generateReport() {
        const apiKey = DataManager.getSetting('deepseek_api_key');
        if (!apiKey) {
            Utils.showToast('请先配置 API Key', 'error');
            this.showKeyModal();
            return;
        }

        const activeReports = this.state.reports.filter(r => r.content && r.content.trim());
        if (activeReports.length === 0) {
            Utils.showToast('请至少输入一位员工的日报', 'warning');
            return;
        }

        // Prepare simulation steps with specific names
        // e.g. "Checking [Name]'s report..."
        const loadingSteps = [];
        loadingSteps.push('正在唤醒日报专家...');
        activeReports.forEach(r => {
            loadingSteps.push(`正在深度分析 ${r.name} 的日报...`);
        });
        loadingSteps.push('正在撰写团队复盘...');
        loadingSteps.push('正在生成心得体会...');
        loadingSteps.push('正在最后润色...');

        // Start Animation and Button Feedback
        const btn = document.getElementById('generate-report-btn');
        let loadingStep = 0;
        let loadingInterval;

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ${loadingSteps[0]}`;

            // Simulate steps
            loadingInterval = setInterval(() => {
                loadingStep = (loadingStep + 1) % loadingSteps.length;
                btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> ${loadingSteps[loadingStep]}`;
            }, 2000); // Slower updates to make it readable
        }

        // Ensure result card is visible but maybe show specific state?
        // For now we keep it hidden until result arrives as per standard pattern, or user wants it "always displayed"?
        // "AI助手页面生成结果可以一直显示" -> Maybe they mean previous result? Or a placeholder? 
        // Let's assume they want the result area to appear ASAP with a loader? 
        // For now, let's stick to the button feedback as it is "Expert Thinking".

        // this.startLoading(); // Removed overlay loading

        try {
            // Prepare Data
            const goals = DataManager.getMonthlyGoals();
            const progress = DataManager.getMonthlyProgress();
            const date = new Date();
            const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

            const commentPrompt = DataManager.getSetting('ai_comment_prompt', '语气像销售总监，简明扼要，直击痛点，多给鼓励。');
            const commentLength = DataManager.getSetting('ai_comment_length', 50);
            const userMotto = DataManager.getSetting('ai_motto', '永远有一个更好的方法');

            // Construct Prompt
            const prompt = `
你是一个专业的CRM销售团队助理。请根据以下提供的【团队历史数据】和【今日员工日报】，完成两项任务：
1. 生成一份"${dateStr}工作总结"（Markdown格式），**格式必须严格遵照下方模版**。
2. 从每个员工的日报中提取今日的具体业务数据（JSON格式）。

【团队数据 (截止昨日/已入库)】
本月签约目标：${goals.contract}
已录入签约：${progress.contract}
本月访量目标：${goals.visit}
已录入访量：${progress.visit}

【今日员工日报列表】
${activeReports.map((r, i) => `${i + 1}. ${r.name}：${r.content}`).join('\n')}

【生成的日报内容模版 (请严格模仿此格式和标点符号)】
${dateStr}工作总结：
一、团队数据：
本月签约目标：${goals.contract}
已完成签约：[此处计算：历史签约+今日新增签约]
本月访量目标：${goals.visit}
已完成访量：[此处计算：历史访量+今日新增访量]（[计算百分比]%）
1.今日拨打电话数量：[AI自动统计今日总数]个
2.今日新增需求微信：[AI自动统计今日总数]个
3.今日意向客户数量：[AI自动统计今日总数]个
4.今日线上演示/线下演示：[AI自动统计今日总数]个
5.当前所有推进客户：[AI自动统计今日意向+拜访的总数]

二、今日团队业务复盘：
1. [员工名]... (提炼该员工今日亮点，如"完成了入职以来质量最高的一次独立拜访...")
2. [员工名]...
...

三、今日心得体会：
[AI根据今日情况生成一段有深度的感悟]

四、下周重点工作：
1. ...
2. ...

五、座右铭：
${userMotto}

【输出格式要求】
1. 只输出JSON格式。
2. report_text 字段中的内容必须完全符合上述Markdown模版。

{
    "report_text": "Markdown内容...",
    "daily_records": [
        {
            "name": "员工姓名",
            "phoneCount": 0,
            "wechatCount": 0,
            "intentionCount": 0,
            "visitCount": 0,
            "contractCount": 0,
            "ai_comment": "这里是给该员工的单独点评（用于界面显示），语气要根据设置：${commentPrompt}，字数控制在${commentLength}字以内"
        }
    ]
}
`;

            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: "You are a helpful assistant. Please respond in valid JSON format only." },
                        { role: "user", content: prompt }
                    ],
                    stream: false,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            const content = data.choices[0].message.content;

            let parsedResult;
            try {
                parsedResult = JSON.parse(content);
            } catch (e) {
                parsedResult = JSON.parse(content.replace(/```json\n?|```/g, ''));
            }

            // Update State
            const reportText = parsedResult.report_text.replace(/\*/g, '');

            // 如果 marked 库可用，渲染 Markdown
            if (typeof marked !== 'undefined') {
                marked.setOptions({ breaks: true, gfm: true }); // Enable line breaks
            }
            const renderedHtml = (typeof marked !== 'undefined') ? marked.parse(parsedResult.report_text) : reportText;

            this.state.generatedResult = {
                reportText: renderedHtml,
                rawText: parsedResult.report_text
            };
            this.state.isGenerated = true;

            // Make sure result card is visible
            const resultCard = document.getElementById('result-card');
            if (resultCard) {
                resultCard.style.display = 'block';
                // Force scroll after a short delay to ensure rendering
                setTimeout(() => resultCard.scrollIntoView({ behavior: 'smooth' }), 100);
            }

            // Update Reports
            parsedResult.daily_records.forEach(record => {
                const report = this.state.reports.find(r => r.name === record.name);
                if (report) {
                    report.extractedData = {
                        phoneCount: record.phoneCount,
                        wechatCount: record.wechatCount,
                        intentionCount: record.intentionCount,
                        visitCount: record.visitCount,
                        contractCount: record.contractCount
                    };
                    report.aiComment = record.ai_comment;
                }
            });

            // Stop Loading
            this.stopLoading();
            Utils.showToast('AI生成完成！', 'success');

            // Re-render
            this.render(document.getElementById('page-content'));

            // Scroll to result
            setTimeout(() => {
                document.getElementById('result-card')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);

        } catch (error) {
            this.stopLoading();
            console.error(error);
            Utils.showToast(`生成失败: ${error.message}`, 'error');
        } finally {
            if (loadingInterval) clearInterval(loadingInterval);
            const btn = document.getElementById('generate-report-btn');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="ri-sparkling-fill"></i> 求 AI 帮帮我';
            }
        }
    },


    showConfigModal() {
        const prompt = DataManager.getSetting('ai_comment_prompt', '语气像销售总监，简明扼要，直击痛点，多给鼓励。');
        const length = DataManager.getSetting('ai_comment_length', 50);

        Utils.createModal({
            title: '<i class="ri-equalizer-line"></i> AI 参数配置',
            content: `
                <form id="ai-config-form">
                    <div class="form-group">
                        <label>点评提示词 (Prompt)</label>
                        <textarea name="prompt" class="form-control" rows="4">${prompt}</textarea>
                    </div>
                    <div class="form-group">
                        <label>点评字数限制</label>
                        <input type="number" name="length" class="form-control" value="${length}">
                    </div>
                    <div class="form-group">
                        <label>🌟 自定义座右铭</label>
                        <input type="text" name="motto" class="form-control" value="${DataManager.getSetting('ai_motto', '永远有一个更好的方法')}" placeholder="输入你想在日报末尾展示的座右铭">
                    </div>
                </form>
            `,
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                {
                    text: '保存', class: 'btn btn-primary', onClick: () => {
                        const form = document.getElementById('ai-config-form');
                        DataManager.saveSetting('ai_comment_prompt', form.prompt.value);
                        DataManager.saveSetting('ai_comment_length', parseInt(form.length.value));
                        DataManager.saveSetting('ai_motto', form.motto.value);
                        Utils.showToast('设置已保存', 'success');
                        document.querySelector('.modal-overlay').remove();
                    }
                }
            ]
        });
    },

    showKeyModal() {
        Utils.createModal({
            title: '<i class="ri-key-2-line"></i> 配置 API Key',
            content: `
                <div class="form-group">
                    <label>DeepSeek API Key</label>
                    <input type="text" id="api-key-input" class="form-control" value="${DataManager.getSetting('deepseek_api_key', '')}">
                </div>
            `,
            buttons: [
                { text: '取消', class: 'btn btn-secondary' },
                {
                    text: '保存', class: 'btn btn-primary', onClick: () => {
                        const key = document.getElementById('api-key-input').value.trim();
                        DataManager.saveSetting('deepseek_api_key', key);
                        Utils.showToast('API Key 已保存', 'success');
                        document.querySelector('.modal-overlay').remove();
                    }
                }
            ]
        });
    },

    async resetReports(container) {
        if (await Utils.confirm('确定要清空所有输入的内容吗？')) {
            const employees = DataManager.getAll('employees');
            this.state.reports = employees.map(emp => ({
                id: emp.id, name: emp.name, content: '', extractedData: null, aiComment: ''
            }));
            this.state.isGenerated = false;
            this.state.generatedResult = null;
            this.render(container);
        }
    },

    async handleImport() {
        const finalData = [];
        this.state.reports.forEach(report => {
            if (report.extractedData) {
                const data = report.extractedData;
                const newItem = {
                    employeeId: report.id,
                    date: new Date().toISOString(),
                    phoneCount: data.phoneCount || 0,
                    wechatCount: data.wechatCount || 0,
                    intentionCount: data.intentionCount || 0,
                    visitCount: data.visitCount || 0,
                    contractCount: data.contractCount || 0
                };
                newItem.totalScore = DataManager.calculateTaskScore(newItem);
                finalData.push(newItem);
            }
        });

        if (finalData.length > 0) {
            if (await Utils.confirm(`确认导入 ${finalData.length} 条数据？`)) {
                await DataManager.batchAdd('taskRecords', finalData);
                Utils.showToast(`成功导入 ${finalData.length} 条数据！`, 'success');
            }
        } else {
            Utils.showToast('没有可导入的数据', 'warning');
        }
    }
};

