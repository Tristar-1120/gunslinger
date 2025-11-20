# Cloudflare Worker Proxy Setup

This Cloudflare Worker proxies requests to your Koyeb server, giving you a `*.workers.dev` URL that's less likely to be blocked by school firewalls.

## Setup Steps

### 1. Install Wrangler (Cloudflare CLI)
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```
This opens a browser to authenticate.

### 3. Deploy the Worker
```bash
cd cloudflare-worker
wrangler deploy
```

### 4. Get Your Worker URL
After deployment, you'll get a URL like:
```
https://gunslinger-proxy.YOUR-SUBDOMAIN.workers.dev
```

### 5. Update Your Game Client
Update the server URL in `gunslinger/js/multiplayer.js`:
```javascript
this.serverUrl = 'https://gunslinger-proxy.YOUR-SUBDOMAIN.workers.dev';
```

### 6. Rebuild and Deploy
```bash
cd ..
./deploy.sh
```

---

## How It Works

1. Your game connects to: `https://gunslinger-proxy.*.workers.dev`
2. Cloudflare Worker receives the request
3. Worker forwards it to: `https://overwhelming-jessa-tristaronline-14089b39.koyeb.app`
4. Response comes back through Cloudflare
5. School firewall sees Cloudflare (usually allowed)

---

## Benefits

✅ No client-side installation needed
✅ Cloudflare IPs rarely blocked (would break half the internet)
✅ Free tier: 100,000 requests/day
✅ Fast global CDN
✅ Automatic HTTPS

---

## Troubleshooting

**Worker not deploying?**
- Make sure you're logged in: `wrangler whoami`
- Check your Cloudflare account has Workers enabled

**Still blocked?**
- School might block all gaming traffic (deep packet inspection)
- Try mobile hotspot as last resort

**Socket.IO not working?**
- Socket.IO polling mode should work through the proxy
- WebSocket upgrades might still be blocked

---

## Alternative: Custom Domain

If you have a domain, you can use it instead of `*.workers.dev`:

1. Add domain to Cloudflare
2. Uncomment the `routes` section in `wrangler.toml`
3. Update with your domain
4. Deploy again

This gives you a cleaner URL like `game.yourdomain.com`
