# JS Bundle Usage Guide

## Created Bundles

After running `npm run build:all-bundles`, you will have:

1. **core.min.js** (~35KB) - Required on ALL pages
   - config.js, logger.js, safe-html.js, event-manager.js
   - performance-utils.js, error-boundary.js, lazy-loader.js, event-cleanup.js

2. **auth.min.js** (~25KB) - Required on pages with authentication
   - auth-client.js, auth-helper.js, auth-integration.js

3. **ui.min.js** (~15KB) - Required on pages with UI components
   - mobile-navigation.js, header-component.js, admin-header.js
   - custom-modals.js, dashboard-fix.js

## HTML Implementation

Replace multiple <script> tags with:

```html
<!-- Core (required) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js" integrity="sha512-..." crossorigin="anonymous"></script>
<script defer src="/js/core.min.js?v=1"></script>

<!-- Auth (if needed) -->
<script defer src="/js/auth.min.js?v=1"></script>

<!-- UI (if needed) -->
<script defer src="/js/ui.min.js?v=1"></script>

<!-- Page-specific -->
<script defer src="/js/[page].js"></script>
```

## Build Commands

```bash
# Build individual bundles
npm run build:core
npm run build:auth
npm run build:ui

# Build all bundles
npm run build:all-bundles
```
