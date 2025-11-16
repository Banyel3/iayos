/**
 * FAQ Data
 *
 * Categorized frequently asked questions for the iAyos mobile app
 */

export interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
}

export const FAQ_CATEGORIES = [
  "All",
  "Account",
  "Jobs",
  "Payments",
  "Technical",
  "Safety",
] as const;

export const FAQS: FAQ[] = [
  // Account FAQs
  {
    id: 1,
    category: "Account",
    question: "How do I create an account?",
    answer:
      "You can create an account by downloading the iAyos mobile app and tapping 'Sign Up'. Enter your email, create a password, and follow the verification steps. You'll need to verify your email address before accessing all features.",
  },
  {
    id: 2,
    category: "Account",
    question: "I forgot my password. What should I do?",
    answer:
      "On the login screen, tap 'Forgot Password'. Enter your registered email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
  },
  {
    id: 3,
    category: "Account",
    question: "How do I verify my account?",
    answer:
      "After registration, check your email for a verification link. Click the link to verify your email address. For KYC verification (required for workers), go to Profile > KYC Verification and upload your valid ID and other required documents.",
  },
  {
    id: 4,
    category: "Account",
    question: "Can I change my profile information?",
    answer:
      "Yes! Go to Profile tab, tap 'Edit Profile', and update your information including name, contact number, bio, skills, and profile picture. Make sure to save your changes.",
  },
  {
    id: 5,
    category: "Account",
    question: "How do I delete my account?",
    answer:
      "Go to Settings > Danger Zone > Delete Account. Please note that this action is permanent and cannot be undone. All your data, jobs, and transaction history will be permanently deleted.",
  },

  // Jobs FAQs
  {
    id: 6,
    category: "Jobs",
    question: "How do I find jobs?",
    answer:
      "Workers can browse available jobs in the 'Jobs' tab. Use the search bar, filter by category, urgency level, or location. You can also save jobs for later by tapping the heart icon.",
  },
  {
    id: 7,
    category: "Jobs",
    question: "How do I apply for a job?",
    answer:
      "Open a job listing, review the details, and tap 'Apply Now'. You can include a custom message to the client. Your application will be sent immediately, and you'll be notified if the client accepts.",
  },
  {
    id: 8,
    category: "Jobs",
    question: "Can I withdraw my job application?",
    answer:
      "Yes, you can withdraw your application before the client accepts it. Go to 'My Applications', find the job, and tap 'Withdraw Application'. Once accepted, you cannot withdraw.",
  },
  {
    id: 9,
    category: "Jobs",
    question: "How do I post a job as a client?",
    answer:
      "Clients can post jobs by going to the 'Post Job' screen. Fill in the job details including title, description, category, budget, location, and expected duration. Review and submit your job posting.",
  },
  {
    id: 10,
    category: "Jobs",
    question: "What happens after I apply for a job?",
    answer:
      "The client will review your application along with others. If accepted, you'll receive a notification and the job will appear in your 'Active Jobs'. You can then start working and communicate with the client.",
  },
  {
    id: 11,
    category: "Jobs",
    question: "How do I mark a job as complete?",
    answer:
      "When you finish the work, go to the job details and tap 'Mark as Complete'. Upload photos of your completed work if required. The client will then review and approve the completion.",
  },
  {
    id: 12,
    category: "Jobs",
    question: "What if the client doesn't approve completion?",
    answer:
      "If there's a dispute, you can initiate a dispute resolution process. Go to the job details and tap 'Report Issue'. Our support team will review the case and help resolve it fairly.",
  },

  // Payments FAQs
  {
    id: 13,
    category: "Payments",
    question: "How does payment work?",
    answer:
      "iAyos uses an escrow system. Clients pay 50% upfront (held in escrow) and 50% upon job completion. Workers receive payment after completing the job and client approval. This protects both parties.",
  },
  {
    id: 14,
    category: "Payments",
    question: "What payment methods are accepted?",
    answer:
      "We accept GCash, bank transfers, and cash payments. For cash payments, you'll need to upload proof of payment for verification. Digital payments are processed instantly.",
  },
  {
    id: 15,
    category: "Payments",
    question: "How do I add funds to my wallet?",
    answer:
      "Go to Wallet > Add Funds. Choose your payment method (GCash or bank transfer), enter the amount, and follow the payment instructions. Funds are usually added within minutes for digital payments.",
  },
  {
    id: 16,
    category: "Payments",
    question: "How do I withdraw my earnings?",
    answer:
      "Go to Wallet > Withdraw. Enter your bank account details or GCash number, specify the amount, and submit. Withdrawals are processed within 1-3 business days.",
  },
  {
    id: 17,
    category: "Payments",
    question: "Are there any fees?",
    answer:
      "iAyos charges a 5% platform fee on completed jobs. This fee covers payment processing, support, and platform maintenance. There are no hidden charges.",
  },
  {
    id: 18,
    category: "Payments",
    question: "When do I get paid?",
    answer:
      "Workers receive the final 50% payment immediately after the client approves job completion. The escrowed 50% is also released at this time. Payments are credited to your wallet instantly.",
  },
  {
    id: 19,
    category: "Payments",
    question: "Can I get a refund?",
    answer:
      "Refunds are processed if a job is cancelled before work begins or if there's a verified dispute in your favor. Refund processing times vary by payment method (instant for wallet, 3-7 days for bank/GCash).",
  },
  {
    id: 20,
    category: "Payments",
    question: "How do I view my transaction history?",
    answer:
      "Go to the Wallet tab and scroll down to 'Transaction History'. You can filter by transaction type (deposits, payments, withdrawals) and view details for each transaction.",
  },

  // Technical FAQs
  {
    id: 21,
    category: "Technical",
    question: "The app is not loading. What should I do?",
    answer:
      "First, check your internet connection. Try closing and reopening the app. If the problem persists, clear the app cache in Settings > Data & Storage > Clear Cache. Restart your device if needed.",
  },
  {
    id: 22,
    category: "Technical",
    question: "I'm not receiving notifications",
    answer:
      "Check that notifications are enabled in your device settings and in the app (Settings > Preferences > Notifications). Make sure you have a stable internet connection and the app is up to date.",
  },
  {
    id: 23,
    category: "Technical",
    question: "How do I update the app?",
    answer:
      "Visit the App Store (iOS) or Google Play Store (Android), search for 'iAyos', and tap 'Update' if available. Enable automatic updates in your store settings to always have the latest version.",
  },
  {
    id: 24,
    category: "Technical",
    question: "Why can't I upload photos?",
    answer:
      "Ensure you've granted camera and photo library permissions to the app in your device settings. Check that you have sufficient storage space. Photos should be under 10MB each.",
  },
  {
    id: 25,
    category: "Technical",
    question: "The app keeps crashing. How can I fix it?",
    answer:
      "Try clearing the app cache, updating to the latest version, and restarting your device. If the issue continues, uninstall and reinstall the app. Contact support if the problem persists.",
  },

  // Safety FAQs
  {
    id: 26,
    category: "Safety",
    question: "How do I report suspicious activity?",
    answer:
      "If you encounter suspicious behavior, go to the user's profile or job listing and tap 'Report'. Describe the issue in detail. Our team reviews all reports within 24 hours.",
  },
  {
    id: 27,
    category: "Safety",
    question: "How does iAyos verify workers?",
    answer:
      "All workers must complete KYC verification by uploading a valid government ID. Our team manually reviews each submission. Verified workers have a blue checkmark badge on their profile.",
  },
  {
    id: 28,
    category: "Safety",
    question: "What should I do if I feel unsafe?",
    answer:
      "Your safety is our priority. If you feel unsafe during a job, leave immediately and contact local authorities if necessary. Then report the incident to our support team with as much detail as possible.",
  },
  {
    id: 29,
    category: "Safety",
    question: "How can I avoid scams?",
    answer:
      "Never share personal information outside the app. Don't accept payment requests outside the platform. Check worker reviews and ratings. Report any suspicious requests for upfront payments or personal details.",
  },
  {
    id: 30,
    category: "Safety",
    question: "Is my personal information secure?",
    answer:
      "Yes. We use bank-level encryption to protect your data. Your payment information is never stored on our servers. We never share your personal information with third parties without your consent.",
  },
];
