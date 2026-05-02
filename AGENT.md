# Makex Vendor Generator - AI Agent Context

## Project Overview
This repository contains a lightweight Node.js/Docker automation pipeline. Its goal is to generate statically hosted, hyper-optimized, Local SEO-compliant e-commerce storefronts for local Indian SMBs (Small/Medium Businesses). 

The generated sites act as "App Shells" that are deployed to Cloudflare R2 buckets and served via edge networks. Checkout is handled entirely via WhatsApp redirect.

## Architecture & Constraints
**CRITICAL: You must adhere to these architectural rules when making modifications.**
1. **Zero Backend / Static Only:** The generated output (`vendor.makex.in/` folder) must be 100% static (`.html`, `.json`, `.css`, `.js`). Do not add server-side logic, PHP, or Node dependencies to the output.
2. **Vanilla JS & CDN Tailwind:** The frontend uses CDN-based Tailwind CSS and Vanilla JavaScript. Do NOT initialize npm, Webpack, React, or Vue in the template. 
3. **Data Separation (App Shell):** The `index.html` file must remain "dumb". It loads inventory dynamically from `catalog.json` at runtime. Do NOT bake product arrays directly into the HTML.
4. **Cloudflare & Edge SEO:** The architecture relies on Cloudflare's edge caching and a Deno worker for SEO routing. Do not change the file naming conventions (`index.html`, `catalog.json`).
5. **Absolute Data URIs:** To avoid cross-domain routing errors, `catalog.json` must strictly contain absolute URLs. `build.js` manages this via a `formatImageUrl()` helper that interpolates URLs against the `CDN_BASE` constant at build time. 

## Edge Routing & App Shell Proxy
1. **Compute Isolation**: The Deno SEO worker runs on an isolated domain (`item.makex.in`) due to Cloudflare Free Tier limitations, completely independent of the vanity domains or R2 storage domains.
2. **Proxy vs Redirect**: The SEO worker MUST NOT use HTTP redirects. It acts as an **App Shell Proxy**, fetching the vendor's static `index.html` from R2, injecting product-specific JSON-LD schemas and `window.__TARGET_ITEM_ID__`, and returning a `200 OK`.
3. **Double Injection Prevention**: Cloudflare natively injects bot/analytics scripts into R2 HTML. To prevent double-injection and CORS errors when proxying, the `seo-worker` aggressively strips upstream `cdn-cgi` scripts using a multi-line Javascript Replacer function before returning the payload.
4. **The Edge Network Paradox (No Base Tags)**: To prevent hijacking Cloudflare's outbound edge scripts, we explicitly DO NOT use HTML `<base>` tags. Instead, the SEO worker injects a `window.__ASSET_BASE__` JS variable. The frontend Vanilla JS uses this variable to dynamically resolve relative fetches (like `catalog.json`), completely decoupling the Document Base from the Asset Base.

## Core Files
* `vendor-config.json`: The single source of truth for a vendor's details. Uses `vendorId` to dictate the bucket path and the vanity domain routing.
* `template.html`: The base HTML shell. Contains placeholder tags (e.g., `__BUSINESS_NAME__`) and the Vanilla JS shopping cart logic.
* `build.js`: The Node script that reads the config, enforces absolute URLs, replaces placeholders, generates JSON-LD LocalBusiness schema, and outputs the final deployment folder.
* `seo-worker/main.ts`: The Deno proxy script that intercepts individual product links for SEO indexing.

## Current Backlog (Prioritized)

### 1. Dynamic OG Images for Vendors (`og-worker`)
* **Goal**: An edge-generated, CDN-cached custom Open Graph image for every vendor for WhatsApp sharing.
* **Architecture**: Create an isolated Cloudflare/Deno worker (e.g. `og.makex.in/?vendor=ve`) that fetches a base background template (`op-image.jpg`), overlays the specific vendor's business name text + Makex watermark using SVG/Canvas, and returns the image.
* **Caching**: Must use aggressive Cache-Control headers (`s-maxage=2592000`) to protect Free Tier limits.

### 2. CSV-to-Catalog Pipeline
* **Goal**: Convert human-readable CSVs into `catalog.json` and build a `<noscript>` crawler discovery block.
* **Architecture**: Create a script to parse `catalog.csv`. Use `formatImageUrl()` from `build.js` to ensure all image paths are absolute. 
* **SEO**: Inject a `<noscript>` list of direct `<a>` tags pointing to `item.makex.in` URLs for every product into `index.html` during the build step.

### 3. Vanilla JS Fuzzy Search
* **Goal**: Instant catalog filtering.
* **Architecture**: Add a search input field to the header. Implement lightweight fuzzy filtering on the `catalogData` array in memory, and re-trigger `renderCatalog()`.

## Brainstorming / Future Research
### Roaming Vendor Coordinate Management (Live SEO)
* **Problem**: Food carts and roaming pop-ups need live location tracking. 
* **Constraint**: Needs a free backend with zero quotas. For the UI, we want to fetch the live location. For SEO, JSON-LD might need fixed locations or schedules based on a new "Vendor Type" classification (e.g. static vs roaming).
* **Next Steps**: Brainstorm vendor classification logic and research scalable, free data-store mechanisms (like Cloudflare KV or Google Sheets API) for coordinate tracking.