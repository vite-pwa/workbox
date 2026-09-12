export const swCode = `self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', () => {
  console.log('SW activated');
});
self.addEventListener('fetch', (event) => {
  console.log('Fetch:', event.request.url);
});
self.__precacheList = self.__WB_MANIFEST;
`
