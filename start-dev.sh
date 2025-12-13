#!/bin/bash

# Kill ports 3001 and 5173 if they are in use to avoid conflicts
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "Starting Backend..."
cd server
npm start &
SERVER_PID=$!

echo "Starting Frontend..."
cd ../client
npm run dev &
CLIENT_PID=$!

echo "App is running!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
