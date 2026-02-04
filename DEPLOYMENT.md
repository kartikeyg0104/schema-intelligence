# Deployment Guide

This guide covers deploying the GraphQL Schema Intelligence application with the frontend on Vercel and backend on Render.

## Architecture Overview

- **Frontend**: React application → Vercel (Static Hosting)
- **Backend**: Node.js/Express API → Render (Web Service)

---

## Backend Deployment (Render)

### Option 1: Deploy Analysis Server (Recommended)
The Analysis Server provides all the APIs used by the frontend.

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub

### Step 2: Create New Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Select your repository: `schema-intelligence`

### Step 3: Configure Service
Fill in the following settings:

- **Name**: `graphql-schema-intelligence-api` (or your choice)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `graphql-schema-intelligence/backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node analysisServer.js`
- **Instance Type**: `Free` (or paid plan for better performance)

### Step 4: Environment Variables
No environment variables needed! The backend automatically uses `process.env.PORT` which Render provides.

### Step 5: Deploy
1. Click **Create Web Service**
2. Wait for deployment to complete
3. Copy your service URL (e.g., `https://graphql-schema-intelligence-api.onrender.com`)

### Testing Backend
Once deployed, test these endpoints:
```bash
# Health check
curl https://your-app.onrender.com/health

# Schema metrics
curl https://your-app.onrender.com/schema/metrics

# Schema graph
curl https://your-app.onrender.com/schema/graph
```

---

## Frontend Deployment (Vercel)

### Step 1: Update API URL
Before deploying, you need to set the production backend URL.

1. Create a `.env.production` file in `graphql-schema-intelligence/frontend/`:

```env
REACT_APP_ANALYSIS_API_URL=https://your-backend-app.onrender.com
```

Replace `https://your-backend-app.onrender.com` with your actual Render URL from the backend deployment.

### Step 2: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub

### Step 3: Import Project
1. Click **Add New...** → **Project**
2. Import your GitHub repository
3. Vercel will auto-detect it's a Create React App

### Step 4: Configure Project
- **Framework Preset**: Create React App (auto-detected)
- **Root Directory**: `graphql-schema-intelligence/frontend`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `build` (default)

### Step 5: Add Environment Variable
In Vercel project settings:
1. Go to **Settings** → **Environment Variables**
2. Add variable:
   - **Key**: `REACT_APP_ANALYSIS_API_URL`
   - **Value**: `https://your-backend-app.onrender.com`
   - **Environments**: Select all (Production, Preview, Development)

### Step 6: Deploy
1. Click **Deploy**
2. Wait for build to complete
3. Vercel will provide your production URL (e.g., `https://your-app.vercel.app`)

---

## Post-Deployment

### Update CORS (if needed)
If you encounter CORS errors, update the backend's CORS configuration in `analysisServer.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend.vercel.app',
  credentials: true
}));
```

Then redeploy the backend on Render.

### Custom Domain (Optional)
- **Vercel**: Settings → Domains → Add your domain
- **Render**: Settings → Custom Domain → Add your domain

---

## Local Development

### Backend
```bash
cd graphql-schema-intelligence/backend
npm install
npm start:analysis
# Runs on http://localhost:4001
```

### Frontend
```bash
cd graphql-schema-intelligence/frontend
npm install
npm start
# Runs on http://localhost:3000
```

The frontend is configured to use `http://localhost:4001` when no production URL is set.

---

## Environment Variables Summary

### Backend (Render)
- `PORT` - Automatically provided by Render ✅

### Frontend (Vercel)
- `REACT_APP_ANALYSIS_API_URL` - Your backend URL (e.g., `https://your-app.onrender.com`)

---

## Troubleshooting

### Backend Issues
1. **Port binding error**: Render automatically provides `PORT` - no manual configuration needed
2. **Module not found**: Check `package.json` dependencies are correct
3. **Build failed**: Ensure Node version compatibility (Render uses Node 18+ by default)

### Frontend Issues
1. **API connection failed**: 
   - Verify `REACT_APP_ANALYSIS_API_URL` environment variable in Vercel
   - Check backend URL is correct and accessible
   - Verify backend CORS allows your frontend domain

2. **Build failed**:
   - Check all dependencies are in `package.json`
   - Verify no hardcoded `localhost` URLs in production code

3. **Blank page**:
   - Check browser console for errors
   - Verify API URL is set correctly
   - Test backend endpoints directly

### CORS Errors
If you see CORS errors in browser console:
1. Add your Vercel domain to backend CORS configuration
2. Redeploy backend
3. Clear browser cache and test again

---

## Quick Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Backend health check responding
- [ ] Frontend `.env.production` created with backend URL
- [ ] Frontend deployed to Vercel
- [ ] Environment variable set in Vercel
- [ ] Frontend can connect to backend
- [ ] Test all features work in production

---

## Support

For issues:
1. Check Render logs: Render Dashboard → Your Service → Logs
2. Check Vercel logs: Vercel Dashboard → Your Project → Deployments → View Details
3. Test backend endpoints directly with curl/Postman
4. Verify environment variables are set correctly

---

## Cost Estimate

- **Render Free Tier**: 
  - 750 hours/month
  - Spins down after 15 min inactivity
  - Good for demos and testing

- **Vercel Free Tier**:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Perfect for personal projects

Both platforms offer paid tiers for production workloads.
