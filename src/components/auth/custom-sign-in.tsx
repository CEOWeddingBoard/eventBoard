"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginAccount } from "@/lib/actions/auth.actions";

interface CustomSignInProps {
  locale: string;
  signUpUrl: string;
  afterSignInUrl: string;
}

export function CustomSignIn({ locale, signUpUrl, afterSignInUrl }: CustomSignInProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAccount({ email, password });
      if (result.ok) {
        router.push(afterSignInUrl);
        router.refresh();
      } else {
        setError(result.error ?? "Nieprawidłowy e-mail lub hasło");
      }
    } catch {
      setError("Nie udało się zalogować. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="signin-email" className="block text-sm font-medium text-neutral-700">Adres e-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input id="signin-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com" className="auth-field-input auth-field-input--leading-icon w-full text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="signin-password" className="block text-sm font-medium text-neutral-700">Hasło</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input id="signin-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="auth-field-input auth-field-input--both-icons w-full text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-all disabled:opacity-60">
          {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Zaloguj się"}
        </button>
      </form>

      <p className="text-center text-sm">
        <Link href={`/${locale}/auth/reset`} className="text-neutral-500 hover:text-neutral-900 hover:underline">
          Nie pamiętam hasła
        </Link>
      </p>

      <p className="text-center text-sm text-neutral-500">
        Nie masz konta?{" "}<Link href={signUpUrl} className="font-semibold text-neutral-900 hover:underline">Zarejestruj się</Link>
      </p>
    </div>
  );
}
