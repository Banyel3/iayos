# IP Configuration for React Native Mobile App

## 🔄 Automatic IP Detection (Recommended)

The mobile app now **automatically detects your network IP** without manual configuration!

### How It Works

The app uses a **3-tier fallback system**:

1. **🎯 Environment Variable** (`.env.local`) - Set by the update script
2. **📱 Expo Auto-Detection** - Uses Expo Constants to detect your machine's IP
3. **🏠 Localhost Fallback** - Falls back to localhost (won't work on physical devices)

### Quick Setup

**When you change networks** (home → school → café, etc.), simply run:

```bash
# From project root
.\scripts\update-mobile-ip.ps1

# OR from mobile app directory
npm run update-ip
```

This will:

- ✅ Auto-detect your current network IP
- ✅ Update `.env.local` with `EXPO_PUBLIC_DEV_IP`
- ✅ Update `.env.docker` for backend
- ✅ Show you the detected IP

Then **restart your Expo app** (press `r` in Metro terminal).

## 📝 Manual Configuration (If Needed)

If auto-detection doesn't work, create/edit `.env.local`:

```env
# apps/frontend_mobile/iayos_mobile/.env.local
EXPO_PUBLIC_DEV_IP=192.168.1.100
```

Replace `192.168.1.100` with your machine's IP address.

## 🔍 Finding Your IP Address

### Windows (PowerShell)

```powershell
ipconfig | Select-String "IPv4"
```

### macOS/Linux

```bash
ifconfig | grep "inet "
```

### From Expo Output

When you run `npm start`, Expo shows your IP:

```
Metro waiting on exp://192.168.1.100:8081
                    ^^^^^^^^^^^^^^^^
                    This is your IP!
```

## 🎯 Testing Backend Connection

1. **Check if backend is running**:

   ```bash
   curl http://localhost:8000/admin/
   ```

2. **Test from your IP**:

   ```bash
   curl http://YOUR_IP:8000/admin/
   ```

3. **In the app**: Login should work without errors

## ⚠️ Common Issues

### "Network request failed"

- ❌ Backend not running
- ❌ Wrong IP in `.env.local`
- ❌ Firewall blocking port 8000

**Fix**: Run `.\scripts\update-mobile-ip.ps1` and restart backend

### "Unable to connect to backend"

- ❌ Mobile device on different WiFi network
- ❌ Corporate/school firewall

**Fix**: Ensure phone and computer are on **same WiFi network**

### iOS Simulator works but physical device doesn't

- ❌ Using localhost instead of network IP

**Fix**: Run `npm run update-ip` and ensure you're using your **network IP** (192.168.x.x), not localhost

## 🚀 Recommended Workflow

**Every time you switch networks**:

```bash
# 1. Update IP
.\scripts\update-mobile-ip.ps1

# 2. Restart backend
docker-compose -f docker-compose.dev.yml restart backend

# 3. Restart Expo app (press 'r' in Metro terminal)
```

## 📦 Files Involved

- **`.env.local`** - Auto-generated, gitignored, contains your current IP
- **`lib/api/config.ts`** - Smart IP detection logic
- **`scripts/update-mobile-ip.ps1`** - Auto-update script
- **`.env.docker`** - Backend environment (also updated by script)

## 🔐 Security Note

`.env.local` is gitignored and machine-specific. Each developer has their own IP configuration.

---

**Need help?** Run the update script first, then check Expo's console output for your detected IP.
