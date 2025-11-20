# DISCLAIMER

This was a vibe coding project done with AI to see its technical capabilities, while I dont agree with the use of AI and there for will not be monetizing this project in ANY way, i thought y'all might like to see what its capable of.

# 🤠 Gunslinger

Fast-paced Wild West duel game with competitive multiplayer.

**Play Now:** https://tristar-1120.github.io/gunslinger/

## Features

- ⚡ **Quick Match** - Automatic matchmaking with ELO-based pairing
- 🏆 **Global Leaderboard** - Compete for top rankings
- 📊 **ELO Rating System** - Track your skill progression
- 🎮 **Local Multiplayer** - 2 players on same device
- 🔐 **Private Rooms** - Play with friends via room codes
- 🎨 **Character Customization** - Hats, outfits, guns, and more
- 🗺️ **5 Unique Maps** - Each with different visual cues
- 📱 **Mobile Support** - Touch controls and responsive design

## Tech Stack

- **Frontend:** HTML5 Canvas, Vanilla JavaScript
- **Backend:** Node.js, Socket.IO
- **Database:** Firebase Firestore
- **Hosting:** GitHub Pages + Koyeb

## Local Development

```bash
# Setup
cp .env.example .env
# Edit .env with your Firebase credentials

# Build
./build.sh

# Open game
open gunslinger/index.html
```

## Server

The multiplayer server runs on Koyeb. See `gunslinger-server/` for code.

## License

MIT
