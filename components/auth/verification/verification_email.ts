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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f9fafb;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          line-height: 1.5;
        }
        
        .container {
          max-width: 390px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        
        .email-icon {
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: #dbeafe;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .email-icon svg {
          width: 4rem;
          height: 4rem;
          color: #2563eb;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
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
          display: block;
          width: 100%;
          background-color: #2563eb;
          color: white;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          text-align: center;
          transition: background-color 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }
        
        .verify-button:hover {
          background-color: #1d4ed8;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
            padding: 1rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
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
        <a href="${verificationLink}" class="verify-button">
          Verify Email Address →
        </a>

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
