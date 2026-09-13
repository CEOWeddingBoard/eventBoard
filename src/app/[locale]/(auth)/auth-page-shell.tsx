import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AuthPageShellProps = {
  locale: string;
  backLabel: string;
  backHref?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthPageShell({
  locale,
  backLabel,
  backHref,
  title,
  subtitle,
  children,
}: AuthPageShellProps) {
  const backLink = backHref ?? `/${locale}`;

  return (
    <main className="flex w-full min-w-0 flex-1 flex-col px-3 py-4 sm:px-4 sm:py-6 md:items-center md:justify-center md:py-8" lang={locale}>
      <div className="mx-auto flex w-full min-w-0 max-w-full flex-col lg:max-w-4xl">
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white sm:rounded-2xl">
          {/* Mobile header */}
          <div className="border-b border-neutral-200 px-3 py-3 sm:px-5 sm:py-4 lg:hidden">
            <Link href={backLink} className="mb-3 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors" aria-label={backLabel}>
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> {backLabel}
            </Link>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-snug text-neutral-500">{subtitle}</p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Desktop sidebar */}
            <aside className="hidden flex-col justify-center border-r border-neutral-200 bg-neutral-50 px-8 py-10 lg:flex">
              <Link href={backLink} className="mb-8 inline-flex w-fit items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors" aria-label={backLabel}>
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> {backLabel}
              </Link>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-500">{subtitle}</p>
            </aside>

            {/* Form */}
            <section className="flex w-full min-w-0 items-stretch justify-center p-4 sm:p-6 lg:p-8">
              <div className="clerk-form-host mx-auto w-full min-w-0 max-w-md">{children}</div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
