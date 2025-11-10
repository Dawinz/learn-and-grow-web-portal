export async function sendWithdrawalConfirmationEmail(
  email: string,
  withdrawalId: string,
  xpDebited: number,
  amountTzs: number,
  rate: number
): Promise<void> {
  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'

  // Create email content
  const emailSubject = 'Withdrawal Request Confirmed - Learn & Grow'
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #6b7280; }
        .value { color: #111827; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Withdrawal Request Confirmed</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your withdrawal request has been submitted successfully and is now being processed.</p>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">XP Debited:</span>
              <span class="value">${xpDebited.toLocaleString()} XP</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value">${amountTzs.toLocaleString()} TZS</span>
            </div>
            <div class="detail-row">
              <span class="label">Conversion Rate:</span>
              <span class="value">${rate.toFixed(6)} TZS/XP</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value">Pending</span>
            </div>
            <div class="detail-row">
              <span class="label">Withdrawal ID:</span>
              <span class="value">${withdrawalId}</span>
            </div>
          </div>

          <p>Your request is being reviewed and processed. You will receive another email once your withdrawal has been completed.</p>
          
          <a href="${siteUrl}/history" class="button">View Withdrawal History</a>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Learn & Grow Cashout Portal</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  // Use Supabase's email sending via admin API
  // Note: Supabase doesn't have a direct email API, so we'll log it for now
  // In production, integrate with a service like Resend, SendGrid, or AWS SES
  console.log('=== WITHDRAWAL CONFIRMATION EMAIL ===')
  console.log(`To: ${email}`)
  console.log(`Subject: ${emailSubject}`)
  console.log(`Withdrawal ID: ${withdrawalId}`)
  console.log(`XP: ${xpDebited}, Amount: ${amountTzs} TZS`)
  console.log('=====================================')

  // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
  // For now, this logs the email content
  // In production, replace this with actual email sending:
  //
  // Example with Resend:
  // await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'noreply@learnandgrow.com',
  //     to: email,
  //     subject: emailSubject,
  //     html: emailHtml,
  //   }),
  // })
}

