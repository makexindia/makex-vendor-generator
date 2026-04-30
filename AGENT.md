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

## Core Files
* `vendor-config.json`: The single source of truth for a vendor's details (Theme, NAP details, WhatsApp numbers).
* `template.html`: The base HTML shell. Contains placeholder tags (e.g., `__BUSINESS_NAME__`) and the Vanilla JS shopping cart logic.
* `build.js`: The Node script that reads the config, replaces placeholders in the template, generates JSON-LD LocalBusiness schema, and outputs the final deployment folder.
* `Dockerfile`: Containerizes the generator so volunteers can run it without installing Node.js.

## UI & UX Standards
* Modals must always support 'click outside to close' using event propagation stopping.
* Badges or tags next to dynamic text must use `flex-shrink-0` to prevent layout breaking.

## SEO Standards
* All generated templates must include canonical links and og:url tags mapped to the correct vanity domain.