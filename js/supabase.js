/**
 * Supabase 客户端初始化模块
 * 提供数据库连接和认证功能
 */

const SUPABASE_URL = 'https://pkluoenngimchrngldye.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHVvZW5uZ2ltY2hybmdsZHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDIzNDgsImV4cCI6MjA4NDI3ODM0OH0.MWsJnuHnNcZgNM0kz7yGj-hBMAbGlkFcL98ldX82SuE';

// 检查 Supabase SDK 是否已加载
function initSupabase() {
    console.log('正在初始化 Supabase...');

    // 检查 SDK 是否存在
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase SDK 未加载！请检查网络连接。');
        return null;
    }

    try {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase 客户端初始化成功');
        return client;
    } catch (error) {
        console.error('Supabase 初始化失败:', error);
        return null;
    }
}

// 初始化 Supabase 客户端
const supabaseClient = initSupabase();

// 导出供其他模块使用
window.SupabaseClient = supabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
