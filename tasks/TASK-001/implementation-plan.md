# TASK-001 Implementation Plan: Training Sessions Workspace

Source: `tasks/TASK-001/requirements.md`, `tasks/TASK-001/architecture.md`, `tasks/TASK-001/api-integration.md`. All architecture, dependency, and data-contract decisions referenced below are already resolved in those documents; this plan sequences the file-level work against them. Application Root = Repository Root (`/home/ig/Desktop/accelerator/app`), the only frontend candidate (stock Vite + React 19 + TS starter).

## Current Behavior

`src/App.tsx` renders the Vite/React starter template (hero image, logos, a demo counter button, "Documentation"/"Connect with us" link sections) styled by `src/App.css`. No sessions feature, no test runner, no mock/API layer exists. `package.json` has `dev`, `build`, `lint`, `preview` scripts only.

## Intended Behavior

`src/App.tsx` mounts a `SessionsWorkspace` that, on load, fetches sessions from a mock in-memory API and shows a loading state, then a list (title/status/start date-time per row) with an `All` + one-status filter, plus a control to open a create form that validates title (3–80 trimmed chars) and a future date/time, blocks duplicate submission while pending, and appends the created session to the visible list on success. List/create failures show a specific, recoverable message. One behavior-level test proves either the filter or the create-success flow end to end.

## Files to Create

Ordered by dependency; items in the same bullet group have no dependency on each other and may be implemented in either order or in parallel.

**1. Test tooling foundation** (unlocks writing/running the essential test; no dependency on feature code)
- `package.json` — add devDependencies `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`; add script `"test": "vitest run"`. (Per architecture.md's confirmed Vitest decision — this is new tooling this plan introduces, not something already present.)
- `vite.config.ts` — add a `test` block to the existing `defineConfig(...)` call: `environment: 'jsdom'`, `setupFiles: ['./src/setupTests.ts']`. Use the `/// <reference types="vitest/config" />` triple-slash directive at the top of the file so the `test` key type-checks without touching `tsconfig.*.json`. Do not enable Vitest's `globals` option — test files import `describe`/`it`/`expect`/etc. explicitly from `vitest`, avoiding any change to `tsconfig.app.json`'s `types` array.
- `src/setupTests.ts` (new) — single line: `import '@testing-library/jest-dom/vitest'` (registers jest-dom matchers for Vitest's `expect` without extra type declaration files).

**2. Data layer** (per api-integration.md's provisional contract)
- `src/features/sessions/types.ts` — `SessionStatus` (`'scheduled' | 'completed' | 'cancelled'`), `Session`, `CreateSessionInput`, exactly as specified in `api-integration.md`.
- `src/features/sessions/mockSessionsStore.ts` — in-memory session array seeded with at least 2–3 sessions spanning at least two different `status` values (so the list is non-empty and the filter is meaningfully exercisable on first load, both for the essential test and the manual check); id generation via `crypto.randomUUID()`; a deterministic, test-only outcome seam (e.g. exported setters such as `setNextListOutcome('success' | 'error')` / `setNextCreateOutcome('success' | 'error')`, defaulting to `'success'`) per architecture.md's "no randomized failure" requirement; simulated latency via a small bounded delay.
- `src/features/sessions/sessionsApi.ts` — `listSessions(): Promise<Session[]>` and `createSession(input: CreateSessionInput): Promise<Session>`, built on `mockSessionsStore.ts`, resolving/rejecting per the Error-shape and default-status-on-create (`'scheduled'`) rules in `api-integration.md`. No re-validation of `input` here — validation is the UI's job (see `validation.ts`).
- `src/features/sessions/validation.ts` — pure functions `validateTitle(rawTitle: string): string | null` and `validateStartAt(rawValue: string): string | null`, returning `null` when valid or a specific user-facing message when not (trimmed 3–80 chars; strictly-future date/time compared to `new Date()` at call time). No dependency on the data layer — implementable in parallel with items in group 2 above.

**3. State and presentation** (depend on group 2)
- `src/features/sessions/useSessions.ts` — the single state owner from architecture.md: `sessions`, `listStatus`, `listError`, `filter`, `createStatus`, `createError`, derived `filteredSessions`, and actions `retryLoad()`, `setFilter(value)`, `createSession(input): Promise<void>`. Calls `sessionsApi` only; fetches once on mount.
- `src/features/sessions/SessionList.tsx` — props-only component rendering loading / error-with-retry / populated rows (title, status, formatted start date/time) for whatever list it's given; no direct data fetching.
- `src/features/sessions/SessionFilter.tsx` — props-only `All` + status control, calls an `onChange` prop; no direct state ownership.
- `src/features/sessions/CreateSessionForm.tsx` — local field state (title text, date/time text) plus per-field validation messages from `validation.ts`; calls an `onSubmit(input): Promise<void>` prop; disables its submit control for the duration of that promise to prevent duplicate submission; surfaces a passed-in `submitError` prop for server-side failure. Can be implemented in parallel with `SessionList.tsx`/`SessionFilter.tsx` once `types.ts` and `validation.ts` exist.

**4. Wiring** (depends on all of group 3)
- `src/features/sessions/SessionsWorkspace.tsx` — calls `useSessions()` once; owns the create-form's open/closed boolean locally (transient UI visibility, not remote data, so it does not belong in `useSessions`); passes derived data/actions down as props to `SessionFilter`, `SessionList`, and (when open) `CreateSessionForm`; closes/resets the form on successful create.
- `src/App.tsx` — replace the starter markup with `<SessionsWorkspace />`; remove the now-unused starter imports (`heroImg`, `reactLogo`, `viteLogo`, the demo `count` state).
- `src/App.css` — remove the starter-only rules that no longer apply (`.hero`, `.counter`, `#next-steps`, `#docs`, `#social`, `.ticks`, `#spacer`, etc.); keep or add only the minimal layout styling the new workspace actually needs. Exact visual styling is implementation discretion — no `ui-designer` pass was requested for this small scope (per architecture.md's open item 4), so keep it simple and functional.
- Starter assets `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png` become unused once `App.tsx` no longer imports them; remove them as part of this same change rather than leaving dead files.

**5. Essential test** (depends on everything above)
- `src/features/sessions/SessionsWorkspace.test.tsx` — one behavior-level test using Testing Library + `user-event`, rendering `<SessionsWorkspace />` against the default (`'success'`) mock outcome. Recommended scenario (covers more surface in one test; the filter-only scenario from AC4/5 is an equally acceptable, simpler alternative if preferred during implementation): wait for the seeded sessions to render past the loading state, open the create form, fill a valid title and a future date/time, submit, and assert the new session's title appears in the rendered list. This exercises requirements AC1/AC2 (loading → populated) and AC8/AC9 (submit-guard + list update) in one pass.

## Contracts Between Steps

- `types.ts` is the single source of truth for `Session`/`SessionStatus`/`CreateSessionInput` — every other file imports from it, none redeclares shape.
- `sessionsApi.ts` is the only module that imports `mockSessionsStore.ts`; `useSessions.ts` is the only module that imports `sessionsApi.ts`. Presentational components (`SessionList`, `SessionFilter`, `CreateSessionForm`) receive everything via props and import neither.
- `CreateSessionForm.tsx` calls `validation.ts` before ever calling its `onSubmit` prop — `sessionsApi.createSession` is never reached with an invalid title or a past date/time, so `sessionsApi`/`mockSessionsStore` do not need their own validation-error path.

## Risk-Based Additional Test Opportunities (optional — not required by scope)

- Unit tests for `validation.ts` directly (cheap, pure, covers the exact boundary values: 2/3/80/81 chars, whitespace-only, a past vs. future date).
- A `SessionList` test using `mockSessionsStore`'s `setNextListOutcome('error')` seam to prove the error+retry path (AC3) — the essential test above does not exercise this path.
- A `CreateSessionForm` test asserting the submit control is actually disabled mid-flight (a stronger check on AC8 than the happy-path essential test provides).

`Full test coverage` is an explicit non-goal in requirements.md — these are optional, not blocking.

## Verification Commands

Existing, discovered from `package.json` (Application Root):
- `npm run build` — `tsc -b && vite build`; exercises TypeScript type-checking across `src/`.
- `npm run lint` — `eslint .`.
- `npm run dev` / `npm run preview` — for the manual browser check required by `TASK.md`.

Introduced by this plan (does not exist yet — installing `vitest` and adding the script is part of Step 1 above, not a pre-existing command):
- `npm test` — runs `vitest run`, including the essential test in `SessionsWorkspace.test.tsx`.

## Rollback Considerations

Not applicable beyond a normal `git revert`. This is a greenfield feature addition inside a starter app with no existing users or deployed traffic depending on the current `App.tsx` content; no feature flag or staged rollout is justified by the task's risk level.
