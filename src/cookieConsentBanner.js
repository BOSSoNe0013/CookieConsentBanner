/**
 * @file cookieConsentBanner.js
 * @description A comprehensive GDPR-compliant cookie consent banner ES6 module
 * @version 1.0.0
 * @author Cyril Bosselut <contact@b1project.com>
 * @license MIT
 */

import MarkdownIt from 'https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm';

// Create global instance
if (!window.cookieConsentBanner) {
  window.cookieConsentBanner = null;
}

/**
 * @typedef {Object} ConsentState
 * @property {boolean} functional - Mandatory cookies for site functionality
 * @property {boolean} analytical - Analytics and tracking cookies
 * @property {boolean} performance - Performance optimization cookies
 * @property {boolean} advertising - Advertising and marketing cookies
 * @property {boolean} social - Social media integration cookies
 * @property {boolean} other - Other custom cookie categories
 * @property {string} timestamp - ISO timestamp of consent
 * @property {string} language - Language code of consent
 */

/**
 * @typedef {Object} CookieConsentConfig
 * @property {string} [domain] - Cookie domain
 * @property {string[]} [subdomains] - Array of subdomains
 * @property {number} [cookieExpiryDays] - Cookie expiry in days (default: 365)
 * @property {string} [locale] - Default locale (default: 'en')
 * @property {Object} [localization] - Custom localization strings
 * @property {string} [privacyPolicyUrl] - Privacy policy URL
 * @property {string} [cookiePolicyUrl] - Cookie policy URL
 * @property {string} [termsUrl] - Terms of use URL
 * @property {string} [consentEndpoint] - Endpoint for sending consent token
 * @property {Object} [customData] - Custom data to send with consent
 * @property {boolean} [blockSiteOnFunctionalDeny] - Block site if functional cookies denied (default: false)
 * @property {Object} [theme] - CSS custom properties for theming
 * @property {Object} [thirdPartyHandlers] - Custom third-party handlers
 */

/**
 * Cookie Consent Banner Class
 */
class CookieConsentBanner {
  /**
   * @param {CookieConsentConfig} [config={}] - Configuration object
   */
  constructor(config = {}) {
    this.config = this.mergeConfig(config);
    this.consentState = this.loadConsentState();
    this.currentModal = null;
    this.markdownParser = new MarkdownIt({
      linkify: true,
      breaks: true
    });
    
    this.init();
  }

  /**
   * Initialize the cookie consent banner
   */
  init() {
    if (this.consentState) {
      this.applyConsentState();
    } else {
      this.showConsentModal();
    }
    
    // Store instance globally
    window.cookieConsentBanner = this;
    
    // Add event listeners
    this.bindEvents();
  }

  /**
   * Merge default config with user config
   * @param {CookieConsentConfig} config 
   * @returns {CookieConsentConfig}
   */
  mergeConfig(config) {
    return {
      domain: config.domain || window.location.hostname,
      subdomains: config.subdomains || [],
      cookieExpiryDays: config.cookieExpiryDays || 365,
      locale: config.locale || this.detectLocale(),
      localization: config.localization || {},
      privacyPolicyUrl: config.privacyPolicyUrl || '/locales/{locale}/privacy-policy.md',
      cookiePolicyUrl: config.cookiePolicyUrl || '/locales/{locale}/cookie-policy.md',
      termsUrl: config.termsUrl || '/locales/{locale}/terms.md',
      consentEndpoint: config.consentEndpoint,
      customData: config.customData || {},
      blockSiteOnFunctionalDeny: config.blockSiteOnFunctionalDeny || false,
      theme: config.theme || {},
      thirdPartyHandlers: config.thirdPartyHandlers || {},
      ...config
    };
  }

  /**
   * Detect user's locale from browser settings
   * @returns {string}
   */
  detectLocale() {
    const browserLang = navigator.language || navigator.languages?.[0];
    return browserLang?.split('-')[0] || 'en';
  }

  /**
   * Load consent state from cookies
   * @returns {ConsentState|null}
   */
  loadConsentState() {
    const consentCookie = this.getCookie('cookie_consent_state');
    if (!consentCookie) return null;

    try {
      return JSON.parse(decodeURIComponent(consentCookie));
    } catch (error) {
      console.warn('Failed to parse consent state cookie:', error);
      return null;
    }
  }

  /**
   * Save consent state to cookies
   * @param {ConsentState} state 
   */
  saveConsentState(state) {
    const cookieValue = encodeURIComponent(JSON.stringify(state));
    this.setCookie('cookie_consent_state', cookieValue, this.config.cookieExpiryDays, 'fonctionnel');
    
    // Generate and save consent token if analytics are allowed
    if (state.analytical) {
      this.generateAndSaveConsentToken(state);
    } else {
      this.deleteCookie('cookie_consent_token');
    }
  }

  /**
   * Generate unique consent token and save to cookie
   * @param {ConsentState} state 
   */
  generateAndSaveConsentToken(state) {
    const token = this.generateUUID();
    const consentToken = {
      token,
      timestamp: state.timestamp,
      language: state.language,
      ...this.config.customData
    };

    this.setCookie('cookie_consent_token', JSON.stringify(consentToken), this.config.cookieExpiryDays, 'analytique');
    
    // Send to endpoint if configured
    if (this.config.consentEndpoint) {
      this.sendConsentToEndpoint(token, this.config.customData);
    }
  }

  /**
   * Send consent token to configured endpoint
   * @param {string} token 
   * @param {Object} data 
   */
  async sendConsentToEndpoint(token, data) {
    try {
      await fetch(this.config.consentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          data,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.warn('Failed to send consent to endpoint:', error);
    }
  }

  /**
   * Generate a UUID v4
   * @returns {string}
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get cookie value by name
   * @param {string} name 
   * @returns {string|null}
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  /**
   * Set cookie with options
   * @param {string} name 
   * @param {string} value 
   * @param {number} days 
   * @param {string} type 
   */
  setCookie(name, value, days, type = 'fonctionnel') {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const cookieOptions = [
      `expires=${expires.toUTCString()}`,
      `path=/`,
      `domain=${this.config.domain}`,
      'SameSite=Lax'
    ];

    if (location.protocol === 'https:') {
      cookieOptions.push('Secure');
    }

    document.cookie = `${name}=${value}; ${cookieOptions.join('; ')}; type=${type}`;
  }

  /**
   * Delete cookie by name
   * @param {string} name 
   */
  deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${this.config.domain}`;
  }

  /**
   * Apply consent state and handle third-party integrations
   */
  applyConsentState() {
    if (!this.consentState) return;

    // Apply third-party handlers
    Object.entries(this.config.thirdPartyHandlers || {}).forEach(([category, handler]) => {
      if (this.consentState[category] && typeof handler === 'function') {
        handler(true);
      } else if (this.consentState[category] === false && typeof handler === 'function') {
        handler(false);
      }
    });

    // Apply built-in third-party blockers
    this.applyThirdPartyBlockers();
  }

  /**
   * Apply built-in third-party service blockers
   */
  applyThirdPartyBlockers() {
    const { functional, analytical, performance, advertising, social } = this.consentState;

    // Google Analytics
    if (!analytical) {
      this.blockGoogleAnalytics();
    }

    // Google AdSense
    if (!advertising) {
      this.blockGoogleAdSense();
    }

    // Facebook
    if (!social) {
      this.blockFacebook();
    }

    // Twitter
    if (!social) {
      this.blockTwitter();
    }

    // Firebase
    if (!performance) {
      this.blockFirebase();
    }
  }

  /**
   * Block Google Analytics
   */
  blockGoogleAnalytics() {
    // Remove GA cookies
    const gaCookies = ['_ga', '_ga_*', '_gid', '_gat'];
    gaCookies.forEach(cookie => {
      const pattern = new RegExp(cookie.replace('*', '.*'));
      document.cookie.split(';').forEach(c => {
        if (pattern.test(c.trim().split('=')[0])) {
          this.deleteCookie(c.trim().split('=')[0]);
        }
      });
    });

    // Disable GA scripts
    const gaScripts = document.querySelectorAll('script[src*="google-analytics.com"], script[src*="googletagmanager.com"]');
    gaScripts.forEach(script => script.remove());
  }

  /**
   * Block Google AdSense
   */
  blockGoogleAdSense() {
    // Remove AdSense cookies
    const adsCookies = ['_gcl_au', '__gads', '__gpi'];
    adsCookies.forEach(cookie => this.deleteCookie(cookie));

    // Remove AdSense scripts
    const adsScripts = document.querySelectorAll('script[src*="googlesyndication.com"], script[src*="doubleclick.net"]');
    adsScripts.forEach(script => script.remove());

    // Block AdSense containers
    const adsContainers = document.querySelectorAll('.adsbygoogle, [id*="google_ads"]');
    adsContainers.forEach(container => container.remove());
  }

  /**
   * Block Facebook
   */
  blockFacebook() {
    // Remove Facebook cookies
    const fbCookies = ['_fbp', 'fr'];
    fbCookies.forEach(cookie => this.deleteCookie(cookie));

    // Remove Facebook scripts
    const fbScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
    fbScripts.forEach(script => script.remove());

    // Block Facebook SDK
    window.FB = undefined;
  }

  /**
   * Block Twitter
   */
  blockTwitter() {
    // Remove Twitter cookies
    const twCookies = ['personalization_id', 'guest_id'];
    twCookies.forEach(cookie => this.deleteCookie(cookie));

    // Remove Twitter scripts
    const twScripts = document.querySelectorAll('script[src*="platform.twitter.com"]');
    twScripts.forEach(script => script.remove());

    // Block Twitter widgets
    window.twttr = undefined;
  }

  /**
   * Block Firebase
   */
  blockFirebase() {
    // Remove Firebase cookies
    const fbCookies = ['_fbp']; // Firebase often shares FB cookie
    fbCookies.forEach(cookie => this.deleteCookie(cookie));

    // Remove Firebase scripts
    const fbScripts = document.querySelectorAll('script[src*="firebaseio.com"], script[src*="firebase.com"]');
    fbScripts.forEach(script => script.remove());
  }

  /**
   * Show consent modal
   * @param {string} type - Modal type: 'banner', 'fullscreen', 'management'
   */
  showConsentModal(type = 'banner') {
    this.currentModal = type;
    
    switch (type) {
      case 'banner':
        this.showBannerModal();
        break;
      case 'fullscreen':
        this.showFullscreenModal();
        break;
      case 'management':
        this.showManagementModal();
        break;
    }
  }

  /**
   * Show banner modal (simple opt-in)
   */
  showBannerModal() {
    const modal = this.createModal('banner');
    modal.innerHTML = this.getBannerContent();
    this.attachBannerEvents(modal);
    document.body.appendChild(modal);
  }

  /**
   * Show fullscreen modal (comprehensive consent)
   */
  showFullscreenModal() {
    const modal = this.createModal('fullscreen');
    modal.innerHTML = this.getFullscreenContent();
    this.attachFullscreenEvents(modal);
    document.body.appendChild(modal);
  }

  /**
   * Show management modal (adjust settings)
   */
  showManagementModal() {
    const modal = this.createModal('management');
    modal.innerHTML = this.getManagementContent();
    this.attachManagementEvents(modal);
    document.body.appendChild(modal);
  }

  /**
   * Create modal container
   * @param {string} type 
   * @returns {HTMLElement}
   */
  createModal(type) {
    const modal = document.createElement('div');
    modal.className = `ccb-modal ccb-modal--${type}`;
    modal.setAttribute('data-modal-type', type);
    
    return modal;
  }

  /**
   * Get banner modal content
   * @returns {string}
   */
  getBannerContent() {
    const t = this.getLocalizedText;
    return `
      <div class="ccb-banner">
        <div class="ccb-banner__content">
          <h3 class="ccb-banner__title">${t('cookieConsent.title')}</h3>
          <p class="ccb-banner__description">${t('cookieConsent.description')}</p>
          <div class="ccb-banner__actions">
            <button class="ccb-btn ccb-btn--secondary ccb-btn--manage" data-action="manage">
              ${t('cookieConsent.manageSettings')}
            </button>
            <button class="ccb-btn ccb-btn--secondary ccb-btn--reject" data-action="reject">
              ${t('cookieConsent.rejectAll')}
            </button>
            <button class="ccb-btn ccb-btn--primary ccb-btn--accept" data-action="accept">
              ${t('cookieConsent.acceptAll')}
            </button>
          </div>
          <div class="ccb-banner__links">
            <button class="ccb-link" data-action="policy" data-policy="privacy">
              ${t('cookieConsent.privacyPolicy')}
            </button>
            <button class="ccb-link" data-action="policy" data-policy="cookie">
              ${t('cookieConsent.cookiePolicy')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get fullscreen modal content
   * @returns {string}
   */
  getFullscreenContent() {
    const t = this.getLocalizedText;
    const currentState = this.consentState || {};
    return `
      <div class="ccb-fullscreen__content">
        <div class="ccb-fullscreen__header">
          <h2 class="ccb-fullscreen__title">${t('cookieConsent.title')}</h2>
          <p class="ccb-fullscreen__description">${t('cookieConsent.fullscreenDescription')}</p>
        </div>
        
        <div class="ccb-fullscreen__body">
          <div class="ccb-consent-categories">
            ${this.getConsentCategoriesHTML(currentState)}
          </div>
        </div>
        
        <div class="ccb-fullscreen__footer">
          <div class="ccb-fullscreen__actions">
            <button class="ccb-btn ccb-btn--secondary ccb-btn--reject" data-action="reject">
              ${t('cookieConsent.rejectAll')}
            </button>
            <button class="ccb-btn ccb-btn--secondary ccb-btn--partial" data-action="partial">
              ${t('cookieConsent.customChoice')}
            </button>
            <button class="ccb-btn ccb-btn--primary ccb-btn--accept" data-action="accept">
              ${t('cookieConsent.acceptAll')}
            </button>
          </div>
          
          <div class="ccb-fullscreen__links">
            <button class="ccb-link" data-action="policy" data-policy="privacy">
              ${t('cookieConsent.privacyPolicy')}
            </button>
            <button class="ccb-link" data-action="policy" data-policy="cookie">
              ${t('cookieConsent.cookiePolicy')}
            </button>
            <button class="ccb-link" data-action="policy" data-policy="terms">
              ${t('cookieConsent.terms')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get management modal content
   * @returns {string}
   */
  getManagementContent() {
    const t = this.getLocalizedText;
    const currentState = this.consentState || {};
    return `
      <div class="ccb-management__content">
        <div class="ccb-management__header">
          <h2 class="ccb-management__title">${t('cookieConsent.manageSettings')}</h2>
          <p class="ccb-management__description">${t('cookieConsent.manageDescription')}</p>
        </div>
        
        <div class="ccb-management__body">
          <div class="ccb-consent-categories">
            ${this.getConsentCategoriesHTML(currentState)}
          </div>
        </div>
        
        <div class="ccb-management__footer">
          <div class="ccb-management__actions">
            <button class="ccb-btn ccb-btn--secondary ccb-btn--cancel" data-action="cancel">
              ${t('cookieConsent.cancel')}
            </button>
            <button class="ccb-btn ccb-btn--primary ccb-btn--save" data-action="save">
              ${t('cookieConsent.saveSettings')}
            </button>
          </div>
          
          <div class="ccb-management__links">
            <button class="ccb-link" data-action="policy" data-policy="privacy">
              ${t('cookieConsent.privacyPolicy')}
            </button>
            <button class="ccb-link" data-action="policy" data-policy="cookie">
              ${t('cookieConsent.cookiePolicy')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get consent categories HTML
   * @param {Object} [state={}] 
   * @returns {string}
   */
  getConsentCategoriesHTML(state = {}) {
    const categories = [
      {
        key: 'functional',
        title: 'cookieConsent.categories.functional.title',
        description: 'cookieConsent.categories.functional.description',
        required: true,
        default: true
      },
      {
        key: 'analytical',
        title: 'cookieConsent.categories.analytical.title',
        description: 'cookieConsent.categories.analytical.description',
        required: false,
        default: false
      },
      {
        key: 'performance',
        title: 'cookieConsent.categories.performance.title',
        description: 'cookieConsent.categories.performance.description',
        required: false,
        default: false
      },
      {
        key: 'advertising',
        title: 'cookieConsent.categories.advertising.title',
        description: 'cookieConsent.categories.advertising.description',
        required: false,
        default: false
      },
      {
        key: 'social',
        title: 'cookieConsent.categories.social.title',
        description: 'cookieConsent.categories.social.description',
        required: false,
        default: false
      },
      {
        key: 'other',
        title: 'cookieConsent.categories.other.title',
        description: 'cookieConsent.categories.other.description',
        required: false,
        default: false
      }
    ];

    return categories.map(category => {
      const currentValue = state[category.key] !== undefined ? state[category.key] : category.default;
      const disabled = category.required ? 'disabled checked' : '';
      
      return `
        <div class="ccb-consent-category" data-category="${category.key}">
          <div class="ccb-consent-category__header">
            <div class="ccb-consent-category__info">
              <h4 class="ccb-consent-category__title">${this.getLocalizedText(category.title)}</h4>
              <p class="ccb-consent-category__description">${this.getLocalizedText(category.description)}</p>
            </div>
            <div class="ccb-consent-category__toggle">
              <input 
                type="checkbox" 
                id="category-${category.key}" 
                name="${category.key}" 
                ${currentValue ? 'checked' : ''} 
                ${disabled}
                class="ccb-toggle"
              />
              <label for="category-${category.key}" class="ccb-toggle-label">
                <span class="ccb-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Get localized text
   * @param {string} key 
   * @returns {string}
   */
  get getLocalizedText() {
    return (key) => {
      const defaultTexts = {
        'cookieConsent.title': 'Cookie Consent',
        'cookieConsent.description': 'We use cookies to enhance your experience and analyze our traffic.',
        'cookieConsent.fullscreenDescription': 'Choose which cookies you want to allow. You can change these settings at any time.',
        'cookieConsent.manageDescription': 'Adjust your cookie preferences below.',
        'cookieConsent.acceptAll': 'Accept All',
        'cookieConsent.rejectAll': 'Reject All',
        'cookieConsent.customChoice': 'Custom Choice',
        'cookieConsent.manageSettings': 'Manage Settings',
        'cookieConsent.saveSettings': 'Save Settings',
        'cookieConsent.cancel': 'Cancel',
        'cookieConsent.privacyPolicy': 'Privacy Policy',
        'cookieConsent.cookiePolicy': 'Cookie Policy',
        'cookieConsent.terms': 'Terms of Use',
        'cookieConsent.categories.functional.title': 'Functional Cookies',
        'cookieConsent.categories.functional.description': 'These cookies are necessary for the website to function properly.',
        'cookieConsent.categories.analytical.title': 'Analytical Cookies',
        'cookieConsent.categories.analytical.description': 'These cookies help us understand how visitors interact with our website.',
        'cookieConsent.categories.performance.title': 'Performance Cookies',
        'cookieConsent.categories.performance.description': 'These cookies help us improve the performance of our website.',
        'cookieConsent.categories.advertising.title': 'Advertising Cookies',
        'cookieConsent.categories.advertising.description': 'These cookies are used to deliver relevant advertisements.',
        'cookieConsent.categories.social.title': 'Social Media Cookies',
        'cookieConsent.categories.social.description': 'These cookies enable social media features.',
        'cookieConsent.categories.other.title': 'Other Cookies',
        'cookieConsent.categories.other.description': 'Other uncategorized cookies.',
        'cookieConsent.policyContentError': 'Policy content could not be loaded.',
        'cookieConsent.siteBlocker.message': 'This website requires functional cookies to work properly. Please enable them to continue using our services.',
        'cookieConsent.siteBlocker.button': 'Enable Cookies'
      };

      const userTexts = this.config.localization[this.config.locale] || {};
      const combined = { ...defaultTexts, ...userTexts };
      
      return combined[key] || key;
    };
  }

  /**
   * Attach banner modal events
   * @param {HTMLElement} modal 
   */
  attachBannerEvents(modal) {
    modal.addEventListener('click', (e) => {
      e.preventDefault();
      const action = e.target.getAttribute('data-action');
      
      if (action === 'accept') {
        this.acceptAllConsent();
      } else if (action === 'reject') {
        this.rejectAllConsent();
      } else if (action === 'manage') {
        this.closeModal();
        this.showFullscreenModal();
      } else if (action === 'policy') {
        this.closeModal();
        this.showPolicyModal(e.target.getAttribute('data-policy'));
      }
    });
  }

  /**
   * Attach fullscreen modal events
   * @param {HTMLElement} modal 
   */
  attachFullscreenEvents(modal) {
    modal.addEventListener('click', (e) => {
      //e.preventDefault();
      const action = e.target.getAttribute('data-action');
      
      if (action === 'accept') {
        this.acceptAllConsent();
      } else if (action === 'reject') {
        this.rejectAllConsent();
      } else if (action === 'partial') {
        this.saveCustomConsent();
      } else if (action === 'policy') {
        this.closeModal();
        this.showPolicyModal(e.target.getAttribute('data-policy'));
      }
    });
  }

  /**
   * Attach management modal events
   * @param {HTMLElement} modal 
   */
  attachManagementEvents(modal) {
    modal.addEventListener('click', (e) => {
      e.preventDefault();
      const action = e.target.getAttribute('data-action');
      
      if (action === 'save') {
        this.saveCustomConsent();
      } else if (action === 'cancel') {
        this.closeModal();
      } else if (action === 'policy') {
        this.closeModal();
        this.showPolicyModal(e.target.getAttribute('data-policy'));
      }
    });
  }

  /**
   * Accept all consent
   */
  acceptAllConsent() {
    const state = this.createConsentState({
      functional: true,
      analytical: true,
      performance: true,
      advertising: true,
      social: true,
      other: true
    });
    
    this.saveAndApplyConsent(state);
  }

  /**
   * Reject all consent (except functional)
   */
  rejectAllConsent() {
    const state = this.createConsentState({
      functional: true,
      analytical: false,
      performance: false,
      advertising: false,
      social: false,
      other: false
    });
    
    this.saveAndApplyConsent(state);
  }

  /**
   * Save custom consent based on user selections
   */
  saveCustomConsent() {
    const state = {
      functional: true, // Always required
      analytical: document.querySelector('[name="analytical"]')?.checked || false,
      performance: document.querySelector('[name="performance"]')?.checked || false,
      advertising: document.querySelector('[name="advertising"]')?.checked || false,
      social: document.querySelector('[name="social"]')?.checked || false,
      other: document.querySelector('[name="other"]')?.checked || false
    };

    const finalState = this.createConsentState(state);
    this.saveAndApplyConsent(finalState);
  }

  /**
   * Create consent state object
   * @param {Object} state 
   * @returns {ConsentState}
   */
  createConsentState(state) {
    return {
      ...state,
      timestamp: new Date().toISOString(),
      language: this.config.locale
    };
  }

  /**
   * Save consent state and apply it
   * @param {ConsentState} state
   */
  saveAndApplyConsent(state) {
    this.consentState = state;
    this.saveConsentState(state);
    this.applyConsentState();
    this.closeModal();

    // Check if functional cookies are denied
    if (!state.functional && this.config.blockSiteOnFunctionalDeny) {
      this.showFunctionalBlockedMessage();
    }

    // Dispatch custom event when consent is saved and applied
    window.dispatchEvent(new CustomEvent('cookieConsentSaved', {
      detail: {
        consentState: state,
        timestamp: new Date().toISOString(),
        language: state.language
      }
    }));
  }

  /**
   * Show message when functional cookies are blocked
   */
  showFunctionalBlockedMessage() {
    const modal = this.createModal('blocked');
    modal.innerHTML = `
      <div class="ccb-blocked__content">
        <h2>Functionality Limited</h2>
        <p>${this.getLocalizedText('cookieConsent.siteBlocker.message')}</p>
        <button class="ccb-btn ccb-btn--primary" onclick="CookieConsentBanner.showConsentModal('banner')">
          ${this.getLocalizedText('cookieConsent.siteBlocker.button')}
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Show policy modal
   * @param {string} policyType - 'privacy', 'cookie', or 'terms'
   */
  async showPolicyModal(policyType) {
    try {
      const policyUrl = this.getPolicyUrl(policyType);
      const content = await this.loadMarkdownFile(policyUrl);
      
      const modal = this.createModal('policy');
      modal.innerHTML = `
        <div class="ccb-policy__content">
          <div class="ccb-policy__header">
            <h2 class="ccb-policy__title">${this.getPolicyTitle(policyType)}</h2>
            <button class="ccb-policy__close" data-action="close">×</button>
          </div>
          <div class="ccb-policy__body">
            ${content}
          </div>
        </div>
      `;
      
      modal.addEventListener('click', (e) => {
        if (e.target.getAttribute('data-action') === 'close') {
          this.closeModal();
          if (!this.consentState) {
            this.showConsentModal();
          }
        }
      });
      
      document.body.appendChild(modal);
    } catch (error) {
      console.warn('Failed to load policy file:', error);
      // Fallback to URL if markdown file fails
      window.open(this.getPolicyUrl(policyType), '_blank');
    }
  }

  /**
   * Get policy URL based on type and locale
   * @param {string} policyType 
   * @returns {string}
   */
  getPolicyUrl(policyType) {
    const urlTemplates = {
      'privacy': this.config.privacyPolicyUrl,
      'cookie': this.config.cookiePolicyUrl,
      'terms': this.config.termsUrl
    };
    
    return urlTemplates[policyType]?.replace('{locale}', this.config.locale) || '#';
  }

  /**
   * Get policy title
   * @param {string} policyType 
   * @returns {string}
   */
  getPolicyTitle(policyType) {
    const titles = {
      'privacy': this.getLocalizedText('cookieConsent.privacyPolicy'),
      'cookie': this.getLocalizedText('cookieConsent.cookiePolicy'),
      'terms': this.getLocalizedText('cookieConsent.terms')
    };
    
    return titles[policyType] || 'Policy';
  }

  /**
   * Load and parse markdown file
   * @param {string} url 
   * @returns {Promise<string>}
   */
  async loadMarkdownFile(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const markdown = await response.text();
      return this.markdownParser.render(markdown);
    } catch (error) {
      console.warn('Failed to load markdown file:', url, error);
      return `<p>${this.getLocalizedText('cookieConsent.plolicyContentError')}</p>`;
    }
  }

  /**
   * Close current modal
   */
  closeModal() {
    const modal = document.querySelector('.ccb-modal');
    if (modal) {
      modal.remove();
      this.currentModal = null;
    }
  }

  /**
   * Bind global events
   */
  bindEvents() {
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentModal) {
        this.closeModal();
      }
    });

    // Click outside modal to close (except for banner modal)
    document.addEventListener('click', (e) => {
      const classList = e.target.classList;
      if (classList.contains('ccb-modal')) {
        if (['banner', 'fullscreen'].includes(this.currentModal) || this.consentState) {
          this.closeModal();
          if (classList.contains('ccb-modal--policy') && !this.consentState) {
            this.showConsentModal();
          }
        }
        else {
          e.stopPropagation();
        }
      }
    });
  }

  /**
   * Public API methods
   */

  /**
   * Show consent modal
   * @param {string} type - Modal type
   */
  showModal(type = 'banner') {
    this.closeModal();
    this.showConsentModal(type);
  }

  /**
   * Get current consent state
   * @returns {ConsentState|null}
   */
  getConsentState() {
    return this.consentState;
  }

  /**
   * Check if consent is given for a specific category
   * @param {string} category 
   * @returns {boolean}
   */
  hasConsent(category) {
    return this.consentState?.[category] === true;
  }

  /**
   * Clear all consent data
   */
  clearConsent() {
    this.deleteCookie('cookie_consent_state');
    this.deleteCookie('cookie_consent_token');
    this.consentState = null;
  }

  /**
   * Register custom third-party handler
   * @param {string} category 
   * @param {Function} handler 
   */
  registerThirdPartyHandler(category, handler) {
    this.config.thirdPartyHandlers = this.config.thirdPartyHandlers || {};
    this.config.thirdPartyHandlers[category] = handler;
    
    // Apply immediately if consent state exists
    if (this.consentState && typeof handler === 'function') {
      handler(this.consentState[category]);
    }
  }
}

// Export for ES6 modules
export default CookieConsentBanner;
