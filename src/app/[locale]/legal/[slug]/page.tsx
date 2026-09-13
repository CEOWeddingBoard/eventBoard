import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLegalDoc, LEGAL_DOCS, TERMS_VERSION } from "@/lib/legal";

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export default async function LegalDocPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href={`/${locale}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Strona główna
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900">{doc.title}</h1>
      <p className="mt-1 text-xs text-neutral-400">Wersja: {TERMS_VERSION}</p>
      <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-700">{doc.body}</pre>
      <div className="mt-8 flex flex-wrap gap-4 border-t border-neutral-200 pt-4 text-sm">
        {LEGAL_DOCS.map((d) => (
          <Link key={d.slug} href={`/${locale}/legal/${d.slug}`} className="text-[#7a5f28] hover:underline">
            {d.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
