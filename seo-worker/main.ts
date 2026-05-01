// This function safely hunts down the item ID whether it is in a nested category array or a flat list.
function findProduct(data: any, targetId: string): any {
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProduct(item, targetId);
      if (found) return found;
    }
  } else if (data !== null && typeof data === 'object') {
    if (String(data.id) === targetId) {
      return data;
    }
    for (const key of Object.keys(data)) {
      const found = findProduct(data[key], targetId);
      if (found) return found;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Expecting exactly: item.makex.in/aoh/sal1
  if (pathParts.length < 2) {
    return new Response("Not Found. Please use /vendor/item format.", { 
      status: 404,
      headers: { "Cache-Control": "s-maxage=2592000, max-age=0" } // Cache 404s for 1 Month
    });
  }

  // 1. Extract and format the routing names
  let vendorName = pathParts[0];
  const itemId = pathParts[1];

  // Ensure clean routing if someone accidentally includes .makex.in in the URL path
  vendorName = vendorName.replace('.makex.in', '');
  
  // The actual R2 folder requires the .makex.in suffix
  const bucketFolder = `${vendorName}.makex.in`;

  try {
    // 2. Fetch the JSON from your Cloudflare Edge Shield
    const menuUrl = `https://vendor.makex.in/${bucketFolder}/catalog.json`;
    const menuRes = await fetch(menuUrl);
    
    if (!menuRes.ok) {
      return new Response(`Vendor JSON not found at ${menuUrl}`, { 
        status: 404,
        headers: { "Cache-Control": "s-maxage=2592000, max-age=0" } // Cache 404s for 1 Month
      });
    }

    const menuData = await menuRes.json();

    // 3. Extract the product using the recursive hunter
    const product = findProduct(menuData, itemId);

    if (!product) {
        return new Response("Product not found in vendor's catalog", { 
          status: 404,
          headers: { "Cache-Control": "s-maxage=2592000, max-age=0" } // Cache 404s for 1 Month
        });
    }

    // 4. Map the exact fields from your JSON
    const productName = product.name;
    const productPrice = product.price;
    
    // Fallbacks for SEO fields you plan to add later
    const productDesc = product.description || `Enjoy delicious ${productName} for just ₹${productPrice}!`;
    const productImage = product.image || ""; 

    // 5. Fetch the original index.html
    const indexUrl = `https://vendor.makex.in/${bucketFolder}/index.html`;
    const indexRes = await fetch(indexUrl);
    if (!indexRes.ok) {
        return new Response(`Vendor index.html not found at ${indexUrl}`, { 
          status: 404,
          headers: { "Cache-Control": "s-maxage=2592000, max-age=0" }
        });
    }
    let html = await indexRes.text();

    // Clean up Cloudflare auto-injected scripts from the fetched HTML
    // This regex matches and removes any <script> tags containing cdn-cgi or cloudflareinsights
    html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (match) => {
        if (match.includes('cdn-cgi') || match.includes('cloudflareinsights')) {
            return ''; // Strip it!
        }
        return match; // Keep it
    });

    // 6. Build the injection payload
    const injection = `
        <script>
            window.__TARGET_ITEM_ID__ = "${itemId}";
            window.__ASSET_BASE__ = "https://vendor.makex.in/${bucketFolder}/";
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": "${productName}",
          "image": "${productImage}",
          "description": "${productDesc}",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": "${productPrice}"
          }
        }
        </script>
    `;

    // 7. Inject into <head>
    html = html.replace('</head>', injection + '</head>');

    // 8. Return to Cloudflare and cache for 30 days
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "s-maxage=2592000, max-age=0" // Cache success for 1 Month
      },
    });

  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { 
      status: 500,
      headers: { "Cache-Control": "s-maxage=60, max-age=0" } // Cache 500s for 1 MINUTE ONLY
    });
  }
});