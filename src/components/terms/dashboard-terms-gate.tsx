"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/session-provider";
import { TermsAcceptanceModal } from "./terms-acceptance-modal";

interface DashboardTermsGateProps {
  locale: string;
  children: React.ReactNode;
  isPartnerMode?: boolean;
  partnerTermsAccepted?: boolean;
}

function PartnerTermsGate({
  locale,
  children,
  initialAccepted,
}: {
  locale: string;
  children: React.ReactNode;
  initialAccepted: boolean;
}) {
  const [accepted, setAccepted] = useState(initialAccepted);

  if (accepted) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <TermsAcceptanceModal
        open
        locale={locale}
        acceptTermsPath={`/${locale}/api/partner-access/accept-terms`}
        onAccepted={() => setAccepted(true)}
      />
    </div>
  );
}

export function DashboardTermsGate({
  locale,
  children,
  isPartnerMode = false,
  partnerTermsAccepted = false,
}: DashboardTermsGateProps) {
  const { user, isLoaded, reload } = useSession();
  const termsAcceptedAt = user?.metadata?.termsAcceptedAt as string | undefined;

  const handleAccepted = async () => {
    await reload();
  };

  if (isPartnerMode) {
    return (
      <PartnerTermsGate locale={locale} initialAccepted={partnerTermsAccepted}>
        {children}
      </PartnerTermsGate>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-olive/30 border-t-olive" />
      </div>
    );
  }

  if (termsAcceptedAt) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <TermsAcceptanceModal open locale={locale} onAccepted={handleAccepted} />
    </div>
  );
}
