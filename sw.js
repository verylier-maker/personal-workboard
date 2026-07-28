// 澜舟的工作台 Service Worker
// 缓存首页 + 离线兜底

const CACHE_NAME = 'lanzhou-workboard-v1';
const URLS_TO_CACHE = [
  '.',
  'index.html'
];

// 安装：预缓存首页
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  // 立即激活，不等待旧 SW
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：缓存优先 + 网络更新
self.addEventListener('fetch', event => {
  // 只处理同源请求
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 有缓存先用缓存
      const fetchPromise = fetch(event.request).then(response => {
        // 成功的 GET 请求才更新缓存
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // 网络失败，如果没缓存就返回首页
        return cached || caches.match('index.html');
      });
      return cached || fetchPromise;
    })
  );
});
