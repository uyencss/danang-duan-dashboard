#!/bin/bash

# Define paths
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

echo "Checking environment setup..."

if [ -f "$ENV_FILE" ]; then
    echo "✅ .env file already exists. Skipping creation."
    exit 0
fi

if [ ! -f "$ENV_EXAMPLE" ]; then
    echo "❌ Error: $ENV_EXAMPLE not found. Please ensure it exists in the repository."
    exit 1
fi

echo "⚠️  .env file not found. Creating from $ENV_EXAMPLE..."
cp "$ENV_EXAMPLE" "$ENV_FILE"

echo "✅ Created .env from $ENV_EXAMPLE."

# NOTE REGARDING GITHUB SECRETS:
# GitHub intentionally prevents extracting the plaintext values of Repository Secrets 
# via the API or CLI for security reasons. (You can only list their names).
# 
# Therefore, you cannot automatically pull down production secrets to your local .env.
# Please open the .env file and fill in your local development credentials manually, 
# or use a password manager to securely share the development .env values across your team.

echo "============================================================"
echo "⚠️  ACTION REQUIRED:"
echo "Please open the .env file and fill in your actual local"
echo "development credentials. production secrets cannot be"
echo "downloaded from GitHub for security reasons."
echo "============================================================"
