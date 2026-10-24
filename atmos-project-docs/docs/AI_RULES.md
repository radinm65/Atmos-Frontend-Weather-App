# AI Coding Rules for Atmos

**Version:** 1.0

## 1. Read before coding

Before starting any task, read the relevant parts of:

- `BRD.md`
- `PRD.md`
- `DESIGN_SPEC.md`
- `TRD.md`
- `IMPLEMENTATION_PLAN.md`
- `OPEN_DECISIONS.md` (do not silently decide anything marked `Open`)

If instructions conflict, use this order:

1. Latest explicit instruction from the project owner
2. Approved product requirements
3. Technical and design specifications
4. Existing project conventions
5. The coding agent's preference

Flag contradictions instead of silently making product decisions.

## 2. Work incrementally

- Inspect the repository before editing files.
- State the small scope of the current task.
- Implement only that scope; do not generate the entire app in one pass.
- Avoid unrelated refactors and unnecessary dependencies.
- Preserve working behavior unless a change is explicitly required.
- Ask a concise question if an unresolved decision blocks safe implementation.

## 3. Code quality

- Use strict TypeScript and meaningful types.
- Avoid `any`; justify exceptions.
- Keep components focused and avoid giant page components.
- Keep provider/API logic out of presentation components.
- Reuse shared utilities and domain types instead of duplicating logic.
- Use clear names and consistent error handling.
- Prefer CSS Modules and CSS variables; do not introduce Tailwind unless explicitly approved.
- Do not add Docker or unnecessary infrastructure.
- Keep code easy to explain and maintain.

## 4. Product and design fidelity

- Follow the Cinematic Photography direction and Hybrid layout.
- Support both light and dark themes.
- Use the centralized design tokens.
- Do not create a generic admin dashboard.
- Build responsive layouts and accessible interaction states.
- Include loading, empty, error, and stale-data states.
- Never represent fixture/mock data as live production weather.

## 5. API and security

- Keep external API calls in the data layer.
- Normalize and validate provider responses.
- Do not commit secrets or expose secret API keys in client code.
- Do not assume a paid chat subscription includes runtime API credits.
- Keep AI runtime calls behind a secure server-side endpoint.
- Follow current attribution, licensing, and rate-limit requirements for weather and map providers.
- Do not claim that a map overlay works until it has been integrated and tested.

## 6. Accessibility

- Use semantic HTML and proper labels.
- Preserve keyboard access and visible focus.
- Respect reduced-motion settings.
- Do not rely on color alone to communicate meaning.
- Ensure chart and weather information has a readable text equivalent where practical.

## 7. Verification

After changes, run the checks that exist in the project, such as:

- lint
- TypeScript type check
- unit/component tests
- production build
- relevant end-to-end tests

Never claim a check passed unless it was actually run. If a check cannot run, explain why and give the exact command needed.

## 8. Completion report

At the end of each task, report:

1. **Summary** — what changed
2. **Files Changed** — files created/modified
3. **Verification** — commands run and real outcomes
4. **Acceptance Criteria** — which criteria are satisfied
5. **Limitations** — remaining issues or assumptions
6. **Next Step** — one small recommended task

Do not silently expand scope or claim the app is production-ready when provider configuration, licensing, security, or tests remain incomplete.
