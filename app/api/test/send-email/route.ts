import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    console.log("=== EMAIL TEST DEBUG ===");
    console.log("EMAIL_USER:", emailUser ? "SET" : "NOT SET");
    console.log("EMAIL_PASSWORD:", emailPassword ? "SET (length: " + emailPassword.length + ")" : "NOT SET");

    if (!emailUser || !emailPassword) {
      return NextResponse.json(
        { 
          error: "Email credentials not configured",
          debug: {
            emailUserSet: !!emailUser,
            emailPasswordSet: !!emailPassword
          }
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Verify the transporter
    console.log("Testing transporter connection...");
    await transporter.verify();
    console.log("Transporter verification successful");

    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; }
            .header { color: #1a1a1a; text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; }
            .content { color: #333; line-height: 1.6; }
            .success { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">📧 Armstrong Haulage - Test Email</div>
            <div class="content">
              <p>This is a <span class="success">test email</span> to verify email sending is working!</p>
              <p>If you received this, the email system is configured correctly.</p>
              <p><strong>Time sent:</strong> ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending test email to ${email}...`);
    const info = await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: "Armstrong Haulage - Test Email",
      html: testHtml,
      text: "Test email from Armstrong Haulage. If you received this, email is working!",
    });

    console.log(`✅ Email sent successfully!`);
    console.log("Message ID:", info.messageId);

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully!",
      debug: {
        from: emailUser,
        to: email,
        messageId: info.messageId,
        response: info.response,
      }
    });

  } catch (error: unknown) {
    console.error("❌ Test email failed:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return NextResponse.json(
      { 
        error: `Failed to send test email: ${errorMsg}`,
        details: errorDetails,
        debug: {
          emailUser: process.env.EMAIL_USER ? "SET" : "NOT SET",
          emailPassword: process.env.EMAIL_PASSWORD ? "SET" : "NOT SET"
        }
      },
      { status: 500 }
    );
  }
}
