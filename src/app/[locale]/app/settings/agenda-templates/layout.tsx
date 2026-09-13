import { assertModuleView } from "@/lib/permissions/guard";

export default async function AgendaTemplatesLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertModuleView("settings", locale);
  return <>{children}</>;
}
