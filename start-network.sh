#!/bin/bash

# Hockey App Network Startup Script
echo "🏒 Starting Hockey App for Network Access..."
echo ""

# Get the local IP address
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "Unable to detect IP")

echo "📡 Network Configuration:"
echo "  Server will be available at: http://$LOCAL_IP:5000"
echo "  Client will be available at: http://$LOCAL_IP:3000"
echo ""

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Start the server
echo "🚀 Starting server..."
cd app/hockey-app/server
npm start &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start the client
echo "🎨 Starting client..."
cd ../client
HOST=0.0.0.0 npm start &
CLIENT_PID=$!

echo ""
echo "✅ Both servers started!"
echo ""
echo "📱 Share these URLs with others on your network:"
echo "  🏒 Hockey App: http://$LOCAL_IP:3000"
echo "  🔌 API Server: http://$LOCAL_IP:5000"
echo ""
echo "💻 Local access (just for you):"
echo "  🏒 Hockey App: http://localhost:3000"
echo "  🔌 API Server: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for background processes
wait
