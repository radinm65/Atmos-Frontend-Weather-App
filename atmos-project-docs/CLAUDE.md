# Atmos — Claude Code project memory

Atmos is a portfolio-grade weather web app: cinematic weather photography + a structured, data-rich dashboard. React + TypeScript + Vite, no backend framework, no accounts.

## Read first

@README.md
@docs/AI_RULES.md
@docs/IMPLEMENTATION_PLAN.md
@docs/OPEN_DECISIONS.md

Read the others on demand for the task at hand: `docs/BRD.md` (goals/scope), `docs/PRD.md` (stories + acceptance criteria), `docs/DESIGN_SPEC.md` (visual rules, tokens), `docs/TRD.md` (architecture).

## Hard rules (full list in `docs/AI_RULES.md`)

- Work one phase at a time from `docs/IMPLEMENTATION_PLAN.md`. Stop at the end of the phase and wait for review.
- Inspect the repo before editing. Preserve useful existing code. No unrelated refactors.
- Strict TypeScript, no `any` without a written justification.
- CSS Modules + CSS custom properties from `src/styles/`. No Tailwind, no Docker, no new dependency without a concrete need.
- Never fake weather. Fixtures only in tests or clearly labeled dev states.
- Never put secrets in the repo or client bundle. `VITE_*` variables are public.
- If a doc is silent or contradictory, or a decision in `docs/OPEN_DECISIONS.md` is still open and blocks you: ask. Do not decide silently.
- Never claim a check passed unless you ran it and saw the result.
- Do not commit or push unless the user asks.

## Commands

Fill this in during Phase 1 once the scripts exist (dev, build, lint, typecheck, test, e2e). Keep it accurate.

## Completion report

End every task with: Summary · Files Changed · Verification (real commands, real results) · Acceptance Criteria · Limitations · Next Step.
