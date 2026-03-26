import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 * Supports both SMTP and development mode
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (smtpHost && smtpPort && smtpUser && smtpPassword) {
    // Production: Use real SMTP
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  } else {
    // Development: Use Ethereal Email (test email service)
    console.warn("⚠️ SMTP not configured. Using test mode.");
    console.warn("Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env");
  }

  return transporter as nodemailer.Transporter;
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      console.log("📧 EMAIL (TEST MODE):");
      console.log(`  To: ${options.to}`);
      console.log(`  Subject: ${options.subject}`);
      console.log(`  Body: ${options.html.substring(0, 100)}...`);
      return true;
    }

    const result = await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM_EMAIL || "noreply@birdiefund.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`✓ Email sent to ${options.to} (Message ID: ${result.messageId})`);
    return true;
  } catch (error) {
    console.error("✗ Error sending email:", error);
    return false;
  }
}

/**
 * Send draw published notification
 */
export async function sendDrawPublishedEmail(userEmail: string, drawMonth: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d6f56b, #63d2ff); padding: 20px; border-radius: 8px; }
          .content { margin: 20px 0; line-height: 1.6; }
          .button { background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Draw Published!</h1>
          </div>

          <div class="content">
            <p>Hi,</p>
            <p>Great news! A new draw has just been published for <strong>${drawMonth}</strong>.</p>
            <p>The winning numbers have been drawn, and we're checking for winners across all prize tiers.</p>

            <p>If you're a winner, you'll receive a separate notification with details about your prize!</p>

            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">View Your Status</a>

            <p>Good luck in the next draw! 🍀</p>
          </div>

          <div class="footer">
            <p>© 2026 BirdieFund. All rights reserved.</p>
            <p>This is an automated message. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `🎯 New Draw Published - ${drawMonth}`,
    html,
  });
}

/**
 * Send winner notification
 */
export async function sendWinnerNotificationEmail(
  userEmail: string,
  userName: string,
  tier: string,
  amount: number,
  month: string
): Promise<boolean> {
  const tierName = {
    match5: "5-Match Prize",
    match4: "4-Match Prize",
    match3: "3-Match Prize",
  }[tier] || "Prize";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; border-radius: 8px; text-align: center; }
          .prize-box { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .prize-amount { font-size: 32px; font-weight: bold; color: #FFD700; }
          .content { margin: 20px 0; line-height: 1.6; }
          .button { background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations, ${userName}!</h1>
            <p style="font-size: 18px; margin: 10px 0;">You're a Winner!</p>
          </div>

          <div class="content">
            <p>Fantastic news! You've won a prize in the ${month} BirdieFund Draw!</p>

            <div class="prize-box">
              <p style="margin: 0; color: #666; font-size: 12px;">PRIZE TIER</p>
              <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">${tierName}</p>
              <p style="margin: 15px 0; color: #666;">Amount Won</p>
              <div class="prize-amount">$${amount.toFixed(2)}</div>
              <p style="margin: 15px 0; color: #999; font-size: 12px;">💡 This amount includes your enabled charity contribution</p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Go to your dashboard to upload proof of your score</li>
              <li>We'll verify your winning entry</li>
              <li>Once approved, we'll process your payment</li>
            </ol>

            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">View Winning Details</a>

            <p>Thank you for supporting BirdieFund! 🏌️</p>
          </div>

          <div class="footer">
            <p>© 2026 BirdieFund. All rights reserved.</p>
            <p>This is an automated message. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `🎉 Congratulations! You Won - ${tierName}`,
    html,
  });
}

/**
 * Send account verification email
 */
export async function sendAccountVerificationEmail(userEmail: string, userName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d6f56b, #63d2ff); padding: 20px; border-radius: 8px; }
          .content { margin: 20px 0; line-height: 1.6; }
          .button { background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👋 Welcome to BirdieFund, ${userName}!</h1>
          </div>

          <div class="content">
            <p>Your account has been successfully created!</p>

            <p>You can now:</p>
            <ul>
              <li>Participate in golf draws</li>
              <li>Support your chosen charity</li>
              <li>Track your winnings</li>
              <li>View draw results</li>
            </ul>

            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">Go to Dashboard</a>

            <p>If you have any questions, feel free to contact us!</p>
          </div>

          <div class="footer">
            <p>© 2026 BirdieFund. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Welcome to BirdieFund! 🎉",
    html,
  });
}

/**
 * Send verification approved email
 */
export async function sendVerificationApprovedEmail(userEmail: string, amount: number): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #90EE90, #32CD32); padding: 20px; border-radius: 8px; }
          .content { margin: 20px 0; line-height: 1.6; }
          .button { background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Your Winning Has Been Approved!</h1>
          </div>

          <div class="content">
            <p>Great news! Your winning entry has been verified and approved.</p>

            <p><strong>Prize Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Status:</strong> Ready for payment processing</p>

            <p>Your prize will be processed within 5-7 business days.</p>

            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">View Details</a>
          </div>

          <div class="footer">
            <p>© 2026 BirdieFund. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "✅ Your Winning Verified - Payment Processing",
    html,
  });
}
