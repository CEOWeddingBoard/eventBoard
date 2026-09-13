import { notFound } from "next/navigation";
import { isPlatformAdmin, listEventSpaces, listProcessSources, getTemplateLibrary } from "@/lib/actions/admin.actions";
import { getCurrentUser } from "@/lib/auth/utils";
import { AdminSpacesClient } from "@/components/admin/AdminSpacesClient";
import { AdminAccountCard } from "@/components/admin/AdminAccountCard";

export const metadata = { robots: { index: false, follow: false } };

export default async function PlatformAdminPage() {
  // Bez przycisków w UI — wejście tylko przez adres URL. Dla nie-adminów
  // zwracamy 404, żeby istnienie panelu nie było w żaden sposób widoczne.
  const admin = await isPlatformAdmin();
  if (!admin) notFound();

  // Biblioteka procesów najpierw — zakłada wewnętrzną przestrzeń wzorców, którą
  // listEventSpaces/listProcessSources potem odpowiednio filtrują/etykietują.
  const library = await getTemplateLibrary();
  const [spaces, sources, me] = await Promise.all([
    listEventSpaces(),
    listProcessSources(),
    getCurrentUser(),
  ]);

  return (
    <div className="eb-ui min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-[#0f172a] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Panel administratora</p>
            <h1 className="text-lg font-bold text-white">Klienci i przestrzenie</h1>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-100">serviceUser</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {me?.email && <AdminAccountCard email={me.email} />}
        <AdminSpacesClient initialSpaces={spaces} processSources={sources} library={library} />
      </main>
    </div>
  );
}
