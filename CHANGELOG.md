# Changelog

## v2.2.0 - December 2, 2024

### Features - Admin Panel
- 🛡️ Complete admin panel at `/admin.html`
- 👑 Head admin system with role hierarchy
- 🚫 Ban/unban players with reason tracking
- ✏️ Edit player stats (ELO, wins, losses)
- 🗑️ Delete player accounts
- 👥 Admin management (add/remove admins)
- 🔍 Search and filter players
- 📋 View all banned players
- 🔒 Ban checking on login (banned users can't access game)

### Infrastructure Updates
- 🌐 Deno Deploy proxy for URL masking
- ⚡ Replaced Cloudflare Workers with Deno proxy
- 🔄 Direct proxy to Koyeb game server
- 📦 Auto-deployment to Deno on GitHub push

### Server Improvements
- ⏱️ 5-second timeout for inactive rounds
- 🧹 Auto-kick both players if neither shoots
- 💾 Memory optimization for AFK players
- 🔧 Enhanced room cleanup system

### Database Schema
- Added `admins` collection for role management
- Added `banned`, `banReason`, `bannedAt`, `bannedBy` fields to users
- Added admin action logging

## v2.1.0 - November 19, 2024

### Features - User Profiles
- 🎭 Character customization now saves to Firebase
- 👤 User profile pages at `/profile.html?user=username`
- 📊 Profile shows: character, ELO, win/loss ratio, account age, rank
- 🔗 Clickable usernames in leaderboard
- 📈 Track wins AND losses separately
- 🎨 Character display on profile page

### Database Updates
- Added `gamesLost` field to user profiles
- Added `character` object to store customization
- Added `createdAt` timestamp for account age

### Features
- ⚡ Quick Match with ELO-based matchmaking
- 🏆 Global leaderboard (top 100 players)
- 📊 ELO rating system (standard chess formula, K-factor 32)
- 🎮 Local and online multiplayer
- 🔐 Private rooms with 6-digit codes
- 🎨 Character customization (hats, outfits, guns, eyes, body shapes)
- 🗺️ 5 unique maps with different visual cues
- 📱 Mobile support with touch controls
- 🔒 Firebase authentication (email/password + guest mode)

### Tech Stack
- Frontend: HTML5 Canvas, Vanilla JavaScript
- Backend: Node.js, Socket.IO
- Database: Firebase Firestore
- Hosting: GitHub Pages + Koyeb

### Deployment
- Automatic deployment via GitHub Actions
- Deploys to `gh-pages` branch on push to `main`
- Firebase config injected from GitHub secrets
