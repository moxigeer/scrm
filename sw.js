// Service Worker - 用于缓存资源和离线访问
const CACHE_NAME = 'crm-cache-v1';

// 需要缓存的核心资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/login.html',
    '/css/main.css',
    '/css/datacenter.css',
    '/js/utils.js',
    '/js/supabase.js',
    '/js/auth.js',
    '/js/dataManager.js',
    '/js/app.js',
    '/js/modules/dashboard.js',
    '/js/modules/employees.js',
    '/js/modules/taskRecords.js',
    '/js/modules/payments.js',
    '/js/modules/aiAssistant.js',
    '/lib/supabase.min.js',
    '/lib/chart.min.js',
    '/lib/xlsx.full.min.js',
    '/lib/marked.min.js',
    '/lib/remixicon/remixicon.css',
    '/lib/remixicon/remixicon.woff2'
];

// 安装 Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存静态资源');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 网络请求拦截策略：网络优先，失败时使用缓存
self.addEventListener('fetch', event => {
    // 跳过 Supabase API 请求（始终走网络）
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // 成功获取网络响应，更新缓存
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // 网络失败，尝试从缓存获取
                return caches.match(event.request);
            })
    );
});
