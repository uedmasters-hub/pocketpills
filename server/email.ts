import { Resend } from "resend";

function resolveFromAddress(): string {
  const from = (process.env.RESEND_FROM || "").trim();
  if (from) return from;
  // Resend test sender — only delivers to the account owner until a domain is verified.
  return "PocketPills Preview <onboarding@resend.dev>";
}

function friendlyResendError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("only send testing emails") ||
    lower.includes("verify a domain") ||
    lower.includes("testing email")
  ) {
    return "Magic links can only be sent to your Resend account email until a sending domain is verified. Add and verify a domain at resend.com/domains, then set RESEND_FROM on Vercel to an address on that domain (e.g. PocketPills Preview <access@yourdomain.com>).";
  }
  if (lower.includes("invalid `to`") || lower.includes("invalid to")) {
    return "That email address can’t receive mail from the current Resend setup. Use your Resend account email, or verify a domain to send to anyone.";
  }
  return message || "Failed to send magic link email";
}

export async function sendMagicLinkEmail(opts: {
  to: string;
  magicUrl: string;
  expiresMinutes: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const from = resolveFromAddress();
  const usingTestSender = /@resend\.dev>?$/i.test(from) || from.includes("onboarding@resend.dev");

  if (usingTestSender && process.env.VERCEL_ENV === "production") {
    console.warn(
      "[access] RESEND_FROM still uses resend.dev — outbound mail is limited to the Resend account owner. Verify a domain and set RESEND_FROM for all recipients.",
    );
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: "Your PocketPills preview access link",
    html: magicLinkHtml(opts),
    text: [
      "Your PocketPills preview access link",
      "",
      `Open this link to continue (valid for ${opts.expiresMinutes} minutes):`,
      opts.magicUrl,
      "",
      "If you didn’t request this, you can ignore this email.",
      "",
      "— Ramesh · PocketPills assessment preview",
    ].join("\n"),
  });

  if (error) {
    throw new Error(friendlyResendError(error.message || ""));
  }
}

function magicLinkHtml(opts: { magicUrl: string; expiresMinutes: number }): string {
  const { magicUrl, expiresMinutes } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Preview access</title>
</head>
<body style="margin:0;padding:0;background:#F5F4F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E8E2F0;box-shadow:0 16px 48px rgba(40,24,72,0.06);">
          <tr>
            <td style="background:#3A2A5C;padding:28px 32px;">
              <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#C4B5E0;">PocketPills</p>
              <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;font-weight:600;color:#ffffff;">Your preview access is ready</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#3A2A5C;">
                Thanks for taking the time to explore this work. Tap the button below to open the temporary assessment preview.
              </p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.5;color:#8A8399;">
                This link expires in <strong style="color:#3A2A5C;">${expiresMinutes} minutes</strong>. After that, you can request a new one with the same email.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:999px;background:#3A2A5C;">
                    <a href="${magicUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Open preview →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#9A8BAF;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;color:#5B4578;">
                <a href="${magicUrl}" style="color:#5B4578;">${magicUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="border-top:1px solid #E8E2F0;padding-top:20px;">
                <p style="margin:0;font-size:12px;line-height:1.55;color:#9A8BAF;">
                  This is a temporary assessment project and will be removed soon. If you didn’t request access, you can ignore this email. Questions? Reach Ramesh at
                  <a href="tel:+919538000060" style="color:#5B4578;text-decoration:none;">+91 95380 00060</a>.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
