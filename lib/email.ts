import nodemailer from "nodemailer";

export async function sendEmail(
  userEmail: string,
  subject: string,
  message: string
) {
  const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL_FROM,
    to: userEmail,
    subject,
    html: message,
  };

  return transporter.sendMail(mailOptions);
}
