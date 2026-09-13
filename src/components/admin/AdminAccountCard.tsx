"use client";

import { useState } from "react";
import { changeOwnPassword } from "@/lib/actions/auth.actions";

export function AdminAccountCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) {
      setMsg({ ok: false, text: "Nowe hasło musi mieć co najmniej 8 znaków." });
      return;
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: "Nowe hasła nie są takie same." });
      return;
    }
    setBusy(true);
    const res = await changeOwnPassword({ currentPassword: current, newPassword: next });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Hasło zostało zmienione." });
      setCurrent("");
      setNext("");
      setConfirm("");
      setOpen(false);
    } else {
      setMsg({ ok: false, text: res.error ?? "Nie udało się zmienić hasła." });
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Twoje konto</p>
          <p className="text-sm font-semibold text-neutral-900">{email}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setMsg(null);
          }}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
        >
          {open ? "Anuluj" : "Zmień hasło"}
        </button>
      </div>

      {msg && !open && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>
      )}

      {open && (
        <form onSubmit={submit} className="mt-4 grid max-w-md gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-neutral-700">Obecne hasło</span>
            <input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-neutral-700">Nowe hasło (min. 8 znaków)</span>
            <input
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-neutral-700">Powtórz nowe hasło</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              required
            />
          </label>
          {msg && <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
          <div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1e293b] disabled:opacity-60"
            >
              {busy ? "Zapisywanie…" : "Zapisz nowe hasło"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
