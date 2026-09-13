"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions/auth.actions";

export function PasswordResetRequestForm({ locale }: { locale: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await requestPasswordReset({ email, locale });
      if (result.ok) setSent(true);
      else setError(result.error ?? "Nie udało się wysłać linku.");
    } catch {
      setError("Nie udało się wysłać linku.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="text-sm text-neutral-700">
          Jeśli konto o tym adresie istnieje, wysłaliśmy na nie link do ustawienia nowego hasła.
          Link jest ważny godzinę.
        </p>
        <Link href={`/${locale}/sign-in`} className="inline-block text-sm font-semibold text-neutral-900 hover:underline">
          Wróć do logowania
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="reset-email">E-mail</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@adres.pl"
          className="mt-1"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={sending} className="w-full">
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {sending ? "Wysyłanie…" : "Wyślij link do zmiany hasła"}
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Pamiętasz hasło?{" "}
        <Link href={`/${locale}/sign-in`} className="font-semibold text-neutral-900 hover:underline">
          Zaloguj się
        </Link>
      </p>
    </form>
  );
}
