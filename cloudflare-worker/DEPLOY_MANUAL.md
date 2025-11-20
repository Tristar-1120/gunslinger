# Deploy Cloudflare Worker Manually (No Installation)

Since you need Node.js 20+ for Wrangler CLI, here's how to deploy directly from the Cloudflare dashboard:

## Steps:

### 1. Go to Cloudflare Dashboard
https://dash.cloudflare.com/

### 2. Sign up / Login
- Create a free account if you don't have one
- No credit card required

### 3. Navigate to Workers & Pages
- Click "Workers & Pages" in the left sidebar
- Click "Create Application"
- Click "Create Worker"

### 4. Name Your Worker
- Name it: `gunslinger-proxy`
- Click "Deploy"

### 5. Edit the Worker Code
- After deployment, click "Edit Code"
- Delete the default code
- Copy and paste the code from `worker.js` (see below)
- Click "Save and Deploy"

### 6. Get Your Worker URL
You'll see a URL like:
```
https://gunslinger-proxy.YOUR-SUBDOMAIN.workers.dev
```

Copy this URL!

### 7. Update Your Game
Update `gunslinger/js/multiplayer.js` line 8:
```javascript
this.serverUrl = 'https://gunslinger-proxy.YOUR-SUBDOMAIN.workers.dev';
```

### 8. Rebuild and Deploy
```bash
./deploy.sh
```

---

## Worker Code to Copy

```javascript
const KOYEB_SERVER = 'https://overwhelming-jessa-tristaronline-14089b39.koyeb.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = new URL(url.pathname + url.search, KOYEB_SERVER);
    
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
    
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });
    
    try {
      const response = await fetch(modifiedRequest);
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
```

---

## Testing

After deployment, test your worker:
```
https://gunslinger-proxy.YOUR-SUBDOMAIN.workers.dev/health
```

Should return your Koyeb server's health check response.

---

## Free Tier Limits

✅ 100,000 requests per day
✅ Unlimited workers
✅ No credit card required

This should be more than enough for your game!
