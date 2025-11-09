# Cookie Consent Banner 🍪

A comprehensive, GDPR-compliant cookie consent banner ES6 module with localization support, third-party integrations, and customizable themes.

[![jsDeliver](https://data.jsdelivr.com/v1/package/npm/@bossone0013/nu-cookie-consent-banner/badge)](https://www.jsdelivr.com/package/npm/@bossone0013/nu-cookie-consent-banner)

## Features

### 🛡️ GDPR & Privacy Compliance

- **Granular consent management** for different cookie categories
- **Consent withdrawal capability** with easy-to-use management interface
- **Consent logging** with timestamps and user language
- **Cookie categorization** (functional, analytical, performance, advertising, social, other)
- **Third-party cookie blocking** based on user preferences

### 🌍 Localization & Content

- **Auto-detection** of user's browser language
- **Markdown policy file support** for Privacy Policy, Cookie Policy, and Terms of Use
- **Custom text overrides** for all interface elements
- **Multiple language support** with fallback to English
- **Dynamic policy loading** from localized markdown files

### 🎨 UI & User Experience

- **Three modal types**: banner, fullscreen, and management panel
- **Policy display modals** for markdown content
- **CSS custom properties** for easy theming
- **Responsive design** that works on all devices
- **Accessibility features** with proper focus management
- **Smooth animations** with reduced motion support

### 🔧 Technical Features

- **ES6 module** compatible with modern browsers and bundlers
- **Vanilla JavaScript** with no external dependencies (except markdown-it for policy parsing)
- **Pre-configured blockers** for common third-party services
- **Custom handler registration** for any service
- **API endpoint integration** for consent logging
- **Cookie expiration** configuration

### 🚀 Third-Party Integrations

Built-in support and blocking for:

- Google Analytics
- Google AdSense & AdWords
- Facebook SDK
- Twitter widgets
- Firebase services
- Custom handler registration

## Installation

### NPM

```bash
npm install cookie-consent-banner
```

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@bossone0013/nu-cookie-consent-banner@1.0.3/css/cookie-consent.min.css">
<script type="module"> 
  import CookieConsentBanner from 'https://cdn.jsdelivr.net/npm/@bossone0013/nu-cookie-consent-banner@1.0.3/+esm'; 
</script>
```

### Local Installation

```bash
# Clone or download the package
# Install dependencies
npm install

# Build for production
npm run build
```

## Quick Start

### Basic Usage

```javascript
import CookieConsentBanner from 'cookie-consent-banner';

// Initialize with default configuration
const consent = new CookieConsentBanner();
```

### Custom Configuration

```javascript
const config = {
  // Domain and cookie settings
  domain: 'example.com',
  cookieExpiryDays: 365,
  
  // Localization
  locale: 'en',
  localization: {
    'en': {
      'cookieConsent.title': 'Your Custom Title',
      'cookieConsent.acceptAll': 'Accept All Cookies'
    }
  },
  
  // Privacy policy URLs
  privacyPolicyUrl: '/policies/privacy-{locale}.md',
  cookiePolicyUrl: '/policies/cookies-{locale}.md',
  termsUrl: '/policies/terms-{locale}.md',
  
  // Consent logging
  consentEndpoint: 'https://api.example.com/consent',
  customData: {
    siteId: '12345',
    userSegment: 'premium'
  },
  
  // Security
  blockSiteOnFunctionalDeny: false,
  
  // Theming
  theme: {
    '--ccb-primary-color': '#10b981',
    '--ccb-primary-hover': '#059669'
  }
};

const consent = new CookieConsentBanner(config);
```

## API Reference

### Constructor

```javascript
new CookieConsentBanner(config)
```

**Parameters:**

- `config` (Object, optional): Configuration object

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `domain` | String | `window.location.hostname` | Cookie domain |
| `subdomains` | Array | `[]` | Array of subdomains |
| `cookieExpiryDays` | Number | `365` | Cookie expiration in days |
| `locale` | String | Auto-detect | Default locale |
| `localization` | Object | `{}` | Custom localization strings |
| `privacyPolicyUrl` | String | `/locales/{locale}/privacy-policy.md` | Privacy policy URL |
| `cookiePolicyUrl` | String | `/locales/{locale}/cookie-policy.md` | Cookie policy URL |
| `termsUrl` | String | `/locales/{locale}/terms.md` | Terms of use URL |
| `consentEndpoint` | String | - | API endpoint for consent logging |
| `customData` | Object | `{}` | Custom data to send with consent |
| `blockSiteOnFunctionalDeny` | Boolean | `false` | Block site if functional cookies denied |
| `theme` | Object | `{}` | CSS custom properties for theming |
| `thirdPartyHandlers` | Object | `{}` | Custom third-party handlers |

### Methods

#### `showModal(type)`

Show a consent modal.

```javascript
// Show different modal types
consent.showModal('banner');
consent.showModal('fullscreen');
consent.showModal('management');
```

#### `getConsentState()`

Get the current consent state.

```javascript
const state = consent.getConsentState();
console.log(state);
// {
//   functional: true,
//   analytical: false,
//   performance: true,
//   advertising: false,
//   social: true,
//   other: false,
//   timestamp: "2023-01-01T00:00:00.000Z",
//   language: "en"
// }
```

#### `hasConsent(category)`

Check if consent is given for a specific category.

```javascript
if (consent.hasConsent('analytical')) {
  // Initialize Google Analytics
  gtag('config', 'GA_MEASUREMENT_ID');
}
```

#### `clearConsent()`

Clear all consent data and show banner again.

```javascript
consent.clearConsent();
```

#### `registerThirdPartyHandler(category, handler)`

Register a custom third-party handler.

```javascript
consent.registerThirdPartyHandler('customAnalytics', (enabled) => {
  if (enabled) {
    // Initialize custom analytics
    window.customAnalytics.init();
  } else {
    // Disable custom analytics
    window.customAnalytics.disable();
  }
});
```

#### `blockAll()`

Block all third party cookies

```javascript
consent.blockAll();
```

## Cookie Categories

The banner manages six cookie categories:

1. **Functional** (required): Necessary for website functionality
2. **Analytical**: Website analytics and performance monitoring
3. **Performance**: Performance optimization and monitoring
4. **Advertising**: Targeted advertising and marketing
5. **Social**: Social media integration and features
6. **Other**: Custom categories for specific needs

## Localization

### Auto-Detection

The banner automatically detects the user's browser language and uses the appropriate localization.

### Custom Localization

```javascript
const localization = {
  'en': {
    'cookieConsent.title': 'We value your privacy',
    'cookieConsent.acceptAll': 'Accept All',
    'cookieConsent.categories.functional.title': 'Essential Cookies'
  },
  'fr': {
    'cookieConsent.title': 'Nous respectons votre vie privée',
    'cookieConsent.acceptAll': 'Tout accepter',
    'cookieConsent.categories.functional.title': 'Cookies essentiels'
  }
};

const consent = new CookieConsentBanner({
  locale: 'fr',
  localization: localization
});
```

### Policy File Structure

Place markdown files in the following structure:

```bash
locales/
├── en/
│   ├── privacy-policy.md
│   ├── cookie-policy.md
│   └── terms.md
└── fr/
    ├── privacy-policy.md
    ├── cookie-policy.md
    └── terms.md
```

## Theming

### CSS Custom Properties

The banner uses CSS custom properties for theming:

```javascript
const theme = {
  '--ccb-primary-color': '#2563eb',        // Primary button color
  '--ccb-primary-hover': '#1d4ed8',        // Primary button hover
  '--ccb-secondary-color': '#6b7280',      // Secondary button color
  '--ccb-bg-primary': '#ffffff',           // Primary background
  '--ccb-text-primary': '#111827',         // Primary text color
  '--ccb-border-color': '#e5e7eb'          // Border color
};
```

### Custom CSS

You can override styles with custom CSS:

```css
.ccb-btn--primary {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  border: none;
  border-radius: 25px;
}

.ccb-modal {
  backdrop-filter: blur(10px);
}
```

## Third-Party Integration

### Built-in Blockers

The banner automatically blocks common third-party services when consent is not given:

- **Google Analytics**: Blocks GA scripts and removes tracking cookies
- **Google AdSense**: Removes ad scripts and containers
- **Facebook**: Blocks Facebook SDK and removes tracking cookies
- **Twitter**: Removes Twitter widgets and tracking
- **Firebase**: Blocks Firebase services and tracking

### Custom Handlers

Register handlers for any third-party service:

```javascript
consent.registerThirdPartyHandler('hotjar', (enabled) => {
  if (enabled) {
    // Initialize Hotjar
    (function(h,o,t,j,a,r){
      // Hotjar initialization code
    })(window,document,'https://static.hotjar.com/','script','hj');
  }
});

consent.registerThirdPartyHandler('mixpanel', (enabled) => {
  if (enabled) {
    mixpanel.init('your-token');
  } else {
    mixpanel.disable();
  }
});
```

## API Integration

### Consent Endpoint

Send consent data to your backend:

```javascript
const consent = new CookieConsentBanner({
  consentEndpoint: 'https://api.example.com/consent',
  customData: {
    siteId: '12345',
    userSegment: 'premium',
    page: 'homepage'
  }
});
```

The banner will POST the following data:

```json
{
  "token": "uuid-v4-string",
  "data": {
    "siteId": "12345",
    "userSegment": "premium",
    "page": "homepage"
  },
  "userAgent": "Mozilla/5.0...",
  "url": "https://example.com/page"
}
```

## Testing

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Single Test File

```bash
npm run test:single cookieConsentBanner.test.js
```

## Building

### Development Build

```bash
npm run build
```

This creates:

- `src/cookieConsentBanner.min.js` (minified ES6 module)
- `css/cookie-consent.min.css` (minified CSS)

### Individual Builds

```bash
npm run build:js  # Build JavaScript only
npm run build:css # Build CSS only
```

## Demo

View the interactive demo:

```bash
npm run demo
```

The demo showcases:

- All modal types
- Third-party integration examples
- Theme customization
- API usage examples
- Consent state management

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## GDPR Compliance Features

1. **Granular Consent**: Users can choose which cookie categories to accept
2. **Easy Withdrawal**: Management panel allows users to change preferences anytime
3. **Consent Logging**: All consent decisions are logged with timestamps
4. **Cookie Categorization**: Clear separation of cookie types
5. **Transparency**: Full disclosure of cookie usage and purposes
6. **No Pre-checked Boxes**: All non-essential cookies are unchecked by default
7. **Equal Treatment**: Reject all option is as prominent as accept all

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.3

- ✨ feat(banner): add explicit consent blocking before modal display
- 🤖 chore(min): update minified version with the changes

### v1.0.2

- ⬆️ chore(deps): update package name to @bossone0013/nu-cookie-consent-banner and upgrade all dependencies
- 🐛 fix(banner): remove unnecessary preventDefault calls

### v1.0.1

- ✨ feat(banner): add localized strings for site blocker and policy titles
- 🐛 fix(modal): allow closing modal when consent already set, forbid if not

### v1.0.0

- Initial release
- GDPR-compliant cookie consent management
- Three modal types (banner, fullscreen, management)
- Localization support with markdown policy files
- Third-party integration and blocking
- Custom theming with CSS variables
- Comprehensive test coverage
- API endpoint integration

## Support

For support and questions:

- Create an issue on GitHub
- Check the demo page for implementation examples
- Review the API documentation above

## Related

- [GDPR Official Text](https://gdpr.eu/)
- [Cookie Law Guide](https://cookiepedia.co.uk/cookie-law-cookielaw)
- [Privacy Policy Generators](https://www.privacypolicies.com/blog/privacy-policy-generator/)

---

Made with ❤️ for privacy-focused web development.
