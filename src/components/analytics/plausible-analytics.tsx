"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

declare global {
  interface Window {
    plausible?: (event: string, options?: { u?: string }) => void;
  }
}

const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

function PlausiblePageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!domain) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    window.plausible?.("pageview", { u: url });
  }, [pathname, searchParams]);

  return null;
}

export function PlausibleAnalytics() {
  if (!domain || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        defer
        data-domain={domain}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <PlausiblePageviewTracker />
      </Suspense>
    </>
  );
}
