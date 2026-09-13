import { assertModuleView } from "@/lib/permissions/guard";

export default async function CalendarLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertModuleView("calendar", locale);
  return <>{children}</>;
}
