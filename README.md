# Learn & Grow Cashout Portal

A minimal, production-ready cashout web portal for "Learn & Grow" built with Next.js, Supabase, and TypeScript.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Deployment**: Vercel
- **Authentication**: Email OTP (6-digit codes) + Passkeys (future)

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Supabase account
- Supabase CLI (`npm install -g supabase`)

### 2. Setup Supabase

1. **Create/Login to Supabase Project**
   - Project ID: `iscqpvwtikwqquvxlpsr`
   - Dashboard: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr

2. **Apply Database Schema**
   ```bash
   # Link to project
   npx supabase link --project-ref iscqpvwtikwqquvxlpsr
   
   # Apply migrations
   npx supabase db push
   ```

3. **Configure Email Template for OTP Codes**
   - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/templates
   - Select **"Magic Link"** template
   - Replace the content with:
     ```html
     <h2>Your Verification Code</h2>
     <p>Your one-time password (OTP) is:</p>
     <h3 style="font-size: 32px; letter-spacing: 8px; text-align: center; margin: 20px 0;">{{ .Token }}</h3>
     <p>This code will expire in 1 hour.</p>
     <p>If you didn't request this code, please ignore this email.</p>
     ```
   - Click **Save**

4. **Configure Auth Redirect URLs** (optional, not needed for OTP)
   - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/url-configuration
   - **Site URL**: `http://localhost:3000`

5. **Deploy Edge Functions**
   ```bash
   npx supabase functions deploy start --no-verify-jwt
   npx supabase functions deploy auth-otp --no-verify-jwt
   npx supabase functions deploy me
   npx supabase functions deploy conversion-rate --no-verify-jwt
   npx supabase functions deploy withdrawals
   npx supabase functions deploy admin-mark-paid
   ```

6. **Set Edge Function Secrets**
   - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/settings/functions
   - Add these secrets:
     ```
     SITE_URL=http://localhost:3000
     TZS_PER_XP=0.05
     MIN_WITHDRAWAL_XP=5000
     WITHDRAWAL_COOLDOWN_DAYS=7
     MAX_WITHDRAWALS_PER_7DAYS=1
     ```
   - **Note**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided - don't set them manually.

### 3. Setup Next.js App

1. **Install Dependencies**
   ```bash
   cd apps/web
   npm install
   ```

2. **Create `.env.local`**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://iscqpvwtikwqquvxlpsr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Visit**: http://localhost:3000

## Project Structure

```
.
├── apps/
│   └── web/                 # Next.js application
│       ├── app/             # App Router pages
│       │   ├── start/       # Email input page
│       │   ├── login/       # OTP login (6-digit code)
│       │   ├── dashboard/   # User dashboard
│       │   ├── withdraw/    # Withdrawal form
│       │   ├── history/    # Withdrawal history
│       │   └── account/    # Account settings
│       └── lib/             # Utilities
├── packages/
│   └── api-client/          # Typed API client
├── supabase/
│   ├── functions/           # Edge Functions
│   └── sql/                 # Database migrations
└── scripts/                  # Utility scripts
```

## API Endpoints

All endpoints are Supabase Edge Functions:

- `POST /start` - Phone/email collection
- `POST /auth-magiclink` - Send magic link
- `GET /me` - User profile & XP balance
- `GET /conversion-rate` - Current conversion rate
- `POST /withdrawals` - Create withdrawal
- `GET /withdrawals` - List withdrawals
- `POST /admin-mark-paid` - Mark withdrawal as paid (admin)

## Business Rules

Configurable via environment variables:

- `TZS_PER_XP=0.05` - Conversion rate
- `MIN_WITHDRAWAL_XP=5000` - Minimum withdrawal
- `WITHDRAWAL_COOLDOWN_DAYS=7` - Days between withdrawals
- `MAX_WITHDRAWALS_PER_7DAYS=1` - Max withdrawals per week

## Deployment

### Deploy Edge Functions

Use the deployment script:

```bash
chmod +x scripts/deploy-all.sh
./scripts/deploy-all.sh
```

Or deploy manually:

```bash
npx supabase functions deploy start --no-verify-jwt
npx supabase functions deploy auth-magiclink --no-verify-jwt
npx supabase functions deploy me
npx supabase functions deploy conversion-rate --no-verify-jwt
npx supabase functions deploy withdrawals
npx supabase functions deploy admin-mark-paid
```

### Vercel (Frontend)

**Quick Deploy:**

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to: https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and use `vercel.json` config
   - Root Directory is automatically set to `apps/web` via `vercel.json`

3. **Set Environment Variables in Vercel Dashboard:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://iscqpvwtikwqquvxlpsr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0
   ```
   - Go to: Project Settings → Environment Variables
   - Add both variables for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your site will be live at: `https://your-project.vercel.app`

5. **Update Supabase Settings** (After deployment)
   - **Update SITE_URL in Edge Function Secrets:**
     - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/settings/functions
     - Update `SITE_URL` to: `https://your-project.vercel.app`
   
   - **Update Auth Redirect URLs:**
     - Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/url-configuration
     - Add:
       - Site URL: `https://your-project.vercel.app`
       - Redirect URLs: `https://your-project.vercel.app/auth/callback`

**Note:** The `vercel.json` file is already configured for monorepo deployment.

## Troubleshooting

### Magic Link Not Working

1. **Check Auth Redirect URLs**: Ensure `http://localhost:3000/auth/callback` is added
2. **Check Site URL**: Should be `http://localhost:3000` in Supabase Dashboard
3. **Check Edge Function Secrets**: Ensure `SITE_URL` is set correctly
4. **Request New Magic Link**: Old links won't work after config changes

### Session Not Persisting

- Clear browser cookies and try again
- Check browser console for errors
- Verify Supabase client is using correct URL and key

## License

MIT
