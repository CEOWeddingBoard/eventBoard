const INK = "#0f172a";
const ACCENT = "#7a5f28";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

export function getPasswordResetEmailHtml(params: {
  resetUrl: string;
  expiresInMinutes: number;
}): string {
  const { resetUrl, expiresInMinutes } = params;
  return `<!doctype html>
<html lang="pl">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:${INK};">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;padding:32px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};font-weight:bold;">EventBoard</p>
      <h1 style="margin:0 0 16px;font-size:20px;">Ustaw nowe hasło</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};">
        Dostaliśmy prośbę o zmianę hasła do Twojego konta. Kliknij przycisk poniżej —
        link jest ważny ${expiresInMinutes} minut i działa tylko raz.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${resetUrl}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
          Ustaw nowe hasło
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:${MUTED};">
        Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:
      </p>
      <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:${MUTED};">${resetUrl}</p>
      <p style="margin:0;padding-top:16px;border-top:1px solid ${BORDER};font-size:12px;color:${MUTED};">
        Jeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość — hasło pozostanie bez zmian.
      </p>
    </div>
  </body>
</html>`;
}

export function getPasswordResetEmailText(params: {
  resetUrl: string;
  expiresInMinutes: number;
}): string {
  return [
    "Ustaw nowe hasło — EventBoard",
    "",
    `Link jest ważny ${params.expiresInMinutes} minut i działa tylko raz:`,
    params.resetUrl,
    "",
    "Jeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość.",
  ].join("\n");
}
