#!/bin/bash

echo "=================================================="
echo "  Starting Online Food Delivery System Services"
echo "=================================================="

# Function to clean up background processes on exit
cleanup() {
  echo ""
  echo "[System] Shutting down services..."
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  exit 0
}

# Trap exit signals to ensure both servers terminate when Ctrl+C is pressed
trap cleanup INT TERM EXIT

# 1. Check and install backend dependencies
if [ ! -d "backend/node_modules" ]; then
  echo "[System] node_modules not found in backend directory. Installing dependencies..."
  cd backend
  npm install
  cd ..
fi

# 2. Check and install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
  echo "[System] node_modules not found in frontend directory. Installing dependencies..."
  cd frontend
  npm install
  cd ..
fi

# 3. Start Backend Dev Server
echo "[System] Launching backend dev server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 4. Start Frontend Dev Server
echo "[System] Launching frontend dev server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for background processes to finish
wait $BACKEND_PID $FRONTEND_PID
