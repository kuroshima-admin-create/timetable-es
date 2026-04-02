import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ============================================================
// CONSTANTS — 小学校版（複式学級対応）
// ============================================================
const MEXT = {
  1: { 国語: 306, 算数: 136, 生活: 102, 音楽: 68, 図画工作: 68, 体育: 102, 道徳: 34, 特別活動: 34 },
  2: { 国語: 315, 算数: 175, 生活: 105, 音楽: 70, 図画工作: 70, 体育: 105, 道徳: 35, 特別活動: 35 },
  3: { 国語: 245, 社会: 70, 算数: 175, 理科: 90, 音楽: 60, 図画工作: 60, 体育: 105, 外国語活動: 35, 道徳: 35, 特別活動: 35, 総合: 70 },
  4: { 国語: 245, 社会: 90, 算数: 175, 理科: 105, 音楽: 60, 図画工作: 60, 体育: 105, 外国語活動: 35, 道徳: 35, 特別活動: 35, 総合: 70 },
  5: { 国語: 175, 社会: 100, 算数: 175, 理科: 105, 音楽: 50, 図画工作: 50, 家庭: 60, 体育: 90, 外国語: 70, 道徳: 35, 特別活動: 35, 総合: 70 },
  6: { 国語: 175, 社会: 105, 算数: 175, 理科: 105, 音楽: 50, 図画工作: 50, 家庭: 55, 体育: 90, 外国語: 70, 道徳: 35, 特別活動: 35, 総合: 70 },
};

function subjectsForGrade(grade) {
  const base = ["国語", "算数", "音楽", "図画工作", "体育", "道徳", "特別活動"];
  if (grade <= 2) return [...base, "生活"];
  if (grade <= 4) return [...base, "社会", "理科", "外国語活動", "総合"];
  return [...base, "社会", "理科", "家庭", "外国語", "総合"];
}

const ALL_SUBS_ES = [
  "国語", "社会", "算数", "理科", "生活",
  "音楽", "図画工作", "家庭", "体育",
  "外国語", "外国語活動",
  "道徳", "特別活動", "総合"
];
const NON_COUNT_SUBS = [
  "儀式", "文化", "健康安全", "旅行・宿泊",
  "勤労・奉仕", "児童会", "クラブ活動",
  "始業式", "終業式", "その他"
];
const ALL_SUBS = [...ALL_SUBS_ES, ...NON_COUNT_SUBS];
const ALL_DAYS = ["月", "火", "水", "木", "金", "土", "日"];
const PER = [1, 2, 3, 4, 5, 6];
const MAX_WK = 52;

const PTIMES_ES = {
  1: { start: "8:45", end: "9:25", label: "1校時", minutes: 40 },
  2: { start: "9:35", end: "10:15", label: "2校時", minutes: 40 },
  3: { start: "10:35", end: "11:15", label: "3校時", minutes: 40 },
  4: { start: "11:20", end: "12:00", label: "4校時", minutes: 40 },
  5: { start: "13:30", end: "14:10", label: "5校時", minutes: 40 },
  mod: { start: "14:15", end: "14:40", label: "ひらめき", minutes: 25 },
  6: { start: "14:45", end: "15:30", label: "6校時", minutes: 45 },
};
const PTIMES_DISPLAY = PER.map(p => `${PTIMES_ES[p].start}-${PTIMES_ES[p].end}`);

const MAX_PERIODS_BY_GRADE = { 1: 5, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6 };

const SC = {
  国語: { bg: "#fef3c7", tx: "#78350f", bd: "#f59e0b" },
  社会: { bg: "#dbeafe", tx: "#1e3a5f", bd: "#3b82f6" },
  算数: { bg: "#fce7f3", tx: "#831843", bd: "#ec4899" },
  理科: { bg: "#dcfce7", tx: "#064e3b", bd: "#22c55e" },
  生活: { bg: "#fff7ed", tx: "#9a3412", bd: "#fb923c" },
  音楽: { bg: "#ede9fe", tx: "#4c1d95", bd: "#8b5cf6" },
  図画工作: { bg: "#fef9c3", tx: "#713f12", bd: "#eab308" },
  家庭: { bg: "#e0e7ff", tx: "#312e81", bd: "#6366f1" },
  体育: { bg: "#ffedd5", tx: "#7c2d12", bd: "#f97316" },
  外国語: { bg: "#cffafe", tx: "#164e63", bd: "#06b6d4" },
  外国語活動: { bg: "#cffafe", tx: "#155e75", bd: "#22d3ee" },
  道徳: { bg: "#fce4ec", tx: "#880e4f", bd: "#e91e63" },
  特別活動: { bg: "#f3e5f5", tx: "#4a148c", bd: "#ab47bc" },
  総合: { bg: "#e8f5e9", tx: "#1b5e20", bd: "#4caf50" },
  儀式: { bg: "#fef2f2", tx: "#991b1b", bd: "#dc2626" },
  文化: { bg: "#fef2f2", tx: "#9a3412", bd: "#ea580c" },
  健康安全: { bg: "#fef2f2", tx: "#166534", bd: "#22c55e" },
  "旅行・宿泊": { bg: "#fef2f2", tx: "#1e40af", bd: "#3b82f6" },
  "勤労・奉仕": { bg: "#fef2f2", tx: "#6b21a8", bd: "#9333ea" },
  児童会: { bg: "#f0f0f0", tx: "#374151", bd: "#9ca3af" },
  クラブ活動: { bg: "#f0f0f0", tx: "#374151", bd: "#9ca3af" },
  始業式: { bg: "#fef2f2", tx: "#991b1b", bd: "#dc2626" },
  終業式: { bg: "#fef2f2", tx: "#991b1b", bd: "#dc2626" },
  その他: { bg: "#f0f0f0", tx: "#6b7280", bd: "#9ca3af" },
};
const EVT_TYPES = { 行事: { bg: "#dc2626", tx: "#fff" }, 研修: { bg: "#2563eb", tx: "#fff" }, 出張: { bg: "#7c3aed", tx: "#fff" }, その他: { bg: "#6b7280", tx: "#fff" } };
const DAY_JS_MAP = { 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6, 日: 0 };

// ============================================================
// HELPERS
// ============================================================
// modMode: "none" | "am" | "pm"
function calcCnt(period, modMode) {
  if (period === 6) {
    if (modMode === "pm") return (45 + 25) / 45;  // 午後反映: ≒1.56
    return 1.0;
  }
  // 1〜5校時 = 40分
  if (modMode === "am") return (40 + 25 / 5) / 45; // 午前反映: = 1.0
  return 40 / 45;                                    // なし: ≒0.89
}

function countForGrade(cell, grade, period, modMode) {
  if (!cell) return { subject: null, count: 0 };
  const cnt = calcCnt(period, modMode);
  if (cell.type === "split" && cell.grades) {
    const gs = cell.grades[grade];
    if (gs?.subject) return { subject: gs.subject, count: cnt };
    return { subject: null, count: 0 };
  }
  if (cell.subject) return { subject: cell.subject, count: cnt };
  return { subject: null, count: 0 };
}

function fmtCnt(v) { return (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, "") || "0"; }

const EMPTY_CELL = { _empty: true };
function isEmptyCell(v) { return v && v._empty === true; }

function getWeekMod(modSched, weekNum) {
  return modSched?.[weekNum] || {};
}

// ひらめき 3-mode helpers
const MOD_MODES = ["none", "am", "pm"];
const MOD_LABELS = { none: "なし", am: "午前", pm: "午後" };
const MOD_STYLES = {
  none: { bg: "#f5f3ef", border: "1px solid #e8e4de", color: "#ccc", label: "○ なし" },
  am:   { bg: "#dcfce7", border: "2px solid #22c55e", color: "#16a34a", label: "● 午前" },
  pm:   { bg: "#dbeafe", border: "2px solid #3b82f6", color: "#1d4ed8", label: "● 午後" },
};
function nextModMode(current) {
  const idx = MOD_MODES.indexOf(current || "none");
  return MOD_MODES[(idx + 1) % 3];
}

function emptyTT(days) {
  const t = {};
  days.forEach(d => { t[d] = {}; PER.forEach(p => { t[d][p] = null; }); });
  return t;
}

function mondayOfWeek(weekNum, semesterDates) {
  const s1Start = new Date(semesterDates.s1Start + "T00:00:00");
  const dow = s1Start.getDay();
  const firstMon = new Date(s1Start);
  if (dow === 0) firstMon.setDate(s1Start.getDate() + 1);
  else if (dow === 1) { /* already Monday */ }
  else firstMon.setDate(s1Start.getDate() - (dow - 1));
  const target = new Date(firstMon);
  target.setDate(firstMon.getDate() + (weekNum - 1) * 7);
  return target;
}

function weekDates(weekNum, semesterDates) {
  const mon = mondayOfWeek(weekNum, semesterDates);
  return ALL_DAYS.map((d, i) => {
    const dt = new Date(mon);
    dt.setDate(mon.getDate() + i);
    return dt;
  });
}

function fmtDate(d) { return `${d.getMonth() + 1}/${d.getDate()}`; }
function fmtWeekday(d) { return ["日", "月", "火", "水", "木", "金", "土"][d.getDay()]; }

function dateToWeekNum(date, semesterDates) {
  const s1Start = new Date(semesterDates.s1Start + "T00:00:00");
  const dow = s1Start.getDay();
  const firstMon = new Date(s1Start);
  if (dow === 0) firstMon.setDate(s1Start.getDate() + 1);
  else if (dow !== 1) firstMon.setDate(s1Start.getDate() - (dow - 1));
  const diff = Math.floor((date - firstMon) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}

function semesterOfWeek(weekNum, semesterDates) {
  const mon = mondayOfWeek(weekNum, semesterDates);
  const s2s = new Date(semesterDates.s2Start + "T00:00:00");
  const s3s = new Date(semesterDates.s3Start + "T00:00:00");
  if (mon >= s3s) return 3;
  if (mon >= s2s) return 2;
  return 1;
}

function resolveWeekTT(baseTT, overrides, weekNum, days) {
  const ovr = overrides[weekNum];
  const base = baseTT ? JSON.parse(JSON.stringify(baseTT)) : {};
  days.forEach(d => { if (!base[d]) { base[d] = {}; PER.forEach(p => { base[d][p] = null; }); } });
  if (!ovr) return base;
  days.forEach(d => {
    PER.forEach(p => {
      if (ovr[d]?.[p] !== undefined) {
        if (!base[d]) base[d] = {};
        base[d][p] = isEmptyCell(ovr[d][p]) ? null : ovr[d][p];
      }
    });
  });
  return base;
}

// Hour analysis — per grade within a class
function analyzeHoursForGrade(grade, classId, baseTT, overrides, modSched, upToWeek, activeDays, totalWeeks) {
  const std = MEXT[grade];
  const subs = subjectsForGrade(grade);
  const totals = {};
  subs.forEach(s => { totals[s] = 0; });
  for (let w = 1; w <= upToWeek; w++) {
    const tt = resolveWeekTT(baseTT, overrides, w, activeDays);
    const wMod = getWeekMod(modSched, w);
    activeDays.forEach(d => {
      PER.forEach(p => {
        if (p > MAX_PERIODS_BY_GRADE[grade]) return;
        const cell = tt[d]?.[p];
        const { subject, count } = countForGrade(cell, grade, p, wMod[d] || "none");
        if (subject && subs?.includes(subject)) {
          totals[subject] = (totals[subject] || 0) + count;
        }
      });
    });
  }
  const tw = totalWeeks || MAX_WK;
  return subs.map(s => {
    const done = Math.round(totals[s] * 100) / 100;
    const annual = std[s] || 0;
    const remaining = Math.round((annual - done) * 100) / 100;
    const remWeeks = tw - upToWeek;
    const neededPerWk = remWeeks > 0 ? Math.round(remaining / remWeeks * 100) / 100 : 0;
    const pct = annual > 0 ? Math.round(done / annual * 100) : 0;
    const weekCount = upToWeek || 1;
    const expectedPct = Math.round((weekCount / (totalWeeks || 35)) * 100);
    let sv = "ok";
    if (pct < expectedPct - 10) sv = "danger";
    else if (pct < expectedPct - 5) sv = "warning";
    return { subject: s, done, annual, remaining, pct, neededPerWk, severity: sv, expectedPct };
  });
}

// Non-counted subjects totals for a grade
function analyzeNonCountForGrade(grade, classId, baseTT, overrides, modSched, upToWeek, activeDays) {
  const totals = {};
  NON_COUNT_SUBS.forEach(s => { totals[s] = 0; });
  for (let w = 1; w <= upToWeek; w++) {
    const tt = resolveWeekTT(baseTT, overrides, w, activeDays);
    const wMod = getWeekMod(modSched, w);
    activeDays.forEach(d => {
      PER.forEach(p => {
        if (p > MAX_PERIODS_BY_GRADE[grade]) return;
        const cell = tt[d]?.[p];
        const { subject, count } = countForGrade(cell, grade, p, wMod[d] || "none");
        if (subject && NON_COUNT_SUBS?.includes(subject)) {
          totals[subject] = (totals[subject] || 0) + count;
        }
      });
    });
  }
  return NON_COUNT_SUBS.filter(s => totals[s] > 0).map(s => ({
    subject: s, done: Math.round(totals[s] * 100) / 100
  }));
}

// ICS parser
function parseICS(text) {
  const events = []; let cur = null;
  text.split("\n").forEach(line => {
    const l = line.trim();
    if (l === "BEGIN:VEVENT") cur = {};
    else if (l === "END:VEVENT" && cur) { events.push(cur); cur = null; }
    else if (cur) {
      if (l.startsWith("SUMMARY:")) cur.title = l.slice(8);
      else if (l.startsWith("DTSTART")) {
        const v = l.split(":").pop();
        if (v.length >= 8) cur.date = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
      }
      else if (l.startsWith("DESCRIPTION:")) cur.desc = l.slice(12).replace(/\\n/g, "\n");
    }
  });
  return events;
}

// Get subject's display color info
function subjectColor(sub) {
  return SC[sub] || { bg: "#f0f0f0", tx: "#666", bd: "#aaa" };
}

// ============================================================
// INITIAL DATA — 複式学級校（3学級）
// ============================================================
function initClasses() {
  return [
    { id: "12", grades: [1, 2], name: "1・2年" },
    { id: "34", grades: [3, 4], name: "3・4年" },
    { id: "56", grades: [5, 6], name: "5・6年" },
  ];
}

function initTeachers() {
  return [
    { id: "t1", name: "田中 太郎", classId: "12", senkaOut: ["音楽", "図画工作"], senka: [] },
    { id: "t2", name: "鈴木 花子", classId: "34", senkaOut: ["音楽", "図画工作", "外国語活動"], senka: [] },
    { id: "t3", name: "佐藤 健一", classId: "56", senkaOut: ["音楽", "図画工作", "家庭", "外国語"], senka: [] },
    { id: "t4", name: "渡辺 大輔", classId: null, senkaOut: [],
      senka: [
        { classId: "12", subject: "音楽" }, { classId: "34", subject: "音楽" }, { classId: "56", subject: "音楽" },
        { classId: "12", subject: "図画工作" }, { classId: "34", subject: "図画工作" }, { classId: "56", subject: "図画工作" },
      ] },
    { id: "t5", name: "小林 裕子", classId: null, senkaOut: [],
      senka: [
        { classId: "56", subject: "外国語" }, { classId: "34", subject: "外国語活動" }, { classId: "56", subject: "家庭" },
      ] },
  ];
}

function initMod() { return {}; }

const DEFAULT_SEM_DATES = {
  s1Start: "2025-04-07", s1End: "2025-07-18",
  s2Start: "2025-09-01", s2End: "2025-12-24",
  s3Start: "2026-01-08", s3End: "2026-03-24",
};

// ============================================================
// FIREBASE
// ============================================================
function loadFbConfig() { return { databaseURL: "https://timetable-49637-default-rtdb.asia-southeast1.firebasedatabase.app" }; }
function saveFbConfig() {}
function loadSchoolId() { return "school_es01"; }
function saveSchoolId() {}

function fbSanitize(val) {
  if (val === null || val === undefined || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(fbSanitize);
  var keys = Object.keys(val);
  if (keys.length > 0 && keys.every(function(k, i) { return String(i) === k; })) {
    return keys.map(function(k) { return fbSanitize(val[k]); });
  }
  var out = {};
  for (var ki = 0; ki < keys.length; ki++) out[keys[ki]] = fbSanitize(val[keys[ki]]);
  return out;
}

function useFirebaseSync(fbConfig, schoolId, stateMap, enabled) {
  const [fbStatus, setFbStatus] = useState("offline");
  const [lastFbSync, setLastFbSync] = useState(null);
  const isRemoteUpdate = useRef(false);
  const writeTimers = useRef({});
  const pollRef = useRef(null);
  const dbURL = (fbConfig?.databaseURL || "").replace(/\/$/, "");

  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (!enabled || !dbURL) { setFbStatus("offline"); return; }
    let cancelled = false;
    setFbStatus("connecting");
    const loadAll = async () => {
      try {
        const res = await fetch(dbURL + "/" + schoolId + ".json");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (cancelled) return;
        if (data) {
          isRemoteUpdate.current = true;
          Object.entries(stateMap).forEach(function([key, info]) {
            if (data[key] !== undefined && data[key] !== null) info.setter(fbSanitize(data[key]));
          });
          setTimeout(function() { isRemoteUpdate.current = false; }, 200);
        }
        setLastFbSync(new Date());
        setFbStatus("connected");
      } catch (err) {
        console.error("Firebase error:", err);
        if (!cancelled) setFbStatus("error");
      }
    };
    loadAll();
    pollRef.current = setInterval(loadAll, 15000);
    return function() {
      cancelled = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [dbURL, schoolId, enabled]); // eslint-disable-line

  const writeToFb = useCallback(function(key, value) {
    if (fbStatus !== "connected" || !dbURL || isRemoteUpdate.current) return;
    if (writeTimers.current[key]) clearTimeout(writeTimers.current[key]);
    writeTimers.current[key] = setTimeout(function() {
      fetch(dbURL + "/" + schoolId + "/" + key + ".json", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      }).catch(function(err) { console.error("Firebase write error [" + key + "]:", err); });
    }, 800);
  }, [fbStatus, dbURL, schoolId]);

  return { fbStatus, lastFbSync, writeToFb };
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [role, setRole] = useState(null);
  const [classes, setClasses] = useState(initClasses);
  const [baseTTs, setBaseTTs] = useState(() => {
    const b = {};
    const days = ["月", "火", "水", "木", "金"];
    initClasses().forEach(c => { b[c.id] = emptyTT(days); });
    return b;
  });
  const [overrides, setOverrides] = useState(() => {
    const o = {};
    initClasses().forEach(c => { o[c.id] = {}; });
    return o;
  });
  const [events, setEvents] = useState({});
  const [teachers, setTeachers] = useState(initTeachers);
  const [modSched, setModSched] = useState(initMod);
  const [curWeek, setCurWeek] = useState(1);
  const [semDates, setSemDates] = useState(DEFAULT_SEM_DATES);
  const [weekPlans, setWeekPlans] = useState({});
  const [activeDays, setActiveDays] = useState(["月", "火", "水", "木", "金"]);
  const [gcalConfig, setGcalConfig] = useState({
    method: "ical", gasUrl: "",
    calendars: [
      { icalUrl: "", label: "学校行事", type: "行事", color: "#dc2626", enabled: true },
      { icalUrl: "", label: "研修・出張", type: "研修", color: "#2563eb", enabled: true },
    ],
    syncEnabled: false, autoSync: true, intervalMin: 5,
  });
  const [syncedEvents, setSyncedEvents] = useState({});

  const [fbConfig, setFbConfig] = useState(() => loadFbConfig());
  const [schoolId, setSchoolId] = useState(() => loadSchoolId());
  const [fbEnabled, setFbEnabled] = useState(true);
  useEffect(() => { if (fbConfig) saveFbConfig(fbConfig); }, [fbConfig]);
  useEffect(() => { saveSchoolId(schoolId); }, [schoolId]);

  const stateMap = useMemo(() => ({
    baseTTs: { setter: setBaseTTs }, overrides: { setter: setOverrides },
    events: { setter: setEvents }, teachers: { setter: setTeachers },
    modSched: { setter: setModSched }, semDates: { setter: setSemDates },
    weekPlans: { setter: setWeekPlans }, activeDays: { setter: setActiveDays },
    gcalConfig: { setter: setGcalConfig }, classes: { setter: setClasses },
  }), []);

  const { fbStatus, lastFbSync, writeToFb } = useFirebaseSync(fbConfig, schoolId, stateMap, fbEnabled);

  const prevFbStatus = useRef("offline");
  useEffect(() => {
    if (prevFbStatus.current !== "connected" && fbStatus === "connected") {
      setTimeout(() => {
        const dbURL = (fbConfig?.databaseURL || "").replace(/\/$/, "");
        if (!dbURL) return;
        fetch(dbURL + "/" + schoolId + ".json").then(r => r.json()).then(data => {
          if (!data || Object.keys(data).length === 0) {
            const allState = { baseTTs, overrides, events, teachers, modSched, semDates, weekPlans, activeDays, gcalConfig, classes };
            fetch(dbURL + "/" + schoolId + ".json", {
              method: "PUT", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(allState),
            }).catch(err => console.error("Initial upload error:", err));
          }
        }).catch(() => {});
      }, 500);
    }
    prevFbStatus.current = fbStatus;
  }, [fbStatus]);

  useEffect(() => { if (fbEnabled) writeToFb("baseTTs", baseTTs); }, [baseTTs]);
  useEffect(() => { if (fbEnabled) writeToFb("overrides", overrides); }, [overrides]);
  useEffect(() => { if (fbEnabled) writeToFb("events", events); }, [events]);
  useEffect(() => { if (fbEnabled) writeToFb("teachers", teachers); }, [teachers]);
  useEffect(() => { if (fbEnabled) writeToFb("modSched", modSched); }, [modSched]);
  useEffect(() => { if (fbEnabled) writeToFb("semDates", semDates); }, [semDates]);
  useEffect(() => { if (fbEnabled) writeToFb("weekPlans", weekPlans); }, [weekPlans]);
  useEffect(() => { if (fbEnabled) writeToFb("activeDays", activeDays); }, [activeDays]);
  useEffect(() => { if (fbEnabled) writeToFb("gcalConfig", gcalConfig); }, [gcalConfig]);
  useEffect(() => { if (fbEnabled) writeToFb("classes", classes); }, [classes]);

  const semester = semesterOfWeek(curWeek, semDates);
  const totalWeeks = useMemo(() => {
    const s1s = new Date(semDates.s1Start);
    const s3e = new Date(semDates.s3End);
    return Math.min(MAX_WK, Math.ceil((s3e - s1s) / (7 * 86400000)));
  }, [semDates]);

  const shared = {
    classes, setClasses, baseTTs, setBaseTTs, overrides, setOverrides, events, setEvents,
    teachers, setTeachers, modSched, setModSched, curWeek, setCurWeek,
    semester, semDates, setSemDates, weekPlans, setWeekPlans,
    activeDays, setActiveDays, totalWeeks,
    gcalConfig, setGcalConfig, syncedEvents, setSyncedEvents,
    fbConfig, setFbConfig, schoolId, setSchoolId, fbEnabled, setFbEnabled, fbStatus, lastFbSync,
  };

  if (!role) return <RoleSelect onSelect={setRole} />;
  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideR{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @media print{.no-print{display:none!important}table{page-break-inside:auto}tr{page-break-inside:avoid}}
      `}</style>
      {role === "kyomu" ? <KyomuApp {...shared} onBack={() => setRole(null)} /> :
        <TeacherApp {...shared} onBack={() => setRole(null)} />}
    </div>
  );
}

// ============================================================
// ROLE SELECT
// ============================================================
function RoleSelect({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(155deg,#1a1625 0%,#2a2240 50%,#1e2d3d 100%)", fontFamily: "'Noto Sans JP',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;900&family=Zen+Kaku+Gothic+New:wght@400;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ textAlign: "center", animation: "fadeUp .5s ease-out" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#c0392b,#e74c3c)", marginBottom: 18, fontSize: 26, color: "#fff", fontWeight: 900, fontFamily: "'Zen Kaku Gothic New'", boxShadow: "0 4px 24px rgba(192,57,43,.4)" }}>時</div>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: 3, marginBottom: 4, fontFamily: "'Zen Kaku Gothic New'" }}>時間割マネージャー</h1>
        <p style={{ color: "#e74c3c", fontSize: 13, fontWeight: 700, marginBottom: 3, letterSpacing: 2 }}>小学校版</p>
        <p style={{ color: "rgba(255,255,255,.35)", fontSize: 11, marginBottom: 38, letterSpacing: 1 }}>複式学級対応 — 時間割・週案管理システム</p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          {[
            { id: "kyomu", title: "教務主任", sub: "時間割作成 · 授業時数管理", icon: "教", desc: "ベース時間割の作成、週ごとの確認・修正、行事取込、学年別授業時数分析", color: "#c0392b", bg: "linear-gradient(135deg,#c0392b,#e74c3c)" },
            { id: "teacher", title: "学級担任", sub: "週案作成 · 授業計画", icon: "担", desc: "複式学級の時間割確認、学年別の週案作成、授業時数の進捗確認", color: "#27ae60", bg: "linear-gradient(135deg,#27ae60,#2ecc71)" },
          ].map(r => (
            <button key={r.id} onClick={() => onSelect(r.id)}
              style={{ width: 280, padding: "34px 26px", borderRadius: 18, border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.03)", cursor: "pointer", textAlign: "center", transition: "all .25s", backdropFilter: "blur(8px)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 21, color: "#fff", fontWeight: 900, fontFamily: "'Zen Kaku Gothic New'", boxShadow: `0 4px 18px ${r.color}50` }}>{r.icon}</div>
              <h3 style={{ color: "#fff", fontSize: 19, fontWeight: 700, marginBottom: 5 }}>{r.title}</h3>
              <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginBottom: 10 }}>{r.sub}</p>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: 10, lineHeight: 1.7 }}>{r.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED UI
// ============================================================
function Card({ children, style, ...p }) { return <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 5px rgba(0,0,0,.04)", border: "1px solid #e8e4de", ...(style || {}) }} {...p}>{children}</div>; }
function Badge({ sv, label }) { const m = { ok: { bg: "#dcfce7", tx: "#166534" }, warning: { bg: "#fef9c3", tx: "#854d0e" }, danger: { bg: "#fee2e2", tx: "#991b1b" } }; const s = m[sv] || m.ok; return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: s.bg, color: s.tx }}>{label}</span>; }
function BtnP({ children, color, ...p }) { return <button {...p} style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: color || "#c0392b", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, ...(p.style || {}) }}>{children}</button>; }
function BtnS({ children, ...p }) { return <button {...p} style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #e8e4de", background: "#fff", cursor: "pointer", fontSize: 11, color: "#666", ...(p.style || {}) }}>{children}</button>; }
function Modal({ children, onClose, width }) { return (<div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,22,37,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(3px)" }}><div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: width || 600, maxWidth: "94vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)", animation: "fadeUp .2s ease-out" }}>{children}</div></div>); }
function Toggle({ on, onChange, size }) {
  const w = size === "sm" ? 34 : 40;
  const h = size === "sm" ? 18 : 22;
  const dot = size === "sm" ? 13 : 16;
  return (
    <button onClick={() => onChange(!on)} style={{ width: w, height: h, borderRadius: h / 2, border: "none", cursor: "pointer", position: "relative", background: on ? "#22c55e" : "#e8e4de", transition: "background .2s" }}>
      <div style={{ width: dot, height: dot, borderRadius: "50%", background: "#fff", position: "absolute", top: (h - dot) / 2, left: on ? w - dot - (h - dot) / 2 : (h - dot) / 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
    </button>
  );
}

function WeekNav({ curWeek, setCurWeek, semester, semDates, totalWeeks }) {
  const semLabel = semester === 1 ? "1学期" : semester === 2 ? "2学期" : "3学期";
  const mon = mondayOfWeek(curWeek, semDates);
  return (
    <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => setCurWeek(w => Math.max(1, w - 1))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,.15)", background: "transparent", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
      <div style={{ textAlign: "center", minWidth: 110 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>第{curWeek}週</div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,.4)" }}>{semLabel} | {fmtDate(mon)}〜</div>
      </div>
      <button onClick={() => setCurWeek(w => Math.min(totalWeeks, w + 1))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,.15)", background: "transparent", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
    </div>
  );
}

// ============================================================
// SPLIT CELL DISPLAY — 複式学級セル表示
// ============================================================
function CellDisplay({ cell, period, modMode, classGrades }) {
  if (!cell || isEmptyCell(cell)) {
    return <div style={{ height: "100%", borderRadius: 7, border: "1px dashed #e8e4de", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#ddd", fontSize: 9 }}>—</span></div>;
  }
  if (cell.isEvent) {
    const et = EVT_TYPES[cell.subject?.replace(/[【】]/g, "")] || EVT_TYPES["その他"];
    return (
      <div style={{ height: "100%", borderRadius: 7, padding: "3px 4px", background: et.bg + "20", border: `2px solid ${et.bg}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: et.bg }}>{cell.subject}</div>
        {cell.eventTitle && <div style={{ fontSize: 7, color: "#888", textAlign: "center", lineHeight: 1.2, marginTop: 1 }}>{cell.eventTitle}</div>}
      </div>
    );
  }
  const isNonCount = cell.subject && NON_COUNT_SUBS?.includes(cell.subject);
  const cnt = (cell.subject || cell.type === "split") && !isNonCount ? calcCnt(period, modMode) : 0;

  if (cell.type === "split" && cell.grades) {
    const gradeKeys = Object.keys(cell.grades).map(Number).sort();
    return (
      <div style={{ height: "100%", borderRadius: 7, overflow: "hidden", border: "1px solid #d4d0cb", display: "flex", flexDirection: "column" }}>
        {gradeKeys.map((g, i) => {
          const gs = cell.grades[g];
          if (!gs?.subject) return (
            <div key={g} style={{ flex: 1, padding: "2px 3px", background: "#fafaf8", borderBottom: i < gradeKeys.length - 1 ? "1px solid #e8e4de" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 7, color: "#ccc" }}>{g}年 —</span>
            </div>
          );
          const s = subjectColor(gs.subject);
          const isNC = NON_COUNT_SUBS?.includes(gs.subject);
          const gCnt = !isNC ? calcCnt(period, modMode) : 0;
          return (
            <div key={g} style={{ flex: 1, padding: "1px 3px", background: s.bg, borderBottom: i < gradeKeys.length - 1 ? "1px solid " + s.bd + "40" : "none", display: "flex", alignItems: "center", gap: 2, minHeight: 22 }}>
              <span style={{ fontSize: 7, fontWeight: 800, color: s.bd, flexShrink: 0, width: 16 }}>{g}年</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: s.tx, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{gs.subject}</span>
              {gCnt > 0 && <span style={{ fontSize: 6, color: s.tx + "90", flexShrink: 0 }}>{fmtCnt(gCnt)}</span>}
            </div>
          );
        })}
        {/* Show 1年下校 label for 6th period */}
        {period === 6 && classGrades?.includes(1) && !gradeKeys?.includes(1) && (
          <div style={{ padding: "1px 3px", background: "#f0ede8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 7, color: "#999", fontStyle: "italic" }}>1年下校</span>
          </div>
        )}
      </div>
    );
  }

  // All-class (一斉指導) cell
  const s = subjectColor(cell.subject);
  return (
    <div style={{ height: "100%", borderRadius: 7, padding: "3px 4px", background: s.bg, border: `1px solid ${s.bd}25`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: s.tx, whiteSpace: "nowrap" }}>{cell.subject}</div>
      {cell.teacherName && <div style={{ fontSize: 7, color: s.tx + "80" }}>{cell.teacherName}</div>}
      {cnt > 0 && <div style={{ fontSize: 7, color: s.tx + "70" }}>{fmtCnt(cnt)}</div>}
      {isNonCount && <div style={{ fontSize: 6, color: "#999", fontStyle: "italic" }}>対象外</div>}
      {/* Show 1年下校 for period 6 in all-class cell */}
      {period === 6 && classGrades?.includes(1) && (
        <div style={{ fontSize: 6, color: "#c0392b", fontWeight: 600 }}>※1年下校</div>
      )}
    </div>
  );
}

// ============================================================
// CELL EDIT MODAL — 複式学級セル編集
// ============================================================
function CellEditModal({ cell, classObj, period, day, onSave, onDelete, onClose, teachers }) {
  const grades = classObj.grades;
  const isSingleGrade = grades.length === 1;
  const [mode, setMode] = useState(() => {
    if (cell?.type === "split") return "split";
    if (cell?.subject) return "all";
    return isSingleGrade ? "all" : "all";
  });
  const [allSubject, setAllSubject] = useState(cell?.subject || "");
  const [splitGrades, setSplitGrades] = useState(() => {
    const sg = {};
    grades.forEach(g => {sg[g] = cell?.type === "split" && cell?.grades?.[g]?.subject ? cell.grades[g].subject : "";
    });
    return sg;
  });
  const [teacherId, setTeacherId] = useState(cell?.teacher || "");

  // Common subjects (available for all grades in class) for all-class mode
  const commonSubs = useMemo(() => {
    const sets = grades.map(g => new Set(subjectsForGrade(g)));
    return ALL_SUBS_ES.filter(s => sets.every(set => set.has(s)));
  }, [grades]);

  const handleSave = () => {
    const t = teachers.find(x => x.id === teacherId);
    const tName = t ? t.name.split(" ")[0] : "";
    if (mode === "all") {
      if (!allSubject) { onDelete(); onClose(); return; }
      onSave({ subject: allSubject, teacher: teacherId, teacherName: tName, type: "all" });
    } else {
      const g = {};
      let hasAny = false;
      grades.forEach(gr => {
        if (splitGrades[gr]) { g[gr] = { subject: splitGrades[gr] }; hasAny = true; }
      });
      if (!hasAny) { onDelete(); onClose(); return; }
      onSave({ type: "split", teacher: teacherId, teacherName: tName, grades: g });
    }
    onClose();
  };

  return (
    <Modal onClose={onClose} width={480}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
        {day}曜 {period}校時 — {classObj.name}
      </h3>

      {!isSingleGrade && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button onClick={() => setMode("all")} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: mode === "all" ? "2px solid #c0392b" : "2px solid #e8e4de", background: mode === "all" ? "#fef2f0" : "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            一斉指導（全学年同じ教科）
          </button>
          <button onClick={() => setMode("split")} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: mode === "split" ? "2px solid #c0392b" : "2px solid #e8e4de", background: mode === "split" ? "#fef2f0" : "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            分割指導（学年別に異なる教科）
          </button>
        </div>
      )}

      {mode === "all" ? (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>教科</label>
          <select value={allSubject} onChange={e => setAllSubject(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e8e4de", fontSize: 12 }}>
            <option value="">— 空 —</option>
            <optgroup label="共通教科">{commonSubs.map(s => <option key={s} value={s}>{s}</option>)}</optgroup>
            <optgroup label="カウント対象外">{NON_COUNT_SUBS.map(s => <option key={s} value={s}>◇ {s}</option>)}</optgroup>
          </select>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {grades.map(g => {
            const maxP = MAX_PERIODS_BY_GRADE[g];
            const isDisabled = period > maxP;
            return (
              <div key={g} style={{ marginBottom: 8, padding: 10, background: isDisabled ? "#f5f3ef" : "#f9f7f4", borderRadius: 8, border: "1px solid #e8e4de", opacity: isDisabled ? 0.5 : 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#1a1625", display: "block", marginBottom: 4 }}>
                  {g}年生 {isDisabled && <span style={{ color: "#c0392b", fontSize: 9 }}>（{period}校時は対象外 — 下校済み）</span>}
                </label>
                {!isDisabled && (
                  <select value={splitGrades[g] || ""} onChange={e => setSplitGrades(p => ({ ...p, [g]: e.target.value }))}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #e8e4de", fontSize: 11 }}>
                    <option value="">— 空 —</option>
                    <optgroup label="教科">{subjectsForGrade(g).map(s => <option key={s} value={s}>{s}</option>)}</optgroup>
                    <optgroup label="カウント対象外">{NON_COUNT_SUBS.map(s => <option key={s} value={s}>◇ {s}</option>)}</optgroup>
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: "#999", display: "block", marginBottom: 4 }}>担当教員</label>
        <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #e8e4de", fontSize: 11 }}>
          <option value="">— 選択 —</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.classId ? `（${t.classId}担任）` : "（専科）"}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={() => { onDelete(); onClose(); }} style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #fca5a5", background: "#fff", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>削除</button>
        <BtnS onClick={onClose}>キャンセル</BtnS>
        <BtnP onClick={handleSave}>保存</BtnP>
      </div>
    </Modal>
  );
}

// ============================================================
// WEEKLY GRID — 複式学級対応
// ============================================================
function TTHeader({ days, curWeek, semDates, weekEvents, weekMod }) {
  const dates = weekDates(curWeek, semDates);
  const dayDateMap = {};
  ALL_DAYS.forEach((d, i) => { dayDateMap[d] = dates[i]; });
  return (
    <tr>
      <th style={{ width: 58, padding: 4, verticalAlign: "bottom" }}></th>
      {days.map(d => {
        const dt = dayDateMap[d];
        const isWeekend = d === "土" || d === "日";
        const dayEvts = (weekEvents || []).filter(ev => ev.day === d);
        return (
          <th key={d} style={{ padding: "5px 3px", textAlign: "center", verticalAlign: "bottom", background: isWeekend ? "#fef2f0" : undefined }}>
            <div style={{ fontSize: 9, color: "#999", marginBottom: 1 }}>{dt ? fmtDate(dt) : ""}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: isWeekend ? "#c0392b" : "#1a1625" }}>{d}</div>
            {dayEvts.length > 0 && (
              <div style={{ marginTop: 3, display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                {dayEvts.map((ev, i) => {
                  const et = EVT_TYPES[ev.type] || EVT_TYPES["その他"];
                  return <span key={i} style={{ fontSize: 7, padding: "1px 5px", borderRadius: 6, background: et.bg, color: et.tx, fontWeight: 600, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{ev.title}</span>;
                })}
              </div>
            )}
          </th>
        );
      })}
    </tr>
  );
}

function WeeklyGrid({ tt, modSched, curWeek, days, semDates, weekEvents, classObj, editable, onCellClick, teachers, onModToggle }) {
  const weekMod = getWeekMod(modSched, curWeek);
  const classGrades = classObj?.grades || [];
  return (
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 2 }}>
      <thead>
        <TTHeader days={days} curWeek={curWeek} semDates={semDates} weekEvents={weekEvents || []} weekMod={weekMod} />
      </thead>
      <tbody>
        {PER.map(p => {
          const minGrade = classGrades.length > 0 ? Math.min(...classGrades) : 1;
          const allGradesAbove = classGrades.every(g => p > MAX_PERIODS_BY_GRADE[g]);
          const someGradeAbove = classGrades.some(g => p > MAX_PERIODS_BY_GRADE[g]);
          if (allGradesAbove) return null;
          // Insert ひらめき row after 5校時
          const rows = [];
          if (p === 6) {
            rows.push(
              <tr key="mod-row">
                <td style={{ textAlign: "center", padding: 3 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>ひらめき</div>
                  <div style={{ fontSize: 7, color: "#999" }}>25分</div>
                  <div style={{ fontSize: 6, color: "#bbb" }}>{PTIMES_ES.mod.start}</div>
                </td>
                {days.map(d => {
                  const mode = weekMod[d] || "none";
                  const ms = MOD_STYLES[mode];
                  return (
                    <td key={d} style={{ padding: 2, textAlign: "center" }}>
                      {onModToggle ? (
                        <button onClick={() => onModToggle(d)}
                          style={{ width: "100%", padding: "4px 6px", borderRadius: 5, border: ms.border, background: ms.bg, cursor: "pointer", fontSize: 9, fontWeight: 600, color: ms.color, transition: "all .15s" }}>
                          {ms.label}
                        </button>
                      ) : (
                        <div style={{ padding: "4px 6px", borderRadius: 5, border: ms.border, background: ms.bg, fontSize: 9, fontWeight: 600, color: ms.color }}>
                          {ms.label}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          }
          rows.push(
            <tr key={p}>
              <td style={{ textAlign: "center", padding: 3 }}>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{p}校時</div>
                <div style={{ fontSize: 7, color: "#999" }}>{p <= 5 ? "40分" : "45分"}</div>
                <div style={{ fontSize: 6, color: "#bbb" }}>{PTIMES_ES[p].start}</div>
              </td>
              {days.map(d => {
                const cell = tt[d]?.[p];
                const modMode = weekMod[d] || "none";
                const isWeekend = d === "土" || d === "日";
                return (
                  <td key={d} onClick={() => { if (editable && !cell?.isEvent) onCellClick?.(d, p, cell); }}
                    style={{ padding: 0, height: classGrades.length > 1 ? 56 : 48, verticalAlign: "middle", position: "relative", background: isWeekend ? "#fefbfb" : undefined, cursor: editable && !cell?.isEvent ? "pointer" : "default" }}>
                    <CellDisplay cell={cell} period={p} modMode={modMode} classGrades={classGrades} />
                  </td>
                );
              })}
            </tr>
          );
          return rows;
        })}
        {/* ひらめき row for classes with max 5 periods (no 6th period row to trigger it) */}
        {classGrades.every(g => MAX_PERIODS_BY_GRADE[g] <= 5) && (
          <tr>
            <td style={{ textAlign: "center", padding: 3 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>ひらめき</div>
              <div style={{ fontSize: 7, color: "#999" }}>25分</div>
            </td>
            {days.map(d => {
              const mode = weekMod[d] || "none";
              const ms = MOD_STYLES[mode];
              return (
                <td key={d} style={{ padding: 2, textAlign: "center" }}>
                  {onModToggle ? (
                    <button onClick={() => onModToggle(d)}
                      style={{ width: "100%", padding: "4px 6px", borderRadius: 5, border: ms.border, background: ms.bg, cursor: "pointer", fontSize: 9, fontWeight: 600, color: ms.color }}>
                      {ms.label}
                    </button>
                  ) : (
                    <div style={{ padding: "4px 6px", borderRadius: 5, border: ms.border, background: ms.bg, fontSize: 9, fontWeight: 600, color: ms.color }}>
                      {ms.label}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ============================================================
// TUTORIAL
// ============================================================
const KYOMU_TUTORIAL = [
  { icon: "👋", title: "ようこそ！小学校 時間割マネージャーへ",
    body: "このシステムは複式学級対応の時間割作成・管理ツールです。\n1つの学級に複数学年が所属し、1コマ内で学年別に異なる教科を指導する「わたり・ずらし」に対応しています。", tip: null },
  { icon: "◉", title: "STEP 1: まず設定から",
    body: "最初に「設定」タブで基本情報を設定しましょう。",
    tip: "📚 学級構成（どの学年を組み合わせるか）\n📅 学期期間（1〜3学期の開始日・終了日）\n📆 授業実施曜日\n👤 教員の登録（担任・専科）\n🔗 Googleカレンダー連携（任意）" },
  { icon: "◈", title: "STEP 2: ベース時間割を作る",
    body: "「ベース時間割」タブで各学級の基本パターンを作成します。",
    tip: "一斉指導（全学年同じ教科）と分割指導（学年別に異なる教科）を選択可能\nセルをクリックして教科・指導形態を設定\n科目パレットから共通科目をドラッグ&ドロップ" },
  { icon: "▦", title: "STEP 3: 週間時間割で確認・修正",
    body: "「週間時間割」タブでベースを元に週ごとの時間割を確認・修正できます。",
    tip: "ヘッダーの ◂ ▸ で週を移動\n各セルをクリックして教科変更\n「ひらめき」行で曜日ごとにモジュールON/OFF\n行事がある日は上部に表示" },
  { icon: "◎", title: "STEP 4: 授業時数を確認",
    body: "「授業時数」タブで学年ごとの進捗を確認できます。",
    tip: "複式学級でも学年ごとに個別カウント\n文科省標準と比較して進捗を可視化\n緑=順調、黄=注意、赤=不足" },
  { icon: "🎯", title: "基本の流れは以上です！",
    body: "設定 → ベース時間割作成 → 週ごとの確認・修正 → 行事登録 → 時数確認\n\nいつでもヘッダーの「?」ボタンからこのガイドを再表示できます。", tip: null },
];

const TEACHER_TUTORIAL = [
  { icon: "👋", title: "ようこそ！学級担任モードへ",
    body: "教務主任が作成した時間割をもとに、自分の学級の確認と週案の作成ができます。\n複式学級の学年別教科も一目でわかるレイアウトです。", tip: null },
  { icon: "📋", title: "STEP 1: 担当教員を選択",
    body: "ログイン画面で自分の名前を選択してください。", tip: "自分の担任学級が自動で紐づけされます\n専科教員は担当学級の時間割を確認できます" },
  { icon: "📅", title: "STEP 2: 週間時間割を確認",
    body: "「週間時間割」タブで自分の学級の今週の時間割を確認できます。",
    tip: "分割セル: 学年別の教科が上下に表示\n一斉セル: 全学年共通の教科が表示\n6校時目の1年生下校も自動表示" },
  { icon: "📝", title: "STEP 3: 週案を作成",
    body: "「週案作成」タブで各授業の目標・内容を学年別に入力できます。",
    tip: "分割コマ: 学年ごとに別々の記入欄\n一斉コマ: 1つの共通記入欄\n入力内容は自動保存されます" },
  { icon: "🎯", title: "以上で準備完了です！",
    body: "毎週、週案タブで授業計画を入力していきましょう。\nいつでもヘッダーの「?」ボタンからこのガイドを再表示できます。", tip: null },
];

function Tutorial({ steps, onClose, accentColor }) {
  const [step, setStep] = useState(0);
  const s = steps[step];
  const pct = ((step + 1) / steps.length) * 100;
  const accent = accentColor || "#c0392b";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,22,37,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 18, width: 540, maxWidth: "94vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 25px 80px rgba(0,0,0,.3)", animation: "fadeUp .3s ease-out" }}>
        <div style={{ height: 4, background: "#f0ede8", borderRadius: "18px 18px 0 0", overflow: "hidden" }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg,${accent},${accent}cc)`, width: `${pct}%`, transition: "width .4s ease", borderRadius: 2 }} />
        </div>
        <div style={{ padding: "28px 32px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#1a1625,#2d2640)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 1, marginBottom: 2 }}>{step + 1} / {steps.length}</div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1625", lineHeight: 1.4 }}>{s.title}</h2>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.9, marginBottom: s.tip ? 16 : 0, whiteSpace: "pre-line" }}>{s.body}</div>
          {s.tip && (
            <div style={{ padding: "14px 16px", background: "#f8f6f2", borderRadius: 10, border: "1px solid #e8e4de", marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#999", marginBottom: 6, letterSpacing: 1 }}>💡 ポイント</div>
              <div style={{ fontSize: 11, color: "#555", lineHeight: 2, whiteSpace: "pre-line" }}>{s.tip}</div>
            </div>
          )}
        </div>
        <div style={{ padding: "0 32px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid #e8e4de", background: "#fff", fontSize: 11, color: "#999", cursor: "pointer" }}>スキップ</button>
          <div style={{ display: "flex", gap: 5 }}>
            {steps.map((_, i) => (
              <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, background: i === step ? accent : i < step ? accent + "60" : "#e8e4de", cursor: "pointer", transition: "all .3s" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {step > 0 && <button onClick={() => setStep(step - 1)} style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid #e8e4de", background: "#fff", fontSize: 11, color: "#666", cursor: "pointer", fontWeight: 600 }}>◂ 戻る</button>}
            {step === steps.length - 1 ? (
              <button onClick={onClose} style={{ padding: "8px 24px", borderRadius: 7, border: "none", background: `linear-gradient(135deg,${accent},${accent}cc)`, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 2px 10px ${accent}50` }}>はじめる →</button>
            ) : (
              <button onClick={() => setStep(step + 1)} style={{ padding: "8px 22px", borderRadius: 7, border: "none", background: "#1a1625", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>次へ ▸</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EVENT FORM / ICS IMPORT
// ============================================================
function EventForm({ onAdd, onClose, week, activeDays }) {
  const [title, setTitle] = useState(""); const [type, setType] = useState("行事");
  const [day, setDay] = useState(activeDays[0] || "月"); const [allDay, setAllDay] = useState(true);
  const [periods, setPeriods] = useState([]);
  return (
    <Modal onClose={onClose}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>行事・研修を登録（第{week}週）</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div><label style={{ fontSize: 10, fontWeight: 600, color: "#999", display: "block", marginBottom: 3 }}>名称</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="入学式、遠足、校外研修..." style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e8e4de", fontSize: 12 }} /></div>
        <div><label style={{ fontSize: 10, fontWeight: 600, color: "#999", display: "block", marginBottom: 3 }}>種別</label>
          <div style={{ display: "flex", gap: 4 }}>{["行事", "研修", "出張", "その他"].map(t => { const et = EVT_TYPES[t]; return <button key={t} onClick={() => setType(t)} style={{ padding: "5px 14px", borderRadius: 6, border: type === t ? `2px solid ${et.bg}` : "1px solid #e8e4de", background: type === t ? `${et.bg}18` : "#fff", color: type === t ? et.bg : "#666", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{t}</button>; })}</div></div>
        <div><label style={{ fontSize: 10, fontWeight: 600, color: "#999", display: "block", marginBottom: 3 }}>曜日</label>
          <div style={{ display: "flex", gap: 3 }}>{activeDays.map(d => <button key={d} onClick={() => setDay(d)} style={{ padding: "5px 10px", borderRadius: 5, border: day === d ? "2px solid #c0392b" : "1px solid #e8e4de", background: day === d ? "#fef2f0" : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{d}</button>)}</div></div>
        <div><label style={{ fontSize: 10, fontWeight: 600, color: "#999", display: "block", marginBottom: 3 }}>時間帯</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setAllDay(!allDay)} style={{ padding: "5px 12px", borderRadius: 5, border: allDay ? "2px solid #c0392b" : "1px solid #e8e4de", background: allDay ? "#fef2f0" : "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>終日</button>
            {!allDay && <div style={{ display: "flex", gap: 3 }}>{PER.map(p => <button key={p} onClick={() => setPeriods(prev => prev?.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} style={{ width: 26, height: 26, borderRadius: 5, border: periods?.includes(p) ? "2px solid #c0392b" : "1px solid #e8e4de", background: periods?.includes(p) ? "#fef2f0" : "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{p}</button>)}</div>}
          </div></div>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 16 }}>
        <BtnS onClick={onClose}>取消</BtnS>
        <BtnP onClick={() => { if (!title) return; onAdd({ title, type, day, allDay, periods: allDay ? [] : periods }); onClose(); }}>登録</BtnP>
      </div>
    </Modal>
  );
}

function ICSImportModal({ onImport, onClose }) {
  const [text, setText] = useState(""); const fileRef = useRef(null);
  return (
    <Modal onClose={onClose}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>📥 Googleカレンダー取込</h3>
      <p style={{ fontSize: 11, color: "#888", lineHeight: 1.7, marginBottom: 12 }}>Googleカレンダーからエクスポートした ICS ファイルを取り込みます。</p>
      <div style={{ padding: 14, background: "#f9f7f4", borderRadius: 8, marginBottom: 10, textAlign: "center" }}>
        <input ref={fileRef} type="file" accept=".ics,.ical" onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setText(ev.target.result); r.readAsText(f); }} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={{ padding: "10px 24px", borderRadius: 8, border: "2px dashed #c0c0c0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#666" }}>ICSファイルを選択</button>
        {text && <div style={{ marginTop: 6, fontSize: 10, color: "#22c55e", fontWeight: 600 }}>✓ 読み込み完了</div>}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <BtnS onClick={onClose}>取消</BtnS>
        <BtnP onClick={() => { if (text) onImport(text); }} color="#2563eb" style={{ opacity: text ? 1 : 0.5 }}>取り込む</BtnP>
      </div>
    </Modal>
  );
}

// ============================================================
// TEACHER MANAGEMENT — 複式学級対応
// ============================================================
function TeacherMgr({ teachers, setTeachers, classes }) {
  const [showAdd, setShowAdd] = useState(false);
  const [nw, setNw] = useState({ name: "", classId: "", senkaOut: [], senka: [] });

  const addTeacher = () => {
    if (!nw.name) return;
    const id = "t" + Date.now();
    setTeachers(p => [...p, { id, name: nw.name, classId: nw.classId || null, senkaOut: [], senka: [] }]);
    setNw({ name: "", classId: "", senkaOut: [], senka: [] });
    setShowAdd(false);
  };

  return (
    <Card style={{ gridColumn: "span 2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700 }}>👨‍🏫 教員管理</h3>
        <BtnS onClick={() => setShowAdd(!showAdd)}>{showAdd ? "閉じる" : "+ 教員追加"}</BtnS>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ background: "#f9f7f4" }}>
        {["教員名", "タイプ", "担任学級", "専科で担当する教科", ""].map(h => <th key={h} style={{ padding: "7px 10px", fontSize: 10, fontWeight: 700, color: "#999", textAlign: "left", borderBottom: "1px solid #eee" }}>{h}</th>)}
      </tr></thead><tbody>
        {teachers.map(t => {
          const cls = classes.find(c => c.id === t.classId);
          return (
            <tr key={t.id} style={{ borderBottom: "1px solid #f5f3f0" }}>
              <td style={{ padding: "7px 10px", fontSize: 12, fontWeight: 700 }}>{t.name}</td>
              <td style={{ padding: "7px 10px", fontSize: 10 }}>
                <span style={{ padding: "2px 8px", borderRadius: 5, background: t.classId ? "#dcfce7" : "#e0e7ff", color: t.classId ? "#166534" : "#312e81", fontWeight: 600 }}>
                  {t.classId ? "担任" : "専科"}
                </span>
              </td>
              <td style={{ padding: "7px 10px", fontSize: 11 }}>{cls ? cls.name : "—"}</td>
              <td style={{ padding: "7px 10px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {(t.senka || []).map((s, i) => {
                    const c = classes.find(x => x.id === s.classId);
                    return <span key={i} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 6, background: SC[s.subject]?.bg || "#eee", color: SC[s.subject]?.tx || "#666", fontWeight: 600 }}>{c?.name || s.classId} {s.subject}</span>;
                  })}
                  {(t.senkaOut || []).length > 0 && (
                    <span style={{ fontSize: 8, color: "#999", padding: "1px 4px" }}>自学級専科委託: {t.senkaOut.join(", ")}</span>
                  )}
                </div>
              </td>
              <td style={{ padding: "7px 10px" }}>
                <button onClick={() => setTeachers(p => p.filter(x => x.id !== t.id))} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #fca5a5", background: "#fff", color: "#ef4444", fontSize: 9, cursor: "pointer" }}>削除</button>
              </td>
            </tr>
          );
        })}
      </tbody></table>
      {showAdd && (
        <div style={{ marginTop: 10, padding: 12, background: "#fafaf8", borderRadius: 7, display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 9, fontWeight: 600, color: "#999", display: "block", marginBottom: 2 }}>名前</label>
            <input value={nw.name} onChange={e => setNw(p => ({ ...p, name: e.target.value }))} placeholder="山田 花子" style={{ width: "100%", padding: "6px 8px", borderRadius: 5, border: "1px solid #e8e4de", fontSize: 11 }} />
          </div>
          <div>
            <label style={{ fontSize: 9, fontWeight: 600, color: "#999", display: "block", marginBottom: 2 }}>担任学級</label>
            <select value={nw.classId} onChange={e => setNw(p => ({ ...p, classId: e.target.value }))} style={{ padding: "6px 8px", borderRadius: 5, border: "1px solid #e8e4de", fontSize: 11 }}>
              <option value="">専科（担任なし）</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <BtnP onClick={addTeacher}>追加</BtnP>
        </div>
      )}
    </Card>
  );
}

// ============================================================
// CLASS CONFIGURATION — 学級構成管理
// ============================================================
function ClassConfig({ classes, setClasses, teachers, setTeachers }) {
  const allGrades = [1, 2, 3, 4, 5, 6];
  const assignedGrades = classes.flatMap(c => c.grades);
  const unassigned = allGrades.filter(g => !assignedGrades?.includes(g));

  const toggleGrade = (classIdx, grade) => {
    setClasses(prev => {
      const next = prev.map((c, i) => {
        if (i !== classIdx) return { ...c, grades: c.grades.filter(g => g !== grade) };
        const has = c.grades?.includes(grade);
        const newGrades = has ? c.grades.filter(g => g !== grade) : [...c.grades, grade].sort();
        const newName = newGrades.map(g => g).join("・") + "年";
        const newId = newGrades.join("");
        return { ...c, grades: newGrades, name: newName, id: newId };
      });
      return next;
    });
  };

  const addClass = () => {
    if (unassigned.length === 0) return;
    const g = unassigned[0];
    setClasses(prev => [...prev, { id: String(g), grades: [g], name: `${g}年` }]);
  };

  const removeClass = (idx) => {
    setClasses(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <Card style={{ gridColumn: "span 2" }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📚 学級構成（複式学級）</h3>
      <p style={{ fontSize: 10, color: "#999", marginBottom: 10, lineHeight: 1.6 }}>
        各学級にどの学年を所属させるかを設定します。全学年（1〜6年）がいずれかの学級に所属する必要があります。
      </p>
      {classes.map((c, ci) => (
        <div key={ci} style={{ marginBottom: 8, padding: 12, background: "#f9f7f4", borderRadius: 8, border: "1px solid #e8e4de" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{c.name || "（未設定）"}</span>
            {classes.length > 1 && (
              <button onClick={() => removeClass(ci)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #fca5a5", background: "#fff", color: "#ef4444", fontSize: 9, cursor: "pointer" }}>削除</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {allGrades.map(g => {
              const inThis = c.grades?.includes(g);
              const inOther = !inThis && assignedGrades?.includes(g);
              return (
                <button key={g} onClick={() => { if (!inOther) toggleGrade(ci, g); }}
                  style={{ width: 40, height: 36, borderRadius: 6, cursor: inOther ? "not-allowed" : "pointer",
                    border: inThis ? "2px solid #c0392b" : "2px solid #e8e4de",
                    background: inThis ? "#fef2f0" : inOther ? "#f0f0f0" : "#fff",
                    opacity: inOther ? 0.4 : 1, fontSize: 12, fontWeight: 700, color: inThis ? "#c0392b" : "#888" }}>
                  {g}年
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button onClick={addClass} disabled={unassigned.length === 0}
        style={{ padding: "8px 16px", borderRadius: 7, border: "2px dashed #c0c0c0", background: "#fff", cursor: unassigned.length > 0 ? "pointer" : "not-allowed", fontSize: 11, color: "#888", width: "100%", opacity: unassigned.length > 0 ? 1 : 0.4 }}>
        + 学級追加
      </button>
      {unassigned.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 10, color: "#c0392b", fontWeight: 600 }}>
          ⚠ 未所属の学年: {unassigned.map(g => `${g}年`).join(", ")}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// MONTHLY VIEW
// ============================================================
function MonthlyView({ baseTTs = {}, overrides = {}, events = {}, syncedEvents = [], modSched = {}, semDates = {}, activeDays = [], classes = [], selCls, setSelCls, setCurWeek, setTab }) {  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = new Date(semDates.s1Start + "T00:00:00");
  const viewDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDow + 1;
    cells.push(dayNum >= 1 && dayNum <= totalDays ? new Date(year, month, dayNum) : null);
  }
  const classObj = classes.find(c => c.id === selCls);

  const isSchoolDay = (dt) => {
    if (!dt) return false;
    const s1s = new Date(semDates.s1Start + "T00:00:00"), s1e = new Date(semDates.s1End + "T00:00:00");
    const s2s = new Date(semDates.s2Start + "T00:00:00"), s2e = new Date(semDates.s2End + "T00:00:00");
    const s3s = new Date(semDates.s3Start + "T00:00:00"), s3e = new Date(semDates.s3End + "T00:00:00");
    return (dt >= s1s && dt <= s1e) || (dt >= s2s && dt <= s2e) || (dt >= s3s && dt <= s3e);
  };

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const getDayData = (dt) => {
    if (!dt) return { subjects: [], evts: [] };
    const dow = dt.getDay();
    const dayName = dayNames[dow];
    if (!activeDays?.includes(dayName)) return { subjects: [], evts: [] };
    const wk = dateToWeekNum(dt, semDates);
    if (wk < 1 || wk > 52) return { subjects: [], evts: [] };
    const tt = resolveWeekTT(baseTTs[selCls] || {}, overrides[selCls] || {}, wk, activeDays);
    const subjects = [];
    PER.forEach(p => {
      const cell = tt[dayName]?.[p];
      if (cell) {
        if (cell.type === "split" && cell.grades) {
          const gradeKeys = Object.keys(cell.grades);
          if (gradeKeys.length > 0) {
            subjects.push({ p, split: true, grades: cell.grades, isEvent: false });
          }
        } else if (cell.subject) {
          subjects.push({ p, subject: cell.subject, isEvent: cell.isEvent });
        }
      }
    });
    const manualEvts = (events[wk] || []).filter(ev => ev.day === dayName);
    const gcalEvts = (syncedEvents[wk] || []).filter(ev => ev.day === dayName);
    return { subjects, evts: [...manualEvts, ...gcalEvts], weekNum: wk };
  };

  const goToWeek = (dt) => {
    if (!dt) return;
    const wk = dateToWeekNum(dt, semDates);
    if (wk >= 1 && wk <= 52) { setCurWeek(wk); setTab("weekly"); }
  };

  const rows = [];
  for (let r = 0; r < 6; r++) {
    const row = cells.slice(r * 7, r * 7 + 7);
    if (row.some(c => c !== null)) rows.push(row);
  }

  return (
    <div style={{ animation: "fadeUp .3s ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>月間時間割</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setMonthOffset(p => p - 1)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8e4de", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>◀</button>
          <span style={{ fontSize: 15, fontWeight: 700, minWidth: 120, textAlign: "center" }}>{year}年 {month + 1}月</span>
          <button onClick={() => setMonthOffset(p => p + 1)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8e4de", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>▶</button>
          <button onClick={() => setMonthOffset(0)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e8e4de", background: "#f9f7f4", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#888" }}>今月</button>
        </div>
      </div>

      <Card style={{ marginBottom: 10, padding: "6px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700 }}>表示学級:</span>
          {classes.map(c => (
            <span key={c.id} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, fontWeight: 700, background: selCls === c.id ? "#c0392b" : "#f5f3ef", color: selCls === c.id ? "#fff" : "#888", cursor: "pointer" }} onClick={() => setSelCls(c.id)}>{c.name}</span>
          ))}
          <span style={{ fontSize: 9, color: "#aaa", marginLeft: "auto" }}>※日付クリックで週間時間割へ</span>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg,#1a1625,#2d2640)" }}>
              {dayNames.map((d, i) => (
                <th key={d} style={{ padding: "8px 4px", fontSize: 12, fontWeight: 700, color: i === 0 ? "#f87171" : i === 6 ? "#60a5fa" : "rgba(255,255,255,.8)", textAlign: "center", borderRight: i < 6 ? "1px solid rgba(255,255,255,.08)" : "none" }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((dt, ci) => {
                  if (!dt) return <td key={ci} style={{ padding: 2, background: "#fafaf8", borderRight: ci < 6 ? "1px solid #f0ede8" : "none", borderBottom: "1px solid #f0ede8", height: 90, verticalAlign: "top" }} />;
                  const isToday = dt.getTime() === today.getTime();
                  const isWeekend = ci === 0 || ci === 6;
                  const inSchool = isSchoolDay(dt);
                  const isActive = activeDays?.includes(dayNames[ci]);
                  const { subjects, evts, weekNum } = getDayData(dt);
                  return (
                    <td key={ci} onClick={() => goToWeek(dt)}
                      style={{ padding: 2, verticalAlign: "top", height: 90, cursor: "pointer", background: isToday ? "#fffbeb" : !inSchool ? "#f5f3ef" : isWeekend ? "#fef7f7" : "#fff", borderRight: ci < 6 ? "1px solid #f0ede8" : "none", borderBottom: "1px solid #f0ede8", transition: "background .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#f0edff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isToday ? "#fffbeb" : !inSchool ? "#f5f3ef" : isWeekend ? "#fef7f7" : "#fff"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px 1px" }}>
                        <span style={{ fontSize: 12, fontWeight: isToday ? 900 : 600, color: isToday ? "#c0392b" : ci === 0 ? "#ef4444" : ci === 6 ? "#3b82f6" : "#1a1625", background: isToday ? "#fde68a" : "none", borderRadius: isToday ? 10 : 0, padding: isToday ? "0 5px" : 0 }}>{dt.getDate()}</span>
                        {weekNum && inSchool && <span style={{ fontSize: 7, color: "#ccc" }}>W{weekNum}</span>}
                      </div>
                      {evts.map((ev, i) => {
                        const et = EVT_TYPES[ev.type] || EVT_TYPES["その他"];
                        return <div key={"e" + i} style={{ fontSize: 7, padding: "1px 3px", margin: "1px 2px", borderRadius: 3, background: et.bg, color: et.tx, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>;
                      })}
                      {inSchool && isActive && subjects.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 1, padding: "1px 2px" }}>
                          {subjects.map((s, i) => {
                            if (s.isEvent) return <span key={i} style={{ fontSize: 7, padding: "0 2px", borderRadius: 2, background: "#fef2f2", color: "#991b1b", fontWeight: 600 }}>{s.p}</span>;
                            if (s.split) {
                              return Object.entries(s.grades).map(([g, gs]) => {
                                const sc = SC[gs.subject];
                                return <span key={i + "-" + g} style={{ fontSize: 6, padding: "0 2px", borderRadius: 2, background: sc?.bg || "#f0f0f0", color: sc?.tx || "#666", fontWeight: 600 }}>{g}:{gs.subject?.slice(0, 1)}</span>;
                              });
                            }
                            const sc = SC[s.subject];
                            return <span key={i} style={{ fontSize: 7, padding: "0 2px", borderRadius: 2, background: sc?.bg || "#f0f0f0", color: sc?.tx || "#666", fontWeight: 600 }}>{s.subject?.slice(0, 2)}</span>;
                          })}
                        </div>
                      )}
                      {!inSchool && <div style={{ fontSize: 7, color: "#ddd", textAlign: "center", marginTop: 8 }}>休</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// KYOMU APP — 教務主任画面
// ============================================================
function KyomuApp({ classes, setClasses, baseTTs, setBaseTTs, overrides, setOverrides, events, setEvents,
  teachers, setTeachers, modSched, setModSched, curWeek, setCurWeek,
  semester, semDates, setSemDates, weekPlans, setWeekPlans,
  activeDays, setActiveDays, totalWeeks,
  gcalConfig, setGcalConfig, syncedEvents, setSyncedEvents,
  fbConfig, setFbConfig, schoolId, setSchoolId, fbEnabled, setFbEnabled, fbStatus, lastFbSync, onBack }) {

  const [tab, setTab] = useState("weekly");
  const [selCls, setSelCls] = useState(classes[0]?.id || "");
  const [showTutorial, setShowTutorial] = useState(false);
  const [toast, setToast] = useState(null);
  const [evtModal, setEvtModal] = useState(false);
  const [icsModal, setIcsModal] = useState(false);
  const [cellEdit, setCellEdit] = useState(null);
  const [dragSub, setDragSub] = useState(null);



  // Gcal sync
  const [syncStatus, setSyncStatus] = useState("idle");
  const syncTimerRef = useRef(null);

  const notify = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  const cls = classes.find(c => c.id === selCls);

  // Google Calendar fetch
  const fetchGoogleCalEvents = useCallback(async (weekNum, force) => {
    const hasSyncSource = gcalConfig?.method === "gas" ? !!gcalConfig.gasUrl : gcalConfig?.calendars?.some(c => c.enabled && c.icalUrl);
    if (!hasSyncSource || !gcalConfig?.syncEnabled) return;
    if (!force && syncedEvents?.[weekNum]?.length > 0) return;
    setSyncStatus("syncing");
    const allFetched = [];
    try {
      if (gcalConfig.method === "gas") {
        const mon = mondayOfWeek(weekNum, semDates);
        const sun = new Date(mon); sun.setDate(sun.getDate() + 7);
        const url = `${gcalConfig.gasUrl}?timeMin=${mon.toISOString()}&timeMax=${sun.toISOString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        (data.events || data || []).forEach(item => {
          const start = item.start || item.date;
          if (!start) return;
          const evtDate = new Date(typeof start === "string" ? (start.length <= 10 ? start + "T00:00:00" : start) : start);
          const dayName = ["日", "月", "火", "水", "木", "金", "土"][evtDate.getDay()];
          let type = item.calType || "行事";
          const title = item.title || item.summary || "（無題）";
          if (title?.includes("研修")) type = "研修";
          else if (title?.includes("出張")) type = "出張";
          allFetched.push({ title, type, day: dayName, allDay: item.allDay !== false, periods: [], source: "gcal" });
        });
      } else {
        const PROXIES = [
          (u) => `/api/ical?url=${encodeURIComponent(u)}`,
          (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
          (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        ];
        for (let ci = 0; ci < (gcalConfig.calendars || []).length; ci++) {
          const cal = gcalConfig.calendars[ci];
          if (!cal.enabled || !cal.icalUrl) continue;
          let icsText = null;
          for (const mkProxy of PROXIES) {
            try {
              const proxyUrl = mkProxy(cal.icalUrl);
              const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
              if (res.ok) { icsText = await res.text(); break; }
            } catch { /* try next */ }
          }
          if (!icsText) {
            try { const res = await fetch(cal.icalUrl, { signal: AbortSignal.timeout(10000) }); if (res.ok) icsText = await res.text(); } catch { }
          }
          if (icsText) {
            const parsed = parseICS(icsText);
            const mon = mondayOfWeek(weekNum, semDates);
            const weekEnd = new Date(mon); weekEnd.setDate(weekEnd.getDate() + 7);
            parsed.forEach(evt => {
              if (!evt.date || !evt.title) return;
              const evtDate = new Date(evt.date + "T00:00:00");
              if (evtDate < mon || evtDate >= weekEnd) return;
              const dayName = ["日", "月", "火", "水", "木", "金", "土"][evtDate.getDay()];
              let type = cal.type || "行事";
              if (evt.title?.includes("研修")) type = "研修";
              else if (evt.title?.includes("出張")) type = "出張";
              allFetched.push({ title: evt.title, type, day: dayName, allDay: true, periods: [], source: "gcal", calLabel: cal.label });
            });
          }
        }
      }
      setSyncedEvents(prev => ({ ...prev, [weekNum]: allFetched }));
      setSyncStatus("ok");
    } catch (err) {
      setSyncStatus("error");
      console.error("GCal sync error:", err);
    }
  }, [gcalConfig, semDates, setSyncedEvents, syncedEvents]);

  const hasSyncSource = gcalConfig?.method === "gas" ? !!gcalConfig.gasUrl : gcalConfig?.calendars?.some(c => c.enabled && c.icalUrl);
  useEffect(() => {
    if (gcalConfig.syncEnabled && hasSyncSource && gcalConfig.autoSync) fetchGoogleCalEvents(curWeek, false);
  }, [curWeek, gcalConfig.syncEnabled, hasSyncSource, gcalConfig.autoSync]);

  useEffect(() => {
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    if (gcalConfig.syncEnabled && hasSyncSource && gcalConfig.intervalMin > 0) {
      syncTimerRef.current = setInterval(() => fetchGoogleCalEvents(curWeek, false), gcalConfig.intervalMin * 60 * 1000);
    }
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, [gcalConfig.syncEnabled, hasSyncSource, gcalConfig.intervalMin, curWeek]);

  const manualEvents = events[curWeek] || [];
  const gcalEvents = syncedEvents[curWeek] || [];
  const weekEvents = [...manualEvents, ...gcalEvents];

  const weekTT = useMemo(() => resolveWeekTT(baseTTs[selCls], overrides[selCls] || {}, curWeek, activeDays), [baseTTs, overrides, selCls, curWeek, activeDays]);

  const updateWeekCell = useCallback((day, p, val) => {
    setOverrides(prev => {
      const co = { ...prev }; const clsOvr = { ...(co[selCls] || {}) };
      const weekOvr = { ...(clsOvr[curWeek] || {}) }; const dayOvr = { ...(weekOvr[day] || {}) };
      dayOvr[p] = val; weekOvr[day] = dayOvr; clsOvr[curWeek] = weekOvr; co[selCls] = clsOvr;
      return co;
    });
  }, [selCls, curWeek, setOverrides]);

  const updateBaseCell = useCallback((cid, day, p, val) => {
    setBaseTTs(prev => { const n = { ...prev }; const tt = { ...n[cid] }; if (!tt[day]) tt[day] = {}; tt[day] = { ...tt[day], [p]: val }; n[cid] = tt; return n; });
  }, [setBaseTTs]);

  const resetWeek = useCallback(() => {
    setOverrides(prev => { const co = { ...prev }; const o = { ...(co[selCls] || {}) }; delete o[curWeek]; co[selCls] = o; return co; });
    setModSched(prev => { const nm = { ...prev }; delete nm[curWeek]; return nm; });
    notify("ベースに戻しました");
  }, [selCls, curWeek, setOverrides, setModSched, notify]);

  const cycleMod = useCallback((day) => {
    setModSched(prev => {
      const nm = { ...prev }; const wm = { ...(nm[curWeek] || {}) };
      wm[day] = nextModMode(wm[day]);
      nm[curWeek] = wm; return nm;
    });
  }, [curWeek, setModSched]);

  const hasOverride = overrides[selCls]?.[curWeek] !== undefined || modSched[curWeek] !== undefined;

  const addEvent = useCallback((evt) => {
    setEvents(prev => ({ ...prev, [curWeek]: [...(prev[curWeek] || []), evt] }));
    if (evt.allDay && evt.day) {
      PER.forEach(p => { updateWeekCell(evt.day, p, { subject: `【${evt.type}】`, teacher: null, teacherName: "", eventTitle: evt.title, isEvent: true }); });
    } else if (evt.periods?.length && evt.day) {
      evt.periods.forEach(p => { updateWeekCell(evt.day, p, { subject: `【${evt.type}】`, teacher: null, teacherName: "", eventTitle: evt.title, isEvent: true }); });
    }
    notify("行事を登録しました");
  }, [curWeek, setEvents, updateWeekCell, notify]);

  const handleICSImport = useCallback((text) => {
    const parsed = parseICS(text);
    const mon = mondayOfWeek(curWeek, semDates);
    const weekEnd = new Date(mon); weekEnd.setDate(weekEnd.getDate() + 7);
    let imported = 0;
    parsed.forEach(evt => {
      if (!evt.date || !evt.title) return;
      const evtDate = new Date(evt.date + "T00:00:00");
      if (evtDate < mon || evtDate >= weekEnd) return;
      const dayName = ["日", "月", "火", "水", "木", "金", "土"][evtDate.getDay()];
      if (!activeDays?.includes(dayName)) return;
      let type = "行事";
      if (evt.title?.includes("研修")) type = "研修";
      else if (evt.title?.includes("出張")) type = "出張";
      const newEvt = { title: evt.title, type, day: dayName, periods: [], allDay: true };
      setEvents(prev => ({ ...prev, [curWeek]: [...(prev[curWeek] || []), newEvt] }));
      PER.forEach(p => { updateWeekCell(dayName, p, { subject: `【${type}】`, teacher: null, teacherName: "", eventTitle: evt.title, isEvent: true }); });
      imported++;
    });
    notify(`${imported}件取込完了`); setIcsModal(false);
  }, [curWeek, semDates, activeDays, setEvents, updateWeekCell, notify]);



  const tabs = [
    { id: "weekly", label: "週間時間割", icon: "▦" },
    { id: "monthly", label: "月間表示", icon: "📅" },
    { id: "base", label: "ベース時間割", icon: "◉" },
    { id: "hours", label: "授業時数", icon: "◎" },
    { id: "events", label: "行事・研修", icon: "☆" },

    { id: "settings", label: "設定", icon: "⚙" },
  ];

  return (<>
    {showTutorial && <Tutorial steps={KYOMU_TUTORIAL} onClose={() => setShowTutorial(false)} accentColor="#c0392b" />}
    {toast && <div style={{ position: "fixed", top: 14, right: 14, zIndex: 9999, padding: "11px 22px", borderRadius: 8, background: "#1a1625", color: "#fff", fontSize: 12, fontWeight: 500, animation: "slideR .3s ease-out" }}>{toast}</div>}
    {cellEdit && (
      <CellEditModal
        cell={cellEdit.cell} classObj={cls} period={cellEdit.p} day={cellEdit.d}
        teachers={teachers}
        onSave={(val) => {
          if (tab === "base") updateBaseCell(selCls, cellEdit.d, cellEdit.p, val);
          else updateWeekCell(cellEdit.d, cellEdit.p, val);
        }}
        onDelete={() => {
          if (tab === "base") updateBaseCell(selCls, cellEdit.d, cellEdit.p, null);
          else updateWeekCell(cellEdit.d, cellEdit.p, EMPTY_CELL);
        }}
        onClose={() => setCellEdit(null)}
      />
    )}
    {evtModal && <EventForm onAdd={addEvent} onClose={() => setEvtModal(false)} week={curWeek} activeDays={activeDays} />}
    {icsModal && <ICSImportModal onImport={handleICSImport} onClose={() => setIcsModal(false)} />}

    <header className="no-print" style={{ background: "linear-gradient(135deg,#1a1625 0%,#2d2640 100%)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,255,255,.35)", cursor: "pointer", fontSize: 16 }}>←</button>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#c0392b", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 900 }}>教</div>
        <h1 style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>教務管理 <span style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>小学校版</span></h1>
        <button onClick={() => setShowTutorial(true)} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "50%", width: 22, height: 22, color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>?</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <WeekNav curWeek={curWeek} setCurWeek={setCurWeek} semester={semester} semDates={semDates} totalWeeks={totalWeeks} />
        {fbEnabled && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 5, background: fbStatus === "connected" ? "rgba(34,197,94,.12)" : fbStatus === "error" ? "rgba(239,68,68,.12)" : "rgba(255,255,255,.05)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: fbStatus === "connected" ? "#22c55e" : fbStatus === "connecting" ? "#f59e0b" : fbStatus === "error" ? "#ef4444" : "#9ca3af", animation: fbStatus === "connecting" ? "pulse 1s infinite" : "none" }} />
            <span style={{ fontSize: 8, color: "rgba(255,255,255,.5)" }}>{fbStatus === "connected" ? "DB接続中" : fbStatus === "connecting" ? "接続中..." : fbStatus === "error" ? "DB障害" : "オフライン"}</span>
          </div>
        )}
        <select value={selCls} onChange={e => setSelCls(e.target.value)} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.06)", color: "#fff", fontSize: 11, cursor: "pointer", outline: "none" }}>
          {classes.map(c => <option key={c.id} value={c.id} style={{ color: "#000" }}>{c.name}</option>)}
        </select>
      </div>
    </header>

    <nav className="no-print" style={{ background: "#fff", borderBottom: "1px solid #e8e4de", padding: "0 20px", display: "flex", overflowX: "auto" }}>
      {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 12px", background: "none", border: "none", borderBottom: tab === t.id ? "2.5px solid #c0392b" : "2.5px solid transparent", color: tab === t.id ? "#1a1625" : "#aaa", fontSize: 11, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}><span style={{ fontSize: 11 }}>{t.icon}</span>{t.label}</button>)}
    </nav>

    <main style={{ padding: "16px 20px", maxWidth: 1400, margin: "0 auto" }}>

      {/* ========= WEEKLY ========= */}
      {tab === "weekly" && (
        <div style={{ animation: "fadeUp .3s ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a1625" }}>{cls?.name} — 第{curWeek}週</h2>
              {hasOverride && <span style={{ fontSize: 9, color: "#c0392b", fontWeight: 600 }}>● 変更あり</span>}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {hasOverride && <BtnS onClick={resetWeek}>ベースに戻す</BtnS>}
              <BtnS onClick={() => setEvtModal(true)}>☆ 行事登録</BtnS>
              <BtnS onClick={() => setIcsModal(true)}>📥 カレンダー取込</BtnS>
            </div>
          </div>
          <Card style={{ padding: 10, overflowX: "auto" }}>
            <WeeklyGrid tt={weekTT} modSched={modSched} curWeek={curWeek} days={activeDays}
              semDates={semDates} weekEvents={weekEvents} classObj={cls} editable={true}
              onCellClick={(d, p, cell) => setCellEdit({ d, p, cell })} teachers={teachers}
              onModToggle={cycleMod} />
          </Card>
        </div>
      )}

      {/* ========= MONTHLY ========= */}
      {tab === "monthly" && (
        <MonthlyView baseTTs={baseTTs} overrides={overrides} events={events} syncedEvents={syncedEvents}
          modSched={modSched} semDates={semDates} activeDays={activeDays} classes={classes}
          selCls={selCls} setSelCls={setSelCls} setCurWeek={setCurWeek} setTab={setTab} />
      )}

      {/* ========= BASE TIMETABLE ========= */}
      {tab === "base" && (
        <div style={{ animation: "fadeUp .3s ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a1625" }}>{cls?.name} — ベース時間割</h2>
              <p style={{ fontSize: 10, color: "#999" }}>全週に適用される標準パターン（セルクリックで編集）</p>
            </div>
            <BtnS onClick={() => { activeDays.forEach(d => PER.forEach(p => updateBaseCell(selCls, d, p, null))); notify("クリアしました"); }}>クリア</BtnS>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Subject palette */}
            <div style={{ width: 130, flexShrink: 0 }}>
              <Card style={{ position: "sticky", top: 14 }}>
                {cls && cls.grades.length > 1 && (
                  <>
                    <h4 style={{ fontSize: 10, color: "#999", fontWeight: 700, marginBottom: 6 }}>【一斉指導】共通科目</h4>
                    {(() => {
                      const common = ALL_SUBS_ES.filter(s => cls.grades.every(g => subjectsForGrade(g)?.includes(s)));
                      return common.map(sub => {
                        const s = SC[sub]; return <div key={sub} draggable onDragStart={() => setDragSub({ type: "all", subject: sub })} style={{ padding: "4px 7px", borderRadius: 5, fontSize: 9, background: s.bg, color: s.tx, fontWeight: 700, cursor: "grab", borderLeft: `3px solid ${s.bd}`, marginBottom: 3, userSelect: "none" }}>{sub}</div>;
                      });
                    })()}
                    {cls.grades.map(g => (
                      <div key={g}>
                        <h4 style={{ fontSize: 10, color: "#999", fontWeight: 700, marginTop: 8, marginBottom: 4 }}>【{g}年の教科】</h4>
                        {subjectsForGrade(g).filter(s => !cls.grades.every(gg => subjectsForGrade(gg)?.includes(s))).map(sub => {
                          const s = SC[sub]; return <div key={sub} draggable onDragStart={() => setDragSub({ type: "split", grade: g, subject: sub })} style={{ padding: "3px 6px", borderRadius: 5, fontSize: 8, background: s.bg, color: s.tx, fontWeight: 700, cursor: "grab", borderLeft: `3px solid ${s.bd}`, marginBottom: 2, userSelect: "none" }}>{g}年 {sub}</div>;
                        })}
                      </div>
                    ))}
                  </>
                )}
                {cls && cls.grades.length === 1 && (
                  <>
                    <h4 style={{ fontSize: 10, color: "#999", fontWeight: 700, marginBottom: 6 }}>教科</h4>
                    {subjectsForGrade(cls.grades[0]).map(sub => {
                      const s = SC[sub]; return <div key={sub} draggable onDragStart={() => setDragSub({ type: "all", subject: sub })} style={{ padding: "4px 7px", borderRadius: 5, fontSize: 9, background: s.bg, color: s.tx, fontWeight: 700, cursor: "grab", borderLeft: `3px solid ${s.bd}`, marginBottom: 3, userSelect: "none" }}>{sub}</div>;
                    })}
                  </>
                )}
                <h4 style={{ fontSize: 10, color: "#999", fontWeight: 700, marginTop: 10, marginBottom: 6 }}>カウント対象外</h4>
                {NON_COUNT_SUBS.map(sub => {
                  const s = SC[sub] || { bg: "#f0f0f0", tx: "#666", bd: "#aaa" };
                  return <div key={sub} draggable onDragStart={() => setDragSub({ type: "all", subject: sub })} style={{ padding: "3px 6px", borderRadius: 5, fontSize: 8, background: s.bg, color: s.tx, fontWeight: 700, cursor: "grab", borderLeft: `3px solid ${s.bd}`, marginBottom: 2, userSelect: "none", fontStyle: "italic" }}>◇ {sub}</div>;
                })}
              </Card>
            </div>
            {/* Grid */}
            <div style={{ flex: 1 }}>
              <Card style={{ padding: 10, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 2 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 58, padding: 4 }}></th>
                      {activeDays.map(d => (
                        <th key={d} style={{ padding: "5px 3px", textAlign: "center", fontSize: 13, fontWeight: 700 }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PER.map(p => {
                      if (cls && cls.grades.every(g => p > MAX_PERIODS_BY_GRADE[g])) return null;
                      return (
                        <tr key={p}>
                          <td style={{ textAlign: "center", padding: 3 }}>
                            <div style={{ fontSize: 11, fontWeight: 700 }}>{p}校時</div>
                            <div style={{ fontSize: 7, color: "#999" }}>{p <= 5 ? "40分" : "45分"}</div>
                          </td>
                          {activeDays.map(d => {
                            const cell = baseTTs[selCls]?.[d]?.[p];
                            return (
                              <td key={d}
                                onClick={() => setCellEdit({ d, p, cell })}
                                onDragOver={e => e.preventDefault()}
                                onDrop={() => {
                                  if (!dragSub) return;
                                  if (dragSub.type === "all") {
                                    updateBaseCell(selCls, d, p, { subject: dragSub.subject, teacher: "", teacherName: "", type: "all" });
                                  } else if (dragSub.type === "split") {
                                    const existing = baseTTs[selCls]?.[d]?.[p];
                                    const grades = existing?.type === "split" && existing?.grades ? { ...existing.grades } : {};
                                    grades[dragSub.grade] = { subject: dragSub.subject };
                                    updateBaseCell(selCls, d, p, { type: "split", teacher: existing?.teacher || "", teacherName: existing?.teacherName || "", grades });
                                  }
                                  setDragSub(null);
                                }}
                                style={{ padding: 0, height: cls && cls.grades.length > 1 ? 56 : 48, verticalAlign: "middle", cursor: "pointer" }}>
                                <CellDisplay cell={cell} period={p} modMode="none" classGrades={cls?.grades || []} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        </div>
      )}
{/* ========= HOURS ========= */}
      {tab === "hours" && (
        <div style={{ animation: "fadeUp .3s ease-out" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>📊 授業時数分析（学年別）</h2>
          <p style={{ fontSize: 10, color: "#999", marginBottom: 14 }}>第{curWeek}週まで / 全{totalWeeks}週（進捗率目安: {Math.round(curWeek / totalWeeks * 100)}%）</p>
          
          {classes.map(c => (
            <Card key={c.id} style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, borderBottom: "2px solid #e8e4de", paddingBottom: 6 }}>{c.name}</h3>
              <div style={{ display: "grid", gridTemplateColumns: c.grades?.length > 1 ? `repeat(${c.grades.length}, 1fr)` : "1fr", gap: 12 }}>
                {c.grades.map(g => {
                  const analysis = analyzeHoursForGrade(g, c.id, baseTTs[c.id] || {}, overrides[c.id] || {}, modSched, curWeek, activeDays, totalWeeks) || [];
                  const nonCount = analyzeNonCountForGrade(g, c.id, baseTTs[c.id] || {}, overrides[c.id] || {}, modSched, curWeek, activeDays) || [];
                  
                  return (
                    <div key={g}>
                      <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#c0392b" }}>{g}年生</h4>
                      {analysis?.map(r => {
                        const s = SC[r.subject];
                        const rowDone = r.done || 0;
                        const rowTotal = r.annual || 1;
                        const rowPct = Math.round((rowDone / rowTotal) * 100);
                        const expPct = Math.round(((curWeek || 1) / (totalWeeks || 35)) * 100);
                        const rowSv = rowPct === 0 ? "none" : rowPct < expPct - 10 ? "danger" : rowPct < expPct - 5 ? "warning" : "success";

                        return (
                          <div key={r.subject} style={{ marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: s?.tx || "#666", minWidth: 55 }}>{r.subject}</span>
                              <div style={{ flex: 1, height: 14, background: "#f0ede8", borderRadius: 7, overflow: "hidden", position: "relative" }}>
                                <div style={{ height: "100%", background: rowSv === "danger" ? "#ef4444" : rowSv === "warning" ? "#f59e0b" : "#22c55e", width: `${Math.min(100, rowPct)}%`, borderRadius: 7, transition: "width .3s" }} />
                                <div style={{ position: "absolute", left: `${expPct}%`, top: 0, bottom: 0, width: 1, background: "#666" }} />
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: rowSv === "danger" ? "#ef4444" : rowSv === "warning" ? "#f59e0b" : "#22c55e", minWidth: 32, textAlign: "right" }}>{rowPct}%</span>
                              <Badge sv={rowSv} label={`${fmtCnt(rowDone)}/${rowTotal}`} />
                            </div>
                            <div style={{ fontSize: 7, color: "#999", paddingLeft: 62 }}>
                              残{fmtCnt(r.remaining || 0)}時間 / 週{fmtCnt(r.neededPerWk || 0)}コマ必要
                            </div>
                          </div>
                        );
                      })}

                      {nonCount?.length > 0 && (
                        <div style={{ marginTop: 8, padding: 6, background: "#f9f7f4", borderRadius: 6 }}>
                          <div style={{ fontSize: 8, fontWeight: 700, color: "#999", marginBottom: 4 }}>カウント対象外</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {nonCount?.map(r => (
                              <span key={r.subject} style={{ fontSize: 8, padding: "1px 6px", borderRadius: 4, background: "#f0f0f0", color: "#666" }}>{r.subject}: {fmtCnt(r.done)}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* ========= EVENTS ========= */}
      {tab === "events" && (
        <div style={{ animation: "fadeUp .3s ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>行事・研修（第{curWeek}週）</h2>
            <div style={{ display: "flex", gap: 5 }}>
              <BtnS onClick={() => setIcsModal(true)}>📥 ICS取込</BtnS>
              <BtnP onClick={() => setEvtModal(true)}>☆ 行事登録</BtnP>
            </div>
          </div>
          <Card>
            {weekEvents.length === 0 ? (
              <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: 20 }}>この週の行事・研修はありません</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {weekEvents.map((ev, i) => {
                  const et = EVT_TYPES[ev.type] || EVT_TYPES["その他"];
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f9f7f4", borderRadius: 8, borderLeft: `4px solid ${et.bg}` }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: et.bg, color: et.tx, fontWeight: 700 }}>{ev.type}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{ev.title}</span>
                      <span style={{ fontSize: 10, color: "#888" }}>{ev.day}曜{ev.allDay ? "（終日）" : ""}</span>
                      {ev.source === "gcal" && <span style={{ fontSize: 8, color: "#2563eb", fontWeight: 600 }}>📅 GCal</span>}
                      {!ev.source && (
                        <button onClick={() => {
                          setEvents(prev => {
                            const wk = prev[curWeek] || [];
                            return { ...prev, [curWeek]: wk.filter((_, j) => j !== i) };
                          });
                        }} style={{ padding: "2px 6px", borderRadius: 3, border: "1px solid #fca5a5", background: "#fff", color: "#ef4444", fontSize: 9, cursor: "pointer" }}>✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========= SETTINGS ========= */}
      {tab === "settings" && (
        <div style={{ animation: "fadeUp .3s ease-out" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>設定</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

            <ClassConfig classes={classes} setClasses={setClasses} teachers={teachers} setTeachers={setTeachers} />

            {/* Semester Dates */}
            <Card style={{ gridColumn: "span 2" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📅 学期期間設定</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[{ key: "s1", label: "1学期" }, { key: "s2", label: "2学期" }, { key: "s3", label: "3学期" }].map(sem => (
                  <div key={sem.key} style={{ padding: 12, background: "#f9f7f4", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{sem.label}</div>
                    <div style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 9, fontWeight: 600, color: "#999", display: "block", marginBottom: 2 }}>開始日</label>
                      <input type="date" value={semDates[`${sem.key}Start`]} onChange={e => setSemDates(p => ({ ...p, [`${sem.key}Start`]: e.target.value }))} style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: "1px solid #e8e4de", fontSize: 11 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 600, color: "#999", display: "block", marginBottom: 2 }}>終了日</label>
                      <input type="date" value={semDates[`${sem.key}End`]} onChange={e => setSemDates(p => ({ ...p, [`${sem.key}End`]: e.target.value }))} style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: "1px solid #e8e4de", fontSize: 11 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: "#999" }}>※ 年間の週数: {totalWeeks}週</div>
            </Card>

            {/* Active Days */}
            <Card>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📆 授業実施曜日</h3>
              <div style={{ display: "flex", gap: 5 }}>
                {ALL_DAYS.map(d => {
                  const active = activeDays?.includes(d);
                  const isWE = d === "土" || d === "日";
                  return (
                    <button key={d} onClick={() => {
                      setActiveDays(prev => {
                        if (prev?.includes(d)) return prev.filter(x => x !== d);
                        return ALL_DAYS.filter(x => prev?.includes(x) || x === d);
                      });
                    }} style={{ flex: 1, padding: "10px 4px", borderRadius: 7, textAlign: "center", cursor: "pointer", border: active ? (isWE ? "2px solid #c0392b" : "2px solid #22c55e") : "2px solid #e8e4de", background: active ? (isWE ? "#fef2f0" : "#f0fdf4") : "#fff" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isWE ? "#c0392b" : "#1a1625" }}>{d}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2, color: active ? (isWE ? "#c0392b" : "#22c55e") : "#ccc" }}>{active ? "ON" : "OFF"}</div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Module info */}
            <Card>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⏱ ひらめき（モジュール授業 25分）</h3>
              <p style={{ fontSize: 11, color: "#666", lineHeight: 1.7 }}>
                ひらめきは5校時終了後に実施（25分間）。ON/OFFは<strong>週間時間割</strong>で曜日ごとに切替。
              </p>
              <div style={{ marginTop: 8, padding: 8, background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: 10, color: "#166534" }}>
                  ● ON → 1〜5校時が 1.0 カウント（40分+5分=45分）<br />
                  ○ OFF → 1〜5校時が 0.89 カウント（40分÷45分）<br />
                  6校時は常に 1.0 カウント（45分）
                </div>
              </div>
            </Card>

            <TeacherMgr teachers={teachers} setTeachers={setTeachers} classes={classes} />

            {/* Firebase */}
            <Card style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>🔥 データ共有（Firebase）</h3>
                <Toggle on={fbEnabled} onChange={setFbEnabled} />
              </div>
              <p style={{ fontSize: 10, color: "#999", marginBottom: 12, lineHeight: 1.7 }}>
                複数端末間でデータをリアルタイム同期します。{lastFbSync && <><br /><span style={{ color: "#22c55e" }}>最終同期: {lastFbSync.toLocaleTimeString("ja-JP")}</span></>}
              </p>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>Database URL</label>
                <input value={fbConfig.databaseURL || ""} onChange={e => setFbConfig(p => ({ ...p, databaseURL: e.target.value }))}
                  placeholder="https://○○○-default-rtdb.firebaseio.com"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #e8e4de", fontSize: 12, fontFamily: "monospace" }} />
              </div>
              <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>学校ID</label>
                  <input value={schoolId} onChange={e => setSchoolId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                    placeholder="school_es01" style={{ width: "100%", padding: "7px 10px", borderRadius: 5, border: "1px solid #e8e4de", fontSize: 12, fontFamily: "monospace" }} />
                </div>
                <span style={{ fontSize: 9, color: "#999", paddingBottom: 8 }}>※英数字のみ</span>
              </div>
            </Card>

            {/* Google Calendar */}
            <Card style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>🔗 Googleカレンダー連携</h3>
                <Toggle on={gcalConfig.syncEnabled} onChange={v => setGcalConfig(p => ({ ...p, syncEnabled: v }))} />
              </div>
              {gcalConfig.syncEnabled && (
                <>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {[{ id: "ical", label: "📄 公開iCal URL" }, { id: "gas", label: "⚡ Google Apps Script" }].map(m => (
                      <button key={m.id} onClick={() => setGcalConfig(p => ({ ...p, method: m.id }))}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer", border: gcalConfig.method === m.id ? "2px solid #2563eb" : "2px solid #e8e4de", background: gcalConfig.method === m.id ? "#eff6ff" : "#fff", fontSize: 11, fontWeight: 600 }}>{m.label}</button>
                    ))}
                  </div>
                  {gcalConfig.method === "ical" && gcalConfig.calendars.map((cal, ci) => (
                    <div key={ci} style={{ marginBottom: 8, padding: 10, background: "#f9f7f4", borderRadius: 7, borderLeft: `4px solid ${cal.color}` }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                        <input value={cal.label} onChange={e => { setGcalConfig(p => { const cals = [...p.calendars]; cals[ci] = { ...cals[ci], label: e.target.value }; return { ...p, calendars: cals }; }); }}
                          style={{ width: 100, padding: "4px 7px", borderRadius: 4, border: "1px solid #e8e4de", fontSize: 10, fontWeight: 600 }} />
                        <select value={cal.type} onChange={e => { setGcalConfig(p => { const cals = [...p.calendars]; cals[ci] = { ...cals[ci], type: e.target.value }; return { ...p, calendars: cals }; }); }}
                          style={{ padding: "4px 6px", borderRadius: 4, border: "1px solid #e8e4de", fontSize: 10 }}>
                          <option value="行事">行事</option><option value="研修">研修</option><option value="出張">出張</option><option value="その他">その他</option>
                        </select>
                      </div>
                      <input value={cal.icalUrl} onChange={e => { setGcalConfig(p => { const cals = [...p.calendars]; cals[ci] = { ...cals[ci], icalUrl: e.target.value }; return { ...p, calendars: cals }; }); }}
                        placeholder="https://calendar.google.com/calendar/ical/..." style={{ width: "100%", padding: "6px 8px", borderRadius: 5, border: "1px solid #e8e4de", fontSize: 10, fontFamily: "monospace" }} />
                    </div>
                  ))}
                  {gcalConfig.method === "gas" && (
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>GAS URL</label>
                      <input value={gcalConfig.gasUrl || ""} onChange={e => setGcalConfig(p => ({ ...p, gasUrl: e.target.value }))}
                        placeholder="https://script.google.com/macros/s/..." style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #e8e4de", fontSize: 11, fontFamily: "monospace" }} />
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </main>
  </>);
}

// ============================================================
// TEACHER SELECT
// ============================================================
function TSelect({ teachers, classes, onSelect, onBack }) {
  const tanninTeachers = teachers.filter(t => t.classId);
  const senkaTeachers = teachers.filter(t => !t.classId);
  return (
    <div style={{ padding: "36px 22px", maxWidth: 760, margin: "0 auto", animation: "fadeUp .4s ease-out" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>← 戻る</button>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>教員を選択</h2>
      <p style={{ fontSize: 11, color: "#999", marginBottom: 18 }}>自分の学級の時間割確認と週案作成ができます</p>
      {tanninTeachers.length > 0 && (
        <>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "#27ae60", marginBottom: 8 }}>学級担任</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
            {tanninTeachers.map(t => {
              const cls = classes.find(c => c.id === t.classId);
              return (
                <button key={t.id} onClick={() => onSelect(t.id)} style={{ padding: "14px 12px", borderRadius: 10, border: "1px solid #e8e4de", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#27ae60"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e4de"; }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#27ae60", fontWeight: 600, marginBottom: 4 }}>{cls?.name || "—"} 担任</div>
                  {t.senkaOut?.length > 0 && <div style={{ fontSize: 8, color: "#999" }}>専科委託: {t.senkaOut.join(", ")}</div>}
                </button>
              );
            })}
          </div>
        </>
      )}
      {senkaTeachers.length > 0 && (
        <>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", marginBottom: 8 }}>専科教員</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {senkaTeachers.map(t => (
              <button key={t.id} onClick={() => onSelect(t.id)} style={{ padding: "14px 12px", borderRadius: 10, border: "1px solid #e8e4de", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {(t.senka || []).map((s, i) => {
                    const c = classes.find(x => x.id === s.classId);
                    return <span key={i} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 6, background: SC[s.subject]?.bg || "#eee", color: SC[s.subject]?.tx || "#666", fontWeight: 600 }}>{c?.name} {s.subject}</span>;
                  })}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// TEACHER APP — 学級担任画面
// ============================================================
function TeacherApp({ classes, baseTTs, overrides, events, teachers, modSched, curWeek, setCurWeek,
  semester, semDates, weekPlans, setWeekPlans, activeDays, totalWeeks,
  gcalConfig, syncedEvents, setSyncedEvents, fbStatus, onBack, ...rest }) {

  const [selT, setSelT] = useState(null);
  const [tab, setTab] = useState("schedule");
  const [showTutorial, setShowTutorial] = useState(false);

  const teacher = teachers.find(t => t.id === selT);
  const myClass = teacher ? classes.find(c => c.id === teacher.classId) : null;

  if (!selT) return <TSelect teachers={teachers} classes={classes} onSelect={setSelT} onBack={onBack} />;
  if (!teacher) return null;

  const weekEvents = [...(events[curWeek] || []), ...(syncedEvents?.[curWeek] || [])];
  const weekTT = myClass ? resolveWeekTT(baseTTs[myClass.id], overrides[myClass.id] || {}, curWeek, activeDays) : {};
  const weekMod = getWeekMod(modSched, curWeek);

  const planKey = (d, p, g) => `${selT}-${d}-${p}-${g}-w${curWeek}`;
  const getPlan = (d, p, g) => weekPlans[planKey(d, p, g)] || {};
  const updatePlan = (d, p, g, field, val) => {
    const k = planKey(d, p, g);
    setWeekPlans(prev => ({ ...prev, [k]: { ...(prev[k] || {}), [field]: val } }));
  };

  const tabs = [
    { id: "schedule", label: "週間時間割", icon: "▦" },
    { id: "monthly", label: "月間表示", icon: "📅" },
    { id: "weekplan", label: "週案作成", icon: "☰" },
    { id: "hours", label: "授業時数", icon: "◎" },
  ];

  return (<>
    {showTutorial && <Tutorial steps={TEACHER_TUTORIAL} onClose={() => setShowTutorial(false)} accentColor="#27ae60" />}

    <header className="no-print" style={{ background: "linear-gradient(135deg,#1a3320,#234d2e)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setSelT(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.35)", cursor: "pointer", fontSize: 16 }}>←</button>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#27ae60", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 900 }}>担</div>
        <div>
          <h1 style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{teacher.name}</h1>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>{myClass?.name || "専科"}</div>
        </div>
        <button onClick={() => setShowTutorial(true)} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "50%", width: 22, height: 22, color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>?</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <WeekNav curWeek={curWeek} setCurWeek={setCurWeek} semester={semester} semDates={semDates} totalWeeks={totalWeeks} />
      </div>
    </header>

    <nav className="no-print" style={{ background: "#fff", borderBottom: "1px solid #e8e4de", padding: "0 20px", display: "flex" }}>
      {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 14px", background: "none", border: "none", borderBottom: tab === t.id ? "2.5px solid #27ae60" : "2.5px solid transparent", color: tab === t.id ? "#1a1625" : "#aaa", fontSize: 11, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><span>{t.icon}</span>{t.label}</button>)}
    </nav>

    <main style={{ padding: "16px 20px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Schedule */}
      {tab === "schedule" && myClass && (
        <div style={{ animation: "fadeUp .3s ease-out" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{myClass.name} — 第{curWeek}週</h2>
          {weekEvents.length > 0 && (
            <Card style={{ marginBottom: 10, padding: "8px 12px", borderLeft: "4px solid #dc2626" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", marginBottom: 4 }}>📅 今週の予定</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {weekEvents.map((ev, i) => {
                  const et = EVT_TYPES[ev.type] || EVT_TYPES["その他"];
                  return <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: et.bg, color: et.tx, fontWeight: 700 }}>{ev.day}曜 {ev.title}</span>;
                })}
              </div>
            </Card>
          )}
          <Card style={{ padding: 10, overflowX: "auto" }}>
            <WeeklyGrid tt={weekTT} modSched={modSched} curWeek={curWeek} days={activeDays}
              semDates={semDates} weekEvents={weekEvents} classObj={myClass} editable={false} teachers={teachers} />
          </Card>
        </div>
      )}

      {/* Monthly */}
      {tab === "monthly" && myClass && (
        <MonthlyView baseTTs={baseTTs} overrides={overrides} events={events} syncedEvents={syncedEvents}
          modSched={modSched} semDates={semDates} activeDays={activeDays} classes={classes}
          selCls={myClass.id} setSelCls={() => {}} setCurWeek={setCurWeek} setTab={(t) => { if (t === "weekly") setTab("schedule"); }} />
      )}

      {/* Week Plan */}
      {tab === "weekplan" && myClass && (
        <div style={{ animation: "fadeUp .3s ease-out" }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>週案 — 第{curWeek}週 — {myClass.name}</h2>
            <BtnS onClick={() => window.print()}>🖨️ 印刷</BtnS>
          </div>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "linear-gradient(135deg,#1a3320,#234d2e)" }}>
                <th style={{ padding: "8px 5px", fontSize: 9, color: "rgba(255,255,255,.5)", width: 60, borderRight: "1px solid rgba(255,255,255,.08)" }}>時限</th>
                {activeDays.map((d, di) => {
                  const dates = weekDates(curWeek, semDates);
                  const dt = dates[ALL_DAYS.indexOf(d)];
                  const dayEvts = weekEvents.filter(ev => ev.day === d);
                  return (
                    <th key={d} style={{ padding: "6px 4px", textAlign: "center", borderRight: di < activeDays.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,.4)" }}>{dt ? fmtDate(dt) : ""}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{d}</div>
                      {dayEvts.map((ev, i) => {
                        const et = EVT_TYPES[ev.type] || EVT_TYPES["その他"];
                        return <div key={i} style={{ fontSize: 7, padding: "1px 4px", borderRadius: 4, background: et.bg, color: et.tx, fontWeight: 600, marginTop: 2 }}>{ev.title}</div>;
                      })}
                    </th>
                  );
                })}
              </tr></thead>
              <tbody>
                {PER.map(p => {
                  if (myClass.grades.every(g => p > MAX_PERIODS_BY_GRADE[g])) return null;
                  return (
                    <tr key={p} style={{ borderBottom: p === 5 ? "3px double #27ae60" : "1px solid #f0ede8" }}>
                      <td style={{ padding: "6px 4px", textAlign: "center", background: "#f9f7f4", borderRight: "1px solid #eee" }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{p}校時</div>
                        <div style={{ fontSize: 7, color: "#999" }}>{PTIMES_ES[p].start}-{PTIMES_ES[p].end}</div>
                      </td>
                      {activeDays.map((d, di) => {
                        const cell = weekTT[d]?.[p];
                        if (!cell || isEmptyCell(cell)) {
                          return <td key={d} style={{ padding: 3, textAlign: "center", borderRight: di < activeDays.length - 1 ? "1px solid #f0ede8" : "none", background: "#fafaf8" }}><span style={{ color: "#e0dcd6", fontSize: 9 }}>—</span></td>;
                        }
                        if (cell.isEvent) {
                          const et = EVT_TYPES[cell.subject?.replace(/[【】]/g, "")] || EVT_TYPES["その他"];
                          return <td key={d} style={{ padding: 3, textAlign: "center", borderRight: di < activeDays.length - 1 ? "1px solid #f0ede8" : "none", background: `${et.bg}10` }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: et.bg }}>{cell.subject}</div>
                            {cell.eventTitle && <div style={{ fontSize: 7, color: "#888" }}>{cell.eventTitle}</div>}
                          </td>;
                        }
                        // Split cell — show per-grade plan entries
                        if (cell.type === "split" && cell.grades) {
                          const gradeKeys = Object.keys(cell.grades).map(Number).sort();
                          return (
                            <td key={d} style={{ padding: 3, verticalAlign: "top", borderRight: di < activeDays.length - 1 ? "1px solid #f0ede8" : "none", minWidth: 130 }}>
                              {gradeKeys.map(g => {
                                const gs = cell.grades[g];
                                if (!gs?.subject) return null;
                                if (p > MAX_PERIODS_BY_GRADE[g]) return null;
                                const s = subjectColor(gs.subject);
                                const plan = getPlan(d, p, g);
                                return (
                                  <div key={g} style={{ marginBottom: 4, padding: 4, background: `${s.bg}80`, borderRadius: 6, borderLeft: `3px solid ${s.bd}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: s.tx }}>{g}年 {gs.subject}</span>
                                    </div>
                                    {["goal", "content"].map(field => (
                                      <div key={field} style={{ marginBottom: 1 }}>
                                        <input value={plan[field] || ""} onChange={e => updatePlan(d, p, g, field, e.target.value)}
                                          placeholder={field === "goal" ? "目標" : "内容"}
                                          style={{ width: "100%", padding: "2px 4px", borderRadius: 3, border: "1px solid #e8e4de", fontSize: 9, background: "#fff" }} />
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </td>
                          );
                        }
                        // All-class cell — single plan entry
                        const s = subjectColor(cell.subject);
                        const plan = getPlan(d, p, myClass.grades[0]);
                        return (
                          <td key={d} style={{ padding: 3, verticalAlign: "top", borderRight: di < activeDays.length - 1 ? "1px solid #f0ede8" : "none", background: `${s.bg}50`, minWidth: 130 }}>
                            <div style={{ marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: s.tx }}>{cell.subject}</span>
                              <span style={{ fontSize: 8, color: "#999" }}>一斉</span>
                            </div>
                            {["goal", "content"].map(field => (
                              <div key={field} style={{ marginBottom: 1 }}>
                                <input value={plan[field] || ""} onChange={e => updatePlan(d, p, myClass.grades[0], field, e.target.value)}
                                  placeholder={field === "goal" ? "目標" : "内容"}
                                  style={{ width: "100%", padding: "3px 5px", borderRadius: 3, border: "1px solid #e8e4de", fontSize: 9, background: "#fff" }} />
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Hours */}
      {tab === "hours" && myClass && (
        <div style={{ animation: "fadeUp .3s ease-out" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>📊 授業時数（{myClass.name}）</h2>
          <p style={{ fontSize: 10, color: "#999", marginBottom: 14 }}>第{curWeek}週まで / 全{totalWeeks}週</p>
          <div style={{ display: "grid", gridTemplateColumns: myClass.grades.length > 1 ? `repeat(${myClass.grades.length}, 1fr)` : "1fr", gap: 12 }}>
            {myClass.grades.map(g => {
              const analysis = analyzeHoursForGrade(g, myClass.id, baseTTs[myClass.id] || {}, overrides[myClass.id] || {}, modSched, curWeek, activeDays, totalWeeks);
              return (
                <Card key={g}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#27ae60" }}>{g}年生</h4>
                  {analysis.map(r => {
                    const s = SC[r.subject];
                    return (
                      <div key={r.subject} style={{ marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: s?.tx || "#666", minWidth: 55 }}>{r.subject}</span>
                          <div style={{ flex: 1, height: 12, background: "#f0ede8", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: r.severity === "danger" ? "#ef4444" : r.severity === "warning" ? "#f59e0b" : "#22c55e", width: `${Math.min(100, r.pct)}%`, borderRadius: 6 }} />
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 700, color: r.severity === "danger" ? "#ef4444" : r.severity === "warning" ? "#f59e0b" : "#22c55e", minWidth: 28, textAlign: "right" }}>{r.pct}%</span>
                        </div>
                        <div style={{ fontSize: 7, color: "#999", paddingLeft: 62 }}>
                          {fmtCnt(r.done)}/{r.annual} 残{fmtCnt(r.remaining)}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </main>
  </>);
}

