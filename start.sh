#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=================================================="
echo "  Starting Online Food Delivery System Backend"
echo "=================================================="

# Check if node_modules exists, install dependencies if missing
if [ ! -d "backend/node_modules" ]; then
  echo "[System] node_modules not found in backend directory. Installing dependencies..."
  cd backend
  npm install
  cd ..
fi

# Run the backend dev server
echo "[System] Starting dev server..."
cd backend
npm run dev
