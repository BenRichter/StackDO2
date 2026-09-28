# CLAUDE.md

StackDO – local-first todo app. Core idea: **never choose what's next – just do.** The app sorts all open tasks into a stack; the top card is the one thing to do now.

## Commands

```sh
npm run dev      # dev server (vite)
npm run check    # svelte-check + TypeScript – must be 0 errors / 0 warnings
npm test         # vitest (pure logic in src/lib/utils, TZ=Europe/Berlin)
npm run build    # static SPA into ./build (adapter-static, fallback index.html)
```

## Stack

- SvelteKit 2 + Svelte 5 **runes** (`$state`, `$derived`, `$effect`, `$props`) – no legacy stores, no `export let`.
- `ssr = false` (`src/routes/+layout.ts`): pure client SPA, data in `localStorage` (key `stackdo:v2`).
- Offline via `src/service-worker.ts`; PWA manifest in `static/`. No backend, no runtime deps.
- UI language: **German**. Code/comments: English.

## Architecture

- `src/lib/types.ts` – data model. `Thread` (= "Strang": life area/project, `rank` = relative priority, optional blocker `window`), `Task` (always belongs to a thread), `HistoryEntry` (compact record of every completion; survives the 30-day cleanup, feeds stats + duration predictions).
- `src/lib/stores/app.svelte.ts` – single `AppStore` class with all state + mutations. Persists automatically via `$effect.root`; syncs across tabs via `storage` event; migrates v1 data (`stackdo2-tasks`).
- `src/lib/stores/ui.svelte.ts` – tab, open bottom sheet, toast, celebration trigger.
- `src/lib/utils/` – **pure, tested logic** (keep it free of Svelte/DOM):
  - `scoring.ts` – availability (`unavailableReason`) + score (`scoreTask`) + `buildStack`. Score parts are shown to the user ("Warum?"), so every bonus needs a German label.
  - `plan.ts` – lays the stack onto today's 24h clock; blocker threads own their windows, other tasks fill free time.
  - `parse.ts` – quick-add syntax (`#tag !4 30m morgen 14:00 +Strang`).
  - `predict.ts` – realistic duration from similar history; estimation factor.
  - `recurrence.ts`, `ics.ts`, `time.ts` (always **local** dates via `dateKey()`, never `toISOString().split('T')`).
- `src/lib/components/views/` – Stack, Day (clock), Threads, Stats. `components/sheets/` – bottom panels (docked, **no dimming overlay** – deliberate design decision).

## Conventions

- Scoring changes → update/add tests in `scoring.test.ts`. Keep time-dependent tests on fixed `Date`s.
- Design tokens in `src/app.css` (WordPress-like grey bg, calm blue/green for planning, warm shiny gradient `--prime` only for the "Jetzt dran" card). Badges have square corners (`border-radius: 2px`).
- Icons: inline Lucide-style paths in `Icon.svelte`; add new ones there.
- Left-handed setting mirrors the primary actions – respect `app.settings.leftHanded` in new action rows.
