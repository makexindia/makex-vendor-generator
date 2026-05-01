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

const CDN_BASE = 'https://vendor.makex.in';

// URL Formatting Helper
function formatImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/makex.in/')) return `${CDN_BASE}${url}`;
    
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${CDN_BASE}/${config.vendorId}.makex.in/${cleanUrl}`;
}

// Ensure directories exist
if (!fs.existsSync(vendorDir)) fs.mkdirSync(vendorDir);
if (!fs.existsSync(path.join(vendorDir, 'images'))) fs.mkdirSync(path.join(vendorDir, 'images'));

// 1. Generate LocalBusiness JSON-LD Schema
const vanityUrl = `https://biz${config.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}.makex.in`;

const schema = {
    "@context": "https://schema.org",
    "@type": config.category || "LocalBusiness",
    "name": config.businessName,
    "image": "https://vendor.makex.in/makex.in/op-image.jpg", // FIXED: Master folder path
    "telephone": config.contact.phone,
    "url": vanityUrl,
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

const logoHtml = config.logoUrl 
    ? `<img src="${config.logoUrl}" alt="${config.businessName} Logo" class="w-12 h-12 rounded-lg object-contain bg-white shadow-sm border border-gray-100">`
    : `<div class="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-dark text-white font-bold text-xl shadow-inner">${initials}</div>`;

let socialHtml = '';
if (config.contact.email) {
    socialHtml += `<a href="mailto:${config.contact.email}" class="hover:text-brand-dark transition"><i class="fa-solid fa-envelope text-xl"></i></a>`;
}
if (config.socialLinks?.instagram) {
    socialHtml += `<a href="${config.socialLinks.instagram}" target="_blank" class="hover:text-pink-600 transition"><i class="fa-brands fa-instagram text-xl"></i></a>`;
}
if (config.socialLinks?.facebook) {
    socialHtml += `<a href="${config.socialLinks.facebook}" target="_blank" class="hover:text-blue-600 transition"><i class="fa-brands fa-facebook text-xl"></i></a>`;
}
if (socialHtml !== '') {
    socialHtml = `<div class="flex items-center gap-4 mt-2 md:mt-0">${socialHtml}</div>`;
}

let contactHtml = '';
if (config.contact.phone) {
    contactHtml += `<div class="flex items-center gap-2">
                    <i class="fa-solid fa-phone text-brand-DEFAULT w-4 text-center"></i>
                    <a href="tel:${config.contact.phone.replace(/[^0-9]/g, '')}" class="hover:text-brand-dark transition">${config.contact.phone}</a>
                </div>`;
}
if (config.contact.whatsapp) {
    contactHtml += `<div class="flex items-center gap-2">
                    <i class="fa-brands fa-whatsapp text-brand-DEFAULT w-4 text-center"></i>
                    <a href="https://wa.me/${config.contact.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="hover:text-green-600 transition">+${config.contact.whatsapp.replace(/[^0-9]/g, '')}</a>
                </div>`;
}

// 3. Process Policies
let policyLinksHtml = '';
let policyModalsHtml = '';

if (config.policies) {
    const policies = [
        { id: 'returns', title: 'Returns Policy', content: config.policies.returns },
        { id: 'privacy', title: 'Privacy Policy', content: config.policies.privacy },
        { id: 'terms', title: 'Terms of Service', content: config.policies.terms }
    ];

    policies.forEach(p => {
        if (p.content) {
            policyLinksHtml += `<button onclick="openPolicyModal('${p.id}')" class="hover:text-brand-dark transition underline">${p.title}</button>`;
            
            policyModalsHtml += `
            <div id="modal-${p.id}" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300 cursor-pointer" onclick="closePolicyModal('${p.id}')">
                <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 transform scale-95 transition-transform duration-300 max-h-[90vh] overflow-y-auto cursor-default" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-gray-800">${p.title}</h2>
                        <button onclick="closePolicyModal('${p.id}')" class="text-gray-500 hover:text-gray-800 transition">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    <div class="text-gray-600 text-sm whitespace-pre-wrap">${p.content}</div>
                </div>
            </div>`;
        }
    });

    if (policyLinksHtml !== '') {
        policyLinksHtml = `<div class="max-w-7xl mx-auto px-4 pb-6 flex flex-wrap justify-center gap-6 text-xs text-gray-400">${policyLinksHtml}</div>`;
    }
}

// 4. Process HTML
let html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const replacements = {
    '__BUSINESS_NAME__': config.businessName,
    '__LOGO_HTML__': logoHtml,
    '__DESCRIPTION__': config.description,
    '__SOCIAL_DESCRIPTION__': config.socialDescription,
    '__THEME_PRIMARY__': config.theme.primary,
    '__THEME_DARK__': config.theme.dark,
    '__THEME_LIGHT__': config.theme.light,
    '__THEME_ACCENT__': config.theme.accent,
    '__CURRENCY__': config.currencySymbol,
    '__PHONE_CLEAN__': config.contact.phone.replace(/[^0-9]/g, ''),
    '__WHATSAPP_CLEAN__': config.contact.whatsapp.replace(/[^0-9]/g, ''),
    '__WHATSAPP_MSG__': config.contact.whatsappMessage,
    '__FULL_ADDRESS__': fullAddress,
    '__GMAPS_LINK__': config.location.gmapsLink || '#',
    '__HOURS__': config.hours ? config.hours.join(', ') : '',
    '__SOCIAL_HTML__': socialHtml,
    '__CONTACT_HTML__': contactHtml,
    '__POLICY_LINKS__': policyLinksHtml,
    '__POLICY_MODALS__': policyModalsHtml,
    '__VANITY_URL__': vanityUrl,
    '__LOCAL_BUSINESS_SCHEMA__': schemaString,
    '__CDN_BASE__': CDN_BASE
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
    "image": formatImageUrl("/makex.in/default-product.png"), // FIXED: Master folder path
    "inStock": true,
    "tags": []
},
{
    "id": "sample-02",
    "name": "Upload your second item!",
    "price": 1,
    "image": formatImageUrl("/makex.in/default-product.png"),
    "inStock": false,
    "tags": []
}];

fs.writeFileSync(path.join(vendorDir, 'catalog.json'), JSON.stringify(emptyCatalog, null, 2));

console.log(`✅ Successfully built SEO-optimized vendor package: ${config.vendorId}.makex.in`);