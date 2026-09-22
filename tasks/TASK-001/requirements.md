# TASK-001: Training Sessions Workspace

## Source

`frontend-accelerator-onboarding/TASK.md` (onboarding exercise).

## User

A trainer using the workspace to manage their own training sessions.

## Problem

The trainer currently has no single-screen view where they can see upcoming/past training sessions, narrow that view by status, and add a new session without leaving the page.

## Desired Outcome

The trainer can, in one workspace screen:
1. See all sessions loaded from a mock API on open.
2. Narrow the list to one status at a time (or see all).
3. Open a create form, submit a valid new session, and immediately see it in the list.

## Observable Behavior / Scope

### Sessions list
- On workspace open, sessions are requested from a mock API and, once loaded, each visible session shows title, status, and start date/time.
- A loading indicator is shown while the request is pending; it is replaced by the list (or empty/error state) once the request settles.
- If the request fails, an understandable error message is shown, and the user has a way to recover (e.g., retry) without reloading the page.
- A status filter control offers `All` plus exactly one selectable status filter value; selecting it narrows the visible list to sessions matching that status; selecting `All` shows every session again.

### Create session
- A control opens a create form (inline or modal — implementation's choice).
- The form has a title field and a date/time field.
- Title validation: required; leading/trailing whitespace trimmed; trimmed length must be between 3 and 80 characters inclusive.
- Date/time validation: required; must resolve to a point in time after "now" at submission time.
- Submitting an invalid form shows a specific, useful validation message per failing field (not a generic "invalid form" message) and does not submit.
- While a submission request is pending, the submit control is disabled or otherwise prevents a second submission (no duplicate session creation from repeated clicks).
- On success, the newly created session appears in the visible sessions list without a full page reload, showing the same title/status/start date-time fields as other list entries.

### Mock boundary
- All session data (list + create) is served through a mock HTTP boundary, not hardcoded static arrays rendered directly by components — there must be a replaceable request/client layer between UI and data.
- Use the repository's existing mock mechanism if one exists in this codebase; none currently exists (confirmed by inspection — no MSW or similar dependency, no existing API/mock layer in `src/`), so MSW or another conventional HTTP mock is acceptable. This is an architecture decision, not decided here.
- No real backend service is implemented.

### Essential test
- At least one automated, behavior-level test exists covering either the filter flow or the successful-creation flow (user-observable behavior, not implementation detail).

### Manual check
- Start the app and manually exercise list load, filter, and create once in a browser; report what was actually observed (pass/fail/partial), honestly, including anything not verified.

## Acceptance Criteria

1. **Given** the workspace loads, **when** the mock API request is pending, **then** a loading state is visible and no session rows are shown yet.
2. **Given** the mock API request succeeds, **when** it resolves, **then** every returned session is listed with its title, status, and start date/time.
3. **Given** the mock API request fails, **when** it resolves with an error, **then** a specific recoverable error state is shown instead of a blank or crashed screen, and the user can retry.
4. **Given** the list is loaded, **when** the user selects a specific status filter, **then** only sessions with that status remain visible.
5. **Given** a status filter is active, **when** the user selects `All`, **then** all loaded sessions are visible again.
6. **Given** the create form is open, **when** the user submits a title shorter than 3 chars, longer than 80 chars, or blank/whitespace-only, **then** submission is blocked and a useful validation message names the problem.
7. **Given** the create form is open, **when** the user submits a date/time that is not in the future, **then** submission is blocked and a useful validation message is shown.
8. **Given** a valid title and future date/time, **when** the user submits, **then** the submit control becomes unavailable for further clicks until the request settles, preventing duplicate submissions.
9. **Given** a successful create request, **when** it resolves, **then** the new session appears in the sessions list (respecting the currently active filter's matching logic) with its title, status, and start date/time.
10. **Given** the essential test suite, **when** it runs, **then** at least one behavior-level automated test exercises the filter flow or the create-success flow end-to-end from the user's perspective.

## Non-Goals (Explicitly Optional / Out of Scope)

- Session details view, drawers, or deep links.
- Search or multiple simultaneous filters.
- Pagination.
- A complete/exhaustive API contract or scenario matrix.
- Desktop/mobile screenshot sets.
- Exhaustive responsive and accessibility validation.
- Full test coverage (only one essential behavior-level test is required).
- CI, deployment, or a public URL.
- Strict TypeScript migration or unrelated refactoring.
- Editing or deleting sessions (not mentioned in required flow).
- Any feature beyond the required flow until onboarding is complete.

## Constraints

- Use the repository's existing framework (React 19 + TypeScript via Vite), package manager, and scripts; do not introduce a competing framework.
- Do not rewrite unrelated code or configuration.
- Report incomplete behavior honestly rather than claiming an unperformed check.

## Facts (confirmed by inspection)

- Repository root and application root are the same directory (`/home/ig/Desktop/accelerator/app`); this is a fresh Vite + React 19 + TypeScript starter (`src/main.tsx`, `src/App.tsx` only, no routing/state/data libraries yet).
- `package.json` currently has no test runner, no test script, no HTTP client library, and no mock library (no MSW or similar) in dependencies/devDependencies.
- No `tasks/` directory existed before this task; this is `TASK-001`.
- No living `specs/` directory exists yet.

## Assumptions

- "Status" values for filtering are not specified by the task; a small fixed status set (e.g., `scheduled`, `completed`, `cancelled`) is assumed sufficient, with the exact set left to design/architecture since the task only requires "one status filter" to exist as a control, not a specific taxonomy.
- "Future date/time" is evaluated against the client's local clock at submission time.
- The create control ("open a create form") can be a button that reveals an inline form or a modal; the task does not mandate a specific pattern.

## Open Questions / Gaps Requiring a Specialist

1. **No test runner is installed.** Adding one (e.g., Vitest + React Testing Library) is a tooling/architecture decision, not decided here. → **architect**
2. **No HTTP client, mock mechanism, routing, or state-management approach exists yet.** Choosing the request boundary shape (e.g., fetch wrapper + MSW vs. a hand-rolled mock module) and where session state lives is an architecture decision. → **architect**
3. **Confirmed backend contract for sessions (fields, status enum, id generation, error shapes) is not defined.** A provisional contract needs to be authored before implementation. → **api-integration**
4. **Visual/interaction direction for the create form (inline vs. modal) and list layout is not specified.** → **ui-designer** (optional given how small this task is; architect/coder may decide directly if visual complexity stays minimal)

## Readiness

Requirements and acceptance criteria are ready for architecture/API-contract decisions. Recommend routing to **architect** (and optionally **api-integration**) next to resolve the open questions above before **writing-plans**. No product ambiguity remains that would warrant **brainstorm**.
