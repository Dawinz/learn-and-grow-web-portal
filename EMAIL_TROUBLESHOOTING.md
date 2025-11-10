# Email Not Receiving - Troubleshooting Guide

## Quick Checks

### 1. Check Spam/Junk Folder
- **Most common issue**: Emails often go to spam
- Check your spam/junk folder for emails from Supabase
- Look for sender: `noreply@mail.app.supabase.io` or similar

### 2. Verify Email Template Configuration
Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/templates

**For OTP Codes:**
- Select **"Magic Link"** template (this is used for OTP)
- Make sure it contains: `{{ .Token }}`
- Template should look like:
  ```html
  <h2>Your Verification Code</h2>
  <p>Your one-time password (OTP) is:</p>
  <h3 style="font-size: 32px; letter-spacing: 8px; text-align: center; margin: 20px 0;">{{ .Token }}</h3>
  <p>This code will expire in 1 hour.</p>
  ```

### 3. Check Supabase Email Settings
Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/settings/auth

**Verify:**
- ✅ Email provider is configured (SMTP or Supabase default)
- ✅ "Enable email confirmations" is ON (if required)
- ✅ "Enable email signups" is ON

### 4. Check Supabase Auth Logs
Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/logs/auth

**Look for:**
- OTP send attempts
- Email delivery errors
- Rate limiting messages

### 5. Check Edge Function Logs
Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/functions/auth-otp/logs

**Look for:**
- Successful OTP requests
- API errors from Supabase Auth
- Rate limiting issues

### 6. Test Email Sending Directly

**Option A: Use Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/users
2. Click "Add user" → "Create new user"
3. Enter email: `dawinibra@gmail.com`
4. Check "Auto Confirm User" if you want to skip email verification
5. Or manually trigger email from user actions

**Option B: Test via API**
```bash
curl -X POST 'https://iscqpvwtikwqquvxlpsr.supabase.co/auth/v1/otp' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "dawinibra@gmail.com", "type": "email"}'
```

### 7. Common Issues & Solutions

#### Issue: Emails going to spam
**Solution:**
- Check spam folder
- Add Supabase email to contacts
- Use custom SMTP (if available on your plan)

#### Issue: Rate limiting
**Solution:**
- Wait 1 hour between requests per email
- Check rate limit settings in Edge Function

#### Issue: Email template not configured
**Solution:**
- Configure the "Magic Link" template with `{{ .Token }}`
- Make sure template is saved

#### Issue: SMTP not configured (Free tier)
**Solution:**
- Free tier uses Supabase's default email service
- May have delivery delays or go to spam
- Consider upgrading for custom SMTP

### 8. Verify Edge Function is Working

Check if the `/auth-otp` endpoint is responding:

```bash
curl -X POST 'https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/auth-otp' \
  -H "Content-Type: application/json" \
  -d '{"email": "dawinibra@gmail.com"}'
```

Should return:
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

### 9. Check Browser Console

Open browser DevTools (F12) → Console tab
- Look for API errors
- Check Network tab for `/auth-otp` requests
- Verify request is successful (200 status)

### 10. Alternative: Use Supabase Dashboard to Send Test Email

1. Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/auth/users
2. Find or create user with email `dawinibra@gmail.com`
3. Click on user → "Send magic link" or "Resend confirmation email"

---

## Next Steps

1. **Check spam folder first** (most common)
2. **Verify email template** has `{{ .Token }}`
3. **Check Supabase logs** for delivery errors
4. **Test via Supabase dashboard** to isolate the issue

---

## Still Not Working?

If emails still aren't arriving:
1. Check Supabase project status (should be ACTIVE_HEALTHY)
2. Verify email address is correct
3. Try a different email address
4. Check if your email provider is blocking Supabase emails
5. Contact Supabase support if using paid plan

---

**Project ID:** `iscqpvwtikwqquvxlpsr`  
**Dashboard:** https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr

