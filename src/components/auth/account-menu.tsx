"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, User as UserIcon, ChevronDown, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { logoutAccount } from "@/lib/actions/auth.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu({ locale }: { locale: string }) {
  const { user } = useSession();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAccount();
    } finally {
      window.location.href = `/${locale}/auth`;
    }
  };

  if (!user) {
    return (
      <a
        href={`/${locale}/auth`}
        className="inline-flex items-center gap-2 rounded-full border border-olive/30 bg-olive-muted px-3 py-1.5 text-xs font-medium text-olive-light hover:bg-olive/20 transition-colors"
      >
        Zaloguj się
      </a>
    );
  }

  const initials =
    (user.name ?? user.email ?? "?")
      .split(/[\s@]+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const isOrgAdmin =
    user.role === "ADMIN" || user.orgRole === "OWNER" || user.orgRole === "MANAGER";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-olive/20 bg-white/80 py-1 pl-1 pr-2.5 text-xs text-ink shadow-sm hover:border-olive/50 transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive text-[10px] font-semibold text-white">
            {initials}
          </span>
          <span className="max-w-[120px] truncate font-medium">
            {user.name || user.email}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-ink">{user.name || "Użytkownik"}</p>
          <p className="truncate text-xs text-ink-muted">{user.email}</p>
          {user.organizationName && (
            <p className="mt-1 truncate text-[11px] text-olive">{user.organizationName}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isOrgAdmin && (
          <DropdownMenuItem
            onClick={() => router.push(`/${locale}/dashboard/admin`)}
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-olive" />
            Konta i użytkownicy
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/account`)}>
          <UserIcon className="mr-2 h-4 w-4 text-olive" />
          Moje konto
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4 text-red-600" />
          )}
          Wyloguj się
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
