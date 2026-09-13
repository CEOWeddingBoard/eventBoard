import { assertModuleView } from "@/lib/permissions/guard";

export default async function EventsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertModuleView("events", locale);
  return <>{children}</>;
}
