const PROGRAM_KEY = "workout-diary-program";
const MAXES_KEY = "workout-diary-maxes";
const PLAN_KEY = "workout-diary-plan";
const LOG_KEY = "workout-diary-log";
const TODAY_KEY = "workout-diary-today";

function load(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadProgram() {
  return load(PROGRAM_KEY, null);
}

export function saveProgram(program) {
  save(PROGRAM_KEY, program);
}

export function clearProgram() {
  localStorage.removeItem(PROGRAM_KEY);
}

export function loadMaxes() {
  return load(MAXES_KEY, {});
}

export function saveMaxes(maxes) {
  save(MAXES_KEY, maxes);
}

export function loadPlan() {
  return load(PLAN_KEY, {});
}

export function savePlan(plan) {
  save(PLAN_KEY, plan);
}

export function loadLog() {
  return load(LOG_KEY, {});
}

export function saveLogEntry(week, workoutIndex, exercise, entry) {
  const log = loadLog();
  if (!log[week]) log[week] = {};
  if (!log[week][workoutIndex]) log[week][workoutIndex] = {};
  log[week][workoutIndex][exercise] = entry;
  save(LOG_KEY, log);
  return log;
}

export function clearLog() {
  localStorage.removeItem(LOG_KEY);
}

export function loadToday() {
  return load(TODAY_KEY, { week: 1, workoutIndex: 0 });
}

export function saveToday(today) {
  save(TODAY_KEY, today);
}
