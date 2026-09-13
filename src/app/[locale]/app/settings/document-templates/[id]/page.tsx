import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { getAgendaDocumentTemplate } from "@/lib/actions/agenda-document-template.actions";
import DocumentTemplateBuilder from "@/components/document-template/DocumentTemplateBuilder";

export const metadata = { robots: { index: false, follow: false } };

export default async function EditDocumentTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  try {
    const template = await getAgendaDocumentTemplate(id);
    return (
      <DocumentTemplateBuilder
        templateId={template.id}
        initialData={template}
        locale={locale}
      />
    );
  } catch {
    notFound();
  }
}
