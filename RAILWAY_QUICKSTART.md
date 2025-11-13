# Railway Deployment - Quick Start

## 🚀 Deploy in 5 Minutes

### 1. Push Your Code to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Project
1. Go to: https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect and deploy!

### 3. Add Persistent Storage (Important!)
1. In Railway → Your Service → Settings
2. Scroll to "Volumes"
3. Click "Add Volume"
4. Mount path: `/app`
5. Save

### 4. Generate Domain
1. Settings → Networking
2. Click "Generate Domain"
3. Your app is live at: `https://your-app.up.railway.app`

## ✅ That's It!

Railway automatically:
- Detects Next.js configuration
- Installs dependencies
- Builds your app
- Deploys on every push
- Provides HTTPS

## 📝 Configuration Files Added

- `railway.json` - Railway deployment settings
- `nixpacks.toml` - Build optimization
- `.railwayignore` - Files to exclude
- `DEPLOY_TO_RAILWAY.md` - Detailed guide

## 🔧 Optional: Environment Variables

No environment variables required! The app works out of the box.

## 📚 Full Documentation

See `DEPLOY_TO_RAILWAY.md` for:
- Detailed deployment steps
- Troubleshooting guide
- Custom domain setup
- Performance optimization
- Security checklist

## 🎯 Key Features for Railway

✅ SQLite with persistent volume
✅ WebAuthn/Passkeys (HTTPS provided)
✅ Zero-config deployment
✅ Automatic HTTPS
✅ Hot reload on git push

## 💰 Cost

- Free tier: $5 credit for testing
- Hobby: ~$5-10/month
- Pro: Starting at $20/month

## 🆘 Need Help?

1. Check `DEPLOY_TO_RAILWAY.md` for troubleshooting
2. Railway Docs: https://docs.railway.app
3. Railway Discord: https://discord.gg/railway
