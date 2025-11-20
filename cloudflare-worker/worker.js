// Cloudflare Worker - Proxy for Gunslinger Server
// This proxies requests to your Koyeb server to bypass school firewalls

const KOYEB_SERVER = 'https://overwhelming-jessa-tristaronline-14089b39.koyeb.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Build the target URL
    const targetUrl = new URL(url.pathname + url.search, KOYEB_SERVER);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        }
      });
    }
    
    // Clone the request with new URL
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });
    
    try {
      // Forward request to Koyeb server
      const response = await fetch(modifiedRequest);
      
      // Clone response and add CORS headers
      const modifiedResponse = new Response(response.body, response);
      modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
      modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      modifiedResponse.headers.set('Access-Control-Allow-Headers', '*');
      
      return modifiedResponse;
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Proxy error', 
        message: error.message 
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
