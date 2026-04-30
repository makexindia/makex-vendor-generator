const fs = require('fs');
const path = require('path');

// Target the mounted workspace
const WORKSPACE = '/workspace';
const configPath = path.join(WORKSPACE, 'vendor-config.json');

if (!fs.existsSync(configPath)) {
    console.error("❌ Error: vendor-config.json not found in the mounted directory.");
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const vendorDir = path.join(WORKSPACE, `${config.vendorId}.makex.in`);

// Ensure directories exist
if (!fs.existsSync(vendorDir)) fs.mkdirSync(vendorDir);
if (!fs.existsSync(path.join(vendorDir, 'images'))) fs.mkdirSync(path.join(vendorDir, 'images'));

// 1. Generate LocalBusiness JSON-LD Schema
const schema = {
    "@context": "https://schema.org",
    "@type": config.category || "LocalBusiness",
    "name": config.businessName,
    "image": "https://vendor.makex.in/makex.in/op-image.jpg", // FIXED: Master folder path
    "telephone": config.contact.phone,
    "url": `https://biz${config.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}.makex.in`,
    "address": {
        "@type": "PostalAddress",
        "streetAddress": config.location.street,
        "addressLocality": config.location.city,
        "addressRegion": config.location.state,
        "postalCode": config.location.zip,
        "addressCountry": config.location.country
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": config.location.lat,
        "longitude": config.location.lng
    },
    "openingHours": config.hours
};
const schemaString = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;

// 2. Generate Replacements
const initials = config.businessName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
const fullAddress = `${config.location.street}, ${config.location.city}, ${config.location.zip}`;

// 3. Process HTML
let html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const replacements = {
    '__BUSINESS_NAME__': config.businessName,
    '__SHORT_NAME_INITIALS__': initials,
    '__DESCRIPTION__': config.description,
    '__SOCIAL_DESCRIPTION__': config.socialDescription,
    '__THEME_PRIMARY__': config.theme.primary,
    '__THEME_DARK__': config.theme.dark,
    '__THEME_LIGHT__': config.theme.light,
    '__THEME_ACCENT__': config.theme.accent,
    '__CURRENCY__': config.currencySymbol,
    '__PHONE_CLEAN__': config.contact.phone.replace(/\D/g, ''),
    '__WHATSAPP_CLEAN__': config.contact.whatsapp.replace(/\D/g, ''),
    '__WHATSAPP_MSG__': config.contact.whatsappMessage,
    '__FULL_ADDRESS__': fullAddress,
    '__GMAPS_LINK__': config.location.gmapsLink || '#',
    '__LOCAL_BUSINESS_SCHEMA__': schemaString
};

for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(key, 'g'), value);
}

fs.writeFileSync(path.join(vendorDir, 'index.html'), html);

// 4. Generate Empty Catalog
const emptyCatalog = [{
    "id": "sample-01",
    "name": "Upload your first item!",
    "price": 2,
    "image": "/makex.in/default-product.png", // FIXED: Master folder path
    "inStock": true,
    "tags": []
},
{
    "id": "sample-02",
    "name": "Upload your second item!",
    "price": 1,
    "image": "/makex.in/default-product.png",
    "inStock": false,
    "tags": []
}];

fs.writeFileSync(path.join(vendorDir, 'catalog.json'), JSON.stringify(emptyCatalog, null, 2));

console.log(`✅ Successfully built SEO-optimized vendor package: ${config.vendorId}.makex.in`);