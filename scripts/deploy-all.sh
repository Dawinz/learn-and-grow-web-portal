#!/bin/bash
# Complete deployment script for Learn & Grow Cashout Portal

set -e

echo "🚀 Learn & Grow Cashout Portal - Deployment Script"
echo "=================================================="
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Installing via npx..."
    npm install -g supabase || echo "⚠️  Could not install globally, will use npx"
fi

echo "Step 1: Login to Supabase"
echo "-------------------------"
echo "This will open your browser for authentication..."
echo ""
npx supabase login || {
    echo "❌ Login failed. Please run 'npx supabase login' manually."
    exit 1
}

echo ""
echo "Step 2: Link to Supabase Project"
echo "--------------------------------"
npx supabase link --project-ref iscqpvwtikwqquvxlpsr || {
    echo "❌ Failed to link project. Check your project ID."
    exit 1
}

echo ""
echo "Step 3: Deploy Edge Functions"
echo "----------------------------"
echo "Deploying start function..."
npx supabase functions deploy start

echo "Deploying auth-magiclink function..."
npx supabase functions deploy auth-magiclink --no-verify-jwt

echo "Deploying me function..."
npx supabase functions deploy me

echo "Deploying conversion-rate function..."
npx supabase functions deploy conversion-rate --no-verify-jwt

echo "Deploying withdrawals function..."
npx supabase functions deploy withdrawals

echo "Deploying admin-mark-paid function..."
npx supabase functions deploy admin-mark-paid

echo ""
echo "✅ All Edge Functions deployed successfully!"
echo ""
echo "⚠️  IMPORTANT: Next Steps (Manual)"
echo "=================================="
echo ""
echo "1. Set Edge Function Secrets:"
echo "   Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/settings/functions"
echo "   Add these secrets:"
echo ""
echo "   SITE_URL=http://localhost:3000"
echo ""
echo "   Note: SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY"
echo "   are automatically provided - DO NOT set them manually!"
echo ""
echo "   TZS_PER_XP=0.05"
echo "   MIN_WITHDRAWAL_XP=5000"
echo "   WITHDRAWAL_COOLDOWN_DAYS=7"
echo "   MAX_WITHDRAWALS_PER_7DAYS=1"
echo ""
echo "2. Configure Auth Redirect URLs:"
echo "   Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/url-configuration"
echo "   Add: http://localhost:3000/auth/callback"
echo ""
echo "3. Test your application:"
echo "   Visit: http://localhost:3000"
echo ""

