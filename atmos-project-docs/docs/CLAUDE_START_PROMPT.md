# Claude — First Implementation Session

You are helping implement **Atmos**, a portfolio-grade weather web app. Read these documents before making changes:

- `docs/BRD.md`
- `docs/PRD.md`
- `docs/DESIGN_SPEC.md`
- `docs/TRD.md`
- `docs/AI_RULES.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/OPEN_DECISIONS.md` (use the "Proposed default" rows marked Phase 1, and state in your report that you used them; do not decide `Open` items)

`CLAUDE.md` at the repo root is project memory: fill in its Commands section at the end of this phase.

## Task

Work on **Phase 1 — App foundation only** from `docs/IMPLEMENTATION_PLAN.md`.

## Before editing

1. Inspect the current repository, package scripts, dependencies, and Git status.
2. If an application already exists, preserve useful code and conventions; do not replace it wholesale.
3. Summarize the current state and list the exact small changes you intend to make.
4. Identify any blocker that genuinely prevents Phase 1.

## Expected scope

Depending on the repository's current state:

- Establish or verify React + TypeScript + Vite.
- Configure ESLint, Prettier, and a basic test setup if absent.
- Establish the app entry point, app shell, and route skeletons for:
  - `/`
  - `/forecast`
  - `/compare`
  - `/map`
  - `/assistant`
  - `/locations`
- Add initial global styles and centralized light/dark design tokens based on `docs/DESIGN_SPEC.md`.
- Add theme switching and persist the selected theme locally, via a small validated storage helper. Default to the system preference (fallback dark) and avoid a flash of the wrong theme (OPEN_DECISIONS D-01, D-02).
- Use a system font stack behind `--font-sans` / `--font-display` tokens; final fonts are decided later (D-04).
- Add `.env.example` and ensure real `.env` files are ignored.
- Add only the shared components the shell and route placeholders need, including basic loading, empty and error-state components as listed in Phase 1 of the plan.

## Constraints

- Do not implement weather API calls yet.
- Do not implement the map, AI assistant, charts, or city comparison logic yet.
- Do not add fake weather data.
- Do not expose or invent API keys.
- Do not add Docker.
- Do not add Tailwind; use CSS Modules / organized CSS and CSS variables.
- Avoid unnecessary dependencies and broad refactors.
- Keep components focused, accessible, and responsive.
- Use strict TypeScript and avoid `any`.
- Do not claim tests passed unless you actually ran them.

## Verification

Run the checks available in the project, including lint, type checking, tests, and production build as applicable. If a script is missing, explain that rather than pretending it ran.

## Completion response

Report:
1. Summary
2. Files Changed
3. Verification — commands and actual outcomes
4. Acceptance Criteria met
5. Limitations or unresolved decisions
6. Recommended next task

Stop after Phase 1. Wait for review before starting Phase 2.
