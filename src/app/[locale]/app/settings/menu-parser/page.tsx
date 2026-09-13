import { ClipboardPaste } from "lucide-react";
import { getMenuParserRules } from "@/lib/actions/menu-parser.actions";
import { MenuParserRulesEditor } from "@/components/menu/MenuParserRulesEditor";

export const metadata = { robots: { index: false, follow: false } };

export default async function MenuParserSettingsPage() {
  const rules = await getMenuParserRules();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-neutral-900">
          <ClipboardPaste className="h-5 w-5 text-[#7a5f28]" />
          Reguły importu menu
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Definiujesz, jak system rozpoznaje wklejone menu — od jakich słów kluczowych powstają
          sekcje i typy dań. Import robisz potem w evencie („Warianty menu → Wklej menu z tekstu").
        </p>
      </div>

      <MenuParserRulesEditor initial={rules} />
    </div>
  );
}
