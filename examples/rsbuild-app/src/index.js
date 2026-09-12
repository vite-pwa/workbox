import './style.css'

const app = document.querySelector('#root')

app.innerHTML = `
  <h1>Rsbuild PWA</h1>
  <p>This app is built by Rsbuild. The service worker is attached through the Rspack plugin path.</p>
`

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
