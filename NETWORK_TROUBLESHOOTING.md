# 🏒 Hockey App - Network Access Troubleshooting

## Your Current Setup
- **Server IP**: `10.0.0.69`
- **Server Port**: `5000`
- **Client Port**: `3000`
- **Firewall**: Disabled ✅
- **Ports Status**: Both ports are listening ✅

## 📱 URLs for Other Devices
- **Hockey App**: `http://10.0.0.69:3000`
- **API Server**: `http://10.0.0.69:5000`

## 🔧 Troubleshooting Steps

### Step 1: Verify Both Devices Are on Same Network
```bash
# On your Mac
ping 10.0.0.69

# On the other device (if it has terminal/command prompt)
ping 10.0.0.69
```

### Step 2: Test Server Directly
From the other device, try accessing the server API directly:
- Open browser and go to: `http://10.0.0.69:5000/teams/465.l.15581`
- You should see JSON data

### Step 3: Check Client
- Open browser and go to: `http://10.0.0.69:3000`
- The hockey app should load

### Step 4: Start Both Servers (If Not Running)

**Terminal 1 - Server:**
```bash
cd /Users/admin/workspace/hockey-hacks/app/hockey-app/server
npm start
```

**Terminal 2 - Client:**
```bash
cd /Users/admin/workspace/hockey-hacks/app/hockey-app/client
HOST=0.0.0.0 npm start
```

**Or use the automated script:**
```bash
cd /Users/admin/workspace/hockey-hacks
./start-network.sh
```

## 🚨 Common Issues & Solutions

### Issue 1: "Connection Refused"
**Causes:**
- Server not running on `0.0.0.0` (only localhost)
- Wrong IP address
- Different network/VLAN

**Solutions:**
- Restart server with: `HOST=0.0.0.0 npm start`
- Verify IP with: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Connect both devices to same WiFi

### Issue 2: "Can't Access Client"
**Causes:**
- React dev server not accepting external connections
- Wrong port

**Solutions:**
- Start client with: `HOST=0.0.0.0 npm start`
- Check `.env` file has `HOST=0.0.0.0`

### Issue 3: "API Calls Failing"
**Causes:**
- CORS not enabled
- Wrong API URL

**Solutions:**
- Check server logs for CORS headers
- Verify API debug info in bottom-right of app

### Issue 4: "Different Network"
Some WiFi networks isolate devices (guest networks, corporate networks)

**Solutions:**
- Use mobile hotspot
- Connect both devices to same regular WiFi network
- Check router settings for AP isolation

## 🖥️ Router/Network Issues

### Check AP Isolation
Some routers have "AP Isolation" or "Client Isolation" enabled:
1. Access router admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Look for "Wireless Settings" → "Advanced"
3. Disable "AP Isolation" or "Client Isolation"

### Guest Network
If using guest network, devices might be isolated:
- Connect both devices to main WiFi network
- Or use mobile hotspot from your phone

## 🧪 Testing Commands

### Test from Mac (should work):
```bash
curl http://localhost:5000/teams/465.l.15581
curl http://10.0.0.69:5000/teams/465.l.15581
```

### Test from Other Device:
Open browser and visit:
- `http://10.0.0.69:5000/teams/465.l.15581` (should show JSON)
- `http://10.0.0.69:3000` (should show hockey app)

## 📞 Quick Fixes

### Fix 1: Restart Everything
```bash
# Kill all Node processes
pkill -f node

# Start server
cd /Users/admin/workspace/hockey-hacks/app/hockey-app/server
HOST=0.0.0.0 npm start

# In new terminal, start client
cd /Users/admin/workspace/hockey-hacks/app/hockey-app/client  
HOST=0.0.0.0 npm start
```

### Fix 2: Use Automated Script
```bash
cd /Users/admin/workspace/hockey-hacks
./start-network.sh
```

### Fix 3: Try Different Port
If port 3000 is blocked, try 8080:
```bash
cd /Users/admin/workspace/hockey-hacks/app/hockey-app/client
HOST=0.0.0.0 PORT=8080 npm start
```
Then access via: `http://10.0.0.69:8080`

## 🆘 Still Not Working?

1. **Check both devices on same network:**
   - Same WiFi name
   - Not using guest/isolated network

2. **Try mobile hotspot:**
   - Create hotspot from your phone
   - Connect both devices to hotspot

3. **Use tunnel service (temporary):**
   ```bash
   # Install ngrok
   brew install ngrok
   
   # Create tunnel for client
   ngrok http 3000
   ```
   Share the ngrok URL instead of local IP

Your setup looks correct - the most likely issue is network isolation or using different networks!
