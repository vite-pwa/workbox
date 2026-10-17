import { describe, expect, it } from 'vitest'
import { isServiceWorkerModuleSupported } from '../src/esm-sw-detector'

describe('isServiceWorkerModuleSupported', () => {
  it('returns false for empty user agents', () => {
    expect(isServiceWorkerModuleSupported('')).toBe(false)
  })

  describe('chrome', () => {
    it('supports Chrome 91+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')).toBe(true)
    })
    it('rejects Chrome < 91', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36')).toBe(false)
    })
  })

  describe('chrome (Android)', () => {
    it('supports Chrome Android 147+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36')).toBe(true)
    })
    it('rejects Chrome Android < 147', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36')).toBe(false)
    })
  })

  describe('edge', () => {
    it('supports Edge 91+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59')).toBe(true)
    })
    it('rejects Edge < 91', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 Edg/90.0.818.62')).toBe(false)
    })
  })

  describe('safari (macOS)', () => {
    it('supports Safari 15+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15')).toBe(true)
    })
    it('rejects Safari < 15', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15')).toBe(false)
    })
  })

  describe('iOS Safari', () => {
    it('supports iOS Safari 15+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1')).toBe(true)
    })
    it('rejects iOS Safari < 15', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1')).toBe(false)
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1')).toBe(false)
    })
  })

  describe('firefox', () => {
    it('supports Firefox 145+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0')).toBe(true)
    })
    it('rejects Firefox < 145', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0')).toBe(false)
    })
  })

  describe('firefox (Android)', () => {
    it('supports Firefox Android 150+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Android 14; Mobile; rv:150.0) Gecko/150.0 Firefox/150.0')).toBe(true)
    })
    it('rejects Firefox Android < 150', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Android 14; Mobile; rv:149.0) Gecko/149.0 Firefox/149.0')).toBe(false)
    })
  })

  describe('samsung browser', () => {
    it('supports Samsung Browser 16+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/16.0 Chrome/92.0.4515.166 Mobile Safari/537.36')).toBe(true)
    })
    it('rejects Samsung Browser < 16', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/15.0 Chrome/90.0.4430.212 Mobile Safari/537.36')).toBe(false)
    })
  })

  describe('chromium webview', () => {
    it('supports WebView 147+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; Android 10; SM-G973F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.0.0 Mobile Safari/537.36')).toBe(true)
    })
    it('rejects WebView < 147', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; Android 10; SM-G973F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.0.0 Mobile Safari/537.36')).toBe(false)
    })
  })

  describe('uc browser (Android)', () => {
    it('supports UC Browser 16+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; U; Android 10; en-US; SM-G973F Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 UCBrowser/16.0.0.1309 Mobile Safari/537.36')).toBe(true)
    })
    it('supports UC Browser 15.5+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; U; Android 10; en-US; SM-G973F Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 UCBrowser/15.5.0.1309 Mobile Safari/537.36')).toBe(true)
    })
    it('rejects UC Browser < 15.5', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; U; Android 10; en-US; SM-G973F Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 UCBrowser/15.4.0.1309 Mobile Safari/537.36')).toBe(false)
    })
  })

  describe('opera mobile', () => {
    it('supports Opera Mobile 80+', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36 OPR/80.0.4153.75612')).toBe(true)
    })
    it('rejects Opera Mobile < 80', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36 OPR/79.0.4153.75612')).toBe(false)
    })
  })

  // These tests ensure the CodeRabbit capture group fixes work correctly
  describe('capture Group Fixes (Opera & QQ)', () => {
    it('supports modern Opera (v77+)', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.277')).toBe(true)
    })
    it('rejects older Opera (< v77)', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 OPR/76.0.4017.177')).toBe(false)
    })

    it('supports modern QQ Browser (v15+)', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36 QQBrowser/15.0.0.1')).toBe(true)
    })
    it('supports modern QQ Browser (v14.9+)', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36 QQBrowser/14.9.0.1')).toBe(true)
    })
    it('rejects older QQ Browser (< v14.9)', () => {
      expect(isServiceWorkerModuleSupported('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36 QQBrowser/14.8.0.1')).toBe(false)
    })
  })
})
