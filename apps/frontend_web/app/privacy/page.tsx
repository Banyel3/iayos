import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | iAyos",
  description:
    "Privacy Policy for iAyos — learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            iAyos
          </Link>
          <Link
            href="/terms"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 italic mb-10">
          Last updated: December 9, 2025
        </p>

        <div className="mb-10 pb-8 border-b border-gray-200 space-y-3">
          <p className="text-[15px] text-gray-700 leading-relaxed">
            At iAyos, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our application and services.
          </p>
          <p className="text-[15px] text-gray-700 leading-relaxed">
            Please read this policy carefully. By using iAyos, you agree to the
            collection and use of information in accordance with this policy.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            1.1 Personal Information
          </h3>
          <p>When you register and use iAyos, we collect:</p>
          <ul>
            <li>Full name, email address, and phone number</li>
            <li>Profile photos and avatar images</li>
            <li>Government-issued ID for KYC verification</li>
            <li>Selfie photos for identity verification</li>
            <li>
              Work skills, certifications, and qualifications (for workers)
            </li>
            <li>Business information (for agencies)</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            1.2 Location Information
          </h3>
          <p>We collect your precise location data when you:</p>
          <ul>
            <li>Enable location services in the app</li>
            <li>
              Post job requests (to match with nearby workers)
            </li>
            <li>Browse available jobs as a worker</li>
          </ul>
          <p>
            Location data helps us provide relevant job matches based on
            proximity. You can disable location access in your device settings,
            but this may limit certain features.
          </p>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            1.3 Payment Information
          </h3>
          <p>For payment processing, we collect:</p>
          <ul>
            <li>GCash account information</li>
            <li>Wallet transaction history</li>
            <li>
              Payment method details (stored securely via our payment processor)
            </li>
            <li>Bank account information for withdrawals</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            1.4 Usage Data
          </h3>
          <p>
            We automatically collect certain information when you use iAyos:
          </p>
          <ul>
            <li>
              Device information (model, OS version, unique identifiers)
            </li>
            <li>IP address and browser type</li>
            <li>App usage statistics and feature interactions</li>
            <li>Crash reports and performance data</li>
            <li>Pages visited and time spent on the Platform</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            1.5 User-Generated Content
          </h3>
          <p>We store content you create on the Platform:</p>
          <ul>
            <li>Job descriptions and requirements</li>
            <li>Job applications and proposals</li>
            <li>Messages and communications with other users</li>
            <li>Reviews and ratings</li>
            <li>Portfolio images and work samples</li>
            <li>Dispute evidence (photos and descriptions)</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Create and manage your account</li>
            <li>
              Facilitate job postings and worker-client matching
            </li>
            <li>Process payments and manage your wallet</li>
            <li>Verify your identity through KYC processes</li>
            <li>
              Send notifications about jobs, applications, and messages
            </li>
            <li>Provide customer support and resolve disputes</li>
            <li>Improve Platform features and user experience</li>
            <li>
              Detect and prevent fraud, abuse, and security incidents
            </li>
            <li>
              Comply with legal obligations and enforce our Terms of Service
            </li>
            <li>Send marketing communications (with your consent)</li>
            <li>
              Analyze usage patterns and generate aggregate statistics
            </li>
          </ul>
        </Section>

        <Section title="3. How We Share Your Information">
          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            3.1 With Other Users
          </h3>
          <p>
            When you use iAyos, certain information is visible to other users:
          </p>
          <ul>
            <li>
              Workers: Profile photo, name, skills, ratings, location
              (city/barangay)
            </li>
            <li>
              Clients: Name, profile photo, ratings, job history (for hired
              workers)
            </li>
            <li>
              Messages are visible only to conversation participants
            </li>
          </ul>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            3.2 With Service Providers
          </h3>
          <p>
            We share data with trusted third-party service providers who help us
            operate the Platform:
          </p>
          <ul>
            <li>PayMongo (payment processing)</li>
            <li>Supabase (file storage for images and documents)</li>
            <li>
              Cloud hosting providers (AWS, Google Cloud, or similar)
            </li>
            <li>Email service providers (for transactional emails)</li>
            <li>Analytics providers (to improve app performance)</li>
          </ul>
          <p>
            These providers are contractually obligated to protect your data and
            use it only for specified purposes.
          </p>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            3.3 For Legal Reasons
          </h3>
          <p>
            We may disclose your information if required by law or in response
            to:
          </p>
          <ul>
            <li>
              Legal process (subpoenas, court orders, government requests)
            </li>
            <li>
              Investigations of potential violations of our Terms
            </li>
            <li>
              Protection of rights, property, or safety of iAyos, users, or the
              public
            </li>
            <li>Compliance with Philippine laws and regulations</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            3.4 Business Transfers
          </h3>
          <p>
            In the event of a merger, acquisition, or sale of assets, your
            information may be transferred to the acquiring entity. We will
            notify you of any such change.
          </p>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
            3.5 With Your Consent
          </h3>
          <p>
            We may share your information with other parties when you explicitly
            consent, such as when you choose to share your profile publicly or
            participate in promotional campaigns.
          </p>
        </Section>

        <Section title="4. Data Security">
          <p>
            We implement industry-standard security measures to protect your
            information:
          </p>
          <ul>
            <li>Encryption of data in transit (HTTPS/TLS)</li>
            <li>
              Secure storage of sensitive data (KYC documents, payment info)
            </li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>
              Access controls limiting employee access to personal data
            </li>
            <li>
              Two-factor authentication options for account protection
            </li>
          </ul>
          <p>
            However, no method of transmission or storage is 100% secure. While
            we strive to protect your data, we cannot guarantee absolute
            security.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your information for as long as necessary to provide our
            services and comply with legal obligations:
          </p>
          <ul>
            <li>
              Account data: Until you delete your account, plus 30 days
            </li>
            <li>
              Transaction records: 7 years (for financial compliance)
            </li>
            <li>
              KYC documents: 5 years after account closure (legal requirement)
            </li>
            <li>
              Messages and content: Until deletion by user or account closure
            </li>
            <li>Usage logs: 90 days</li>
          </ul>
          <p>
            After these periods, we securely delete or anonymize your data
            unless retention is required by law.
          </p>
        </Section>

        <Section title="6. Your Privacy Rights">
          <p>
            Under the Philippine Data Privacy Act of 2012, you have the
            following rights:
          </p>
          <ul>
            <li>
              <strong>Access:</strong> Request a copy of your personal data we
              hold
            </li>
            <li>
              <strong>Correction:</strong> Update or correct inaccurate
              information
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your account and
              data
            </li>
            <li>
              <strong>Objection:</strong> Object to certain uses of your data
              (e.g., marketing)
            </li>
            <li>
              <strong>Portability:</strong> Receive your data in a structured,
              machine-readable format
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Revoke consent for non-essential
              data processing
            </li>
          </ul>
          <p>
            To exercise these rights, contact us at privacy@iayos.ph. We will
            respond within 15 business days.
          </p>
        </Section>

        <Section title="7. Children&apos;s Privacy">
          <p>
            iAyos is not intended for users under 18 years old. We do not
            knowingly collect personal information from children. If we discover
            that a child has provided us with personal information, we will
            delete it immediately. Parents or guardians who believe their child
            has provided information should contact us.
          </p>
        </Section>

        <Section title="8. Location Data and Permissions">
          <p>
            <strong>Location Tracking:</strong> We use your location to match
            clients with nearby workers and show relevant job opportunities.
            Location data is collected only when the app is in use (not in the
            background).
          </p>
          <p>
            <strong>Disabling Location:</strong> You can disable location access
            in your device settings. However, this will limit job matching
            features and may affect user experience.
          </p>
          <p>
            <strong>Other Permissions:</strong> The app may request permissions
            for camera (profile photos, KYC verification), storage (document
            uploads), and notifications (job alerts). You can manage these in
            your device settings.
          </p>
        </Section>

        <Section title="9. Cookies and Tracking Technologies">
          <p>
            The iAyos web and mobile platforms use the following technologies:
          </p>
          <ul>
            <li>Session tokens and HTTP-only cookies for authentication</li>
            <li>Local storage for app preferences and cached data</li>
            <li>
              Analytics SDKs to track usage (anonymized when possible)
            </li>
            <li>Crash reporting tools to improve stability</li>
          </ul>
          <p>
            You can opt out of analytics tracking in the app settings.
          </p>
        </Section>

        <Section title="10. International Data Transfers">
          <p>
            Your data is primarily stored and processed in the Philippines.
            However, some service providers (e.g., cloud hosting, payment
            processors) may transfer data to servers in other countries. We
            ensure that such transfers comply with Philippine data protection
            laws and that appropriate safeguards are in place.
          </p>
        </Section>

        <Section title="11. Marketing Communications">
          <p>
            We may send you promotional emails, push notifications, or SMS
            messages about:
          </p>
          <ul>
            <li>New features and platform updates</li>
            <li>Special offers and promotions</li>
            <li>Tips for using iAyos effectively</li>
          </ul>
          <p>You can opt out of marketing communications at any time by:</p>
          <ul>
            <li>Clicking &quot;Unsubscribe&quot; in emails</li>
            <li>Disabling push notifications in app settings</li>
            <li>Replying &quot;STOP&quot; to SMS messages</li>
          </ul>
          <p>
            Note: You cannot opt out of transactional messages (e.g., payment
            confirmations, security alerts).
          </p>
        </Section>

        <Section title="12. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes via:
          </p>
          <ul>
            <li>Email to your registered address</li>
            <li>In-app notification</li>
            <li>Notice on the app&apos;s settings page</li>
          </ul>
          <p>
            The &quot;Last Updated&quot; date at the top of this policy will
            reflect the most recent version. We encourage you to review this
            policy periodically.
          </p>
        </Section>

        <Section title="13. Contact Us">
          <p>
            If you have questions or concerns about this Privacy Policy or our
            data practices, please contact us:
          </p>
          <div className="pl-4 space-y-1">
            <p className="text-blue-600">Email: privacy@iayos.ph</p>
            <p className="text-blue-600">Phone: +63 XXX XXX XXXX</p>
            <p className="text-blue-600">
              Mailing Address:
              <br />
              iAyos Data Privacy Officer
              <br />
              Zamboanga City, Philippines
            </p>
          </div>
        </Section>

        <Section title="14. Data Privacy Officer">
          <p>
            As required by the Philippine Data Privacy Act, we have designated a
            Data Privacy Officer (DPO) to oversee compliance with data
            protection laws. You can contact our DPO at dpo@iayos.ph for
            privacy-related inquiries.
          </p>
        </Section>

        {/* Acknowledgment */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-10 mb-8 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-gray-700 leading-relaxed">
            Your privacy is important to us. We are committed to protecting your
            personal information and using it responsibly to provide you with
            the best possible service.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} iAyos. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-blue-600 font-medium"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3 text-gray-700 leading-relaxed [&>p]:text-[15px] [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul>li]:text-[15px] [&>ul>li]:text-gray-700">
        {children}
      </div>
    </section>
  );
}
