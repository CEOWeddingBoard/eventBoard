import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { listAgendaDocumentTemplates } from "@/lib/actions/agenda-document-template.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteAgendaDocumentTemplate } from "@/lib/actions/agenda-document-template.actions";

export default async function DocumentTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const templates = await listAgendaDocumentTemplates();

  async function handleDelete(id: string) {
    "use server";
    await deleteAgendaDocumentTemplate(id);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Szablony agendy i dokumentów</h1>
          <p className="text-gray-600 mt-1">
            Twórz dokumenty na pustej kartce A4, przeciągając pola zmapowane z danymi eventu
          </p>
        </div>
        <Link href={`/${locale}/app/settings/document-templates/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nowy szablon
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak szablonów</h3>
            <p className="text-gray-600 mb-4">
              Utwórz pierwszy szablon dokumentu aby rozpocząć
            </p>
            <Link href={`/${locale}/app/settings/document-templates/new`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Utwórz szablon
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                  {template.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      Domyślny
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                )}
                <div className="text-xs text-gray-500 mb-4">
                  {template.pages.length} {template.pages.length === 1 ? "strona" : "stron"}
                </div>
                <div className="flex gap-2">
                  <Link href={`/${locale}/app/settings/document-templates/${template.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edytuj
                    </Button>
                  </Link>
                  <form action={handleDelete.bind(null, template.id)}>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
