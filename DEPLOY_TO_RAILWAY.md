# Deploy Todo App to Railway - Quick Guide

This guide will help you deploy your WebAuthn Todo App to Railway in just a few minutes.

## Prerequisites

- A GitHub account with this repository
- A Railway account (sign up at https://railway.app)
- Your repository pushed to GitHub

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Ensure your latest changes are committed:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Verify your branch** (main or solution)

### Step 2: Create Railway Project

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Sign in with your GitHub account

2. **Create New Project**
   - Click "New Project" button
   - Select "Deploy from GitHub repo"

3. **Authorize GitHub**
   - Railway will ask for GitHub repository access
   - Grant access to your repository

4. **Select Your Repository**
   - Choose: `SwetaAIS2024/SDLC_day1` (or your fork)
   - Select branch: `main`

5. **Railway Auto-Configuration**
   - Railway will automatically detect Next.js
   - Build command: `npm run build`
   - Start command: `npm start`
   - Node version: Auto-detected from package.json

### Step 3: Configure Environment Variables (Optional)

The app works without environment variables, but you can add these if needed:

1. **In Railway project dashboard:**
   - Click on your service
   - Go to "Variables" tab

2. **Add variables (optional):**
   ```
   NODE_ENV=production
   PORT=3000
   ```

### Step 4: Configure Persistent Storage (Important!)

Since this app uses SQLite, we need persistent storage:

1. **In Railway project:**
   - Click on your service
   - Go to "Settings" tab
   - Scroll to "Volumes"

2. **Add a Volume:**
   - Click "Add Volume"
   - Mount path: `/app` (or `/data` if you prefer)
   - Size: 1GB (default is fine)

   **Note:** This ensures your SQLite database (`todos.db`) persists between deployments.

### Step 5: Generate Domain

1. **Go to Settings → Networking**
2. **Click "Generate Domain"**
3. **Your app will be available at:**
   ```
   https://your-app-name.up.railway.app
   ```

### Step 6: Deploy!

Railway will automatically deploy your app. You can monitor progress:

1. **Check Deployment Logs:**
   - Click on "Deployments" tab
   - View real-time build logs
   - Wait for "Build Successful" and "Deployed"

2. **Expected Deployment Time:** 2-3 minutes

### Step 7: Test Your App

1. **Visit your Railway URL**
2. **Register a new user** using WebAuthn/Passkey
3. **Create a todo** to test functionality

## Important Notes for WebAuthn

### HTTPS Required

- ✅ Railway provides HTTPS automatically
- ✅ WebAuthn requires HTTPS in production
- ✅ Your passkeys will work on Railway domain

### RP ID Configuration

The app automatically configures the Relying Party ID based on the hostname, so no changes needed!

## Automatic Deployments

Once set up, Railway automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update todo app"
git push origin main

# Railway automatically:
# 1. Detects the push
# 2. Builds your app
# 3. Deploys the new version
# 4. Updates your live URL
```

## Database Persistence

### How SQLite Works on Railway

- Database file: `todos.db` (created automatically on first run)
- Location: `/app/todos.db` (in your mounted volume)
- Persists between deployments via Railway Volume

### Important: Volume Configuration

Without a volume, your database will be lost on every deployment. Make sure you've completed Step 4!

## Monitoring & Logs

### View Application Logs

1. **In Railway Dashboard:**
   - Click on your service
   - Go to "Logs" tab
   - See real-time application logs

2. **Check for errors:**
   - Database initialization logs
   - API request logs
   - WebAuthn authentication logs

### Deployment History

1. **Go to "Deployments" tab**
2. **See all previous deployments**
3. **Rollback if needed** by clicking on a previous deployment

## Troubleshooting

### Build Fails

**Check Node Version:**
- Ensure your `package.json` has proper Node version
- Railway auto-detects from `.nvmrc` or `package.json` engines

**Check Dependencies:**
```bash
# Locally test build
npm install
npm run build
```

### Database Errors on Startup

**Problem:** "SQLITE_CANTOPEN" or "no such table"

**Solution:**
1. Ensure Volume is mounted correctly
2. Database tables are created automatically on first run
3. Check logs for initialization messages

### WebAuthn Not Working

**Problem:** Passkey registration fails

**Checklist:**
- ✅ Using HTTPS (Railway provides this)
- ✅ Browser supports WebAuthn
- ✅ No mixed content warnings
- ✅ RP ID matches domain

### App Crashes After Deployment

**Check Logs:**
1. Go to Railway → Logs tab
2. Look for error messages
3. Common issues:
   - Missing dependencies: Run `npm install` locally
   - TypeScript errors: Run `npm run build` locally
   - Database permission issues: Check volume mount

## Performance Optimization

### Recommended Settings

1. **Instance Type:** Hobby plan is sufficient
2. **Memory:** 512MB minimum (default works fine)
3. **Restarts:** Configured in `railway.json`

### Scaling

For production use:
- Consider upgrading to Railway Pro for better performance
- Monitor memory usage in Railway dashboard
- Add Redis for session storage if needed

## Cost Estimate

### Railway Pricing

- **Free Trial:** $5 credit (enough for testing)
- **Hobby Plan:** ~$5-10/month for small apps
- **Pro Plan:** Starting at $20/month with higher limits

This Todo app should run comfortably on the Hobby plan.

## Custom Domain (Optional)

### Add Your Own Domain

1. **In Railway Settings → Networking**
2. **Click "Custom Domain"**
3. **Enter your domain:** `todos.yourdomain.com`
4. **Add DNS Records:**
   - Type: CNAME
   - Name: todos
   - Value: (provided by Railway)

5. **Wait for DNS propagation** (5-30 minutes)

## Security Checklist

- ✅ HTTPS enabled (automatic on Railway)
- ✅ Environment variables not exposed
- ✅ Database file not in Git
- ✅ WebAuthn configured for production domain
- ✅ JWT secrets generated securely (auto-generated in code)

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update
npm audit fix

# Test locally
npm run dev

# Deploy to Railway
git commit -am "Update dependencies"
git push origin main
```

### Backup Database

Railway Volumes are backed up automatically, but you can also:

1. **Use Railway CLI to download database:**
   ```bash
   railway run sqlite3 todos.db .dump > backup.sql
   ```

2. **Implement periodic backups** (advanced)

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Project Docs:** See `USER_GUIDE.md` for app features

## Success Checklist

After deployment, verify:

- [ ] App loads at Railway URL
- [ ] Can register new user with passkey
- [ ] Can create todos
- [ ] Can add subtasks
- [ ] Database persists after page reload
- [ ] Can create and apply tags
- [ ] Recurring todos work
- [ ] Notifications permission works
- [ ] Calendar view loads

## Quick Commands Reference

```bash
# Push to trigger deployment
git push origin main

# View Railway logs (requires Railway CLI)
railway logs

# Connect to Railway shell
railway shell

# Check Railway status
railway status
```

---

**Congratulations!** 🎉 Your Todo App is now deployed on Railway!

Visit your app at: `https://your-app-name.up.railway.app`
