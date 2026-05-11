import { createTransport, type Transporter } from "nodemailer";
import { env } from "../config/env.js";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  if (transporter) return transporter;
  if (!env.EMAIL_SERVER_HOST || !env.EMAIL_SERVER_USER || !env.EMAIL_SERVER_PASSWORD) return null;

  transporter = createTransport({
    host: env.EMAIL_SERVER_HOST,
    port: env.EMAIL_SERVER_PORT,
    secure: env.EMAIL_SERVER_PORT === 465,
    auth: {
      user: env.EMAIL_SERVER_USER,
      pass: env.EMAIL_SERVER_PASSWORD,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  const transport = getTransport();

  // Dev mode: no SMTP configured, print to console
  if (!transport) {
    console.log("\n─── EMAIL (no SMTP configured, printing to console) ───");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.replace(/<[^>]*>/g, "")}`);
    console.log("───────────────────────────────────────────────────────\n");
    return true;
  }

  try {
    await transport.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

export function resetPasswordEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "FORGE — Reset your password",
    html: `
      <div style="font-family: monospace; background: #08080A; color: #EAEAEC; padding: 40px 24px; max-width: 480px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 32px;">
          <div style="width: 28px; height: 28px; background: #D4FF00; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; color: #08080A;">F</div>
          <span style="font-weight: 900; font-size: 18px;">FORGE</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px;">Reset your password</h2>
        <p style="color: #6B6B75; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #D4FF00; color: #08080A; font-weight: 900; font-size: 14px; text-decoration: none; border-radius: 8px;">
          RESET PASSWORD
        </a>
        <p style="color: #45454D; font-size: 11px; margin-top: 32px; line-height: 1.5;">
          If you didn't request this, ignore this email. Your password won't change.
        </p>
      </div>
    `,
  };
}
