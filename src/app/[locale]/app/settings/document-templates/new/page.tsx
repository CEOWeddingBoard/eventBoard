import DocumentTemplateBuilder from "@/components/document-template/DocumentTemplateBuilder";

export const metadata = { robots: { index: false, follow: false } };

export default async function NewDocumentTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <DocumentTemplateBuilder locale={locale} />;
}
