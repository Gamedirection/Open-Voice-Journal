import nodemailer from "nodemailer";

let smtpTransport = null;

export function getSmtpTransport() {
  if (smtpTransport) return smtpTransport;
  const host = String(process.env.SMTP_HOST || "").trim();
  if (!host) return null;
  smtpTransport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: process.env.SMTP_USER
      ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD || ""
      }
      : undefined
  });
  return smtpTransport;
}

export function resolveFromEmail() {
  return String(process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@open-voice-journal.local");
}

export function isEmailConfigured() {
  return Boolean(String(process.env.SMTP_HOST || "").trim());
}

export async function sendEmail({ to, subject, text, html }) {
  const transport = getSmtpTransport();
  if (!transport) {
    return { sent: false, reason: "smtp_not_configured" };
  }
  await transport.sendMail({
    from: resolveFromEmail(),
    to,
    subject,
    text,
    ...(html ? { html } : {})
  });
  return { sent: true };
}
