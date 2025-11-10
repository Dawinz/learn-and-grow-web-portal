# Vercel Environment Variables

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### 1. Supabase Project URL
```
NEXT_PUBLIC_SUPABASE_URL=https://iscqpvwtikwqquvxlpsr.supabase.co
```

### 2. Supabase Anonymous Key
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0
```

---

## How to Add in Vercel Dashboard

1. **Go to your project** on Vercel: https://vercel.com/dashboard
2. **Click on your project** → **Settings** → **Environment Variables**
3. **Add each variable:**
   - Click **"Add New"**
   - Enter the **Key** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the **Value** (e.g., `https://iscqpvwtikwqquvxlpsr.supabase.co`)
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **Save**
4. **Repeat** for the second variable

---

## Quick Copy-Paste Format

For easy copy-paste into Vercel:

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://iscqpvwtikwqquvxlpsr.supabase.co`

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0`

---

## Important Notes

- ✅ Both variables are **public** (safe to expose in frontend)
- ✅ Apply to **all environments** (Production, Preview, Development)
- ✅ After adding, **redeploy** your project for changes to take effect
- ✅ The `NEXT_PUBLIC_` prefix makes them available in the browser

---

## Verification

After adding the variables, verify they're set correctly:

1. Go to **Settings** → **Environment Variables**
2. You should see both variables listed
3. Trigger a new deployment to apply them

---

## Alternative: Via Vercel CLI

If you prefer using the CLI:

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://iscqpvwtikwqquvxlpsr.supabase.co
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0
# Select: Production, Preview, Development

# Redeploy
vercel --prod
```

---

**That's it! Your app will work once these are set.** 🚀

