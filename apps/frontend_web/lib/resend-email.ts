import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailWithResend(
  userEmail: string,
  subject: string,
  message: string
) {
  try {
    console.log("📧 Using Resend API to send email to:", userEmail);
    console.log("📧 API Key present:", !!process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "team@devante.online",
      to: [userEmail],
      subject: subject,
      html: message,
    });

    if (error) {
      console.error("📧 Resend API error:", error);
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    console.log("📧 Email sent successfully with Resend:", data);
    return data;
  } catch (error) {
    console.error("📧 Failed to send email with Resend:", error);
    throw error;
  }
}
