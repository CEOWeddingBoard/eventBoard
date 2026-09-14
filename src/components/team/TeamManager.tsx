"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, ShieldCheck, Crown, Trash2, Copy, Check, Shield, Plus, KeyRound } from "lucide-react";
import { addTeamMember, updateTeamMember, removeTeamMember, setModulePermission, saveOrgCustomRoles, resetTeamMemberPassword, type TeamContext, type TeamMember } from "@/lib/actions/team.actions";
import { APP_MODULES, PERM_LEVELS, type PermLevel } from "@/lib/permissions/modules";

const OP_ROLES = [
  { value: "MANAGER", label: "Manager" },
  { value: "CHEF", label: "Kuchnia" },
  { value: "WAITER", label: "Kelner" },
  { value: "BARTENDER", label: "Bar" },
  { value: "RECEPTION", label: "Recepcja" },
];

function Copyable({ value }: { value: string }) {
  const [c, setC] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(value).then(() => { setC(true); setTimeout(() => setC(false), 1500); }); }}
      className="inline-flex items-center gap-1 rounded border border-neutral-300 px-2 py-0.5 text-[11px] text-neutral-600 hover:bg-neutral-100">
      {c ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />} {value}
    </button>
  );
}

export function TeamManager({ initial }: { initial: TeamContext }) {
  const [ctx, setCtx] = useState<TeamContext>(initial);
  const [novaRola, setNovaRola] = useState("");
  const [form, setForm] = useState<{ name: string; email: string; isAdmin: boolean; roles: string[] }>({ name: "", email: "", isAdmin: false, roles: [] });
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const adminLimitHit = ctx.maxAdmins != null && ctx.adminsUsed >= ctx.maxAdmins;
  const userLimitHit = ctx.maxUsers != null && ctx.usersUsed >= ctx.maxUsers;
  // Role stałe + własne role tej organizacji (definiowane przez admina platformy).
  const allRoles = [...OP_ROLES, ...(ctx.customRoles ?? [])];

  function toggleRole(r: string) {
    setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }));
  }

  async function reload() {
    // Optymistycznie: po zmianach dociągamy świeży kontekst przez odświeżenie strony.
    window.location.reload();
  }

  async function handleAdd() {
    if (!form.email.trim()) return;
    setBusy(true);
    try {
      const res = await addTeamMember(form);
      if (res.ok && res.credentials) {
        setCreds(res.credentials);
        setForm({ name: "", email: "", isAdmin: false, roles: [] });
        setCtx((c) => ({ ...c, adminsUsed: c.adminsUsed + (form.isAdmin ? 1 : 0), usersUsed: c.usersUsed + (form.isAdmin ? 0 : 1) }));
        toast.success("Konto dodane");
      } else {
        toast.error(res.error ?? "Nie udało się dodać konta");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDodajRole() {
    const label = novaRola.trim();
    if (!label) return;
    const nastepne = [...(ctx.customRoles ?? []), { value: label, label }];
    const res = await saveOrgCustomRoles(nastepne);
    if (res.ok) {
      setCtx((c) => ({ ...c, customRoles: nastepne }));
      setNovaRola("");
      toast.success(`Dodano rolę „${label}”`);
    } else {
      toast.error(res.error ?? "Nie udało się dodać roli");
    }
  }

  async function handleUsunRole(value: string) {
    const nastepne = (ctx.customRoles ?? []).filter((r) => r.value !== value);
    const res = await saveOrgCustomRoles(nastepne);
    if (res.ok) {
      setCtx((c) => ({ ...c, customRoles: nastepne }));
      toast.success("Rola usunięta");
    } else {
      toast.error(res.error ?? "Nie udało się usunąć roli");
    }
  }

  async function handleRolesSave(m: TeamMember, roles: string[], isAdmin: boolean) {
    const res = await updateTeamMember(m.memberId, { roles, isAdmin });
    if (res.ok) {
      setCtx((c) => ({ ...c, members: c.members.map((x) => (x.memberId === m.memberId ? { ...x, roles, isAdmin } : x)) }));
      toast.success("Zapisano");
    } else {
      toast.error(res.error ?? "Nie udało się zapisać");
    }
  }

  async function handlePerm(role: string, moduleKey: string, level: PermLevel) {
    const prev = ctx.modulePermissions;
    setCtx((c) => ({
      ...c,
      modulePermissions: { ...c.modulePermissions, [role]: { ...(c.modulePermissions[role] ?? {}), [moduleKey]: level } },
    }));
    const res = await setModulePermission(role, moduleKey, level);
    if (!res.ok) {
      setCtx((c) => ({ ...c, modulePermissions: prev }));
      toast.error(res.error ?? "Nie udało się zapisać uprawnienia");
    }
  }

  async function handleRemove(m: TeamMember) {
    const res = await removeTeamMember(m.memberId);
    if (res.ok) {
      setCtx((c) => ({ ...c, members: c.members.filter((x) => x.memberId !== m.memberId) }));
      toast.success("Konto usunięte");
    } else {
      toast.error(res.error ?? "Nie udało się usunąć");
    }
  }

  return (
    <div className="space-y-6">
      {ctx.canManage && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-800"><UserPlus className="h-4 w-4 text-[#7a5f28]" /> Dodaj konto</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Admini: {ctx.adminsUsed}{ctx.maxAdmins != null ? ` / ${ctx.maxAdmins}` : ""} · Użytkownicy: {ctx.usersUsed}{ctx.maxUsers != null ? ` / ${ctx.maxUsers}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input className="h-8 w-40 text-xs" placeholder="Imię (opc.)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input className="h-8 w-56 text-xs" type="email" placeholder="e-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label className="flex items-center gap-1.5 text-xs text-neutral-700">
              <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} className="rounded" />
              Administrator
            </label>
          </div>
          <div className="mt-2">
            <span className="mr-2 text-[11px] font-medium text-neutral-500">Role (można wiele):</span>
            {allRoles.map((r) => (
              <button key={r.value} type="button" onClick={() => toggleRole(r.value)}
                className={`mr-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${form.roles.includes(r.value) ? "bg-[#0f172a] text-white" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"}`}>
                {r.label}
              </button>
            ))}
          </div>
          <Button size="sm" className="mt-3" onClick={handleAdd} disabled={busy || !form.email.trim() || (form.isAdmin ? adminLimitHit : userLimitHit)}>
            <UserPlus className="mr-1 h-3.5 w-3.5" /> Utwórz konto
          </Button>
          {(form.isAdmin ? adminLimitHit : userLimitHit) && (
            <p className="mt-2 text-[11px] text-amber-600">Limit {form.isAdmin ? "adminów" : "użytkowników"} osiągnięty — skontaktuj się z nami, aby podnieść plan.</p>
          )}
          {creds && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="text-xs font-bold uppercase text-emerald-800">Dane do przekazania</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-neutral-600">Login:</span> <Copyable value={creds.email} />
                <span className="text-neutral-600">Hasło:</span> <Copyable value={creds.password} />
              </div>
            </div>
          )}
        </section>
      )}

      {ctx.canManage && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-800">
            <Plus className="h-4 w-4 text-[#7a5f28]" /> Role własne
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Poza gotowymi rolami możesz dodać swoje — np. Florysta, DJ, Koordynator sali.
            Pojawią się przy członkach zespołu, w krokach procesu i w tabeli uprawnień niżej.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(ctx.customRoles ?? []).map((r) => (
              <span key={r.value} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {r.label}
                <button
                  type="button"
                  onClick={() => handleUsunRole(r.value)}
                  aria-label={`Usuń rolę ${r.label}`}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
            {(ctx.customRoles ?? []).length === 0 && (
              <span className="text-xs text-neutral-400">Brak ról własnych.</span>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={novaRola}
              onChange={(e) => setNovaRola(e.target.value)}
              placeholder="np. Florysta"
              className="h-9 max-w-xs text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleDodajRole(); } }}
            />
            <Button type="button" size="sm" variant="outline" onClick={handleDodajRole} disabled={!novaRola.trim()}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Dodaj rolę
            </Button>
          </div>
        </section>
      )}

      {ctx.canManage && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-800"><Shield className="h-4 w-4 text-[#7a5f28]" /> Uprawnienia (rola × moduł)</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Ustaw, co dana rola widzi i może zmieniać. <b>Brak</b> = nie widzi w menu, <b>Podgląd</b> = tylko czyta, <b>Edycja</b> = pełny dostęp.
            Właściciel, administrator i serwis mają zawsze pełny dostęp.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-1.5 pr-3 font-medium">Rola</th>
                  {APP_MODULES.map((m) => (
                    <th key={m.key} className="px-1.5 py-1.5 text-center font-medium">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRoles.map((r) => (
                  <tr key={r.value} className="border-b border-neutral-100">
                    <td className="py-1.5 pr-3 font-medium text-neutral-700">{r.label}</td>
                    {APP_MODULES.map((m) => {
                      const level = (ctx.modulePermissions[r.value]?.[m.key] ?? (m.always ? "view" : "none")) as PermLevel;
                      return (
                        <td key={m.key} className="px-1.5 py-1 text-center">
                          <select
                            value={level}
                            disabled={m.always}
                            onChange={(e) => handlePerm(r.value, m.key, e.target.value as PermLevel)}
                            className="rounded border border-neutral-300 bg-white px-1 py-0.5 text-[11px] disabled:opacity-50"
                          >
                            {PERM_LEVELS.map((lv) => (
                              <option key={lv.value} value={lv.value}>{lv.label}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            Uprawnienia liczą się po rolach: konto z kilkoma rolami dostaje najwyższy poziom z nich. „Pulpit” jest zawsze widoczny.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Zespół ({ctx.members.length})</h2>
        <div className="space-y-2">
          {ctx.members.map((m) => (
            <MemberRow key={m.memberId} m={m} canManage={ctx.canManage} roleOptions={allRoles} onSave={handleRolesSave} onRemove={handleRemove} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MemberRow({ m, canManage, roleOptions, onSave, onRemove }: {
  m: TeamMember;
  canManage: boolean;
  roleOptions: { value: string; label: string }[];
  onSave: (m: TeamMember, roles: string[], isAdmin: boolean) => void;
  onRemove: (m: TeamMember) => void;
}) {
  const [roles, setRoles] = useState<string[]>(m.roles);
  const [isAdmin, setIsAdmin] = useState<boolean>(m.isAdmin);
  const [noweHaslo, setNoweHaslo] = useState<string | null>(null);
  const [resetuje, setResetuje] = useState(false);
  const dirty = JSON.stringify(roles) !== JSON.stringify(m.roles) || isAdmin !== m.isAdmin;

  async function handleReset() {
    setResetuje(true);
    try {
      const res = await resetTeamMemberPassword(m.memberId);
      if (res.ok && res.password) {
        setNoweHaslo(res.password);
        toast.success("Nowe hasło wygenerowane — przekaż je tej osobie.");
      } else {
        toast.error(res.error ?? "Nie udało się zresetować hasła");
      }
    } finally {
      setResetuje(false);
    }
  }

  function toggle(r: string) {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-800">{m.name || m.email}</span>
            {m.isOwner && <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"><Crown className="h-3 w-3" /> Właściciel</span>}
            {isAdmin && !m.isOwner && <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"><ShieldCheck className="h-3 w-3" /> Admin</span>}
          </div>
          <p className="text-xs text-neutral-500">{m.email}</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-1">
            {/* Reset hasła w obrębie przestrzeni: właściciel sali nie musi dzwonić
                do dostawcy, gdy kelner zgubi hasło. */}
            <button
              onClick={handleReset}
              disabled={resetuje}
              className="rounded p-1.5 text-neutral-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
              title="Ustaw nowe hasło"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            {!m.isOwner && (
              <button onClick={() => onRemove(m)} className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500" title="Usuń konto">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {noweHaslo && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
          <span className="font-semibold text-amber-900">Nowe hasło:</span>
          <Copyable value={noweHaslo} />
          <span className="text-amber-800/80">Pokazujemy je tylko teraz — przekaż je tej osobie.</span>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {roleOptions.map((r) => {
          const on = roles.includes(r.value);
          return canManage ? (
            <button key={r.value} type="button" onClick={() => toggle(r.value)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${on ? "bg-[#0f172a] text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>
              {r.label}
            </button>
          ) : on ? (
            <span key={r.value} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">{r.label}</span>
          ) : null;
        })}
        {!canManage && roles.length === 0 && <span className="text-[11px] text-neutral-400">brak ról</span>}
      </div>
      {canManage && (
        <div className="mt-2 flex items-center gap-3">
          {!m.isOwner && (
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-600">
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="rounded" />
              Administrator
            </label>
          )}
          {dirty && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSave(m, roles, isAdmin)}>Zapisz</Button>
          )}
        </div>
      )}
    </div>
  );
}
