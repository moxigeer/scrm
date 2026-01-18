/**
 * Supabase 客户端初始化模块
 * 提供数据库连接和认证功能
 */

const SUPABASE_URL = 'https://pkluoenngimchrngldye.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHVvZW5uZ2ltY2hybmdsZHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDIzNDgsImV4cCI6MjA4NDI3ODM0OH0.MWsJnuHnNcZgNM0kz7yGj-hBMAbGlkFcL98ldX82SuE';

// 初始化 Supabase 客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 导出供其他模块使用
window.SupabaseClient = supabase;
