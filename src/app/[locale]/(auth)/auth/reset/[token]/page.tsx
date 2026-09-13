import Link from "next/link";
import { AuthPageShell } from "../../../auth-page-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { isPasswordResetTokenValid } from "@/lib/actions/auth.actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function PasswordResetConfirmPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const valid = await isPasswordResetTokenValid(token);

  if (!valid) {
    return (
      <AuthPageShell
        locale={locale}
        backLabel="Wróć do logowania"
        backHref={`/${locale}/sign-in`}
        title="Link wygasł"
        subtitle="Ten link do zmiany hasła jest już nieaktualny."
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-neutral-600">
            Link jest ważny godzinę i działa tylko raz. Poproś o nowy.
          </p>
          <Link
            href={`/${locale}/auth/reset`}
            className="inline-block text-sm font-semibold text-neutral-900 hover:underline"
          >
            Wyślij nowy link
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      locale={locale}
      backLabel="Wróć do logowania"
      backHref={`/${locale}/sign-in`}
      title="Ustaw nowe hasło"
      subtitle="Po zapisaniu zalogujesz się nowym hasłem."
    >
      <PasswordResetForm locale={locale} token={token} />
    </AuthPageShell>
  );
}
