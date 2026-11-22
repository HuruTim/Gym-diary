"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { evalFormula, roundKg } from "../lib/formula";
import {
  clearLog,
  clearProgram,
  loadLog,
  loadMaxes,
  loadPlan,
  loadProgram,
  loadToday,
  saveLogEntry,
  saveMaxes,
  savePlan,
  saveProgram,
  saveToday,
} from "../lib/storage";

const WEEKS_TOTAL = 8;
const EXERCISES_PER_WORKOUT = 5;

function emptyExercises() {
  return Array.from({ length: EXERCISES_PER_WORKOUT }, () => ({
    name: "",
    sets: "3",
    reps: "8",
    formula: "",
  }));
}

function plannedFor(program, maxes, plan, week, workoutIndex, exercise) {
  const override = plan?.[week]?.[workoutIndex]?.[exercise.name] ?? {};
  const sets = override.sets?.trim() || exercise.sets;
  const reps = override.reps?.trim() || exercise.reps;
  let weight = null;
  if (override.weight != null && override.weight.trim() !== "") {
    const parsed = Number(override.weight);
    weight = Number.isFinite(parsed) ? parsed : null;
  } else if (exercise.formula?.trim()) {
    weight = roundKg(evalFormula(exercise.formula, maxes));
  }
  return { sets, reps, weight };
}

function ProgramForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [workouts, setWorkouts] = useState(
    initial?.workouts?.length === 2
      ? initial.workouts
      : [
          { name: "Workout 1", exercises: emptyExercises() },
          { name: "Workout 2", exercises: emptyExercises() },
        ],
  );

  function update(workoutIndex, exIndex, field, value) {
    setWorkouts((prev) =>
      prev.map((w, wi) =>
        wi !== workoutIndex
          ? w
          : {
              ...w,
              exercises: w.exercises.map((ex, ei) =>
                ei !== exIndex ? ex : { ...ex, [field]: value },
              ),
            },
      ),
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const ok =
      workouts.every((w) =>
        w.exercises.every((ex) => ex.name.trim() !== ""),
      ) && workouts.every((w) => w.name.trim() !== "");
    if (!name.trim() || !ok) {
      alert(
        "Give the program a name and fill in all 5 exercise names per workout.",
      );
      return;
    }
    onSave({
      name: name.trim(),
      workouts: workouts.map((w) => ({
        name: w.name.trim(),
        exercises: w.exercises.map((ex) => ({
          name: ex.name.trim(),
          sets: ex.sets.trim() || "3",
          reps: ex.reps.trim() || "8",
          formula: ex.formula.trim(),
        })),
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="program-form">
      <label className="program-name">
        Program name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="8-Week Strength Program"
        />
      </label>

      {workouts.map((workout, wi) => (
        <fieldset key={wi}>
          <legend>
            <input
              className="inline-name"
              value={workout.name}
              onChange={(e) => {
                const value = e.target.value;
                setWorkouts((prev) =>
                  prev.map((w, i) => (i === wi ? { ...w, name: value } : w)),
                );
              }}
            />
          </legend>
          <div className="grid-head">
            <span>Exercise</span>
            <span>Sets</span>
            <span>Reps</span>
            <span>Weight formula</span>
          </div>
          {workout.exercises.map((ex, ei) => (
            <div key={ei} className="grid-row">
              <input
                value={ex.name}
                onChange={(e) => update(wi, ei, "name", e.target.value)}
                placeholder={`Exercise ${ei + 1} (e.g. Squat)`}
              />
              <input
                value={ex.sets}
                onChange={(e) => update(wi, ei, "sets", e.target.value)}
                placeholder="Sets"
              />
              <input
                value={ex.reps}
                onChange={(e) => update(wi, ei, "reps", e.target.value)}
                placeholder="Reps"
              />
              <input
                value={ex.formula}
                onChange={(e) => update(wi, ei, "formula", e.target.value)}
                placeholder="e.g. 0.7 × Squat"
              />
            </div>
          ))}
        </fieldset>
      ))}

      <p className="hint">
        Weight formula example: <code>0.8 × Squat</code> uses your Squat 1RM
        from the Maxes tab. You can combine maxes and numbers, e.g.{" "}
        <code>(Squat + Bench) / 2</code>. Leave it empty to type the weight in
        the Week plan instead.
      </p>

      <div className="form-actions">
        <button type="submit">Save program</button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function MaxesTab({ maxes, setMaxes }) {
  const [rows, setRows] = useState(() =>
    Object.entries(maxes).map(([name, value]) => ({ name, value })),
  );

  function updateRow(index, field, value) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function handleSave(e) {
    e.preventDefault();
    const next = {};
    for (const row of rows) {
      if (row.name.trim()) next[row.name.trim()] = Number(row.value) || 0;
    }
    saveMaxes(next);
    setMaxes(next);
  }

  return (
    <form onSubmit={handleSave} className="maxes">
      <h2>Maxes (1RM per exercise)</h2>
      <p className="hint">
        These values are used by the weight formulas in your program.
      </p>
      {rows.map((row, i) => (
        <div key={i} className="max-row">
          <input
            value={row.name}
            onChange={(e) => updateRow(i, "name", e.target.value)}
            placeholder="Exercise (e.g. Squat)"
          />
          <input
            className="num"
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
            placeholder="1RM (kg)"
          />
          <button
            type="button"
            className="danger"
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <div className="form-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => setRows([...rows, { name: "", value: "" }])}
        >
          Add max
        </button>
        <button type="submit">Save maxes</button>
      </div>
    </form>
  );
}

function PlanTab({ program, maxes, plan, setPlan }) {
  const [week, setWeek] = useState(1);
  const [workoutIndex, setWorkoutIndex] = useState(0);
  const workout = program?.workouts?.[workoutIndex];

  if (!workout) {
    return <p className="hint">Create a program first.</p>;
  }

  function updateCell(exerciseName, field, value) {
    setPlan((prev) => {
      const next = structuredClone(prev);
      if (!next[week]) next[week] = {};
      if (!next[week][workoutIndex]) next[week][workoutIndex] = {};
      const cell = { ...next[week][workoutIndex][exerciseName], [field]: value };
      next[week][workoutIndex][exerciseName] = cell;
      savePlan(next);
      return next;
    });
  }

  function copyWeekToAll() {
    setPlan((prev) => {
      const next = structuredClone(prev);
      const source = next[week]?.[workoutIndex] ?? {};
      for (const ex of workout.exercises) {
        const cell = source[ex.name];
        if (!cell) {
          for (const w of next) {
            w && w[workoutIndex] && delete w[workoutIndex][ex.name];
          }
          continue;
        }
        for (let w = 1; w <= WEEKS_TOTAL; w += 1) {
          if (!next[w]) next[w] = {};
          next[w][workoutIndex] = {
            ...next[w][workoutIndex],
            [ex.name]: { ...cell },
          };
        }
      }
      savePlan(next);
      return next;
    });
  }

  return (
    <div className="plan-tab">
      <div className="selectors">
        <div className="week-tabs">
          {Array.from({ length: WEEKS_TOTAL }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              className={w === week ? "active" : ""}
              onClick={() => setWeek(w)}
            >
              W{w}
            </button>
          ))}
        </div>
      </div>

      <div className="selectors">
        <div className="week-tabs">
          {program.workouts.map((w, i) => (
            <button
              key={i}
              className={i === workoutIndex ? "active" : ""}
              onClick={() => setWorkoutIndex(i)}
            >
              {w.name}
            </button>
          ))}
        </div>
        <button className="secondary" onClick={copyWeekToAll}>
          Copy week {week} to all weeks
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Exercise</th>
            <th>Sets</th>
            <th>Reps</th>
            <th>Weight (kg)</th>
          </tr>
        </thead>
        <tbody>
          {workout.exercises.map((ex) => {
            const override = plan?.[week]?.[workoutIndex]?.[ex.name] ?? {};
            const planned = plannedFor(
              program,
              maxes,
              plan,
              week,
              workoutIndex,
              ex,
            );
            return (
              <tr key={ex.name}>
                <td>
                  {ex.name}
                  {ex.formula && (
                    <span className="formula-hint">{ex.formula}</span>
                  )}
                </td>
                <td>
                  <input
                    value={override.sets ?? ""}
                    onChange={(e) => updateCell(ex.name, "sets", e.target.value)}
                    placeholder={ex.sets}
                  />
                </td>
                <td>
                  <input
                    value={override.reps ?? ""}
                    onChange={(e) => updateCell(ex.name, "reps", e.target.value)}
                    placeholder={ex.reps}
                  />
                </td>
                <td className="weight-cell">
                  <input
                    value={override.weight ?? ""}
                    onChange={(e) =>
                      updateCell(ex.name, "weight", e.target.value)
                    }
                    placeholder={
                      planned.weight != null
                        ? String(planned.weight)
                        : "formula/—"
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="hint">
        Leave cells empty to use the program defaults ({`sets × reps`} and the
        formula weight). Type a weight to override the formula for this week.
      </p>
    </div>
  );
}

function TodayTab({ program, maxes, plan, log, setLog, today, setToday }) {
  const todayString = () => new Date().toISOString().slice(0, 10);
  const workout = program?.workouts?.[today.workoutIndex];

  if (!workout) {
    return <p className="hint">Create a program first.</p>;
  }

  const entries = log?.[today.week]?.[today.workoutIndex] ?? {};

  return (
    <div className="today-tab">
      <div className="selectors">
        <div className="week-tabs">
          {Array.from({ length: WEEKS_TOTAL }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              className={w === today.week ? "active" : ""}
              onClick={() => setToday({ ...today, week: w })}
            >
              W{w}
            </button>
          ))}
        </div>
        <div className="week-tabs">
          {program.workouts.map((w, i) => (
            <button
              key={i}
              className={i === today.workoutIndex ? "active" : ""}
              onClick={() => setToday({ ...today, workoutIndex: i })}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      <h2>
        {workout.name} — Week {today.week}
      </h2>

      <table>
        <thead>
          <tr>
            <th>Exercise</th>
            <th>Planned</th>
            <th>Result</th>
            <th>Done weight (kg)</th>
            <th>Done sets × reps</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {workout.exercises.map((ex) => {
            const planned = plannedFor(
              program,
              maxes,
              plan,
              today.week,
              today.workoutIndex,
              ex,
            );
            const entry = entries[ex.name];
            const done = !!entry;
            return (
              <tr key={ex.name} className={done ? "logged" : ""}>
                <td>{ex.name}</td>
                <td className="planned">
                  {planned.sets} × {planned.reps}
                  {planned.weight != null ? ` @ ${planned.weight} kg` : ""}
                </td>
                <td>{done ? `✓ ${entry.date}` : "—"}</td>
                <td>
                  <input
                    value={entry?.weight ?? ""}
                    onChange={(e) =>
                      setLog(
                        saveLogEntry(today.week, today.workoutIndex, ex.name, {
                          date: entry?.date ?? todayString(),
                          weight: e.target.value,
                          sets: entry?.sets ?? "",
                          reps: entry?.reps ?? "",
                          note: entry?.note ?? "",
                        }),
                      )
                    }
                    placeholder={planned.weight != null ? String(planned.weight) : "—"}
                  />
                </td>
                <td>
                  <input
                    value={
                      entry?.sets && entry?.reps
                        ? `${entry.sets}×${entry.reps}`
                        : entry?.sets ?? entry?.reps ?? ""
                    }
                    onChange={(e) => {
                      const [sets, reps] = e.target.value.split(/[×x]/);
                      setLog(
                        saveLogEntry(today.week, today.workoutIndex, ex.name, {
                          date: entry?.date ?? todayString(),
                          weight: entry?.weight ?? "",
                          sets: (sets ?? "").trim(),
                          reps: (reps ?? "").trim(),
                          note: entry?.note ?? "",
                        }),
                      );
                    }}
                    placeholder="e.g. 4×8"
                  />
                </td>
                <td>
                  <input
                    value={entry?.note ?? ""}
                    onChange={(e) =>
                      setLog(
                        saveLogEntry(today.week, today.workoutIndex, ex.name, {
                          date: entry?.date ?? todayString(),
                          weight: entry?.weight ?? "",
                          sets: entry?.sets ?? "",
                          reps: entry?.reps ?? "",
                          note: e.target.value,
                        }),
                      )
                    }
                    placeholder="optional"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="hint">
        Results save automatically and are marked with today&apos;s date.
      </p>
    </div>
  );
}

export default function Diary() {
  const [tab, setTab] = useState("today");
  const [program, setProgram] = useState(undefined);
  const [maxes, setMaxes] = useState({});
  const [plan, setPlan] = useState({});
  const [log, setLog] = useState({});
  const [today, setTodayState] = useState({ week: 1, workoutIndex: 0 });
  const [editing, setEditing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgram(loadProgram());
    setMaxes(loadMaxes());
    setPlan(loadPlan());
    setLog(loadLog());
    setTodayState(loadToday());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <main className="diary" />;
  }

  function setToday(next) {
    saveToday(next);
    setTodayState(next);
  }

  if (!program || editing) {
    return (
      <main className="diary">
        <nav className="nav">
          <span className="active">Diary</span>
          <Link href="/chat">Chat</Link>
        </nav>
        <h1>{editing ? "Edit program" : "New 8-Week Program"}</h1>
        <p className="hint">
          Two workouts, five exercises each, covering 8 weeks. Set a weight
          formula per exercise (calculated from your maxes) or enter weights per
          week in the Plan tab.
        </p>
        <ProgramForm
          key={editing ? "editing" : "new"}
          initial={editing ? program : undefined}
          onSave={(next) => {
            clearLog();
            setLog({});
            saveProgram(next);
            setProgram(next);
            setEditing(false);
          }}
          onCancel={editing ? () => setEditing(false) : undefined}
        />
      </main>
    );
  }

  function handleDelete() {
    if (!confirm("Delete the program, maxes, plan and all logged workouts?")) {
      return;
    }
    clearProgram();
    clearLog();
    setProgram(null);
    setEditing(false);
  }

  return (
    <main className="diary">
      <nav className="nav">
        <span className="active">Diary</span>
        <Link href="/chat">Chat</Link>
      </nav>

      <header className="diary-header">
        <div>
          <h1>{program.name}</h1>
          <p className="hint">
            {program.workouts
              .map(
                (w, i) =>
                  `${w.name}: ${w.exercises.map((ex) => ex.name).join(", ")}`,
              )
              .join("  ·  ")}
          </p>
        </div>
        <div className="diary-actions">
          <button onClick={() => setEditing(true)}>Edit program</button>
          <button className="danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </header>

      <div className="selectors">
        <div className="week-tabs">
          {[
            ["today", "Today"],
            ["plan", "Week plan"],
            ["maxes", "Maxes"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "today" && (
        <TodayTab
          program={program}
          maxes={maxes}
          plan={plan}
          log={log}
          setLog={setLog}
          today={today}
          setToday={setToday}
        />
      )}
      {tab === "plan" && (
        <PlanTab
          program={program}
          maxes={maxes}
          plan={plan}
          setPlan={setPlan}
        />
      )}
      {tab === "maxes" && <MaxesTab maxes={maxes} setMaxes={setMaxes} />}
    </main>
  );
}
