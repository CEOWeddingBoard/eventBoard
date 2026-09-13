import { assertModuleView } from "@/lib/permissions/guard";

export default async function TeamLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertModuleView("team", locale);
  return <>{children}</>;
}
