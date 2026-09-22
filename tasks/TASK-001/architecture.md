# TASK-001 Architecture: Training Sessions Workspace

Source: `tasks/TASK-001/requirements.md`. Resolves the open architecture questions from that document. Backend endpoint authority and the final field-level data contract remain owned by **api-integration** — the shapes below are provisional and marked as such.

## Confirmed Human Decisions

Both were new-dependency / hard-to-reverse choices and were confirmed directly with the developer before being treated as decided:

1. **Test runner: Vitest + React Testing Library.** Rationale: native Vite integration (reuses `vite.config.ts`, no parallel transform pipeline to maintain), Jest-compatible API, jsdom environment, fast watch mode. Rejected: Jest + RTL — would need `ts-jest`/`babel-jest` plus module mapping to reconcile with Vite's ESM/`import.meta` handling, more setup for equivalent coverage on a project that has no existing test convention to preserve.
2. **Mock HTTP boundary: hand-rolled in-memory mock client**, not MSW. Rationale: zero new runtime dependencies, trivially usable identically from the browser and from tests, and it satisfies the task's own wording ("HTTP client **or equivalent replaceable request boundary**"). The seam that would let a real backend replace it later is a single module (`sessionsApi.ts`), not the mock technology, so switching cost to MSW or a real fetch client later stays low. Rejected: MSW — intercepts at the network level and is the more "textbook" choice, but adds a dependency, a service worker asset, and handler/server wiring for both app and test environments that this task's scope doesn't need.

## Decision: Module Boundaries

No existing project structure to preserve (repo is the stock Vite + React 19 + TS starter — only `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`). Proposing a single feature folder, since there is exactly one feature and no reuse driver yet:

```
src/
  App.tsx                                # mounts <SessionsWorkspace />, drop the starter counter demo
  features/
    sessions/
      types.ts                           # Session, SessionStatus, CreateSessionInput
      sessionsApi.ts                     # mock request boundary: listSessions(), createSession()
      mockSessionsStore.ts               # in-memory seed data + simulated latency/failure, used only by sessionsApi.ts
      validation.ts                      # pure validateTitle(), validateStartAt()
      useSessions.ts                     # single state owner (see below)
      SessionsWorkspace.tsx              # container: wires useSessions to the UI below via props
      SessionList.tsx                    # loading / error+retry / empty / populated rows
      SessionFilter.tsx                  # "All" + one status <select> (or radio group)
      CreateSessionForm.tsx              # title + datetime fields, inline validation, submit-pending guard
      SessionsWorkspace.test.tsx         # essential behavior-level test (filter or create-success flow)
```

**Dependency direction:** `SessionsWorkspace` is the only component that calls `useSessions`. `SessionList`, `SessionFilter`, and `CreateSessionForm` receive data and callbacks as props — they do not import `useSessions` or `sessionsApi` directly. `useSessions` is the only caller of `sessionsApi`. `sessionsApi` is the only caller of `mockSessionsStore`. This keeps the "swap the mock for a real backend" blast radius to one file (`sessionsApi.ts`) and keeps `validation.ts` a dependency-free pure module usable from both `CreateSessionForm` and its tests directly.

**Why not a compound-component / context-provider structure** (the pattern the React framework ruleset recommends for complex reusable components): this workspace has exactly one consumer tree, one level deep (`SessionsWorkspace` → its three children), with no prop-drilling problem and no second usage requiring a different state implementation. Per the frontend-boundaries rule ("do not introduce a global abstraction for one caller"), plain props from a single owning hook are sufficient. Revisit if a second independent consumer of session state appears.

## Decision: State Ownership

Single owner, `useSessions()`, called once by `SessionsWorkspace`. It owns:

- `sessions: Session[]` — raw list as loaded from `sessionsApi.listSessions()`, plus any session appended after a successful create. This is remote data, not duplicated anywhere else.
- `listStatus: 'idle' | 'loading' | 'ready' | 'error'` and `listError: string | null` — request lifecycle for the initial/retried fetch.
- `filter: SessionStatus | 'all'` — transient UI state, lives in the same hook because `SessionList` needs the *derived* result, not the raw list.
- `createStatus: 'idle' | 'submitting' | 'error'` and `createError: string | null` — request lifecycle for the create flow, kept separate from `listStatus` so a create failure never disturbs the already-loaded list (failure containment).

Derived, not stored: `filteredSessions = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)`. No duplicate/synchronized copy of the filtered list — this satisfies the "derive values instead of synchronizing duplicate state" rule and makes acceptance criteria 4/5 (filter/All) trivially correct by construction.

Actions exposed by the hook: `retryLoad()`, `setFilter(value)`, `createSession(input): Promise<void>` (throws/rejects are caught internally and turned into `createError`, so the form only needs to await it and check `createStatus`).

`CreateSessionForm` keeps its own local field state (title text, datetime text, per-field validation messages) — that's transient form-input state with a different lifecycle than the session list, correctly separated per the state-and-failure-flow rule.

## Decision: Provisional Data Contract (for api-integration to confirm)

```ts
type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

interface Session {
  id: string
  title: string
  status: SessionStatus
  startAt: string // ISO 8601, UTC
}

interface CreateSessionInput {
  title: string
  startAt: string // ISO 8601
}
```

```ts
// sessionsApi.ts
function listSessions(): Promise<Session[]>
function createSession(input: CreateSessionInput): Promise<Session>
```

Both reject with a plain `Error` carrying a user-presentable `message` (e.g. `"Could not load sessions. Please try again."`) — `useSessions` reads `error.message` directly for `listError`/`createError`, no custom error-class hierarchy needed at this scale.

This status enum, field naming, and error shape are the architecture's working assumption to unblock implementation; api-integration owns confirming or revising them before `sessionsApi.ts` is written, per the requirements doc's flagged gap.

## Decision: Simulated Failure Must Be Deterministic, Not Random

Acceptance criterion 3 (list error + retry) and the "essential test" both need the error path to be reliably reproducible — a randomly-failing mock would make the automated test flaky and the manual check unreliable. `mockSessionsStore` should expose a small test-only configuration seam (e.g. a module-level setter such as `setNextListOutcome('success' | 'error')`, defaulting to always-success) rather than a random failure chance. Left to `coder` to finalize the exact shape; the constraint is: deterministic, importable from tests, no UI-visible control required.

## Failure Containment

- List fetch failure: contained to `SessionList`'s render region (shows error + retry control); `SessionFilter` and `CreateSessionForm` remain usable/rendered as normal (filter has nothing to filter yet, form still opens).
- Create failure: contained to `CreateSessionForm` (inline error near the submit control); does not clear entered field values, does not affect the already-rendered list.
- Neither failure crashes the app shell — no error boundary is needed for this scope since both failures are handled locally as request-state, not thrown render errors.

## Testability

- `validation.ts` is pure and dependency-free — directly unit-testable without rendering anything.
- `sessionsApi.ts` is the single seam for making the list/create outcome deterministic in tests (see above).
- `useSessions` and the components are testable through `SessionsWorkspace` with React Testing Library + Vitest, asserting on rendered DOM (loading → list, filter narrowing the visible rows, create form success appending a row) rather than internal state — matches the requirement that the essential test be behavior-level.

## Risks / Trade-offs

- **In-memory mock has no persistence.** A page reload loses any session created during the session. Acceptable: not a requirement, and consistent with "no backend service" being explicitly out of scope.
- **Hand-rolled mock is less "real" than MSW** (no actual network request visible in devtools' Network tab). Acceptable trade-off for this task's scope; if a future task needs network-level realism or is closer to a real backend integration, swapping `sessionsApi.ts`'s internals for `fetch` + MSW is a contained, one-file change because nothing outside `sessionsApi.ts` knows how the mock works.
- **Provisional data contract may change** once api-integration reviews it, which would touch `types.ts`, `sessionsApi.ts`, and `mockSessionsStore.ts` but not the UI components (they consume `Session`/`CreateSessionInput` types, not wire format).

## Rejected Alternatives

- **Jest** — more setup to interoperate with Vite's ESM pipeline than Vitest, no existing test convention to preserve.
- **MSW** — heavier for this scope; see decision above.
- **A global state library (Redux/Zustand/Context+reducer at app level)** — one screen, one state owner, no cross-route or cross-tree sharing need; a local hook satisfies every requirement without adding a dependency.
- **A routing library** — no deep links or multiple routes are in scope (explicit non-goal).
- **A form library (React Hook Form / Zod, etc.)** — two fields, two validation rules; plain controlled inputs plus the pure `validation.ts` functions are simpler and equally testable.

## Implementation Implications

- New devDependencies to add: `vitest`, `@testing-library/react`, `@testing-library/jest-dom` (or equivalent matchers), `jsdom`, and a `test` script in `package.json`. No new runtime dependencies.
- `App.tsx` loses the starter counter demo and mounts `SessionsWorkspace`; `src/assets/react.svg`/`vite.svg`/`hero.png` and `App.css` starter content may become unused — that cleanup is a `coder`/implementation-plan concern, not decided here.
- `writing-plans` can now produce a file-level plan against the module list, state ownership, and provisional contract above.
