import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { AuthPageShell } from "../../auth-page-shell";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";

export const metadata = { robots: { index: false, follow: false } };

export default async function PasswordResetRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/after-auth`);

  return (
    <AuthPageShell
      locale={locale}
      backLabel="Wróć do logowania"
      backHref={`/${locale}/sign-in`}
      title="Nie pamiętasz hasła?"
      subtitle="Podaj adres e-mail, a wyślemy link do ustawienia nowego hasła."
    >
      <PasswordResetRequestForm locale={locale} />
    </AuthPageShell>
  );
}
