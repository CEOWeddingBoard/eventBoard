"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, KeyRound, ExternalLink, Loader2, Building2, Users, CalendarDays, Check } from "lucide-react";
import {
  createEventSpace,
  resetSpaceOwnerPassword,
  enterSpace,
  setSpacePlan,
  setSpaceLimits,
  addSpaceMember,
  openTemplateLibrary,
  assignProcessToSpace,
  addSpaceCustomRole,
  removeSpaceCustomRole,
  setSpaceBilling,
  setSpaceArchived,
  setSpaceNote,
  deleteSpace,
  resetAccountPassword,
  setSpaceBranding,
  type EventSpace,
  type CreateSpaceResult,
  type TemplateLibrary,
} from "@/lib/actions/admin.actions";
import { LogIn, UserPlus, ShieldCheck, Library, Workflow, ArrowRightLeft, Archive, Trash2 } from "lucide-react";
import { PLANS, PLAN_KEYS, type PlanKey } from "@/lib/plans";

const OP_ROLES = [
  { value: "MANAGER", label: "Manager" },
  { value: "CHEF", label: "Kuchnia" },
  { value: "WAITER", label: "Kelner" },
  { value: "BARTENDER", label: "Bar" },
  { value: "RECEPTION", label: "Recepcja" },
];

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Nie udało się skopiować");
        }
      }}
      className="inline-flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {label ?? "Kopiuj"}
    </button>
  );
}

function Credentials({ email, password, loginUrl }: { email: string; password: string; loginUrl: string }) {
  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Dane do przekazania klientowi</p>
      <p className="mt-1 text-[11px] text-emerald-700">Zapisz je teraz — hasło pokazujemy tylko raz.</p>
      <div className="mt-3 space-y-2 text-sm">
        <Row k="Link logowania" v={loginUrl} />
        <Row k="Login (e-mail)" v={email} />
        <Row k="Hasło startowe" v={password} mono />
      </div>
      <div className="mt-3">
        <CopyBtn
          label="Kopiuj wszystko"
          value={`EventBoard — dostęp do panelu\nLink: ${loginUrl}\nLogin: ${email}\nHasło: ${password}`}
        />
      </div>
    </div>
  );
}

function BillingBadge({ paidUntil }: { paidUntil: string | null }) {
  let cls = "bg-neutral-100 text-neutral-500";
  let text = "Płatność: brak";
  if (paidUntil) {
    const d = new Date(paidUntil);
    // Odznaka „opłacone do / zaległość od" z natury porównuje się do teraz.
    // Stan zamrożony w useState starzałby się przy długo otwartej karcie.
    // eslint-disable-next-line react-hooks/purity -- data bieżąca jest tu treścią, nie efektem ubocznym
    const overdue = d.getTime() < Date.now();
    cls = overdue ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700";
    text = `${overdue ? "Zaległość od" : "Opłacone do"} ${d.toLocaleDateString("pl-PL")}`;
  }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{text}</span>;
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] text-neutral-500">{k}</p>
        <p className={`truncate text-sm text-neutral-800 ${mono ? "font-mono" : ""}`}>{v}</p>
      </div>
      <CopyBtn value={v} />
    </div>
  );
}

export function AdminSpacesClient({
  initialSpaces,
  processSources = [],
  library,
}: {
  initialSpaces: EventSpace[];
  processSources?: { id: string; name: string; count: number }[];
  library?: TemplateLibrary;
}) {
  const [spaces, setSpaces] = useState<EventSpace[]>(initialSpaces);
  const [form, setForm] = useState<{ spaceName: string; ownerName: string; ownerEmail: string; plan: PlanKey; copyFrom: string }>({ spaceName: "", ownerName: "", ownerEmail: "", plan: "START", copyFrom: "" });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreateSpaceResult | null>(null);
  const [resetInfo, setResetInfo] = useState<Record<string, { email: string; password: string }>>({});

  async function handleCreate() {
    if (!form.spaceName.trim() || !form.ownerEmail.trim()) return;
    setBusy(true);
    setCreated(null);
    try {
      const res = await createEventSpace({
        spaceName: form.spaceName,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        plan: form.plan,
        copyProcessesFromOrgId: form.copyFrom || undefined,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Nie udało się utworzyć przestrzeni");
        return;
      }
      setCreated(res);
      if (res.space) {
        setSpaces((prev) => [
          {
            id: res.space!.id,
            name: res.space!.name,
            slug: res.space!.slug,
            createdAt: new Date().toISOString(),
            owner: { name: form.ownerName || null, email: res.credentials!.email },
            plan: form.plan,
            adminsUsed: 1,
            usersUsed: 0,
            maxAdmins: PLANS[form.plan].maxAdmins,
            maxUsers: PLANS[form.plan].maxUsers,
            eventCount: 0,
            loginUrl: res.space!.loginUrl,
            customRoles: [],
            billingPaidUntil: null,
            billingNote: null,
            adminNote: null,
            archived: false,
            brandColor: null,
            brandLogoUrl: null,
          },
          ...prev,
        ]);
      }
      setForm({ spaceName: "", ownerName: "", ownerEmail: "", plan: "START", copyFrom: "" });
      toast.success("Przestrzeń utworzona");
    } finally {
      setBusy(false);
    }
  }

  const [entering, setEntering] = useState<string | null>(null);
  async function handleEnter(orgId: string) {
    setEntering(orgId);
    try {
      const res = await enterSpace(orgId);
      if (res.ok) {
        window.location.href = "/pl/app/dashboard";
      } else {
        toast.error(res.error ?? "Nie udało się wejść w przestrzeń");
        setEntering(null);
      }
    } catch {
      toast.error("Nie udało się wejść w przestrzeń");
      setEntering(null);
    }
  }

  async function handlePlanChange(orgId: string, plan: PlanKey) {
    const res = await setSpacePlan(orgId, plan);
    if (res.ok) {
      setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, plan, maxAdmins: s.maxAdmins ?? PLANS[plan].maxAdmins, maxUsers: s.maxUsers ?? PLANS[plan].maxUsers } : s)));
      toast.success(`Plan zmieniony na ${PLANS[plan].label}`);
    } else {
      toast.error(res.error ?? "Nie udało się zmienić planu");
    }
  }

  async function handleLimits(orgId: string, maxAdmins: number | null, maxUsers: number | null) {
    const res = await setSpaceLimits(orgId, { maxAdmins, maxUsers });
    if (res.ok) {
      setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, maxAdmins, maxUsers } : s)));
      toast.success("Limity zapisane");
    } else {
      toast.error(res.error ?? "Nie udało się zapisać limitów");
    }
  }

  const [memberFor, setMemberFor] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<{ email: string; name: string; isAdmin: boolean; roles: string[] }>({ email: "", name: "", isAdmin: false, roles: [] });
  const [memberCreds, setMemberCreds] = useState<Record<string, { email: string; password: string }>>({});

  function toggleMemberRole(r: string) {
    setMemberForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }));
  }

  async function handleAddMember(orgId: string) {
    if (!memberForm.email.trim()) return;
    const res = await addSpaceMember(orgId, memberForm);
    if (res.ok && res.credentials) {
      setMemberCreds((prev) => ({ ...prev, [orgId]: res.credentials! }));
      setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, adminsUsed: s.adminsUsed + (memberForm.isAdmin ? 1 : 0), usersUsed: s.usersUsed + (memberForm.isAdmin ? 0 : 1) } : s)));
      setMemberForm({ email: "", name: "", isAdmin: false, roles: [] });
      toast.success("Konto dodane");
    } else {
      toast.error(res.error ?? "Nie udało się dodać konta");
    }
  }

  const templates = library?.processes ?? [];
  const [openingLib, setOpeningLib] = useState(false);
  async function handleOpenLibrary() {
    setOpeningLib(true);
    try {
      const res = await openTemplateLibrary();
      if (res.ok) window.location.href = "/pl/app/settings/workflows";
      else {
        toast.error(res.error ?? "Nie udało się otworzyć biblioteki");
        setOpeningLib(false);
      }
    } catch {
      toast.error("Nie udało się otworzyć biblioteki");
      setOpeningLib(false);
    }
  }

  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [assignPick, setAssignPick] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<string | null>(null);
  async function handleAssign(orgId: string) {
    const workflowId = assignPick[orgId];
    if (!workflowId) return;
    setAssigning(orgId);
    try {
      const res = await assignProcessToSpace(workflowId, orgId);
      if (res.ok) {
        toast.success("Proces przypisany do przestrzeni");
        setAssignFor(null);
      } else {
        toast.error(res.error ?? "Nie udało się przypisać procesu");
      }
    } finally {
      setAssigning(null);
    }
  }

  const [newRole, setNewRole] = useState<Record<string, string>>({});
  async function handleAddRole(orgId: string) {
    const label = (newRole[orgId] ?? "").trim();
    if (!label) return;
    const res = await addSpaceCustomRole(orgId, label);
    if (res.ok && res.roles) {
      setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, customRoles: res.roles! } : s)));
      setNewRole((p) => ({ ...p, [orgId]: "" }));
      toast.success("Rola dodana");
    } else {
      toast.error(res.error ?? "Nie udało się dodać roli");
    }
  }
  async function handleRemoveRole(orgId: string, value: string) {
    const res = await removeSpaceCustomRole(orgId, value);
    if (res.ok && res.roles) {
      setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, customRoles: res.roles! } : s)));
    } else {
      toast.error(res.error ?? "Nie udało się usunąć roli");
    }
  }

  async function handleBilling(orgId: string, paidUntil: string | null, note: string | null) {
    const res = await setSpaceBilling(orgId, { paidUntil, note });
    if (res.ok) {
      setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, billingPaidUntil: paidUntil ? new Date(paidUntil).toISOString() : null, billingNote: note } : s)));
      toast.success("Zapisano status płatności");
    } else {
      toast.error(res.error ?? "Nie udało się zapisać");
    }
  }

  async function handleArchive(orgId: string, archived: boolean) {
    const res = await setSpaceArchived(orgId, archived);
    if (res.ok) {
      setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, archived } : s)));
      toast.success(archived ? "Zarchiwizowano" : "Przywrócono");
    } else toast.error(res.error ?? "Nie udało się");
  }
  async function handleNote(orgId: string, note: string) {
    const res = await setSpaceNote(orgId, note);
    if (res.ok) setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, adminNote: note || null } : s)));
    else toast.error(res.error ?? "Nie udało się zapisać notatki");
  }
  async function handleDelete(orgId: string, name: string) {
    if (!window.confirm(`Usunąć NA STAŁE przestrzeń „${name}" wraz ze wszystkimi danymi? Tego nie da się cofnąć.`)) return;
    const res = await deleteSpace(orgId);
    if (res.ok) {
      setSpaces((prev) => prev.filter((s) => s.id !== orgId));
      toast.success("Przestrzeń usunięta");
    } else toast.error(res.error ?? "Nie udało się usunąć");
  }

  async function handleBranding(orgId: string, color: string | null, logoUrl: string | null) {
    const res = await setSpaceBranding(orgId, { color, logoUrl });
    if (res.ok) {
      setSpaces((prev) => prev.map((s) => (s.id === orgId ? { ...s, brandColor: color, brandLogoUrl: logoUrl } : s)));
      toast.success("Zapisano branding");
    } else toast.error(res.error ?? "Nie udało się zapisać");
  }

  const [resetEmail, setResetEmail] = useState("");
  const [resetCreds, setResetCreds] = useState<{ email: string; password: string } | null>(null);
  async function handleResetByEmail() {
    if (!resetEmail.trim()) return;
    const res = await resetAccountPassword(resetEmail);
    if (res.ok && res.email && res.password) {
      setResetCreds({ email: res.email, password: res.password });
      setResetEmail("");
      toast.success("Nowe hasło wygenerowane");
    } else toast.error(res.error ?? "Nie udało się");
  }

  async function handleReset(orgId: string) {
    const res = await resetSpaceOwnerPassword(orgId);
    if (res.ok && res.email && res.password) {
      setResetInfo((prev) => ({ ...prev, [orgId]: { email: res.email!, password: res.password! } }));
      toast.success("Wygenerowano nowe hasło");
    } else {
      toast.error(res.error ?? "Nie udało się zresetować hasła");
    }
  }

  return (
    <div className="space-y-8">
      {/* Biblioteka procesów-wzorców */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-neutral-800">
              <Library className="h-4 w-4 text-[#7a5f28]" /> Biblioteka procesów
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Buduj tu ogólne procesy-wzorce u siebie, a potem przypisuj je do przestrzeni klienta
              (przycisk „Przypisz proces” przy każdej przestrzeni).
            </p>
          </div>
          <Button onClick={handleOpenLibrary} disabled={openingLib} className="bg-[#0f172a] text-white hover:bg-[#1e293b]">
            {openingLib ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Workflow className="mr-2 h-4 w-4" />}
            Otwórz bibliotekę i edytuj procesy
          </Button>
        </div>
        <div className="mt-4">
          {templates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-400">
              Brak wzorców. Kliknij „Otwórz bibliotekę”, zbuduj proces w kreatorze, a pojawi się tutaj.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {templates.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                  <Workflow className="h-3.5 w-3.5 shrink-0 text-[#7a5f28]" />
                  <span className="truncate font-medium text-neutral-800">{p.name}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-neutral-500">{p.nodeCount} kroków</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Tworzenie przestrzeni */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-neutral-800">
          <Plus className="h-4 w-4 text-[#7a5f28]" /> Nowy klient (przestrzeń)
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Zakładasz dedykowany EventBoard i konto właściciela. Dane logowania przekazujesz klientowi.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Nazwa przestrzeni *</label>
            <Input value={form.spaceName} onChange={(e) => setForm({ ...form, spaceName: e.target.value })} placeholder="np. Restauracja Prodiż" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Osoba (właściciel)</label>
            <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} placeholder="np. Jan Kowalski" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">E-mail właściciela *</label>
            <Input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} placeholder="kontakt@obiekt.pl" />
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-neutral-600">Plan (subskrypcja)</label>
          <div className="flex flex-wrap gap-2">
            {PLAN_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm({ ...form, plan: k })}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${form.plan === k ? "border-[#0f172a] bg-[#0f172a] text-white" : "border-neutral-200 hover:border-neutral-300"}`}
              >
                <span className="block font-semibold">{PLANS[k].label}</span>
                <span className={`block ${form.plan === k ? "text-neutral-300" : "text-neutral-500"}`}>
                  {PLANS[k].halls} · {PLANS[k].maxUsers == null ? "bez limitu osób" : `${PLANS[k].maxAdmins} admin. / ${PLANS[k].maxUsers} użytk.`}
                </span>
              </button>
            ))}
          </div>
        </div>
        {processSources.length > 0 && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Standardowe procesy (opcjonalnie)</label>
            <select
              value={form.copyFrom}
              onChange={(e) => setForm({ ...form, copyFrom: e.target.value })}
              className="h-9 w-full max-w-md rounded-md border border-neutral-300 bg-white px-2 text-sm sm:w-80"
            >
              <option value="">— nie kopiuj procesów —</option>
              {processSources.map((p) => (
                <option key={p.id} value={p.id}>Skopiuj z: {p.name} ({p.count} procesów)</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-neutral-500">Nowa przestrzeń dostanie gotowe procesy skopiowane z wzorca.</p>
          </div>
        )}
        <Button onClick={handleCreate} disabled={busy || !form.spaceName.trim() || !form.ownerEmail.trim()} className="mt-4 bg-[#0f172a] text-white hover:bg-[#1e293b]">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Utwórz przestrzeń
        </Button>

        {created?.ok && created.credentials && created.space && (
          <Credentials email={created.credentials.email} password={created.credentials.password} loginUrl={created.space.loginUrl} />
        )}
      </section>

      {/* Reset hasła dowolnego konta po e-mailu */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-800"><KeyRound className="h-4 w-4 text-[#7a5f28]" /> Reset hasła konta</h2>
        <p className="mt-1 text-xs text-neutral-500">Dowolne konto (właściciel, kelner, kuchnia…) — po adresie e-mail.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input className="h-8 w-64 text-xs" type="email" placeholder="e-mail konta" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
          <Button size="sm" variant="outline" onClick={handleResetByEmail} disabled={!resetEmail.trim()}>Wygeneruj nowe hasło</Button>
        </div>
        {resetCreds && (
          <div className="mt-3 max-w-md">
            <Credentials email={resetCreds.email} password={resetCreds.password} loginUrl="/pl/auth" />
          </div>
        )}
      </section>

      {/* Lista przestrzeni */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
          Klienci ({spaces.length})
        </h2>
        {spaces.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-white py-12 text-center text-sm text-neutral-400">
            Brak klientów. Utwórz pierwszą przestrzeń powyżej.
          </p>
        ) : (
          <div className="space-y-3">
            {spaces.map((s) => (
              <div key={s.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-neutral-400" />
                      <span className="font-semibold text-neutral-800">{s.name}</span>
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">/{s.slug}</span>
                      {s.archived && <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">Archiwum</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                      {s.owner && <span className="font-medium text-neutral-700">Klient: {s.owner.name ? `${s.owner.name} · ` : ""}{s.owner.email}</span>}
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span className={s.maxAdmins != null && s.adminsUsed >= s.maxAdmins ? "font-semibold text-amber-600" : ""}>
                          {s.adminsUsed}{s.maxAdmins != null ? ` / ${s.maxAdmins}` : ""} admini
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className={s.maxUsers != null && s.usersUsed >= s.maxUsers ? "font-semibold text-amber-600" : ""}>
                          {s.usersUsed}{s.maxUsers != null ? ` / ${s.maxUsers}` : ""} użytkownicy
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{s.eventCount} eventów</span>
                      <BillingBadge paidUntil={s.billingPaidUntil} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={s.plan}
                      onChange={(e) => handlePlanChange(s.id, e.target.value as PlanKey)}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs font-medium text-neutral-700"
                      title="Plan / subskrypcja"
                    >
                      {PLAN_KEYS.map((k) => (
                        <option key={k} value={k}>Plan: {PLANS[k].label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setMemberFor(memberFor === s.id ? null : s.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Dodaj konto
                    </button>
                    <button
                      onClick={() => setAssignFor(assignFor === s.id ? null : s.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Przypisz proces
                    </button>
                    <button
                      onClick={() => handleEnter(s.id)}
                      disabled={entering === s.id}
                      className="inline-flex items-center gap-1 rounded-md bg-[#0f172a] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1e293b] disabled:opacity-60"
                    >
                      {entering === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                      Wejdź w przestrzeń
                    </button>
                    <a href={s.loginUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                      <ExternalLink className="h-3.5 w-3.5" /> Link logowania
                    </a>
                    <CopyBtn value={s.loginUrl} label="Kopiuj link" />
                    <button onClick={() => handleReset(s.id)} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                      <KeyRound className="h-3.5 w-3.5" /> Nowe hasło
                    </button>
                    <button onClick={() => handleArchive(s.id, !s.archived)} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                      <Archive className="h-3.5 w-3.5" /> {s.archived ? "Przywróć" : "Archiwizuj"}
                    </button>
                    <button onClick={() => handleDelete(s.id, s.name)} className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" /> Usuń
                    </button>
                  </div>
                </div>
                {memberFor === s.id && (
                  <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    {/* Limity licencji per przestrzeń */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
                      <span className="text-[11px] font-semibold text-neutral-600">Limity:</span>
                      <label className="flex items-center gap-1 text-[11px] text-neutral-600">
                        Admini
                        <Input className="h-7 w-16 text-xs" type="number" min="0" defaultValue={s.maxAdmins ?? ""} placeholder="∞"
                          onBlur={(e) => handleLimits(s.id, e.target.value === "" ? null : parseInt(e.target.value, 10), s.maxUsers)} />
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-neutral-600">
                        Użytkownicy
                        <Input className="h-7 w-16 text-xs" type="number" min="0" defaultValue={s.maxUsers ?? ""} placeholder="∞"
                          onBlur={(e) => handleLimits(s.id, s.maxAdmins, e.target.value === "" ? null : parseInt(e.target.value, 10))} />
                      </label>
                      <span className="text-[11px] text-neutral-400">(puste = bez limitu)</span>
                    </div>

                    {/* Płatność klienta — ręczne oznaczenie (SaaS bez Stripe) */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 py-3">
                      <span className="text-[11px] font-semibold text-neutral-600">Płatność:</span>
                      <label className="flex items-center gap-1 text-[11px] text-neutral-600">
                        Opłacone do
                        <Input className="h-7 w-36 text-xs" type="date"
                          defaultValue={s.billingPaidUntil ? s.billingPaidUntil.slice(0, 10) : ""}
                          onBlur={(e) => handleBilling(s.id, e.target.value || null, s.billingNote)} />
                      </label>
                      <Input className="h-7 w-52 text-xs" placeholder="Notatka (np. FV 03/2026)"
                        defaultValue={s.billingNote ?? ""}
                        onBlur={(e) => handleBilling(s.id, s.billingPaidUntil ? s.billingPaidUntil.slice(0, 10) : null, e.target.value || null)} />
                      <BillingBadge paidUntil={s.billingPaidUntil} />
                    </div>

                    {/* Notatka wewnętrzna o kliencie */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 py-3">
                      <span className="text-[11px] font-semibold text-neutral-600">Notatka:</span>
                      <Input className="h-7 min-w-[260px] flex-1 text-xs" placeholder="np. kontakt, ustalenia wdrożeniowe"
                        defaultValue={s.adminNote ?? ""} onBlur={(e) => handleNote(s.id, e.target.value)} />
                    </div>

                    {/* Branding klienta: kolor + logo */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 py-3">
                      <span className="text-[11px] font-semibold text-neutral-600">Branding:</span>
                      <label className="flex items-center gap-1 text-[11px] text-neutral-600">
                        Kolor
                        <input type="color" defaultValue={s.brandColor ?? "#1a2332"} className="h-7 w-10 cursor-pointer rounded border border-neutral-300"
                          onBlur={(e) => handleBranding(s.id, e.target.value, s.brandLogoUrl)} />
                      </label>
                      <Input className="h-7 min-w-[220px] flex-1 text-xs" placeholder="Logo URL (https://…)"
                        defaultValue={s.brandLogoUrl ?? ""} onBlur={(e) => handleBranding(s.id, s.brandColor, e.target.value || null)} />
                      {s.brandColor && <button type="button" onClick={() => handleBranding(s.id, null, null)} className="text-[11px] text-neutral-400 hover:text-rose-500">wyczyść</button>}
                    </div>

                    <p className="mt-3 text-xs font-semibold text-neutral-700">Nowe konto</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Input className="h-8 w-36 text-xs" placeholder="Imię (opc.)" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} />
                      <Input className="h-8 w-52 text-xs" type="email" placeholder="e-mail" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
                      <label className="flex items-center gap-1.5 text-xs text-neutral-700">
                        <input type="checkbox" checked={memberForm.isAdmin} onChange={(e) => setMemberForm({ ...memberForm, isAdmin: e.target.checked })} className="rounded" />
                        Administrator (może nadawać uprawnienia)
                      </label>
                    </div>
                    <div className="mt-2">
                      <span className="mr-2 text-[11px] font-medium text-neutral-500">Role (można wiele):</span>
                      <span className="inline-flex flex-wrap gap-1.5">
                        {[...OP_ROLES, ...s.customRoles].map((r) => (
                          <button key={r.value} type="button" onClick={() => toggleMemberRole(r.value)}
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${memberForm.roles.includes(r.value) ? "bg-[#0f172a] text-white" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"}`}>
                            {r.label}
                          </button>
                        ))}
                      </span>
                    </div>

                    {/* Własne role tej przestrzeni */}
                    <div className="mt-3 border-t border-neutral-200 pt-3">
                      <p className="text-[11px] font-semibold text-neutral-600">Własne role (tylko u tego klienta)</p>
                      {s.customRoles.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {s.customRoles.map((r) => (
                            <span key={r.value} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                              {r.label}
                              <button type="button" onClick={() => handleRemoveRole(s.id, r.value)} className="text-amber-600 hover:text-amber-900" title="Usuń rolę">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Input className="h-8 w-52 text-xs" placeholder="np. Koordynator sali" value={newRole[s.id] ?? ""}
                          onChange={(e) => setNewRole((p) => ({ ...p, [s.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRole(s.id); } }} />
                        <Button size="sm" variant="outline" onClick={() => handleAddRole(s.id)} disabled={!(newRole[s.id] ?? "").trim()}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Dodaj rolę
                        </Button>
                      </div>
                    </div>
                    <Button size="sm" className="mt-3" onClick={() => handleAddMember(s.id)} disabled={!memberForm.email.trim()}>
                      <UserPlus className="mr-1 h-3.5 w-3.5" /> Utwórz konto
                    </Button>
                    {memberCreds[s.id] && (
                      <div className="mt-3">
                        <Credentials email={memberCreds[s.id].email} password={memberCreds[s.id].password} loginUrl={s.loginUrl} />
                      </div>
                    )}
                  </div>
                )}
                {assignFor === s.id && (
                  <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs font-semibold text-neutral-700">Przypisz proces-wzorzec z biblioteki</p>
                    {templates.length === 0 ? (
                      <p className="mt-2 text-[11px] text-neutral-500">
                        Biblioteka jest pusta — najpierw zbuduj proces w „Otwórz bibliotekę”.
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select
                          value={assignPick[s.id] ?? ""}
                          onChange={(e) => setAssignPick((p) => ({ ...p, [s.id]: e.target.value }))}
                          className="h-8 min-w-[220px] rounded-md border border-neutral-300 bg-white px-2 text-xs"
                        >
                          <option value="">— wybierz proces —</option>
                          {templates.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.nodeCount} kroków)</option>
                          ))}
                        </select>
                        <Button size="sm" onClick={() => handleAssign(s.id)} disabled={!assignPick[s.id] || assigning === s.id}>
                          {assigning === s.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="mr-1 h-3.5 w-3.5" />}
                          Przypisz do „{s.name}”
                        </Button>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-neutral-400">
                      Proces zostanie skopiowany do przestrzeni klienta — klient dostaje własną, niezależną kopię.
                    </p>
                  </div>
                )}
                {resetInfo[s.id] && (
                  <div className="mt-3">
                    <Credentials email={resetInfo[s.id].email} password={resetInfo[s.id].password} loginUrl={s.loginUrl} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-[11px] text-neutral-400">
        „Wejdź w przestrzeń” (przełączanie organizacji jako serviceUser) dodajemy w kolejnym kroku.
      </p>
    </div>
  );
}
