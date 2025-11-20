# Changelog

## v2.2.0 - November 19, 2024

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

## v2.1.0 - November 19, 2024

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
