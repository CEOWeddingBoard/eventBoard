"use client";

import { usePathname } from "next/navigation";

/** Subtelne tło biznesowe — delikatna siatka + gradient, jak w profesjonalnych SaaS */
const EVENTBOARD_PREFIXES = ["/app", "/auth", "/sign-in", "/sign-up", "/venue/sign-in", "/venue/sign-up", "/sso-callback"];

export function EventBoardBackground() {
  const pathname = usePathname();
  if (!pathname) return null;

  const stripped = pathname.replace(/^\/[a-z]{2}/, "");
  const isEventBoard = EVENTBOARD_PREFIXES.some(
    (p) => stripped.startsWith(p) || stripped === "/" || stripped === ""
  );

  if (!isEventBoard) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      {/* Subtelny gradient bazowy */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #fafafa 0%, #f5f5f5 40%, #fafafa 100%)",
        }}
      />
      {/* Delikatna siatka / dot grid */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `radial-gradient(circle, #d4d4d4 0.5px, transparent 0.5px)`,
          backgroundSize: "20px 20px",
        }}
      />
      {/* Subtelny gradient narożny dla głębi */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,0,0,0.02) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
