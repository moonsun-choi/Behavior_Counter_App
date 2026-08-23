/*
 * 오프라인 캐시. 수업 중 네트워크가 끊겨도 카운트는 계속 되어야 한다.
 *
 * 캐시 이름의 버전을 올리면 옛 캐시를 지우고 새로 받는다.
 * 파일을 고쳤는데 반영이 안 되면 여기 v 숫자를 올린다.
 */
const CACHE_NAME = 'counter-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Tailwind CDN·Chart.js·구글 폰트는 외부 도메인이라 캐시하지 않는다.
  // 네트워크가 없으면 기본 글꼴로 뜨지만 카운트와 저장은 동작한다.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
