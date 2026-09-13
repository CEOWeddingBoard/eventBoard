import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgInquiryForm } from "./org-inquiry-form";

export const metadata = { robots: { index: true, follow: true } };

export default async function OrgPublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const org = await prisma.organization.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: true,
      postalCode: true,
      phone: true,
      email: true,
      website: true,
      description: true,
      capacity: true,
      priceRange: true,
    },
  });

  if (!org) notFound();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{org.name}</h1>
          {org.description && (
            <p className="mt-2 text-neutral-600">{org.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Informacje kontaktowe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {org.address && (
                <div>
                  <span className="text-neutral-500">Adres:</span>{" "}
                  <span className="text-neutral-800">
                    {org.address}, {org.postalCode} {org.city}
                  </span>
                </div>
              )}
              {org.phone && (
                <div>
                  <span className="text-neutral-500">Telefon:</span>{" "}
                  <a href={`tel:${org.phone}`} className="text-blue-600 hover:underline">
                    {org.phone}
                  </a>
                </div>
              )}
              {org.email && (
                <div>
                  <span className="text-neutral-500">Email:</span>{" "}
                  <a href={`mailto:${org.email}`} className="text-blue-600 hover:underline">
                    {org.email}
                  </a>
                </div>
              )}
              {org.website && (
                <div>
                  <span className="text-neutral-500">Strona:</span>{" "}
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {org.website}
                  </a>
                </div>
              )}
              {org.capacity && (
                <div>
                  <span className="text-neutral-500">Pojemność:</span>{" "}
                  <span className="text-neutral-800">{org.capacity} osób</span>
                </div>
              )}
              {org.priceRange && (
                <div>
                  <span className="text-neutral-500">Zakres cen:</span>{" "}
                  <span className="text-neutral-800">{org.priceRange}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Zapytanie o dostępność</CardTitle>
            </CardHeader>
            <CardContent>
              <OrgInquiryForm organizationId={org.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
