import { assertModuleView } from "@/lib/permissions/guard";

export default async function ConfigurationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertModuleView("configuration", locale);
  return <>{children}</>;
}
