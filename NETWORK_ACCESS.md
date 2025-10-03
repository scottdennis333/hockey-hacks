# 🏒 Hockey App - Network Access Setup

## Quick Start for Network Access

### Option 1: Automatic Setup (Recommended)
```bash
# From the project root
./start-network.sh
```
This script will:
- Start both server (port 5000) and client (port 3000)
- Display your network IP addresses
- Allow access from any device on your network

### Option 2: Manual Setup

#### Start Server
```bash
cd app/hockey-app/server
npm start
```

#### Start Client (Network Mode)
```bash
cd app/hockey-app/client
HOST=0.0.0.0 npm start
# or use the npm script:
npm run start:network
```

## Accessing from Other Devices

### Find Your Network IP
```bash
# On macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig | findstr "IPv4"
```

### Share These URLs
- **Hockey App**: `http://YOUR_IP:3000`
- **API Server**: `http://YOUR_IP:5000`

Example: If your IP is `192.168.1.100`:
- Hockey App: `http://192.168.1.100:3000`
- API Server: `http://192.168.1.100:5000`

## Configuration Files

### Server (.env)
```env
HOST=0.0.0.0          # Accept connections from any IP
PORT=5000             # Server port
```

### Client (.env)
```env
HOST=0.0.0.0                    # Accept connections from any IP
PORT=3000                       # Client port
REACT_APP_API_URL=              # Auto-detects API URL
DANGEROUSLY_DISABLE_HOST_CHECK=true  # Allow network access
```

## Troubleshooting

### Can't Access from Other Devices?
1. **Check Firewall**: Make sure ports 3000 and 5000 are open
2. **Check Network**: Ensure devices are on the same network
3. **Check IP**: Use `ifconfig` or `ipconfig` to get correct IP
4. **Try Different Port**: Some networks block certain ports

### API Not Working from Other Devices?
- The client automatically detects the correct API URL
- Check the debug info in the bottom-right corner of the app
- Make sure server is running on `0.0.0.0:5000`

### Firewall Commands (macOS)
```bash
# Allow incoming connections on ports 3000 and 5000
sudo pfctl -f /etc/pf.conf
```

### Windows Firewall
- Go to Windows Defender Firewall
- Allow apps through firewall
- Add Node.js for both private and public networks

## Security Notes

⚠️ **For Development Only**: This setup is for local network sharing during development. Don't use these settings in production without proper security measures.

## Mobile Access

Your hockey app will work on mobile devices too! Just visit `http://YOUR_IP:3000` on any smartphone or tablet connected to the same WiFi network.

## Next Steps

For permanent internet access, see `DEPLOYMENT_GUIDE.md` for cloud deployment options.
