"use strict";

// ---------------- Storage ----------------
const KEY = "family-trainer-v1";
const DEFAULT = {
  me: { profile: { sex: "m", age: "", ft: "", inch: "", startWeight: "", goalWeight: "",
                   activity: "1.375", rate: "1", startDate: "", stepGoal: 8000 },
        logs: {}, done: {} },
  mc: { profile: { startDate: "", position: "OF", commitments: "" },
        done: {}, checkins: {}, bench: [] },
};
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.me && s.mc) return s;
  } catch (e) {}
  return structuredClone(DEFAULT);
}
let state = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

// ---------------- Date helpers ----------------
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysBetween = (a, b) => Math.round((parse(iso(b)) - parse(iso(a))) / 86400000);
const today = () => iso(new Date());
const fmt = (d, opts = { weekday: "short", month: "short", day: "numeric" }) =>
  (typeof d === "string" ? parse(d) : d).toLocaleDateString(undefined, opts);
function nextMonday(d = new Date()) {
  const x = parse(iso(d)); const dow = x.getDay();
  return dow === 1 ? x : addDays(x, (8 - dow) % 7);
}
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = s => document.querySelector(s);

// ---------------- Tabs ----------------
document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("active", x === b));
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.id === "tab-" + b.dataset.tab));
  try { localStorage.setItem(KEY + "-tab", b.dataset.tab); } catch (e) {}
}));
try { const t = localStorage.getItem(KEY + "-tab"); if (t) document.querySelector(`.tabs [data-tab="${t}"]`)?.click(); } catch (e) {}

// ---------------- Form helpers ----------------
function fillForm(form, obj) {
  for (const el of form.elements) if (el.name && obj[el.name] !== undefined) el.value = obj[el.name];
}
function readForm(form) {
  const o = {};
  for (const el of form.elements) if (el.name) o[el.name] = el.value.trim();
  return o;
}

// =====================================================================
// ME — weight loss
// =====================================================================
function meTargets() {
  const p = state.me.profile;
  const latest = latestWeight() ?? Number(p.startWeight);
  const hIn = Number(p.ft) * 12 + Number(p.inch || 0);
  if (!latest || !hIn || !p.age) return null;
  const kg = latest * 0.453592, cm = hIn * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * Number(p.age) + (p.sex === "m" ? 5 : -161);
  const tdee = bmr * Number(p.activity);
  const floor = p.sex === "m" ? 1500 : 1200;
  const raw = tdee - Number(p.rate) * 500;
  const calories = Math.max(floor, Math.round(raw / 10) * 10);
  const goal = Number(p.goalWeight) || latest;
  const protein = Math.round(Math.min(latest, goal + 20) * 0.9 / 5) * 5;
  const effRate = (tdee - calories) / 500;
  const toLose = Math.max(0, latest - goal);
  const weeks = effRate > 0 ? toLose / effRate : null;
  const bmi = latest / (hIn * hIn) * 703;
  return { bmr, tdee, calories, protein, toLose, weeks, latest, goal, bmi, floored: raw < floor };
}
function weightSeries() {
  return Object.entries(state.me.logs)
    .filter(([, v]) => v.weight).map(([d, v]) => ({ d, w: Number(v.weight) }))
    .sort((a, b) => a.d.localeCompare(b.d));
}
function latestWeight() { const s = weightSeries(); return s.length ? s[s.length - 1].w : null; }
function avg7(series, i) {
  const end = parse(series[i].d);
  const win = series.filter(p => { const k = daysBetween(parse(p.d), end); return k >= 0 && k < 7; });
  return win.reduce((a, p) => a + p.w, 0) / win.length;
}

function renderMe() {
  const p = state.me.profile;
  fillForm($("#me-profile"), p);
  const t = meTargets();
  const s = $("#me-summary");
  if (!t) {
    s.innerHTML = `<h2>Let's set you up</h2><p>Fill in <b>My numbers</b> at the bottom of this page (age, height, current weight, goal) and I'll calculate your daily calorie and protein targets.</p>`;
  } else {
    const series = weightSeries();
    const start = Number(p.startWeight) || (series[0]?.w ?? t.latest);
    const trend = series.length ? avg7(series, series.length - 1) : t.latest;
    const lost = start - trend;
    const pct = start > t.goal ? Math.min(100, Math.max(0, lost / (start - t.goal) * 100)) : 0;
    const eta = t.weeks != null ? fmt(addDays(new Date(), Math.ceil(t.weeks * 7)), { month: "short", day: "numeric", year: "numeric" }) : "—";
    s.innerHTML = `
      <div class="stats">
        <div class="stat"><span class="big">${t.calories.toLocaleString()}</span><span>calories / day</span></div>
        <div class="stat"><span class="big">${t.protein}g</span><span>protein / day</span></div>
        <div class="stat"><span class="big">${Number(p.stepGoal || 8000).toLocaleString()}</span><span>steps / day</span></div>
      </div>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div class="row-between small">
        <span><b>${lost >= 0 ? lost.toFixed(1) : "+" + (-lost).toFixed(1)} lb</b> ${lost >= 0 ? "down" : "up"} (7-day avg ${trend.toFixed(1)})</span>
        <span>Goal ${t.goal} lb · ~${eta}</span>
      </div>
      <p class="muted small">Maintenance ≈ ${Math.round(t.tdee).toLocaleString()} cal. BMI ${t.bmi.toFixed(1)}.
      ${t.floored ? "Your target hit the safe minimum, so expect a slightly slower rate than selected — that's fine." : ""}</p>`;
  }
  renderMeDay();
  renderMeChart();
  renderMeWeek();
}

function renderMeDay() {
  const date = $("#me-date").value;
  const form = $("#me-log");
  form.reset();
  fillForm(form, state.me.logs[date] || {});
  const log = state.me.logs[date] || {}, t = meTargets(), p = state.me.profile;
  const checks = [];
  if (t && log.calories) checks.push([Number(log.calories) <= t.calories + 50, `Calories ${log.calories}/${t.calories}`]);
  if (t && log.protein) checks.push([Number(log.protein) >= t.protein - 10, `Protein ${log.protein}/${t.protein}g`]);
  if (log.steps) checks.push([Number(log.steps) >= Number(p.stepGoal || 8000), `Steps ${Number(log.steps).toLocaleString()}`]);
  if (log.sleep) checks.push([Number(log.sleep) >= 7, `Sleep ${log.sleep}h`]);
  const done = (state.me.done[date] || []).length, total = ME_WEEK[parse(date).getDay()].items.length;
  checks.push([done === total, `Workout ${done}/${total}`]);
  $("#me-day-score").innerHTML = `<div class="chips">${checks.map(([ok, l]) => `<span class="chip ${ok ? "ok" : ""}">${ok ? "✓" : "○"} ${esc(l)}</span>`).join("")}</div>`;

  const day = ME_WEEK[parse(date).getDay()];
  const doneSet = new Set(state.me.done[date] || []);
  $("#me-workout").innerHTML = `<h3 class="tag ${day.type}">${esc(day.title)}</h3>` +
    `<ul class="checklist">${day.items.map((it, i) =>
      `<li><label><input type="checkbox" data-i="${i}" ${doneSet.has(i) ? "checked" : ""}><span>${esc(it)}</span></label></li>`).join("")}</ul>`;
  $("#me-workout").querySelectorAll("input").forEach(cb => cb.addEventListener("change", () => {
    const set = new Set(state.me.done[date] || []);
    cb.checked ? set.add(+cb.dataset.i) : set.delete(+cb.dataset.i);
    state.me.done[date] = [...set]; save(); renderMeDay();
  }));
}

function renderMeChart() {
  const series = weightSeries().slice(-90);
  const el = $("#me-chart");
  if (series.length < 2) { el.innerHTML = `<p class="muted">Log at least two weigh-ins to see your trend.</p>`; return; }
  const W = 600, H = 220, P = { l: 40, r: 10, t: 10, b: 24 };
  const t0 = parse(series[0].d), span = Math.max(1, daysBetween(t0, parse(series[series.length - 1].d)));
  const goal = Number(state.me.profile.goalWeight);
  const ws = series.map(p => p.w);
  let lo = Math.min(...ws), hi = Math.max(...ws);
  if (goal && goal > lo - 10) lo = Math.min(lo, goal);
  lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
  const x = d => P.l + daysBetween(t0, parse(d)) / span * (W - P.l - P.r);
  const y = w => P.t + (hi - w) / (hi - lo) * (H - P.t - P.b);
  const avgPts = series.map((p, i) => `${x(p.d).toFixed(1)},${y(avg7(series, i)).toFixed(1)}`).join(" ");
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend">
    ${ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${P.l - 6}" y="${y(v) + 4}" text-anchor="end" class="axis">${v}</text>`).join("")}
    ${goal && goal >= lo ? `<line x1="${P.l}" x2="${W - P.r}" y1="${y(goal)}" y2="${y(goal)}" class="goal"/><text x="${W - P.r}" y="${y(goal) - 4}" text-anchor="end" class="axis">goal ${goal}</text>` : ""}
    ${series.map(p => `<circle cx="${x(p.d)}" cy="${y(p.w)}" r="3" class="dot"/>`).join("")}
    <polyline points="${avgPts}" class="trend"/>
    <text x="${P.l}" y="${H - 6}" class="axis">${fmt(series[0].d, { month: "short", day: "numeric" })}</text>
    <text x="${W - P.r}" y="${H - 6}" text-anchor="end" class="axis">${fmt(series[series.length - 1].d, { month: "short", day: "numeric" })}</text>
  </svg>`;
}

function renderMeWeek() {
  const todayDow = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  $("#me-week").innerHTML = `<ul class="week">${order.map(d =>
    `<li class="${d === todayDow ? "today" : ""}"><b>${names[d]}</b><span class="tag ${ME_WEEK[d].type}">${esc(ME_WEEK[d].title)}</span></li>`).join("")}</ul>
    <h3>Daily rules</h3><ul class="rules">${ME_RULES.map(r => `<li>${esc(r)}</li>`).join("")}</ul>`;
}

$("#me-date").value = today();
$("#me-date").addEventListener("change", renderMeDay);
$("#me-log").addEventListener("submit", e => {
  e.preventDefault();
  const date = $("#me-date").value, v = readForm(e.target);
  Object.keys(v).forEach(k => v[k] === "" && delete v[k]);
  state.me.logs[date] = v;
  if (!state.me.profile.startWeight && v.weight) state.me.profile.startWeight = v.weight;
  save(); renderMe(); toast("Saved");
});
$("#me-profile").addEventListener("submit", e => {
  e.preventDefault();
  state.me.profile = { ...state.me.profile, ...readForm(e.target) };
  if (!state.me.profile.startDate) state.me.profile.startDate = today();
  const sw = state.me.profile.startWeight;
  if (sw && !state.me.logs[state.me.profile.startDate]?.weight)
    state.me.logs[state.me.profile.startDate] = { ...(state.me.logs[state.me.profile.startDate] || {}), weight: sw };
  save(); renderMe(); toast("Targets updated"); window.scrollTo({ top: 0, behavior: "smooth" });
});

// =====================================================================
// MAICIE — softball off-season
// =====================================================================
const PROGRAM_WEEKS = 12;
function mcStart() {
  if (!state.mc.profile.startDate) { state.mc.profile.startDate = iso(nextMonday()); save(); }
  return parse(state.mc.profile.startDate);
}
function mcWeekOf(date) {
  const k = daysBetween(mcStart(), parse(date));
  return k < 0 ? 0 : Math.floor(k / 7) + 1; // 0 = before start, >12 = after
}
const phaseFor = wk => PHASES.find(p => p.weeks.includes(Math.min(Math.max(wk, 1), PROGRAM_WEEKS)));

function positionBlock(block) {
  const pos = state.mc.profile.position;
  if (block.name !== "Outfield footwork" || pos === "OF") return block;
  if (pos === "IF") return { name: "Infield footwork", items: [
    ["Pre-pitch / first-step reactions", R("6 / side","8 / side","8 / side","6 / side")],
    ["Ground balls: forehand, backhand, slow roller", R("15 reps","20 reps","20 reps","20 game-speed")],
    ["Double-play feeds & turns", R("10 reps","12 reps","12 reps","15 reps")],
  ]};
  return { name: "Catcher footwork", items: [
    ["Blocking drills (L/R/center)", R("3 × 5","4 × 5","4 × 5","3 × 5")],
    ["Throw-down footwork (pop time)", R("10 dry reps","12 reps","10 max-intent","10 reps")],
    ["Framing reps", R("30","40","40","30")],
  ]};
}

function mcSession(date) {
  const wk = mcWeekOf(date);
  const day = MC_WEEK[parse(date).getDay()];
  const ph = phaseFor(wk);
  const deload = DELOAD_WEEKS.includes(wk);
  const blocks = day.blocks.map(positionBlock).map((b, bi) => ({
    name: b.name,
    items: b.items.map(([n, rx], ii) => ({ key: `${bi}.${ii}`, name: n, rx: rx[ph.key] }))
                 .filter(it => it.rx && it.rx !== "—"),
  })).filter(b => b.items.length);
  return { wk, ph, deload, day, blocks };
}

function renderMcSummary() {
  const wk = mcWeekOf(today());
  const start = mcStart(), end = addDays(start, PROGRAM_WEEKS * 7 - 1);
  const el = $("#mc-summary");
  let head;
  if (wk === 0) head = `<h2>Starts ${fmt(start)}</h2><p>${daysBetween(new Date(), start)} days to go. Use this week to rest up, get her a band and med ball, and run the week-1 benchmark tests.</p>`;
  else if (wk > PROGRAM_WEEKS) head = `<h2>Program complete 🎉</h2><p>Finished ${fmt(end)}. Retest benchmarks and set a new start date for the next block.</p>`;
  else {
    const ph = phaseFor(wk);
    head = `<h2>Week ${wk} of ${PROGRAM_WEEKS} · <span style="color:${ph.color}">${ph.name}</span>${DELOAD_WEEKS.includes(wk) ? " · deload" : ""}</h2><p>${esc(ph.goal)}</p>`;
  }
  const weeklyDone = mcWeekCompletion(wk);
  el.innerHTML = head + `
    <div class="phasebar">${PHASES.map(p => `<div style="flex:${p.weeks.length};background:${p.color}" class="${p.weeks.includes(wk) ? "cur" : ""}" title="${p.name}">${p.name}</div>`).join("")}</div>
    <div class="phasebar-marker"><div style="left:${Math.min(100, Math.max(0, (wk - 0.5) / PROGRAM_WEEKS * 100))}%"></div></div>
    <div class="row-between small"><span>${fmt(start)}</span><span>${wk >= 1 && wk <= 12 ? `This week: ${weeklyDone.done}/${weeklyDone.total} drills done` : ""}</span><span>${fmt(end)}</span></div>
    ${state.mc.profile.commitments ? `<p class="small muted">Team commitments: ${esc(state.mc.profile.commitments)} — on those days, skip the matching hitting/throwing block.</p>` : ""}`;
}

function mcWeekCompletion(wk) {
  if (wk < 1 || wk > PROGRAM_WEEKS) return { done: 0, total: 0 };
  const ws = addDays(mcStart(), (wk - 1) * 7);
  let done = 0, total = 0;
  for (let i = 0; i < 7; i++) {
    const d = iso(addDays(ws, i)), s = mcSession(d);
    if (!s.day.minutes) continue;
    total += s.blocks.reduce((a, b) => a + b.items.length, 0);
    done += (state.mc.done[d] || []).length;
  }
  return { done, total };
}

function renderMcDay() {
  const date = $("#mc-date").value;
  const s = mcSession(date);
  $("#mc-day-title").textContent = date === today() ? "Today" : fmt(date);
  const doneSet = new Set(state.mc.done[date] || []);
  const outside = s.wk === 0 ? `<p class="note">Before the program starts — preview of week 1.</p>`
    : s.wk > PROGRAM_WEEKS ? `<p class="note">After the program — showing pre-season loads.</p>` : "";
  const total = s.blocks.reduce((a, b) => a + b.items.length, 0);
  $("#mc-session").innerHTML = `${outside}
    <h3>${esc(s.day.title)}</h3>
    <p class="small muted">${s.day.minutes ? `~${s.day.minutes} min · ` : ""}Week ${Math.min(Math.max(s.wk, 1), 12)} · ${s.ph.name}${s.deload ? ` · <b>Deload: cut sets by a third, keep weights light</b>` : ""}</p>
    ${s.blocks.map(b => `<h4>${esc(b.name)}</h4><ul class="checklist">${b.items.map(it =>
      `<li><label><input type="checkbox" data-k="${it.key}" ${doneSet.has(it.key) ? "checked" : ""}><span>${esc(it.name)}</span><em>${esc(it.rx)}</em></label></li>`).join("")}</ul>`).join("")}
    ${s.day.minutes ? `<p class="small">${doneSet.size}/${total} done</p>` : ""}`;
  $("#mc-session").querySelectorAll("input").forEach(cb => cb.addEventListener("change", () => {
    const set = new Set(state.mc.done[date] || []);
    cb.checked ? set.add(cb.dataset.k) : set.delete(cb.dataset.k);
    state.mc.done[date] = [...set]; save(); renderMcDay(); renderMcSummary(); renderMcCalendar();
  }));

  const form = $("#mc-checkin"); form.reset();
  fillForm(form, state.mc.checkins[date] || {});
  renderReadiness(date);
}

function renderReadiness(date) {
  const c = state.mc.checkins[date];
  const el = $("#mc-readiness");
  if (!c) { el.innerHTML = ""; return; }
  const flags = [];
  if (c.arm && Number(c.arm) <= 2) flags.push("Arm feels rough — no long toss or max-intent throws today. Do band work only. If it's pain (sharp, in the elbow, or lasting), see a doctor/trainer.");
  if (c.sleep && Number(c.sleep) < 7) flags.push("Short on sleep — keep the session, but drop one set from each lift and skip max sprints.");
  if (c.soreness && Number(c.soreness) >= 4) flags.push("Very sore — swap today for the Wednesday recovery session.");
  if (c.energy && Number(c.energy) <= 2) flags.push("Low energy — shorten the session and make sure she's eating enough (especially carbs and protein around training).");
  el.innerHTML = flags.length ? `<div class="warn">${flags.map(f => `<p>${esc(f)}</p>`).join("")}</div>`
    : `<p class="okmsg">Good to go — full session as written.</p>`;
}

function renderMcCalendar() {
  const start = mcStart(), cur = mcWeekOf(today());
  let html = `<div class="cal"><div class="cal-h"></div>${["M", "T", "W", "T", "F", "S", "S"].map(d => `<div class="cal-h">${d}</div>`).join("")}`;
  for (let w = 1; w <= PROGRAM_WEEKS; w++) {
    const ph = phaseFor(w);
    html += `<div class="cal-wk" style="border-color:${ph.color}" title="${ph.name}">W${w}</div>`;
    for (let i = 0; i < 7; i++) {
      const d = iso(addDays(start, (w - 1) * 7 + i)), s = mcSession(d);
      const tot = s.blocks.reduce((a, b) => a + b.items.length, 0), dn = (state.mc.done[d] || []).length;
      const cls = !s.day.minutes ? "off" : dn >= tot ? "full" : dn > 0 ? "part" : d < today() ? "miss" : "";
      html += `<button class="cal-d ${cls} ${d === today() ? "now" : ""} ${d === $("#mc-date").value ? "sel" : ""}" data-d="${d}" title="${fmt(d)} – ${esc(s.day.title)}">${parse(d).getDate()}</button>`;
    }
  }
  html += `</div><p class="small muted">Tap a day to open it. <span class="lg full"></span> done <span class="lg part"></span> partial <span class="lg miss"></span> missed. ${cur >= 1 && cur <= 12 ? "" : ""}</p>`;
  $("#mc-calendar").innerHTML = html;
  $("#mc-calendar").querySelectorAll(".cal-d").forEach(b => b.addEventListener("click", () => {
    $("#mc-date").value = b.dataset.d; renderMcDay(); renderMcCalendar();
    $("#mc-day-title").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

function renderMcBench() {
  const sel = $("#mc-bench-form [name=test]");
  if (!sel.options.length) sel.innerHTML = BENCHMARKS.map(b => `<option value="${b.key}">${esc(b.name)} (${b.unit})</option>`).join("");
  const rows = BENCHMARKS.map(b => {
    const r = state.mc.bench.filter(x => x.test === b.key).sort((a, c) => a.date.localeCompare(c.date));
    if (!r.length) return `<tr><td>${esc(b.name)}</td><td class="muted">—</td><td class="muted">—</td><td></td></tr>`;
    const first = r[0].value, last = r[r.length - 1].value, diff = last - first;
    const good = b.lowerBetter == null ? null : (b.lowerBetter ? diff < 0 : diff > 0);
    const d = r.length > 1 ? `<span class="${good === null ? "" : good ? "up" : diff === 0 ? "" : "down"}">${diff > 0 ? "+" : ""}${+diff.toFixed(2)}</span>` : "";
    return `<tr><td>${esc(b.name)}</td><td>${first} ${b.unit}</td><td><b>${last}</b> ${b.unit}</td><td>${d}</td></tr>`;
  }).join("");
  $("#mc-bench").innerHTML = `<table class="bench"><thead><tr><th>Test</th><th>First</th><th>Latest</th><th>Δ</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderMc() {
  fillForm($("#mc-profile"), state.mc.profile);
  renderMcSummary(); renderMcDay(); renderMcCalendar(); renderMcBench();
}

$("#mc-date").value = today();
$("#mc-date").addEventListener("change", () => { renderMcDay(); renderMcCalendar(); });
$("#mc-checkin").addEventListener("submit", e => {
  e.preventDefault();
  state.mc.checkins[$("#mc-date").value] = readForm(e.target);
  save(); renderReadiness($("#mc-date").value); toast("Check-in saved");
});
$("#mc-bench-form [name=date]").value = today();
$("#mc-bench-form").addEventListener("submit", e => {
  e.preventDefault();
  const v = readForm(e.target);
  if (v.value === "") return;
  state.mc.bench.push({ test: v.test, value: Number(v.value), date: v.date || today() });
  save(); renderMcBench(); e.target.value.value = ""; toast("Result added");
});
$("#mc-profile").addEventListener("submit", e => {
  e.preventDefault();
  const v = readForm(e.target);
  if (v.startDate && parse(v.startDate).getDay() !== 1) {
    v.startDate = iso(addDays(parse(v.startDate), -((parse(v.startDate).getDay() + 6) % 7)));
    toast("Moved start to that week's Monday");
  } else toast("Saved");
  state.mc.profile = { ...state.mc.profile, ...v };
  save(); renderMc();
});

// =====================================================================
// Settings
// =====================================================================
$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `trainer-backup-${today()}.json`; a.click();
});
$("#import").addEventListener("change", async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const s = JSON.parse(await f.text());
    if (!s.me || !s.mc) throw new Error("bad file");
    state = s; save(); renderAll(); toast("Backup restored");
  } catch (err) { alert("That doesn't look like a Family Trainer backup file."); }
});
$("#reset").addEventListener("click", () => {
  if (!confirm("Erase ALL data for both of you? Export a backup first if unsure.")) return;
  state = structuredClone(DEFAULT); save(); renderAll();
});

function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1600);
}

function renderAll() { renderMe(); renderMc(); }
renderAll();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
