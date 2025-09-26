import nodemailer from "nodemailer";

export async function sendEmail(
  userEmail: string,
  subject: string,
  message: string
) {
  console.log("📧 Email config check:");
  console.log("- SMTP_USER:", process.env.SMTP_USER ? "✅ Set" : "❌ Missing");
  console.log("- SMTP_PASS:", process.env.SMTP_PASS ? "✅ Set" : "❌ Missing");
  console.log(
    "- SMTP_EMAIL_FROM:",
    process.env.SMTP_EMAIL_FROM ? "✅ Set" : "❌ Missing"
  );
  console.log("- Recipient:", userEmail);

  const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify transporter configuration
  try {
    await transporter.verify();
    console.log("📧 SMTP connection verified successfully");
  } catch (error) {
    console.error("📧 SMTP connection failed:", error);
    throw new Error(`SMTP connection failed: ${error}`);
  }

  const mailOptions = {
    from: process.env.SMTP_EMAIL_FROM,
    to: userEmail,
    subject,
    html: message,
  };

  console.log("📧 Sending email with options:", {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
    htmlLength: message.length,
  });

  return transporter.sendMail(mailOptions);
}
