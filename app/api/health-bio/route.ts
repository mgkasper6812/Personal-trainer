import { requireUser } from "@/lib/auth";
import { getHealthBio, getProfile, saveHealthBio } from "@/lib/data";
import { bad, body, handle, ok } from "@/lib/http";
import type { HealthBio, LabResult, Medication } from "@/lib/types";

// The health bio is private: always the signed-in user's own, never another family member's.
const strs = (v: unknown, n = 30, len = 80) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x: string) => x.trim().slice(0, len)).slice(0, n) : []);
const str = (v: unknown, len = 2000) => (typeof v === "string" ? v.slice(0, len) : "");

export const GET = handle(async () => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Not available", 403);
  const bio = await getHealthBio(me.id);
  if (bio) return ok({ bio });
  // First visit: pre-fill from setup answers
  const p = await getProfile(me.id);
  const conditions: string[] = [];
  if (p?.kind === "adult") {
    if (p.glucoseStatus === "prediabetic" || p.glucoseStatus === "both") conditions.push("Prediabetes");
    if (p.glucoseStatus === "insulin_resistant" || p.glucoseStatus === "both") conditions.push("Insulin resistance");
    conditions.push(...p.conditions.filter((c) => c !== "None"));
  }
  const draft: HealthBio = {
    conditions,
    medications: p?.kind === "adult" ? p.meds.filter((m) => !["None", "Other", "Prefer not to say"].includes(m)).map((name) => ({ name, dose: "", timing: "", purpose: "" })) : [],
    supplements: "", allergies: [], dislikes: [], dietStyle: [], alcohol: "", doctor: "", notes: "",
    labs: p?.kind === "adult" && p.a1c ? [{ name: "A1C", value: p.a1c, unit: "%", date: "" }] : [],
    updatedAt: "",
  };
  return ok({ bio: draft, draft: true });
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Not available", 403);
  const b = await body<HealthBio>(req);
  const meds: Medication[] = (Array.isArray(b.medications) ? b.medications : []).slice(0, 20)
    .map((m) => ({ name: str(m?.name, 80).trim(), dose: str(m?.dose, 60), timing: str(m?.timing, 60), purpose: str(m?.purpose, 80) }))
    .filter((m) => m.name);
  const labs: LabResult[] = (Array.isArray(b.labs) ? b.labs : []).slice(0, 40)
    .map((l) => ({ name: str(l?.name, 40).trim(), value: Number(l?.value), unit: str(l?.unit, 20), date: str(l?.date, 10) }))
    .filter((l) => l.name && Number.isFinite(l.value));
  const bio: HealthBio = {
    conditions: strs(b.conditions), medications: meds, supplements: str(b.supplements, 500),
    allergies: strs(b.allergies), dislikes: strs(b.dislikes), dietStyle: strs(b.dietStyle), alcohol: str(b.alcohol, 200),
    labs, doctor: str(b.doctor, 200), notes: str(b.notes, 2000), updatedAt: new Date().toISOString(),
  };
  await saveHealthBio(me.id, bio);
  return ok({ bio });
});
