/**
 * Email Verification Template Generator
 *
 * This TypeScript function generates a complete HTML email template
 * for email verification purposes. It creates a responsive, styled
 * HTML email that can be sent via email services like Nodemailer,
 * SendGrid, or any other email provider.
 *
 * @param verificationLink - The unique verification URL for the user
 * @returns Complete HTML string ready to be sent as email content
 */

interface EmailTemplateProps {
  verificationLink: string;
}

export function generateVerificationEmailHTML({
  verificationLink,
}: EmailTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - iAyos</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
          line-height: 1.5;
          width: 100% !important;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        
        .container {
          max-width: 390px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }
        
        .email-icon {
          margin: 0 auto 2rem auto;
          padding: 1rem;
          background-color: #dbeafe;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          text-align: center;
        }
        
        .email-icon svg {
          width: 48px;
          height: 48px;
          color: #2563eb;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          display: block;
          margin: 8px auto 0 auto;
        }
        
        .main-heading {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .greeting {
          font-size: 1.125rem;
          font-weight: 400;
          color: #374151;
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .message-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .message-text {
          font-size: 1rem;
          color: #4b5563;
          text-align: center;
          line-height: 1.625;
          margin-bottom: 1rem;
        }
        
        .brand-name {
          font-weight: 600;
          color: #2563eb;
        }
        
        .security-note {
          background-color: #eff6ff;
          border-left: 4px solid #60a5fa;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .security-note p {
          font-size: 0.875rem;
          color: #1d4ed8;
        }
        
        .security-note .font-semibold {
          font-weight: 600;
        }
        
        .verify-button {
          display: inline-block;
          width: auto;
          min-width: 200px;
          background-color: #2563eb;
          color: white !important;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          text-align: center;
          margin: 0 auto 24px auto;
          border: none;
          font-size: 16px;
        }
        
        .verify-button:hover {
          background-color: #1d4ed8 !important;
        }
        
        .alternative-link {
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .alternative-text {
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
          margin-bottom: 0.75rem;
        }
        
        .link-display {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.75rem;
          text-align: center;
          word-break: break-all;
        }
        
        .link-text {
          font-size: 0.75rem;
          color: #2563eb;
        }
        
        .help-section {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          width: 100%;
          margin-bottom: 1.5rem;
        }
        
        .help-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .help-list {
          list-style: none;
          font-size: 0.875rem;
          color: #4b5563;
        }
        
        .help-list li {
          margin-bottom: 0.25rem;
        }
        
        .footer {
          text-align: center;
        }
        
        .footer-text {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }
        
        .login-link-section {
          margin-top: 1.5rem;
        }
        
        .login-text {
          text-align: center;
          font-size: 0.875rem;
          color: #4b5563;
        }
        
        .login-link {
          color: #3b82f6;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .login-link:hover {
          color: #2563eb;
        }
        
        @media (max-width: 640px) {
          .container {
            padding: 1rem !important;
          }
          
          .email-icon {
            width: 60px !important;
            height: 60px !important;
          }
          
          .email-icon svg {
            width: 36px !important;
            height: 36px !important;
          }
        }
        
        /* Email client specific fixes */
        .email-wrapper {
          width: 100%;
          background-color: #f9fafb;
          padding: 20px 0;
        }
        
        .email-table {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f9fafb;
        }
        
        .content-table {
          width: 100%;
          max-width: 390px;
          margin: 0 auto;
          background-color: transparent;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <table class="email-table" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <table class="content-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="container">
                    <!-- Email Icon -->
                    <div class="email-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>

                    <!-- Main Heading -->
                    <h1 class="main-heading">
                      Verify Your Email Address
                    </h1>

                    <!-- Greeting -->
                    <p class="greeting">
                      Hello!
                    </p>

                    <!-- Main Message -->
                    <div class="message-card">
                      <p class="message-text">
                        Thank you for joining <span class="brand-name">iAyos</span>! 
                        We're excited to have you on board.
                      </p>
                      
                      <p class="message-text">
                        To complete your registration and secure your account, please 
                        verify your email address by clicking the button below.
                      </p>

                      <div class="security-note">
                        <p>
                          <span class="font-semibold">Security Note:</span> This 
                          verification link will expire in 24 hours for your protection.
                        </p>
                      </div>
                    </div>

                    <!-- Verification Button -->
                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${verificationLink}" class="verify-button">
                        Verify Email Address →
                      </a>
                    </div>

                    <!-- Alternative Link -->
                    <div class="alternative-link">
                      <p class="alternative-text">
                        Button not working? Copy and paste this link into your browser:
                      </p>
                      <div class="link-display">
                        <span class="link-text">
                          ${verificationLink}
                        </span>
                      </div>
                    </div>

                    <!-- Help Section -->
                    <div class="help-section">
                      <h3 class="help-title">
                        Need Help?
                      </h3>
                      <ul class="help-list">
                        <li>• If you didn't create this account, you can safely ignore this email</li>
                        <li>• Make sure to check your spam/junk folder</li>
                        <li>• Contact support if you continue to have issues</li>
                      </ul>
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                      <p class="footer-text">
                        This email was sent from iAyos
                      </p>
                      <p class="footer-text">
                        © 2025 iAyos. All rights reserved.
                      </p>
                    </div>

                    <!-- Backup Login Link -->
                    <div class="login-link-section">
                      <p class="login-text">
                        Already verified? 
                        <a href="/auth/login" class="login-link">
                          Sign in to your account
                        </a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}

/**
 * Alternative function name for backward compatibility
 * @deprecated Use generateVerificationEmailHTML instead
 */
export const EmailTemplate = generateVerificationEmailHTML;

/**
 * Forgot Password Email Template Generator
 *
 * This TypeScript function generates a complete HTML email template
 * for password reset purposes. It creates a responsive, styled
 * HTML email that can be sent via email services when users request
 * a password reset.
 *
 * @param resetLink - The unique password reset URL for the user
 * @returns Complete HTML string ready to be sent as email content
 */

interface PasswordResetTemplateProps {
  resetLink: string;
}

export function generatePasswordResetEmailHTML({
  resetLink,
}: PasswordResetTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - iAyos</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div style="max-width: 390px; width: 100%; margin: 0 auto; padding: 32px; text-align: center;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 390px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    
                    <!-- Header Section -->
                    <div style="margin-bottom: 32px;">
                      <h1 style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">iAyos</h1>
                      <p style="font-size: 14px; color: #6b7280; margin: 0;">May sira? May iAyos.</p>
                    </div>

                    <!-- Icon Section -->
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 24px auto; display: flex; align-items: center; justify-content: center; font-size: 24px; line-height: 48px;">
                      🔑
                    </div>

                    <!-- Main Content -->
                    <h2 style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 12px 0; text-align: center;">Reset Your Password</h2>
                    
                    <p style="font-size: 16px; color: #4b5563; text-align: center; line-height: 1.625; margin: 0 0 24px 0;">
                      We received a request to reset your password for your <span style="font-weight: 600; color: #f59e0b;">iAyos</span> account. Click the button below to create a new password.
                    </p>

                    <!-- Security Notice -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #fbbf24; padding: 16px; margin-bottom: 24px; text-align: left;">
                      <p style="font-size: 14px; color: #92400e; margin: 0;">
                        <span style="font-weight: 600;">🔒 Security Notice:</span> For your protection, this link will expire in 15 minutes. If you didn't request this password reset, you can safely ignore this email.
                      </p>
                    </div>

                    <!-- Reset Button -->
                    <div style="margin-bottom: 24px;">
                      <a href="${resetLink}" style="display: inline-block; min-width: 200px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white !important; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none; text-align: center; font-size: 16px; box-shadow: 0 4px 12px rgba(31, 41, 55, 0.2);">
                        Reset My Password
                      </a>
                    </div>

                    <!-- Alternative Method -->
                    <div style="margin-bottom: 32px; width: 100%;">
                      <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0 0 12px 0;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; word-break: break-all;">
                        <span style="font-size: 12px; color: #2563eb;">${resetLink}</span>
                      </div>
                    </div>

                    <!-- Help Section -->
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; width: 100%; margin-bottom: 24px; text-align: left;">
                      <h3 style="font-size: 14px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">Need Help?</h3>
                      <ul style="list-style: none; font-size: 14px; color: #4b5563; margin: 0; padding: 0;">
                        <li style="margin-bottom: 4px;">• Password must be at least 6 characters</li>
                        <li style="margin-bottom: 4px;">• Use a mix of letters, numbers, and symbols</li>
                        <li style="margin-bottom: 4px;">• Don't use personal information</li>
                      </ul>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">
                        This email was sent from iAyos
                      </p>
                      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">
                        © 2025 iAyos. All rights reserved.
                      </p>
                    </div>

                    <!-- Login Link -->
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                      <p style="font-size: 14px; color: #6b7280; margin: 0;">
                        Remember your password? 
                        <a href="/auth/login" style="color: #2563eb; text-decoration: none; font-weight: 600;">
                          Sign in to your account
                        </a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}
