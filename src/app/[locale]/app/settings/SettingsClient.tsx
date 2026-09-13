"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CategoryConfigurator } from "@/components/eventboard/CategoryConfigurator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Save, ExternalLink, Copy, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateOrganization, createEventCategory, updateEventCategory, deleteEventCategory, getEventCategories } from "@/lib/actions/organization.actions";

interface CategoryData { id?: string; name: string; icon: string; color: string; modules: string[]; isSystem: boolean; }

export interface OrgProfile {
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  capacity: string;
  priceRange: string;
}

export function SettingsClient({ orgId, orgName: initialName, orgSlug, categories: initialCats, profile: initialProfile }: { orgId: string; orgName: string; orgSlug: string; categories: CategoryData[]; profile: OrgProfile }) {
  const t = useTranslations("eventboard");
  const [name, setName] = useState(initialName);
  const [categories, setCategories] = useState(initialCats);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<OrgProfile>(initialProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/org/${orgSlug}`
      : `/org/${orgSlug}`;

  const reload = async () => {
    const cats = await getEventCategories(orgId);
    setCategories(cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? "Sparkles", color: c.color ?? "#64748b", modules: c.modulesJson ? JSON.parse(c.modulesJson as string) : [], isSystem: c.isSystem })));
  };

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-slate-900">{t("settings")}</h1><p className="text-slate-500 mt-1">{t("settingsDesc")}</p></div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-slate-500" />Organizacja</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1"><Label className="text-sm font-medium">Nazwa organizacji</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
            <Button onClick={async () => { setSaving(true); await updateOrganization(orgId, { name: name.trim() }); setSaving(false); }} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Save className="h-4 w-4 mr-1" />{saving ? "..." : "Zapisz"}
            </Button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Label className="text-sm font-medium">Profil publiczny</Label>
            <p className="text-xs text-slate-500 mt-1">
              Udostępnij ten link klientom, aby mogli wysłać zapytanie ofertowe:
            </p>
            {/* Pełny adres z możliwością skopiowania — sama ścieżka zmuszała
                do ręcznego doklejania domeny przed wysłaniem klientowi. */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={`/org/${orgSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {publicUrl}
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    toast.error("Nie udało się skopiować");
                  }
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? "Skopiowano" : "Kopiuj"}
              </Button>
            </div>

            {/* Dane wizytówki. Strona /org/<slug> pokazuje je od dawna,
                ale nie było ich gdzie wprowadzić. */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium text-slate-600">Adres</Label>
                <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="ul. Kwiatowa 12" className="mt-1" />
              </div>
              <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Kod</Label>
                  <Input value={profile.postalCode} onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })} placeholder="00-001" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Miasto</Label>
                  <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="Warszawa" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Telefon</Label>
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="600 100 200" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">E-mail</Label>
                <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="kontakt@sala.pl" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Strona www</Label>
                <Input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://sala.pl" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Pojemność</Label>
                  <Input type="number" min={1} value={profile.capacity} onChange={(e) => setProfile({ ...profile, capacity: e.target.value })} placeholder="180" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Przedział cenowy</Label>
                  <Input value={profile.priceRange} onChange={(e) => setProfile({ ...profile, priceRange: e.target.value })} placeholder="250–400 zł/os." className="mt-1" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-slate-600">Opis</Label>
                <Textarea
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Krótko o obiekcie — co wyróżnia salę, na jakie imprezy jest przygotowana."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                onClick={async () => {
                  setSavingProfile(true);
                  try {
                    await updateOrganization(orgId, {
                      address: profile.address.trim() || null,
                      city: profile.city.trim() || null,
                      postalCode: profile.postalCode.trim() || null,
                      phone: profile.phone.trim() || null,
                      email: profile.email.trim() || null,
                      website: profile.website.trim() || null,
                      description: profile.description.trim() || null,
                      capacity: profile.capacity ? Number(profile.capacity) : null,
                      priceRange: profile.priceRange.trim() || null,
                    });
                    toast.success("Profil publiczny zapisany");
                  } catch {
                    toast.error("Nie udało się zapisać profilu");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                disabled={savingProfile}
                variant="outline"
                size="sm"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                {savingProfile ? "Zapisywanie..." : "Zapisz profil"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("eventCategories")}</CardTitle><p className="text-sm text-slate-500">{t("categoriesDesc")}</p></CardHeader>
        <CardContent>
          <CategoryConfigurator
            categories={categories}
            onCreate={async (data) => { await createEventCategory(orgId, { name: data.name, icon: data.icon, color: data.color, modulesJson: JSON.stringify(data.modules) }); await reload(); }}
            onUpdate={async (id, data) => { await updateEventCategory(id, { name: data.name, icon: data.icon, color: data.color, modulesJson: data.modules ? JSON.stringify(data.modules) : undefined }); await reload(); }}
            onDelete={async (id) => { await deleteEventCategory(id); await reload(); }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
