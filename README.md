# Workout Diary + Mistral Chat

Minimal Next.js app with two parts:

1. **Workout Diary** — build an 8-week weightlifting program with two
   workouts, five exercises each, plan sets/reps/weights per week using
   formulas based on your maxes, and log your results per session.
2. **Chat** — Mistral chat powered by the official TypeScript SDK
   (`@mistralai/mistralai`) using `mistral-small-latest`. The API key stays on
   the server (`app/api/chat/route.js`).

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Mistral API key (only needed for the chat)
cp .env.local.example .env.local
# then edit .env.local and set MISTRAL_API_KEY to your real key
# (get one at https://console.mistral.ai)

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000 for the diary and http://localhost:3000/chat for
the Mistral chat.

## Production build

```bash
npm run build
npm start
```

## How the diary works

- **New program**: two workouts × 5 exercises. Per exercise you set default
  sets/reps and an optional **weight formula** such as `0.8 × Squat` or
  `(Squat + Bench) / 2`, where `Squat`/`Bench` are your 1RMs entered in the
  **Maxes** tab. Computed weights are rounded to the nearest 2.5 kg.
- **Week plan**: for each week and workout you can override sets, reps and
  weight per exercise. Empty cells fall back to the program defaults; an
  empty weight uses the formula. "Copy week to all weeks" fills the grid.
- **Today**: pick the week and workout, see the planned sets × reps @ weight,
  then record what you actually did (weight done, sets × reps, notes). Results
  are marked with the date.

All data (program, maxes, plan, log) is stored locally in your browser
(localStorage).

## Structure

- `app/page.js` – workout diary (Today / Week plan / Maxes tabs)
- `app/chat/page.js` – Mistral chat UI
- `app/api/chat/route.js` – server route calling the Mistral SDK (holds `MISTRAL_API_KEY`)
- `lib/formula.js` – safe formula evaluator (no `eval`)
- `lib/storage.js` – localStorage persistence helpers
