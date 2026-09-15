import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Phone, Mail, Globe, Users, Wallet, CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { OrgInquiryForm } from "./org-inquiry-form";

/**
 * Publiczny profil obiektu — strona, którą obiekt wysyła po zapytania ofertowe.
 *
 * Wcześniej wyglądała jak formularz z lat dziewięćdziesiątych: globalne reguły
 * typografii dawały nagłówkom krój kaligraficzny i szeryfowy (panel i landing
 * mają własne nadpisania, ta strona nie miała żadnego), linki były domyślnie
 * niebieskie, a branding obiektu — logo i kolor przewodni, które mamy w bazie —
 * nie był używany wcale.
 */

async function pobierzObiekt(slug: string) {
  return prisma.organization.findFirst({
    where: { slug, archivedAt: null },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      postalCode: true,
      phone: true,
      email: true,
      website: true,
      description: true,
      capacity: true,
      priceRange: true,
      brandColor: true,
      brandLogoUrl: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await pobierzObiekt(slug).catch(() => null);
  if (!org) return { title: "Nie znaleziono obiektu" };

  const opis =
    org.description?.slice(0, 160) ??
    `Zapytaj o dostępność terminu — ${org.name}${org.city ? `, ${org.city}` : ""}.`;

  return {
    title: `${org.name} — zapytaj o termin`,
    description: opis,
    robots: { index: true, follow: true },
    openGraph: { title: org.name, description: opis, type: "website" },
  };
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export default async function OrgPublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await pobierzObiekt(slug);
  if (!org) notFound();

  // Kolor przewodni obiektu, z bezpiecznym domyślnym — profil ma wyglądać
  // jak wizytówka TEGO obiektu, nie jak formularz naszego systemu.
  const marka = org.brandColor && HEX.test(org.brandColor) ? org.brandColor : "#0f172a";

  const adres = [org.address, [org.postalCode, org.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  const fakty = [
    adres ? { icon: MapPin, label: "Adres", value: adres, href: null } : null,
    org.phone ? { icon: Phone, label: "Telefon", value: org.phone, href: `tel:${org.phone}` } : null,
    org.email ? { icon: Mail, label: "E-mail", value: org.email, href: `mailto:${org.email}` } : null,
    org.website
      ? { icon: Globe, label: "Strona", value: org.website.replace(/^https?:\/\//, ""), href: org.website }
      : null,
    org.capacity ? { icon: Users, label: "Pojemność", value: `do ${org.capacity} osób`, href: null } : null,
    org.priceRange ? { icon: Wallet, label: "Ceny", value: org.priceRange, href: null } : null,
  ].filter(Boolean) as {
    icon: typeof MapPin;
    label: string;
    value: string;
    href: string | null;
  }[];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Pasek z brandingiem obiektu */}
      <header className="text-white" style={{ backgroundColor: marka }}>
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-5">
          {org.brandLogoUrl ? (
            // Logo bywa zewnętrznym adresem — zwykły <img>, bez optymalizacji.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.brandLogoUrl}
              alt=""
              className="h-10 w-auto max-w-[160px] shrink-0 object-contain"
            />
          ) : null}
          <span className="font-sans text-lg font-bold tracking-tight">{org.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="max-w-2xl">
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            {org.name}
          </h1>
          {org.description && (
            <p className="mt-3 text-base leading-relaxed text-neutral-600">{org.description}</p>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section>
            <h2 className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">
              Obiekt
            </h2>

            <dl className="mt-4 space-y-4">
              {fakty.map((f) => (
                <div key={f.label} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${marka}14`, color: marka }}
                  >
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs text-neutral-500">{f.label}</dt>
                    <dd className="text-sm font-medium text-neutral-800">
                      {f.href ? (
                        <a
                          href={f.href}
                          target={f.href.startsWith("http") ? "_blank" : undefined}
                          rel={f.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="underline-offset-4 hover:underline"
                          style={{ color: marka }}
                        >
                          {f.value}
                        </a>
                      ) : (
                        f.value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            {fakty.length === 0 && (
              <p className="mt-4 text-sm text-neutral-500">
                Skorzystaj z formularza obok — odpowiemy na wszystkie pytania.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-sans text-base font-bold text-neutral-900">
              <CalendarCheck className="h-4 w-4" style={{ color: marka }} />
              Zapytaj o termin
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Odpowiemy z informacją o dostępności i orientacyjną wyceną.
            </p>

            <div className="mt-5">
              <OrgInquiryForm organizationId={org.id} brandColor={marka} />
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-neutral-200 py-8">
        <p className="text-center text-xs text-neutral-400">
          {org.name}
          {org.city ? ` · ${org.city}` : ""}
        </p>
      </footer>
    </div>
  );
}
