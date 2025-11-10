# Supabase Configuration After Vercel Deployment

## ⚠️ IMPORTANT: Update These Settings After Deploying to Vercel

After deploying to Vercel, you **MUST** update these Supabase settings for authentication to work properly.

---

## 1. Update Site URL

**Go to:** https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/url-configuration

**Update:**
- **Site URL:** Change from `http://localhost:3000` to your Vercel domain
  - Example: `https://learn-and-grow-web-portal-web.vercel.app`

**Why:** This tells Supabase where your app is hosted.

---

## 2. Update Redirect URLs

**In the same page** (Auth URL Configuration):

**Add these Redirect URLs:**
```
https://learn-and-grow-web-portal-web.vercel.app/auth/callback
https://learn-and-grow-web-portal-web.vercel.app/**
```

**Why:** Supabase needs to know which URLs are allowed for auth redirects.

---

## 3. Update Edge Function SITE_URL Secret

**Go to:** https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/settings/functions

**Find the `SITE_URL` secret and update it:**
- Old: `http://localhost:3000`
- New: `https://learn-and-grow-web-portal-web.vercel.app`

**Why:** Edge Functions use this for generating links in emails and other operations.

---

## 4. Verify Email Template

**Go to:** https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/templates

**Check the "Magic Link" template:**
- Must contain: `{{ .Token }}`
- This is used for OTP codes

---

## Quick Checklist

After deploying to Vercel:

- [ ] Update Site URL in Auth settings
- [ ] Add Vercel domain to Redirect URLs
- [ ] Update `SITE_URL` in Edge Function secrets
- [ ] Verify email template has `{{ .Token }}`
- [ ] Test login flow on Vercel domain

---

## How This Affects "Missing authorization header" Error

**The error can occur if:**
1. ✅ **Code issue** (just fixed): Calling API before session is ready
2. ✅ **Supabase config**: Redirect URLs not set → cookies not set properly → no session
3. ✅ **CORS issues**: Domain not whitelisted → requests blocked

**After updating Supabase settings:**
- Auth redirects will work properly
- Cookies will be set correctly
- Sessions will persist
- API calls will have proper authorization headers

---

## Your Vercel Domain

Based on your deployment, your domain is likely:
- **Production:** `https://learn-and-grow-web-portal-web.vercel.app`
- **Or custom domain** (if you set one up)

**Check your actual domain:**
1. Go to Vercel dashboard
2. Click on your project
3. Check the "Domains" section

---

## Step-by-Step Update Instructions

### Step 1: Get Your Vercel Domain
1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Copy the domain (e.g., `learn-and-grow-web-portal-web.vercel.app`)

### Step 2: Update Supabase Auth Settings
1. Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/url-configuration
2. **Site URL:** Paste your Vercel domain (with `https://`)
3. **Redirect URLs:** Click "Add URL" and add:
   - `https://your-domain.vercel.app/auth/callback`
   - `https://your-domain.vercel.app/**`
4. Click **Save**

### Step 3: Update Edge Function Secret
1. Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/settings/functions
2. Find `SITE_URL` in the secrets list
3. Click **Edit** or **Update**
4. Change value to: `https://your-domain.vercel.app`
5. Click **Save**

### Step 4: Test
1. Visit your Vercel domain
2. Try logging in
3. Check if emails are received
4. Verify session persists after login

---

**This should fix the "Missing authorization header" error!** 🎯

