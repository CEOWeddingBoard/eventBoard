import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { getUserOrganizations } from "@/lib/actions/organization.actions";
import { isPlatformAdmin } from "@/lib/actions/admin.actions";
import { safeReturnUrl } from "@/lib/safe-return-url";

/**
 * Rozgałęzienie po zalogowaniu. EventBoard ma jedną przestrzeń roboczą:
 * admin platformy trafia do panelu administracyjnego, członek organizacji do
 * pulpitu, a konto bez przypisanej przestrzeni — na stronę wyjaśniającą.
 */
export default async function AfterAuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth`);
  }

  const safeReturn = safeReturnUrl(returnTo, locale);
  if (safeReturn) {
    redirect(safeReturn);
  }

  if (await isPlatformAdmin()) {
    redirect(`/${locale}/admin`);
  }

  const orgs = await getUserOrganizations().catch(() => []);
  if (orgs.length > 0) {
    redirect(`/${locale}/app/dashboard`);
  }

  redirect(`/${locale}/onboarding`);
}
