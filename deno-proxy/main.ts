// Simple proxy to forward requests to Koyeb
const KOYEB_URL = "https://overwhelming-jessa-tristaronline-14089b39.koyeb.app";

Deno.serve({ port: 8000 }, async (req) => {
    const url = new URL(req.url);
    
    // Build target URL
    const targetUrl = `${KOYEB_URL}${url.pathname}${url.search}`;
    
    // Forward the request
    const headers = new Headers(req.headers);
    headers.set("host", new URL(KOYEB_URL).host);
    
    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: req.body,
        });
        
        // Copy response headers
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set("access-control-allow-origin", "*");
        responseHeaders.set("access-control-allow-methods", "GET, POST, OPTIONS");
        responseHeaders.set("access-control-allow-headers", "*");
        
        return new Response(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Proxy error" }), {
            status: 502,
            headers: { "content-type": "application/json" },
        });
    }
});

console.log("Proxy running on port 8000");
