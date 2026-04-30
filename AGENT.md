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

## Current Roadmap / Tasks for the AI Agent
When requested, please assist the human developer with the following planned upgrades:

**1. Smart "Out of Stock" Handling (Lead Gen)**
* **Goal:** Do not block users from adding `inStock: false` items. 
* **UI:** Add a visual badge (e.g., "Out of Stock" or "Pre-order") to the product card in `template.html` if `item.inStock` is false.
* **Logic:** Modify the `sendOrderToWhatsApp()` JS function. It should group the final message into two sections: 
  - "Available Items" (Total: ₹X)
  - "Interest / Backorder" (For out-of-stock items, not added to the immediate total).

**2. Closing the UX Gaps (Rich Footer & Header)**
* **Config:** Expand `vendor-config.json` to accept `email`, `socialLinks` (Instagram, Facebook), and `logoUrl`.
* **Builder:** Update `build.js` to process these new fields.
* **UI:** - Update `template.html` footer to display Business Hours (parsed from config).
  - Add clickable icons for Email and Social Media in the footer.
  - Upgrade the Header Nav to conditionally render an `<img src="logoUrl">` if provided, falling back to the current CSS-text initials if null.

**3. Policy Pages Strategy**
* Implement a lightweight way to include basic Terms/Privacy/Returns policies (either as simple modal popups in Vanilla JS or appended static sections) without complicating the single-page architecture.