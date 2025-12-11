import { Resend } from "resend";

// Validate API key early to avoid silent successes with an unset key
if (!process.env.RESEND_API_KEY) {
  console.error(
    "📧 RESEND_API_KEY is not set in environment. Resend will not work without it."
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailWithResend(
  userEmail: string,
  subject: string,
  message: string
) {
  try {
    console.log("📧 Using Resend API to send email to:", userEmail);
    console.log("📧 API Key present:", !!process.env.RESEND_API_KEY);

    // Call the SDK and capture the full result. Do NOT assume a {data,error} shape
    const result = await resend.emails.send({
      from: "team@devante.online",
      to: [userEmail],
      subject: subject,
      html: message,
    });

    console.log("📧 Raw Resend response:", result);

    // The Resend SDK can return the id either at the top-level or under `data.id`.
    const id =
      (result as any)?.id ??
      (result as any)?.data?.id ??
      (result as any)?.messageId ??
      (result as any)?.message?.id;

    // Validate expected id presence
    if (!id) {
      console.error("📧 Unexpected Resend response (missing id):", result);
      throw new Error(`Unexpected Resend response: ${JSON.stringify(result)}`);
    }

    console.log("📧 Email sent successfully with Resend (id):", id);

    // Return a normalized object so callers can rely on `.id` and still inspect raw
    return { id, raw: result };
  } catch (error) {
    console.error("📧 Failed to send email with Resend:", error);
    throw error;
  }
}
