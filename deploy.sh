#!/bin/bash
# Manual deployment script for gh-pages

set -e

echo "🚀 Deploying Gunslinger to gh-pages..."
echo ""

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Squash main branch history
echo "📦 Squashing main branch history..."
git checkout main
FIRST_COMMIT=$(git rev-list --max-parents=0 HEAD)
git reset --soft $FIRST_COMMIT
git commit --amend -m "Gunslinger v2.3 - Complete game

Features:
- Quick Match with ELO-based matchmaking
- Global leaderboard (top 100 players)
- ELO rating system (K-factor 32)
- Local and online multiplayer
- Character customization
- 5 unique maps
- Mobile support
- Firebase authentication
- Disconnect/timeout protections"

git push origin main --force
echo "✅ Main branch history squashed"
echo ""

# Switch to gh-pages
echo "🔄 Switching to gh-pages branch..."
git checkout gh-pages

# Save build.sh location
BUILD_SCRIPT="$(pwd)/build.sh"

# Get latest from main
echo "📥 Getting latest code from main..."
git checkout main -- gunslinger/

# Build Firebase config
echo "🔨 Building Firebase config..."
export FIREBASE_API_KEY=AIzaSyAdc8nZ4uRB_LrGEDdndwf-5VdXWczwdOA
export FIREBASE_AUTH_DOMAIN=gunslinger-e27d5.firebaseapp.com
export FIREBASE_PROJECT_ID=gunslinger-e27d5
export FIREBASE_STORAGE_BUCKET=gunslinger-e27d5.firebasestorage.app
export FIREBASE_MESSAGING_SENDER_ID=558254073620
export FIREBASE_APP_ID=1:558254073620:web:18bab50c24d4409e488401

# Run build script from main branch location
if [ -f "$BUILD_SCRIPT" ]; then
    "$BUILD_SCRIPT"
else
    echo "⚠️  build.sh not found, skipping Firebase config build"
fi

# Clean up and move files
echo "🧹 Organizing files..."
rm -rf css js *.html README.md build.sh .env 2>/dev/null || true

# Move only necessary files from gunslinger
mv gunslinger/*.html . 2>/dev/null || true
mv gunslinger/css . 2>/dev/null || true
mv gunslinger/js . 2>/dev/null || true
mv gunslinger/favicon.* . 2>/dev/null || true

# Remove gunslinger folder
rm -rf gunslinger 2>/dev/null || true

# Commit and squash gh-pages history
echo "📦 Squashing gh-pages history..."
git add -A
FIRST_COMMIT_GH=$(git rev-list --max-parents=0 HEAD)
git reset --soft $FIRST_COMMIT_GH
git commit --amend -m "Gunslinger v2.1 - Deployed game"
git push origin gh-pages --force

echo "✅ gh-pages deployed and history squashed"
echo ""

# Return to original branch
git checkout $CURRENT_BRANCH

echo "🎉 Deployment complete!"
echo ""
echo "Live at: https://tristar-1120.github.io/gunslinger/"
