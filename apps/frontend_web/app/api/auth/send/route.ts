import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { sendEmailWithResend } from "@/lib/resend-email";
import { z } from "zod";
import { generateVerificationEmailHTML } from "@/components/auth/verification/verification_email";

const verifySchema = z.object({
  email: z.email(),
  verifyLink: z.string().url(),
  verifyLinkExpire: z.string(), // since Django sends ISO string
});
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📧 Email request body:", body);

    const parsed = verifySchema.parse(body);
    const template = generateVerificationEmailHTML({
      verificationLink: parsed.verifyLink,
    });

    console.log("📧 Sending email to:", parsed.email);
    console.log("📧 Email template length:", template.length);

    // Try Resend API first (more reliable)
    try {
      const emailResult = await sendEmailWithResend(
        parsed.email,
        "Email Verification",
        template
      );
      console.log("📧 Email sent successfully via Resend API:", emailResult);

      // If result didn't include an id, log and treat as error so we don't return a false success
      if (!emailResult || !("id" in emailResult)) {
        console.error("📧 Resend returned no id, raw result:", emailResult);
        return NextResponse.json(
          {
            success: false,
            error: "Resend returned unexpected response",
            raw:
              process.env.NODE_ENV === "development" ? emailResult : undefined,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        messageId: (emailResult as any).id,
        method: "resend-api",
      });
    } catch (resendError) {
      console.error("📧 Resend API failed, trying SMTP:", resendError);

      // Fallback to SMTP
      const smtpResult = await sendEmail(
        parsed.email,
        "Email Verification",
        template
      );
      console.log("📧 Email sent successfully via SMTP:", smtpResult);
      return NextResponse.json({
        success: true,
        messageId: smtpResult.messageId,
        method: "smtp-fallback",
      });
    }
  } catch (error) {
    console.error("📧 All email methods failed:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: (error as Error).message },
      { status: 500 }
    );
  }
}
