# Complete Deployment Guide - Learn & Grow Web Portal

## ✅ Pre-Deployment Checklist

### Backend (Supabase) - ✅ COMPLETE
- [x] Database migrations applied
- [x] All Edge Functions deployed (16 functions)
- [x] RLS policies configured
- [x] Referral system active
- [x] Mobile API schema ready

### Frontend (Next.js) - Ready for Vercel
- [x] Code is production-ready
- [x] Environment variables documented
- [x] Build script configured
- [ ] Vercel deployment pending

---

## 🚀 Step-by-Step Deployment

### 1. Deploy to Vercel (Frontend)

#### Option A: Via GitHub (Recommended - Based on your preference)

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to: https://vercel.com/new
   - Import your GitHub repository
   - Configure:
     - **Framework Preset:** Next.js
     - **Root Directory:** `apps/web`
     - **Build Command:** `npm run build` (or `cd apps/web && npm run build`)
     - **Output Directory:** `.next` (default)

3. **Set Environment Variables in Vercel**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://iscqpvwtikwqquvxlpsr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
   
   **Get your keys:**
   - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/settings/api
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at: `https://your-project.vercel.app`

#### Option B: Via Vercel CLI
```bash
cd apps/web
npm install -g vercel
vercel
# Follow prompts, set environment variables when asked
```

---

### 2. Update Supabase Configuration

After Vercel deployment, update Supabase settings:

1. **Update SITE_URL in Edge Function Secrets**
   - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/settings/functions
   - Update `SITE_URL` to your Vercel domain:
     ```
     SITE_URL=https://your-project.vercel.app
     ```

2. **Update Auth Redirect URLs**
   - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/url-configuration
   - Add your Vercel domain:
     - Site URL: `https://your-project.vercel.app`
     - Redirect URLs: 
       - `https://your-project.vercel.app/auth/callback`
       - `https://your-project.vercel.app/**`

3. **Update Email Templates (if needed)**
   - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/templates
   - Ensure OTP email template uses `{{ .Token }}`

---

### 3. Verify Deployment

Test these endpoints after deployment:

1. **Homepage**
   - Should redirect to `/start` or `/dashboard` based on auth

2. **Login Flow**
   - `/start` → Enter email
   - `/login` → Enter OTP code
   - Should redirect to `/dashboard`

3. **Dashboard**
   - Shows XP balance
   - Shows conversion rate
   - Shows recent withdrawals
   - Shows referral section

4. **Withdrawal**
   - `/withdraw` → Create withdrawal
   - `/history` → View withdrawal history

5. **Account**
   - `/account` → View account settings

---

## 📋 Environment Variables Summary

### Required for Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://iscqpvwtikwqquvxlpsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Already Set in Supabase (Edge Functions):
```
SUPABASE_URL=https://iscqpvwtikwqquvxlpsr.supabase.co (auto)
SUPABASE_ANON_KEY=<auto>
SUPABASE_SERVICE_ROLE_KEY=<auto>
SITE_URL=https://your-project.vercel.app (update after deployment)
TZS_PER_XP=0.05
MIN_WITHDRAWAL_XP=5000
WITHDRAWAL_COOLDOWN_DAYS=7
MAX_WITHDRAWALS_PER_7DAYS=1
```

---

## 🔒 Security Checklist

- [x] RLS policies enabled on all tables
- [x] Service role key not exposed to frontend
- [x] Anon key is public (safe for frontend)
- [x] Rate limiting implemented
- [x] Idempotency keys required for mutations
- [x] CORS configured properly

---

## 📊 Current Deployment Status

### Backend (Supabase)
- ✅ **Project ID:** `iscqpvwtikwqquvxlpsr`
- ✅ **URL:** `https://iscqpvwtikwqquvxlpsr.supabase.co`
- ✅ **Edge Functions:** 16 deployed and active
- ✅ **Database:** All migrations applied
- ✅ **Auth:** Email OTP configured

### Frontend (Next.js)
- ⏳ **Status:** Ready for Vercel deployment
- 📁 **Root Directory:** `apps/web`
- 🔑 **Env Vars:** Need to be set in Vercel

---

## 🎯 Quick Deploy Commands

If you want to deploy via CLI:

```bash
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Navigate to web app
cd apps/web

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 5. Redeploy with env vars
vercel --prod
```

---

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (needs 18+)
- Verify all dependencies are in `package.json`
- Check for TypeScript errors: `npm run type-check`

### Auth Not Working
- Verify environment variables in Vercel
- Check Supabase redirect URLs include your domain
- Check browser console for errors

### API Calls Fail
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Edge Functions are deployed
- Check browser network tab for 401/403 errors

---

## ✅ Post-Deployment

After deployment is live:

1. **Test all features**
   - Login flow
   - Dashboard
   - Withdrawals
   - Referrals

2. **Monitor**
   - Check Vercel logs
   - Check Supabase logs
   - Monitor error rates

3. **Share**
   - Your site is live at: `https://your-project.vercel.app`
   - Share with users!

---

## 📝 Notes

- The web portal is fully functional and ready for production
- All backend APIs are deployed and working
- Mobile app integration can be added later (APIs are ready)
- Custom domain can be added in Vercel settings

**You're ready to deploy! 🚀**

