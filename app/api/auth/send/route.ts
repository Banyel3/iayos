import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const sendEmail = async (
  userEmail: string,
  subject: string,
  message: string
) => {
  try {
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

    await transporter.sendMail(mailOptions);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something went wrong" + error,
      },
      {
        status: 500,
      }
    );
  }
};

// Add a default POST handler for the route
export async function POST() {
  return NextResponse.json(
    { message: "This is a utility module for sending emails" },
    { status: 200 }
  );
}
