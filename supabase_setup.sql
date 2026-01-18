-- ================================================
-- CRM 客户管理系统 - Supabase 数据库初始化脚本
-- ================================================

-- 1. 创建员工表 (employees)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT '在职',
    create_time TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建任务记录表 (task_records)
CREATE TABLE IF NOT EXISTS task_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    phone_count INTEGER DEFAULT 0,
    wechat_count INTEGER DEFAULT 0,
    intention_count INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    contract_count INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    remark TEXT,
    create_time TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建付款记录表 (payment_records)
CREATE TABLE IF NOT EXISTS payment_records (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    customer_name TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_time TIMESTAMPTZ NOT NULL,
    remark TEXT,
    create_time TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建设置表 (settings)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 启用 Row Level Security (RLS)
-- ================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 创建 RLS 策略 - 允许已认证用户读写
-- ================================================

-- 员工表策略
CREATE POLICY "Allow all operations for authenticated users on employees" ON employees
    FOR ALL USING (auth.role() = 'authenticated');

-- 任务记录表策略
CREATE POLICY "Allow all operations for authenticated users on task_records" ON task_records
    FOR ALL USING (auth.role() = 'authenticated');

-- 付款记录表策略
CREATE POLICY "Allow all operations for authenticated users on payment_records" ON payment_records
    FOR ALL USING (auth.role() = 'authenticated');

-- 设置表策略
CREATE POLICY "Allow all operations for authenticated users on settings" ON settings
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================================
-- 创建索引优化查询性能
-- ================================================

CREATE INDEX IF NOT EXISTS idx_task_records_date ON task_records(date);
CREATE INDEX IF NOT EXISTS idx_task_records_employee ON task_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_time ON payment_records(payment_time);
CREATE INDEX IF NOT EXISTS idx_payment_records_employee ON payment_records(employee_id);

-- ================================================
-- 插入默认设置
-- ================================================

INSERT INTO settings (key, value) VALUES
    ('scoreConfig', '{"phone": 1, "wechat": 3, "intention": 5, "visit": 20, "contract": 50}'),
    ('dailyTargetScore', '35'),
    ('systemTitle', '"逐米时代 CRM"'),
    ('yearlyGoals', '{"visit": 500, "intent": 100, "contract": 100, "payment": 1000000}'),
    ('monthlyGoals', '{"visit": 50, "intent": 10, "contract": 10, "payment": 100000}')
ON CONFLICT (key) DO NOTHING;
