import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { robots: { index: false, follow: false } };

export default async function FinancesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const membership = await getActiveMembership(user.id);
  if (!membership) redirect(`/${locale}/app/dashboard`);

  const events = await prisma.event.findMany({
    where: { organizationId: membership.organizationId },
    select: {
      id: true,
      name: true,
      date: true,
      estimatedGuestCount: true,
      menuVariants: {
        select: {
          courses: {
            select: {
              priceBase: true,
              priceExtra: true,
            },
          },
        },
      },
      payments: {
        select: {
          amount: true,
          status: true,
          paidAt: true,
          dueDate: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const totalPaid = events.reduce(
    (sum, e) =>
      sum + e.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
    0
  );
  const totalPending = events.reduce(
    (sum, e) =>
      sum + e.payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0),
    0
  );
  
  const totalContractValue = events.reduce((sum, e) => {
    const guests = e.estimatedGuestCount || 0;
    const menuValue = e.menuVariants.reduce((variantSum, variant) => {
      const variantPrice = variant.courses.reduce(
        (courseSum, course) => courseSum + (course.priceBase || 0) + (course.priceExtra || 0),
        0
      );
      return variantSum + variantPrice * guests;
    }, 0);
    return sum + menuValue;
  }, 0);

  const monthlyRevenue: Record<string, number> = {};
  events.forEach((e) => {
    e.payments
      .filter((p) => p.status === "PAID" && p.paidAt)
      .forEach((p) => {
        const key = new Date(p.paidAt!).toISOString().slice(0, 7);
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.amount;
      });
  });

  const sortedMonths = Object.entries(monthlyRevenue).sort(([a], [b]) => a.localeCompare(b));
  const maxRevenue = Math.max(...sortedMonths.map(([, v]) => v), 1);

  const money = (n: number) => n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-neutral-800">Finanse eventów</h1>
        <p className="text-sm text-neutral-500">Przychody i wartość kontraktów</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500">Opłacone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{money(totalPaid)} zł</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500">Do zapłaty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{money(totalPending)} zł</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500">Wartość kontraktów</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-neutral-800">{money(totalContractValue)} zł</p>
          </CardContent>
        </Card>
      </div>

      {sortedMonths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Przychody miesięczne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedMonths.map(([month, revenue]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 w-20">{month}</span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full flex items-center justify-end pr-2"
                      style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                    >
                      <span className="text-[10px] font-medium text-white">
                        {money(revenue)} zł
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Eventy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((e) => {
              const paid = e.payments
                .filter((p) => p.status === "PAID")
                .reduce((s, p) => s + p.amount, 0);
              const pending = e.payments
                .filter((p) => p.status === "PENDING")
                .reduce((s, p) => s + p.amount, 0);
              
              const guests = e.estimatedGuestCount || 0;
              const contractValue = e.menuVariants.reduce((variantSum, variant) => {
                const variantPrice = variant.courses.reduce(
                  (courseSum, course) => courseSum + (course.priceBase || 0) + (course.priceExtra || 0),
                  0
                );
                return variantSum + variantPrice * guests;
              }, 0);
              
              return (
                <div key={e.id} className="border-b border-neutral-100 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{e.name}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(e.date).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-emerald-600 font-medium">{money(paid)} zł opłacone</p>
                      {pending > 0 && (
                        <p className="text-amber-600">{money(pending)} zł do zapłaty</p>
                      )}
                      {contractValue > 0 && (
                        <p className="text-neutral-500">
                          Kontrakt: {money(contractValue)} zł
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {events.length === 0 && (
              <p className="text-sm text-neutral-400">Brak eventów.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
