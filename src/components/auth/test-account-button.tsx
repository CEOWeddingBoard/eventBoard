"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { createTestAccount } from "@/lib/actions/auth.actions";
import { toast } from "sonner";

export function TestAccountButton({ locale }: { locale: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await createTestAccount();
      if (result.ok) {
        toast.success("Utworzono konto testowe");
        router.push(`/${locale}/app/dashboard`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Nie udało się utworzyć konta testowego");
      }
    } catch {
      toast.error("Nie udało się utworzyć konta testowego");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-100 transition-all disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
      Wejdź kontem testowym (bez e-maila)
    </button>
  );
}
