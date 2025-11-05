# Agent Guidelines for CookieConsentBanner Project

## Build/Lint/Test Commands
```bash
npm install                    # Install dependencies
npm run build                  # Build ES6 module and minified version
npm run test                   # Run all tests
npm run test:watch            # Run tests in watch mode
npm run test:single testName   # Run single test file
npm run lint                   # Lint code with ESLint
npm run lint:fix               # Fix linting issues automatically
npm run typecheck              # Run TypeScript type checking
npm run dev                    # Start development server for demo
npm run demo                   # Build and serve demo page
```

## Code Style Guidelines

**Imports & Dependencies**: Use ES6 imports (`import`/`export`), prefer tree-shaking friendly modules, no external UI frameworks, minimal dependencies (shodown.js for Markdown parsing only).

**Formatting**: 2-space indentation, single quotes, trailing semicolons, max 80 chars per line, use Prettier for formatting.

**Naming Conventions**: camelCase for variables/functions, PascalCase for classes, UPPER_CASE for constants, descriptive names (avoid abbreviations), follow existing naming patterns.

**Types**: Use JSDoc comments for all public APIs, TypeScript-compatible annotations, proper return types, optional parameters clearly marked.

**Error Handling**: Try-catch blocks for async operations, meaningful error messages, validate all inputs, proper cookie parsing error handling.

**Security**: Never log sensitive data, sanitize user inputs, validate cookie values, XSS protection in modal content.

**Testing**: Jest/Vitest for unit tests, 80%+ coverage, test all public methods, mock third-party services, include integration tests for cookie operations.

**Documentation**: Update README with API changes, JSDoc for all public methods, include usage examples, maintain changelog.