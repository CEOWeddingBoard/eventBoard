"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM || "wedding-planner@twojewesele.app";

export async function sendContractForSigningEmail(params: {
  coupleEmail: string;
  coupleName: string;
  venueName: string;
  signingUrl: string;
  contractTitle: string;
}): Promise<boolean> {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn("[contract-email] Resend API key not configured, skipping email.");
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.coupleEmail,
      subject: `${params.venueName} — Umowa do podpisu: ${params.contractTitle}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #4a5d3e;">${params.venueName}</h2>
          <p>Dzień dobry ${params.coupleName},</p>
          <p>Sala <strong>${params.venueName}</strong> przygotowała umowę do podpisu: <strong>${params.contractTitle}</strong>.</p>
          <p>Kliknij poniższy przycisk aby przejrzeć i podpisać umowę:</p>
          <a href="${params.signingUrl}"
             style="display: inline-block; background: #4a5d3e; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Podpisz umowę
          </a>
          <p style="color: #888; font-size: 13px;">Link jest ważny 30 dni od daty wysłania.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Wiadomość wygenerowana automatycznie przez Wedding Planner.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[contract-email] Failed to send signing email:", error);
    return false;
  }
}

export async function sendContractSignedNotification(params: {
  venueEmail: string;
  coupleName: string;
  contractTitle: string;
  reservationId: string;
}): Promise<boolean> {
  if (!resend || !process.env.RESEND_API_KEY) {
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.venueEmail,
      subject: `${params.coupleName} podpisał(a) umowę: ${params.contractTitle}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #4a5d3e;">Umowa podpisana</h2>
          <p><strong>${params.coupleName}</strong> podpisał(a) umowę <strong>${params.contractTitle}</strong>.</p>
          <p>Zaloguj się do panelu sali aby pobrać podpisaną umowę i złożyć swój podpis.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">Wiadomość wygenerowana automatycznie przez Wedding Planner.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[contract-email] Failed to send signed notification:", error);
    return false;
  }
}
