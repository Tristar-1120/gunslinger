#!/bin/bash
# Build script to inject Firebase config from environment variables

set -e

echo "Building Gunslinger with environment config..."

# Check if .env file exists
if [ -f .env ]; then
    echo "Loading environment variables from .env..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Validate required environment variables
if [ -z "$FIREBASE_API_KEY" ]; then
    echo "Error: FIREBASE_API_KEY not set"
    exit 1
fi

# Create firebase-client.js from template
echo "Injecting Firebase configuration..."
sed -e "s/\${FIREBASE_API_KEY}/$FIREBASE_API_KEY/g" \
    -e "s/\${FIREBASE_AUTH_DOMAIN}/$FIREBASE_AUTH_DOMAIN/g" \
    -e "s/\${FIREBASE_PROJECT_ID}/$FIREBASE_PROJECT_ID/g" \
    -e "s/\${FIREBASE_STORAGE_BUCKET}/$FIREBASE_STORAGE_BUCKET/g" \
    -e "s/\${FIREBASE_MESSAGING_SENDER_ID}/$FIREBASE_MESSAGING_SENDER_ID/g" \
    -e "s/\${FIREBASE_APP_ID}/$FIREBASE_APP_ID/g" \
    gunslinger/js/firebase-config.template.js > gunslinger/js/firebase-client.js

echo "Build complete! firebase-client.js generated."
