import "@/app/[locale]/(auth)/auth-clerk-overrides.css";

export function AuthFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-flow flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden">
      {children}
    </div>
  );
}
