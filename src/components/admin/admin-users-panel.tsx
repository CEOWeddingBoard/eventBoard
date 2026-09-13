"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ShieldCheck, UserCheck, UserX, KeyRound } from "lucide-react";
import { toast } from "sonner";
import {
  listOrganizationMembers,
  createOrganizationMember,
  updateOrganizationMember,
  resetMemberPassword,
  type OrganizationMemberItem,
} from "@/lib/actions/auth.actions";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Właściciel",
  MANAGER: "Manager",
  STAFF: "Pracownik",
  VIEWER: "Podgląd",
};

export function AdminUsersPanel({ locale: _locale }: { locale: string }) {
  const [members, setMembers] = useState<OrganizationMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listOrganizationMembers();
      setMembers(data);
    } catch {
      toast.error("Nie udało się pobrać kont");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await createOrganizationMember({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      if (result.ok) {
        toast.success("Konto utworzone");
        setForm({ name: "", email: "", password: "", role: "STAFF" });
        await load();
      } else {
        toast.error(result.error ?? "Nie udało się utworzyć konta");
      }
    } catch {
      toast.error("Błąd");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (m: OrganizationMemberItem) => {
    setBusyId(m.id);
    try {
      const result = await updateOrganizationMember(m.id, { isActive: !m.isActive });
      if (result.ok) {
        toast.success(m.isActive ? "Konto dezaktywowane" : "Konto aktywowane");
        await load();
      } else {
        toast.error(result.error ?? "Błąd");
      }
    } catch {
      toast.error("Błąd");
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (m: OrganizationMemberItem, role: string) => {
    setBusyId(m.id);
    try {
      const result = await updateOrganizationMember(m.id, { role });
      if (result.ok) {
        toast.success("Rola zmieniona");
        await load();
      } else {
        toast.error(result.error ?? "Błąd");
      }
    } catch {
      toast.error("Błąd");
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (m: OrganizationMemberItem) => {
    const newPassword = prompt(`Nowe hasło dla ${m.email}:`);
    if (!newPassword) return;
    setBusyId(m.id);
    try {
      const result = await resetMemberPassword(m.id, newPassword);
      if (result.ok) {
        toast.success("Hasło zresetowane");
      } else {
        toast.error(result.error ?? "Błąd");
      }
    } catch {
      toast.error("Błąd");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-script text-4xl text-ink">Konta i użytkownicy</h1>
        <p className="mt-2 text-ink-muted">
          Podkonta pracowników w Twojej organizacji. Logują się e-mailem i hasłem.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-olive" />
            Nowe konto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Imię i nazwisko</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jan Kowalski"
                required
                className="elegant-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Adres e-mail</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jan@restauracja.pl"
                required
                className="elegant-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Hasło (min. 8 znaków)</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={8}
                className="elegant-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Rola</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="elegant-input h-11 w-full"
              >
                <option value="STAFF">Pracownik</option>
                <option value="MANAGER">Manager</option>
                <option value="VIEWER">Podgląd</option>
                <option value="OWNER">Właściciel</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving} className="btn-gold">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Utwórz konto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-olive" />
            Członkowie organizacji
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-olive" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-ink-muted text-sm text-center py-6">
              Brak kont. Utwórz pierwsze konto powyżej.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border ${
                    m.isActive ? "border-olive/10" : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-ink truncate">
                      {m.name || "—"}
                      {!m.isActive && (
                        <Badge variant="destructive" className="ml-2">Nieaktywne</Badge>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m, e.target.value)}
                      disabled={busyId === m.id || m.role === "OWNER"}
                      className="h-8 rounded-md border border-olive/20 bg-white px-2 text-xs text-ink"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleResetPassword(m)}
                      disabled={busyId === m.id}
                    >
                      <KeyRound className="mr-1 h-3.5 w-3.5" />
                      Hasło
                    </Button>
                    <Button
                      size="sm"
                      variant={m.isActive ? "outline" : "default"}
                      className="h-8 text-xs"
                      onClick={() => handleToggleActive(m)}
                      disabled={busyId === m.id || m.role === "OWNER"}
                    >
                      {m.isActive ? (
                        <UserX className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="mr-1 h-3.5 w-3.5" />
                      )}
                      {m.isActive ? "Dezaktywuj" : "Aktywuj"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
