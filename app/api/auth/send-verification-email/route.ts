import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configure your email service here
// For Gmail: you'll need to use an App Password (not your regular password)
// See: https://support.google.com/accounts/answer/185833

// Create transporter with error handling
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.error("Email credentials not configured");
    throw new Error("Email credentials not configured in environment variables");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const { email, uid } = await request.json();

    if (!email || !uid) {
      return NextResponse.json(
        { error: "Email and UID required" },
        { status: 400 }
      );
    }

    // Generate a verification token
    const verificationToken = Buffer.from(`${uid}:${Date.now()}`).toString(
      "base64"
    );
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { color: #1a1a1a; text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #10b981; }
            .content { color: #333; line-height: 1.6; margin-bottom: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; }
            .footer { color: #666; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Armstrong Haulage</div>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>Thank you for signing up for Armstrong Haulage. Please verify your email address to complete your registration.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #10b981; font-size: 12px;">${verificationLink}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Armstrong Haulage. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create transporter
    const transporter = createTransporter();

    // Send email
    console.log(`Sending verification email to ${email}...`);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your Armstrong Haulage email address",
      html: htmlContent,
      text: `Click this link to verify your email: ${verificationLink}`,
    });

    console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);

    return NextResponse.json(
      { success: true, messageId: info.messageId },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Failed to send email:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { error: `Failed to send email: ${errorMsg}` },
      { status: 500 }
    );
  }
}
