"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithToken } from "@/lib/actions/auth.actions";

export function PasswordResetForm({ locale, token }: { locale: string; token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeat) {
      setError("Hasła nie są takie same.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await resetPasswordWithToken({ token, newPassword: password });
      if (result.ok) {
        setDone(true);
        setTimeout(() => router.push(`/${locale}/sign-in`), 2000);
      } else {
        setError(result.error ?? "Nie udało się zmienić hasła.");
      }
    } catch {
      setError("Nie udało się zmienić hasła.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-neutral-700">
          Hasło zmienione. Za chwilę przeniesiemy Cię do logowania.
        </p>
        <Link href={`/${locale}/sign-in`} className="inline-block text-sm font-semibold text-neutral-900 hover:underline">
          Przejdź teraz
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="new-password">Nowe hasło</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-neutral-500">Minimum 8 znaków.</p>
      </div>

      <div>
        <Label htmlFor="repeat-password">Powtórz hasło</Label>
        <Input
          id="repeat-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          className="mt-1"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {saving ? "Zapisywanie…" : "Ustaw nowe hasło"}
      </Button>
    </form>
  );
}
