/**
 * @jest-environment jsdom
 */

import CookieConsentBanner from '../src/cookieConsentBanner.js';

describe('CookieConsentBanner', () => {
  let banner;
  
  beforeEach(() => {
    // Clear all cookies and DOM
    document.cookie = '';
    document.body.innerHTML = '';
    
    // Reset global
    window.CookieConsentBanner = null;
    
    // Mock fetch
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    if (banner) {
      banner.closeModal();
    }
  });
  
  describe('Constructor and Initialization', () => {
    test('should initialize with default config', () => {
      banner = new CookieConsentBanner();
      expect(banner.config.domain).toBe(window.location.hostname);
      expect(banner.config.cookieExpiryDays).toBe(365);
      expect(banner.config.locale).toBe('en');
    });
    
    test('should merge custom config with defaults', () => {
      const customConfig = {
        domain: 'example.com',
        locale: 'fr',
        cookieExpiryDays: 30
      };
      
      banner = new CookieConsentBanner(customConfig);
      expect(banner.config.domain).toBe('example.com');
      expect(banner.config.locale).toBe('fr');
      expect(banner.config.cookieExpiryDays).toBe(30);
      expect(banner.config.blockSiteOnFunctionalDeny).toBe(false); // default
    });
    
    test('should set global instance', () => {
      banner = new CookieConsentBanner();
      expect(window.CookieConsentBanner).toBe(banner);
    });
  });
  
  describe('Locale Detection', () => {
    test('should detect browser locale', () => {
      const originalNavigator = global.navigator;
      global.navigator = {
        language: 'fr-FR',
        languages: ['fr-FR', 'fr', 'en']
      };
      
      banner = new CookieConsentBanner();
      expect(banner.config.locale).toBe('fr');
      
      global.navigator = originalNavigator;
    });
    
    test('should fall back to English if no language detected', () => {
      const originalNavigator = global.navigator;
      global.navigator = {};
      
      banner = new CookieConsentBanner();
      expect(banner.config.locale).toBe('en');
      
      global.navigator = originalNavigator;
    });
  });
  
  describe('Consent State Management', () => {
    test('should return null when no consent state exists', () => {
      banner = new CookieConsentBanner();
      expect(banner.loadConsentState()).toBeNull();
    });
    
    test('should load and parse valid consent state', () => {
      const consentState = {
        functional: true,
        analytical: false,
        timestamp: '2023-01-01T00:00:00.000Z',
        language: 'en'
      };
      
      document.cookie = `cookie_consent_state=${encodeURIComponent(JSON.stringify(consentState))}`;
      
      banner = new CookieConsentBanner();
      const loaded = banner.loadConsentState();
      
      expect(loaded.functional).toBe(true);
      expect(loaded.analytical).toBe(false);
      expect(loaded.timestamp).toBe('2023-01-01T00:00:00.000Z');
    });
    
    test('should handle malformed consent state cookie', () => {
      document.cookie = 'cookie_consent_state=invalid-json';
      
      banner = new CookieConsentBanner();
      const loaded = banner.loadConsentState();
      
      expect(loaded).toBeNull();
    });
  });
  
  describe('Cookie Management', () => {
    test('should set cookie with correct options', () => {
      banner = new CookieConsentBanner({ domain: 'example.com' });
      
      banner.setCookie('test_cookie', 'test_value', 30, 'analytical');
      
      const cookies = document.cookie.split(';');
      const testCookie = cookies.find(c => c.trim().startsWith('test_cookie='));
      
      expect(testCookie).toBeTruthy();
      expect(testCookie).toContain('test_value');
      expect(testCookie).toContain('domain=example.com');
      expect(testCookie).toContain('SameSite=Lax');
    });
    
    test('should delete cookie correctly', () => {
      banner = new CookieConsentBanner({ domain: 'example.com' });
      
      // Set cookie first
      banner.setCookie('delete_me', 'value', 30, 'functional');
      expect(document.cookie).toContain('delete_me=value');
      
      // Delete cookie
      banner.deleteCookie('delete_me');
      expect(document.cookie).not.toContain('delete_me');
    });
    
    test('should get cookie value correctly', () => {
      document.cookie = 'test_cookie=test_value; domain=example.com';
      
      banner = new CookieConsentBanner({ domain: 'example.com' });
      const value = banner.getCookie('test_cookie');
      
      expect(value).toBe('test_value');
    });
  });
  
  describe('Consent State Creation', () => {
    test('should create consent state with all categories', () => {
      banner = new CookieConsentBanner({ locale: 'fr' });
      
      const state = banner.createConsentState({
        functional: true,
        analytical: true,
        performance: false,
        advertising: false,
        social: true,
        other: false
      });
      
      expect(state.functional).toBe(true);
      expect(state.analytical).toBe(true);
      expect(state.performance).toBe(false);
      expect(state.advertising).toBe(false);
      expect(state.social).toBe(true);
      expect(state.other).toBe(false);
      expect(state.timestamp).toBeTruthy();
      expect(state.language).toBe('fr');
      expect(new Date(state.timestamp).toISOString()).toBe(state.timestamp);
    });
  });
  
  describe('Consent Token Generation', () => {
    test('should generate UUID v4 format', () => {
      banner = new CookieConsentBanner();
      
      const uuid = banner.generateUUID();
      
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
    
    test('should generate unique UUIDs', () => {
      banner = new CookieConsentBanner();
      
      const uuid1 = banner.generateUUID();
      const uuid2 = banner.generateUUID();
      
      expect(uuid1).not.toBe(uuid2);
    });
    
    test('should create and save consent token for analytics', () => {
      const mockFetch = global.fetch;
      global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
      
      banner = new CookieConsentBanner({
        consentEndpoint: 'https://api.example.com/consent',
        customData: { siteId: '123' }
      });
      
      const state = {
        functional: true,
        analytical: true,
        timestamp: '2023-01-01T00:00:00.000Z',
        language: 'en'
      };
      
      banner.generateAndSaveConsentToken(state);
      
      const tokenCookie = banner.getCookie('cookie_consent_token');
      expect(tokenCookie).toBeTruthy();
      
      const token = JSON.parse(tokenCookie);
      expect(token.token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(token.timestamp).toBe('2023-01-01T00:00:00.000Z');
      expect(token.language).toBe('en');
      expect(token.siteId).toBe('123');
      
      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"token"')
      });
      
      global.fetch = mockFetch;
    });
  });
  
  describe('Modal System', () => {
    test('should create banner modal', () => {
      banner = new CookieConsentBanner();
      banner.showBannerModal();
      
      const modal = document.querySelector('.ccb-modal--banner');
      expect(modal).toBeTruthy();
      expect(modal.querySelector('.ccb-banner__title')).toBeTruthy();
      expect(modal.querySelector('[data-action="accept"]')).toBeTruthy();
      expect(modal.querySelector('[data-action="manage"]')).toBeTruthy();
    });
    
    test('should create fullscreen modal', () => {
      banner = new CookieConsentBanner();
      banner.showFullscreenModal();
      
      const modal = document.querySelector('.ccb-modal--fullscreen');
      expect(modal).toBeTruthy();
      expect(modal.querySelector('.ccb-fullscreen__title')).toBeTruthy();
      expect(modal.querySelector('.ccb-consent-categories')).toBeTruthy();
      expect(modal.querySelector('[data-action="accept"]')).toBeTruthy();
      expect(modal.querySelector('[data-action="reject"]')).toBeTruthy();
    });
    
    test('should create management modal', () => {
      banner = new CookieConsentBanner();
      banner.showManagementModal();
      
      const modal = document.querySelector('.ccb-modal--management');
      expect(modal).toBeTruthy();
      expect(modal.querySelector('.ccb-management__title')).toBeTruthy();
      expect(modal.querySelector('.ccb-consent-categories')).toBeTruthy();
      expect(modal.querySelector('[data-action="save"]')).toBeTruthy();
    });
    
    test('should close modal on close button click', () => {
      banner = new CookieConsentBanner();
      banner.showBannerModal();
      
      const modal = document.querySelector('.ccb-modal--banner');
      expect(modal).toBeTruthy();
      
      // Test modal closing functionality
      banner.closeModal();
      
      const closedModal = document.querySelector('.ccb-modal');
      expect(closedModal).toBeNull();
    });
  });
  
  describe('Consent Actions', () => {
    test('should accept all consent', () => {
      banner = new CookieConsentBanner();
      
      banner.acceptAllConsent();
      
      expect(banner.consentState.functional).toBe(true);
      expect(banner.consentState.analytical).toBe(true);
      expect(banner.consentState.performance).toBe(true);
      expect(banner.consentState.advertising).toBe(true);
      expect(banner.consentState.social).toBe(true);
      expect(banner.consentState.other).toBe(true);
      
      const consentCookie = banner.getCookie('cookie_consent_state');
      expect(consentCookie).toBeTruthy();
    });
    
    test('should reject all consent (except functional)', () => {
      banner = new CookieConsentBanner();
      
      banner.rejectAllConsent();
      
      expect(banner.consentState.functional).toBe(true);
      expect(banner.consentState.analytical).toBe(false);
      expect(banner.consentState.performance).toBe(false);
      expect(banner.consentState.advertising).toBe(false);
      expect(banner.consentState.social).toBe(false);
      expect(banner.consentState.other).toBe(false);
      
      const tokenCookie = banner.getCookie('cookie_consent_token');
      expect(tokenCookie).toBeNull();
    });
    
    test('should save custom consent based on form state', () => {
      banner = new CookieConsentBanner();
      banner.showManagementModal();
      
      // Mock form state
      document.querySelector('[name="analytical"]').checked = true;
      document.querySelector('[name="performance"]').checked = false;
      document.querySelector('[name="advertising"]').checked = true;
      document.querySelector('[name="social"]').checked = false;
      document.querySelector('[name="other"]').checked = true;
      
      banner.saveCustomConsent();
      
      expect(banner.consentState.functional).toBe(true);
      expect(banner.consentState.analytical).toBe(true);
      expect(banner.consentState.performance).toBe(false);
      expect(banner.consentState.advertising).toBe(true);
      expect(banner.consentState.social).toBe(false);
      expect(banner.consentState.other).toBe(true);
    });
  });
  
  describe('Third-party Integration', () => {
    test('should register custom third-party handler', () => {
      const mockHandler = jest.fn();
      
      banner = new CookieConsentBanner();
      banner.registerThirdPartyHandler('custom', mockHandler);
      
      expect(banner.config.thirdPartyHandlers.custom).toBe(mockHandler);
    });
    
    test('should apply third-party handlers when consent state changes', () => {
      const mockHandler = jest.fn();
      
      banner = new CookieConsentBanner({
        thirdPartyHandlers: {
          custom: mockHandler
        }
      });
      
      banner.acceptAllConsent();
      
      expect(mockHandler).toHaveBeenCalledWith(true);
    });
  });
  
  describe('Third-party Blockers', () => {
    test('should block Google Analytics when consent not given', () => {
      banner = new CookieConsentBanner();
      
      // Mock scripts in DOM
      const gaScript = document.createElement('script');
      gaScript.src = 'https://www.google-analytics.com/analytics.js';
      document.head.appendChild(gaScript);
      
      banner.blockGoogleAnalytics();
      
      expect(document.querySelector('script[src*="google-analytics.com"]')).toBeNull();
    });
    
    test('should block Google AdSense when consent not given', () => {
      banner = new CookieConsentBanner();
      
      // Mock script and container
      const adsScript = document.createElement('script');
      adsScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      document.head.appendChild(adsScript);
      
      const adsContainer = document.createElement('div');
      adsContainer.className = 'adsbygoogle';
      document.body.appendChild(adsContainer);
      
      banner.blockGoogleAdSense();
      
      expect(document.querySelector('script[src*="googlesyndication.com"]')).toBeNull();
      expect(document.querySelector('.adsbygoogle')).toBeNull();
    });
  });
  
  describe('Localization', () => {
    test('should return localized text for existing keys', () => {
      banner = new CookieConsentBanner({
        localization: {
          'fr': {
            'cookieConsent.title': 'Titre en français'
          }
        }
      });
      banner.config.locale = 'fr';
      
      const text = banner.getLocalizedText('cookieConsent.title');
      expect(text).toBe('Titre en français');
    });
    
    test('should return default text when localization not found', () => {
      banner = new CookieConsentBanner();
      
      const text = banner.getLocalizedText('cookieConsent.title');
      expect(text).toBe('Cookie Consent');
    });
    
    test('should return key when no text found', () => {
      banner = new CookieConsentBanner();
      
      const text = banner.getLocalizedText('non.existent.key');
      expect(text).toBe('non.existent.key');
    });
  });
  
  describe('Policy Loading', () => {
    test('should load markdown file and convert to HTML', async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve('# Test Policy\n\nThis is a test policy.')
      };
      global.fetch = jest.fn(() => Promise.resolve(mockResponse));
      
      banner = new CookieConsentBanner();
      const content = await banner.loadMarkdownFile('https://example.com/policy.md');
      
      expect(content).toContain('<h1>Test Policy</h1>');
      expect(content).toContain('<p>This is a test policy.</p>');
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/policy.md');
    });
    
    test('should handle failed markdown file loading', async () => {
      const mockResponse = { ok: false, status: 404 };
      global.fetch = jest.fn(() => Promise.resolve(mockResponse));
      
      banner = new CookieConsentBanner();
      const content = await banner.loadMarkdownFile('https://example.com/missing.md');
      
      expect(content).toContain('Policy content could not be loaded.');
    });
  });
  
  describe('Public API', () => {
    test('should provide correct consent state via getConsentState', () => {
      banner = new CookieConsentBanner();
      banner.acceptAllConsent();
      
      const state = banner.getConsentState();
      expect(state.functional).toBe(true);
      expect(state.analytical).toBe(true);
    });
    
    test('should check consent for specific category', () => {
      banner = new CookieConsentBanner();
      banner.acceptAllConsent();
      
      expect(banner.hasConsent('functional')).toBe(true);
      expect(banner.hasConsent('analytical')).toBe(true);
      expect(banner.hasConsent('nonexistent')).toBe(false);
    });
    
    test('should clear all consent data', () => {
      banner = new CookieConsentBanner();
      banner.acceptAllConsent();
      
      expect(banner.getCookie('cookie_consent_state')).toBeTruthy();
      expect(banner.getCookie('cookie_consent_token')).toBeTruthy();
      
      banner.clearConsent();
      
      expect(banner.getCookie('cookie_consent_state')).toBeNull();
      expect(banner.getCookie('cookie_consent_token')).toBeNull();
      expect(banner.consentState).toBeNull();
    });
    
    test('should show different modal types', () => {
      banner = new CookieConsentBanner();
      
      banner.showModal('banner');
      expect(document.querySelector('.ccb-modal--banner')).toBeTruthy();
      
      banner.closeModal();
      banner.showModal('fullscreen');
      expect(document.querySelector('.ccb-modal--fullscreen')).toBeTruthy();
      
      banner.closeModal();
      banner.showModal('management');
      expect(document.querySelector('.ccb-modal--management')).toBeTruthy();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle malformed JSON in cookie consent state', () => {
      document.cookie = 'cookie_consent_state={invalid json}';
      
      banner = new CookieConsentBanner();
      expect(banner.consentState).toBeNull();
    });
    
    test('should handle failed fetch requests gracefully', async () => {
      const mockFetch = jest.fn(() => Promise.reject(new Error('Network error')));
      global.fetch = mockFetch;
      
      banner = new CookieConsentBanner({
        consentEndpoint: 'https://api.example.com/consent'
      });
      
      banner.acceptAllConsent();
      
      // Should not throw, should handle gracefully
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFetch).toHaveBeenCalled();
    });
  });
  
  describe('GDPR Compliance Features', () => {
    test('should respect functional cookie requirement', () => {
      banner = new CookieConsentBanner({
        blockSiteOnFunctionalDeny: true
      });
      
      const state = { functional: false };
      banner.saveAndApplyConsent(banner.createConsentState(state));
      
      const blockedModal = document.querySelector('.ccb-modal--blocked');
      expect(blockedModal).toBeTruthy();
    });
    
    test('should create proper consent state with timestamp and language', () => {
      banner = new CookieConsentBanner({ locale: 'es' });
      
      banner.acceptAllConsent();
      
      expect(banner.consentState.timestamp).toBeTruthy();
      expect(new Date(banner.consentState.timestamp).toISOString()).toBe(banner.consentState.timestamp);
      expect(banner.consentState.language).toBe('es');
    });
  });
});