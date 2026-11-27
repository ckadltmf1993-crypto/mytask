/* MY TASK 서비스워커 — 오프라인 실행과 시스템 알림 클릭 처리
   index.html을 고친 뒤에는 아래 VERSION 숫자를 올려 주면 사용자에게 새 버전이 확실히 반영됩니다. */
const VERSION = 'mytask-v7';
const FILES = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* 인터넷이 되면 항상 최신 파일, 안 되면 저장해 둔 파일로 실행 */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
/* 알림을 누르면 MY TASK 창을 열고 해당 업무 표시 */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const id = e.notification.data && e.notification.data.id;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const win = list.find(c => c.url.startsWith(self.registration.scope));
    if (win) { win.focus(); if (id) win.postMessage({ type: 'open-task', id }); return; }
    return self.clients.openWindow('./');
  }));
});
