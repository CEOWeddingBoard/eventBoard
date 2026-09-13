"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff, User, Building2 } from "lucide-react";
import { registerOrganization, registerCoupleAccount } from "@/lib/actions/auth.actions";

interface CustomSignUpProps {
  locale: string;
  signInUrl: string;
  afterSignUpUrl: string;
  mode?: "couple" | "organizer";
}

export function CustomSignUp({
  locale: _locale,
  signInUrl,
  afterSignUpUrl,
  mode = "couple",
}: CustomSignUpProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result =
        mode === "organizer"
          ? await registerOrganization({ name, email, password, organizationName })
          : await registerCoupleAccount({ name, email, password });
      if (result.ok) {
        router.push(afterSignUpUrl);
        router.refresh();
      } else {
        setError(result.error ?? "Wystąpił błąd podczas rejestracji.");
      }
    } catch {
      setError("Wystąpił błąd podczas rejestracji. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="block text-sm font-medium text-ink/80">
            Imię i nazwisko
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jan Kowalski"
              className="auth-field-input auth-field-input--leading-icon w-full text-sm text-ink placeholder:text-ink-muted/50 outline-none transition-all"
            />
          </div>
        </div>

        {mode === "organizer" && (
          <div className="space-y-1.5">
            <label htmlFor="signup-org" className="block text-sm font-medium text-ink/80">
              Nazwa organizacji (restauracja / firma)
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
              <input
                id="signup-org"
                type="text"
                required={mode === "organizer"}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Np. Restauracja Pałacowa"
                className="auth-field-input auth-field-input--leading-icon w-full text-sm text-ink placeholder:text-ink-muted/50 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-ink-muted/70">
              Zakładasz konto administratora. Podkonta dla pracowników utworzysz później w panelu.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-sm font-medium text-ink/80">
            Adres e-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="auth-field-input auth-field-input--leading-icon w-full text-sm text-ink placeholder:text-ink-muted/50 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="block text-sm font-medium text-ink/80">
            Hasło
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 znaków"
              className="auth-field-input auth-field-input--both-icons w-full text-sm text-ink placeholder:text-ink-muted/50 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/60 hover:text-ink transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Załóż konto"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-muted">
        Masz już konto?{" "}
        <Link href={signInUrl} className="font-semibold text-neutral-900 hover:underline">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
