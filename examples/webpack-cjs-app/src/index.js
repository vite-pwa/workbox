const app = document.querySelector('#app')

app.innerHTML = `
  <h1>Webpack PWA</h1>
  <p>This app is built by webpack and its service worker is bundled by @vite-pwa/workbox-build.</p>
`

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
