
const CACHE_NAME = 'ai-calorie-tracker-v4';
const OFFLINE_URL = '/';

// 定義需要快取的外部資源 (CDN)
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 嘗試快取所有資源，即使部分失敗也不影響核心運作
      return cache.addAll([
        OFFLINE_URL,
        '/index.html',
        '/manifest.json',
        ...EXTERNAL_ASSETS
      ]).catch(err => {
        console.warn('部分資源快取失敗，但核心檔案已快取:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // 對於導航請求 (HTML)，優先使用網路，失敗則使用快取 (Network First)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL) || caches.match('/index.html');
        })
    );
    return;
  }

  // 對於靜態資源，優先使用快取，失敗則使用網路 (Cache First)
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});