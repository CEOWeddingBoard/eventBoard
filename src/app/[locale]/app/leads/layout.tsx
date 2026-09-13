import { assertModuleView } from "@/lib/permissions/guard";

export default async function LeadsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertModuleView("leads", locale);
  return <>{children}</>;
}
