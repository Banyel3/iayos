/**
 * Agency Email Verification Template Generator
 *
 * This TypeScript function generates a complete HTML email template
 * specifically for agency email verification purposes. It creates a
 * responsive, styled HTML email that can be sent via email services.
 *
 * @param verificationLink - The unique verification URL for the agency
 * @returns Complete HTML string ready to be sent as email content
 */

interface AgencyEmailTemplateProps {
  verificationLink: string;
  businessName?: string;
}

export function generateAgencyVerificationEmailHTML({
  verificationLink,
  businessName = "your agency",
}: AgencyEmailTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Agency Email - iAyos</title>
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
        
        .agency-highlight {
          font-weight: 600;
          color: #7c3aed;
        }
        
        .security-note {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .security-note p {
          font-size: 0.875rem;
          color: #92400e;
        }
        
        .security-note .font-semibold {
          font-weight: 600;
        }
        
        .verify-button {
          display: inline-block;
          width: auto;
          min-width: 200px;
          background-color: #7c3aed;
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
          background-color: #6d28d9 !important;
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
          color: #7c3aed;
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
        
        .help-list li::before {
          content: "• ";
          color: #7c3aed;
          font-weight: bold;
        }
        
        .footer {
          text-align: center;
          margin-top: 2rem;
        }
        
        .footer-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
        
        .footer-links {
          font-size: 0.75rem;
        }
        
        .footer-links a {
          color: #7c3aed;
          text-decoration: none;
          margin: 0 0.5rem;
        }
        
        .footer-links a:hover {
          text-decoration: underline;
        }
        
        @media only screen and (max-width: 480px) {
          .container {
            padding: 1rem;
          }
          
          .main-heading {
            font-size: 1.25rem;
          }
          
          .greeting {
            font-size: 1rem;
          }
          
          .message-card {
            padding: 1rem;
          }
          
          .verify-button {
            min-width: 100%;
            display: block;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Email Icon -->
        <div class="email-icon">
          <svg viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>
        
        <!-- Main Heading -->
        <h1 class="main-heading">Verify Your Agency Email</h1>
        
        <!-- Greeting -->
        <p class="greeting">Welcome to <span class="brand-name">iAyos</span> Agency Network!</p>
        
        <!-- Main Message Card -->
        <div class="message-card">
          <p class="message-text">
            Thank you for registering <span class="agency-highlight">${businessName}</span> with 
            <span class="brand-name">iAyos</span>. To complete your agency setup and start accessing 
            contract opportunities, please verify your business email address.
          </p>
          
          <p class="message-text">
            Click the button below to verify your agency email and activate your account:
          </p>
          
          <!-- Verification Button -->
          <a href="${verificationLink}" class="verify-button">
            Verify Agency Email
          </a>
          
          <!-- Security Note -->
          <div class="security-note">
            <p><span class="font-semibold">Security Notice:</span> This verification link will expire in 30 minutes for your security.</p>
          </div>
        </div>
        
        <!-- Alternative Link Section -->
        <div class="alternative-link">
          <p class="alternative-text">If the button doesn't work, copy and paste this link into your browser:</p>
          <div class="link-display">
            <p class="link-text">${verificationLink}</p>
          </div>
        </div>
        
        <!-- Help Section -->
        <div class="help-section">
          <p class="help-title">What happens after verification?</p>
          <ul class="help-list">
            <li>Access to your agency dashboard</li>
            <li>Browse available contract opportunities</li>
            <li>Submit proposals to potential clients</li>
            <li>Manage your agency profile and portfolio</li>
            <li>Track project progress and payments</li>
          </ul>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            This email was sent to you because you registered an agency account with iAyos.
          </p>
          <p class="footer-text">
            If you didn't create this account, please ignore this email.
          </p>
          <div class="footer-links">
            <a href="${process.env.NEXTAUTH_URL}/help">Help Center</a>
            <a href="${process.env.NEXTAUTH_URL}/contact">Contact Support</a>
            <a href="${process.env.NEXTAUTH_URL}/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
