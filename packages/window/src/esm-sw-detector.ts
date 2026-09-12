type Browser
  = | 'chrome'
    | 'edge-chromium'
    | 'safari'
    | 'firefox'
    | 'opera'
    | 'chrome-android'
    | 'ios-safari'
    | 'samsung'
    | 'opera-mobile'
    | 'uc-browser-android'
    | 'chromium-webview'
    | 'firefox-android'
    | 'qq-browser'

type OS = 'iOS' | 'Android' | 'Mac OS'

type SWFeatures = (versions: number[], os?: OS) => boolean

const esmServiceWorkerChromiumCheck: SWFeatures = v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 91

// https://caniuse.com/?search=service+worker => 2026-04-09
const allowedESMServiceWorkerBrowsers: Record<Browser, SWFeatures> = {
  'chrome': esmServiceWorkerChromiumCheck,
  'edge-chromium': esmServiceWorkerChromiumCheck,
  'safari': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 15,
  'firefox': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 145,
  'opera': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 77,
  'chrome-android': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 147,
  'ios-safari': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 15,
  'samsung': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 16,
  'opera-mobile': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 80,
  'uc-browser-android': v => v.length > 1 && !Number.isNaN(v[0]) && !Number.isNaN(v[1]) && (v[0] >= 16 || (v[0] >= 15 && v[1] >= 5)),
  'chromium-webview': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 147,
  'firefox-android': v => v.length > 0 && !Number.isNaN(v[0]) && v[0] >= 150,
  'qq-browser': v => v.length > 1 && !Number.isNaN(v[0]) && !Number.isNaN(v[1]) && (v[0] >= 15 || (v[0] >= 14 && v[1] >= 9)),
}

type Rule = (userAgent: string, os?: OS) => RegExpExecArray | null

const esmServiceWorkerRegex = {
  chrome: /(?!Chrom.*OPR)Chrom(?:e|ium)\/([\d.]+)(:?\s|$)/,
  edge: /EdgA?\/([\d.]+)/,
  safari: /Version\/.*Safari/,
  safariVersion: /Version\/([\d._]+)/,
  firefoxVersion: /Firefox\/([\d.]+)(?:\s|$)/,
  opera: /(Opera|OPR)\/([\d.]+)/,
  samsung: /SamsungBrowser\/([\d.]+)/,
  webview: /wv\).*Chrom(?:e|ium)\/([\d.]+)/,
  operaMobile: /Mobile/,
  ucBrowser: /UCBrowser\/([\d.]+)/,
  qq: /(MQQBrowser|QQBrowser)\/([\d.]+)/i,
  iOS: /iP(?:hone|od|ad)/,
  android: /Android/,
  macOS: /Macintosh/,
  split: /[._]/,
} as const

// ORDER MATTERS: most-specific browser tokens first, generic chrome/firefox/opera last
const esmServiceWorkerRules: Record<Browser, Rule> = {
  'edge-chromium': userAgent => esmServiceWorkerRegex.edge.exec(userAgent),
  'samsung': userAgent => esmServiceWorkerRegex.samsung.exec(userAgent),
  'uc-browser-android': (userAgent, os) => os === 'Android' && esmServiceWorkerRegex.operaMobile.test(userAgent) ? esmServiceWorkerRegex.ucBrowser.exec(userAgent) : null,
  'qq-browser': userAgent => esmServiceWorkerRegex.qq.exec(userAgent),
  'chromium-webview': (userAgent, os) => os === 'Android' ? esmServiceWorkerRegex.webview.exec(userAgent) : null,
  'opera-mobile': userAgent => esmServiceWorkerRegex.operaMobile.test(userAgent) ? esmServiceWorkerRegex.opera.exec(userAgent) : null,
  'opera': userAgent => esmServiceWorkerRegex.operaMobile.test(userAgent) ? null : esmServiceWorkerRegex.opera.exec(userAgent),
  'firefox-android': (userAgent, os) => os === 'Android' ? esmServiceWorkerRegex.firefoxVersion.exec(userAgent) : null,
  'firefox': userAgent => esmServiceWorkerRegex.firefoxVersion.exec(userAgent),
  'chrome-android': (userAgent, os) => os === 'Android' ? esmServiceWorkerRegex.chrome.exec(userAgent) : null,
  'ios-safari': (userAgent, os) => os === 'iOS' ? esmServiceWorkerRegex.safariVersion.exec(userAgent) : null,
  'chrome': (userAgent, os) => (!os || os !== 'Android') ? esmServiceWorkerRegex.chrome.exec(userAgent) : null,
  'safari': (userAgent, os) => {
    return os === 'Mac OS' && esmServiceWorkerRegex.safari.test(userAgent) ? esmServiceWorkerRegex.safariVersion.exec(userAgent) : null
  },
}

export function isServiceWorkerModuleSupported(userAgent = navigator.userAgent): boolean {
  if (!userAgent)
    return false

  let os: OS | undefined
  if (esmServiceWorkerRegex.iOS.test(userAgent))
    os = 'iOS'
  else if (esmServiceWorkerRegex.android.test(userAgent))
    os = 'Android'
  else if (esmServiceWorkerRegex.macOS.test(userAgent))
    os = 'Mac OS'

  if (os === 'iOS') {
    const match = esmServiceWorkerRules['ios-safari'](userAgent, os)
    return match
      ? allowedESMServiceWorkerBrowsers['ios-safari'](
          match[1].split(esmServiceWorkerRegex.split).map(v => Number.parseInt(v, 10)),
          os,
        )
      : false
  }

  for (const [name, rule] of Object.entries(esmServiceWorkerRules)) {
    if (name === 'ios-safari')
      continue

    const match = rule(userAgent, os)
    if (match) {
      const config = allowedESMServiceWorkerBrowsers[name as Browser]
      return config(
        match[1].split(esmServiceWorkerRegex.split).map(v => Number.parseInt(v, 10)),
        os,
      )
    }
  }

  return false
}
