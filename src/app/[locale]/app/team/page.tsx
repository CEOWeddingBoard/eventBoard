import { getTranslations } from "next-intl/server";
import { getTeamContext } from "@/lib/actions/team.actions";
import { TeamManager } from "@/components/team/TeamManager";

export default async function TeamPage() {
  const t = await getTranslations("eventboard");
  let ctx;
  try {
    ctx = await getTeamContext();
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{t("team")}</h1>
        <p className="text-sm text-neutral-500">{t("noOrganization")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{t("team")}</h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          {ctx.canManage
            ? "Zarządzaj kontami zespołu, uprawnieniami i rolami. Konta i limity zależą od planu."
            : "Członkowie zespołu i ich role. Uprawnienia nadaje administrator."}
        </p>
      </div>
      <TeamManager initial={ctx} />
    </div>
  );
}
