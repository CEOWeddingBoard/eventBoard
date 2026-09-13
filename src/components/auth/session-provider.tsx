"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { SessionUser } from "@/lib/auth/session-user";

type SessionContextValue = {
  user: SessionUser | null;
  isLoaded: boolean;
  reload: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isLoaded: true,
  reload: async () => {},
});

export function SessionProvider({
  user: initialUser,
  children,
}: {
  user: SessionUser | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      }
    } catch {
      // cicho — sesja pozostaje bez zmian
    }
  }, []);

  return (
    <SessionContext.Provider value={{ user, isLoaded: true, reload }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
