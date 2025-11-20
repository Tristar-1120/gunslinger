# Gunslinger - Multiplayer Reaction Time Game

Fast-paced Wild West duel game with local and online multiplayer.

## Play Now

**Live Game**: https://tristar-1120.github.io/gunslinger/

## Features

### Gameplay
- **Local Multiplayer**: 2 players on same device
- **Quick Match**: Automatic matchmaking with ELO-based pairing
- **Private Rooms**: Play with friends via room codes
- **Character Customization**: Hats, outfits, guns, eyes, body shapes
- **5 Unique Maps**: Each with different visual cues
- **Early Fire Penalty**: Shoot too early and lose the round
- **Best of 5 Rounds**: Winner determined by fastest reactions

### Competitive Features
- **ELO Rating System**: Competitive ranking (starts at 1000)
- **Global Leaderboard**: Top 100 players ranked by ELO
- **User Accounts**: Firebase authentication with email/password
- **Guest Mode**: Play without creating an account
- **Stats Tracking**: Wins, games played, win percentage
- **Real-time Rankings**: Live leaderboard updates

### Mobile Support
- **Touch Controls**: Big red shoot button for mobile
- **Responsive Design**: Works on phones, tablets, and desktop
- **Landscape/Portrait**: Optimized for both orientations

## Controls

- **Player 1**: SPACE
- **Player 2**: ENTER

## Tech Stack

- **Frontend**: HTML5 Canvas, Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: GitHub Pages (client), Koyeb (server)
- **Real-time**: Socket.IO for multiplayer, Firebase for data

## Server Deployment

The multiplayer server runs on Koyeb (free 24/7 hosting).

To deploy your own:
1. Fork this repo
2. Sign up at [koyeb.com](https://www.koyeb.com/)
3. Create new app from GitHub
4. Select `gunslinger-server` as build path
5. Deploy!

## Local Development

### Setup

1. **Configure Firebase** (see `FIREBASE_SETUP.md`)
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

2. **Build the client**
   ```bash
   ./build.sh
   ```

3. **Start the server**
   ```bash
   cd gunslinger-server
   npm install
   npm start
   ```

4. **Open the game**
   ```bash
   # Open gunslinger/index.html in your browser
   open gunslinger/index.html
   ```

### Documentation

- `FIREBASE_SETUP.md` - Firebase configuration guide
- `ELO_LEADERBOARD_GUIDE.md` - How the ranking system works
- `DEPLOYMENT.md` - Deployment instructions
- `SECURITY_UPDATE.md` - Security best practices
- `ROADMAP.md` - Feature roadmap and status

## License

MIT
