import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | iAyos",
  description:
    "Terms of Service for iAyos — the marketplace platform for blue-collar services in the Philippines.",
};

export default function TermsOfServicePage() {
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
            href="/privacy"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 italic mb-10">
          Last updated: December 9, 2025
        </p>

        <Section title="1. Agreement to Terms">
          <p>
            By accessing and using iAyos (&quot;the Platform&quot;), you accept
            and agree to be bound by the terms and provisions of this agreement.
            If you do not agree to these terms, please do not use the Platform.
          </p>
          <p>
            iAyos is a marketplace platform connecting clients with skilled
            blue-collar workers in the Philippines. We facilitate connections but
            are not responsible for the actual services provided.
          </p>
        </Section>

        <Section title="2. User Eligibility">
          <p>To use iAyos, you must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>
              Have the legal capacity to enter into binding contracts
            </li>
            <li>
              Provide accurate and complete registration information
            </li>
            <li>
              Be a resident of the Philippines or legally authorized to work in
              the Philippines (for workers)
            </li>
            <li>Comply with all local, national, and international laws</li>
          </ul>
        </Section>

        <Section title="3. Account Registration and Security">
          <p>
            <strong>Registration:</strong> You must create an account to use
            certain features. You agree to provide accurate, current, and
            complete information during registration.
          </p>
          <p>
            <strong>Account Security:</strong> You are responsible for
            maintaining the confidentiality of your account credentials. You
            agree to notify us immediately of any unauthorized use of your
            account.
          </p>
          <p>
            <strong>Account Types:</strong> Users can register as Clients
            (seeking services), Workers (providing services), or Agencies
            (managing multiple workers).
          </p>
        </Section>

        <Section title="4. User Conduct and Responsibilities">
          <p>You agree NOT to:</p>
          <ul>
            <li>Provide false, misleading, or fraudulent information</li>
            <li>Use the Platform for illegal activities</li>
            <li>Harass, abuse, or harm other users</li>
            <li>
              Circumvent or manipulate the Platform&apos;s fee structure
            </li>
            <li>
              Post inappropriate, offensive, or discriminatory content
            </li>
            <li>
              Attempt to gain unauthorized access to the Platform
            </li>
            <li>Use automated systems (bots) without authorization</li>
            <li>
              Solicit users to transact outside the Platform to avoid fees
            </li>
          </ul>
        </Section>

        <Section title="5. Services and Marketplace">
          <p>
            <strong>For Clients:</strong> You can post job requests, review
            worker applications, hire workers, and pay for services through the
            Platform. You are responsible for providing accurate job descriptions
            and requirements.
          </p>
          <p>
            <strong>For Workers:</strong> You can browse available jobs, submit
            applications, and complete work assignments. You represent that you
            have the skills and qualifications stated in your profile.
          </p>
          <p>
            <strong>Platform Role:</strong> iAyos acts as an intermediary and
            does not employ workers or guarantee the quality of services. We are
            not party to the actual service agreements between clients and
            workers.
          </p>
        </Section>

        <Section title="6. Payment Terms">
          <p>
            <strong>Escrow System:</strong> iAyos uses a secure escrow system.
            Clients pay a 50% downpayment when hiring a worker, which is held in
            escrow until job completion.
          </p>
          <p>
            <strong>Platform Fee:</strong> A 10% platform fee is applied to all
            transactions. This fee supports Platform operations, security, and
            customer support.
          </p>
          <p>
            <strong>Payment Methods:</strong> We accept GCash, wallet deposits,
            and cash payments (with admin verification). All payments are
            processed securely through our payment partner.
          </p>
          <p>
            <strong>Worker Earnings:</strong> Workers receive payment after
            successful job completion and client approval. Funds are transferred
            to worker wallets and can be withdrawn.
          </p>
          <p>
            <strong>Refunds:</strong> Refund eligibility is determined on a
            case-by-case basis. See our Dispute Resolution section for details.
          </p>
        </Section>

        <Section title="7. Job Completion and Disputes">
          <p>
            <strong>Two-Phase Completion:</strong> Jobs require both worker and
            client confirmation before being marked complete. This ensures
            mutual satisfaction.
          </p>
          <p>
            <strong>Backjob System:</strong> If a client is unsatisfied with
            completed work, they may request a &quot;backjob&quot; (remedial
            work) through the Platform. Workers must complete approved backjobs
            at no additional cost.
          </p>
          <p>
            <strong>Dispute Resolution:</strong> Disputes are reviewed by iAyos
            administrators. We reserve the right to make final decisions on fund
            distribution in disputed cases.
          </p>
        </Section>

        <Section title="8. KYC Verification">
          <p>
            To ensure Platform safety, we require Know Your Customer (KYC)
            verification for:
          </p>
          <ul>
            <li>All workers before they can apply for jobs</li>
            <li>Agency owners and their employees</li>
            <li>Clients making high-value transactions</li>
          </ul>
          <p>
            KYC requires government-issued ID and may include selfie
            verification. We store this data securely and use it only for
            verification purposes.
          </p>
        </Section>

        <Section title="9. Reviews and Ratings">
          <p>
            After job completion, both parties can leave reviews and ratings.
            Reviews must be honest, accurate, and not contain offensive content.
            We reserve the right to remove reviews that violate our Community
            Guidelines.
          </p>
        </Section>

        <Section title="10. Intellectual Property">
          <p>
            The iAyos Platform, including its design, features, and content, is
            owned by iAyos and protected by copyright and trademark laws. You
            may not copy, modify, or distribute our content without permission.
          </p>
          <p>
            <strong>User Content:</strong> By posting content (profiles, job
            descriptions, photos), you grant iAyos a non-exclusive license to
            use, display, and distribute this content on the Platform.
          </p>
        </Section>

        <Section title="11. Privacy and Data Protection">
          <p>
            Your privacy is important to us. Our collection and use of personal
            information is governed by our{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            . By using iAyos, you consent to our data practices as described in
            the Privacy Policy.
          </p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>iAyos is not liable for:</p>
          <ul>
            <li>
              Quality, safety, legality, or timing of services provided by
              workers
            </li>
            <li>Actions, conduct, or content of Platform users</li>
            <li>
              Property damage or personal injury resulting from services
            </li>
            <li>Unauthorized access to your account</li>
            <li>Platform interruptions or technical errors</li>
          </ul>
          <p>
            Our total liability to you for any claims shall not exceed the
            amount of fees you paid to iAyos in the past 12 months.
          </p>
        </Section>

        <Section title="13. Indemnification">
          <p>
            You agree to indemnify and hold harmless iAyos, its officers,
            employees, and partners from any claims, damages, losses, or
            expenses arising from your use of the Platform, violation of these
            Terms, or infringement of any rights of another party.
          </p>
        </Section>

        <Section title="14. Termination">
          <p>
            We reserve the right to suspend or terminate your account at any
            time for:
          </p>
          <ul>
            <li>Violation of these Terms of Service</li>
            <li>Fraudulent or illegal activity</li>
            <li>Failure to maintain account security</li>
            <li>Repeated complaints from other users</li>
          </ul>
          <p>
            You may terminate your account at any time by contacting support.
            Upon termination, your wallet balance will be made available for
            withdrawal within 30 days.
          </p>
        </Section>

        <Section title="15. Modifications to Terms">
          <p>
            iAyos reserves the right to modify these Terms at any time. We will
            notify users of significant changes via email or in-app
            notification. Continued use of the Platform after changes
            constitutes acceptance of the modified Terms.
          </p>
        </Section>

        <Section title="16. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the Republic of the Philippines. Any disputes arising
            from these Terms shall be subject to the exclusive jurisdiction of
            Philippine courts.
          </p>
        </Section>

        <Section title="17. Contact Information">
          <p>
            For questions about these Terms of Service, please contact us at:
          </p>
          <div className="pl-4 space-y-1">
            <p className="text-blue-600">Email: support@iayos.ph</p>
            <p className="text-blue-600">Phone: +63 XXX XXX XXXX</p>
            <p className="text-blue-600">
              Address: Zamboanga City, Philippines
            </p>
          </div>
        </Section>

        {/* Acknowledgment */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 mt-10 mb-8 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-gray-700 leading-relaxed">
            By using iAyos, you acknowledge that you have read, understood, and
            agree to be bound by these Terms of Service.
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
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-blue-600 font-medium"
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
