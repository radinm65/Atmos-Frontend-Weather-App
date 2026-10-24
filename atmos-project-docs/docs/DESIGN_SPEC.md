# Design Specification

**Product:** Atmos  
**Version:** 1.1  
**Status:** Approved visual direction; details to refine during implementation

## 1. Design direction

- **Style:** Cinematic Photography
- **Layout:** Hybrid — cinematic hero area plus a structured, information-rich dashboard
- **Themes:** Light and dark
- **Product feel:** Editorial, atmospheric, premium, calm, and data-aware
- **Avoid:** Generic admin-dashboard styling, excessive glassmorphism, noisy gradients, decorative cards without purpose, and oversized empty spaces that hide useful information.

Weather photography should support the current condition and text readability. Imagery is a visual layer, not a replacement for accessible weather information.

## 2. Layout principles

- Use a clear global shell with navigation, active location, unit preferences, and theme control.
- Overview: cinematic weather hero with current conditions, followed by compact metric groups and forecast highlights.
- Forecast: prioritize readable hourly progression and daily summaries.
- Compare: align equivalent metrics across cities so differences are easy to scan.
- Map: give the map enough space to be useful; controls and selected-location details should remain discoverable.
- Assistant: make the conversation readable and show which location/context the assistant is using.
- Saved locations: prioritize quick switching and simple management.
- On mobile, reorganize content vertically and preserve access to core actions.

## 3. Initial dark-theme tokens

These are starting values and should be visually validated rather than treated as immutable:

```css
:root,
[data-theme="dark"] {
  color-scheme: dark;
  --color-bg: #080D18;
  --color-surface: #101827;
  --color-surface-elevated: #172235;
  --color-border: #263449;
  --color-text: #F4F7FC;
  --color-text-muted: #A3B1C6;
  --color-accent: #72D5FF;
  --color-accent-strong: #399CFF;
  --color-on-accent: #080D18;
  --color-border-strong: #5C6F8C; /* form-control boundaries, 3:1+ on all dark surfaces */
  --color-focus-ring: #72D5FF;
  --color-success: #58D6A3;
  --color-warning: #FFC66D;
  --color-danger: #FF747E;
}
```

Contrast was computed for these values: text, muted text, accent, success, warning and danger all exceed 4.5:1 on bg, surface and elevated surface. `--color-border` (about 1.4:1) is decorative only; inputs and other controls whose boundary is a border must use `--color-border-strong`.

## 4. Initial light-theme tokens

Define a complete light palette explicitly; do not invert the dark theme mechanically.

```css
[data-theme="light"] {
  color-scheme: light;
  --color-bg: #F4F7FB;
  --color-surface: #FFFFFF;
  --color-surface-elevated: #FFFFFF;
  --color-border: #DCE4EF;
  --color-text: #152033;
  --color-text-muted: #58677D;
  --color-accent: #0772AA; /* was #087EBA: 4.16:1 on bg failed AA for small text */
  --color-accent-strong: #05598F;
  --color-on-accent: #FFFFFF;
  --color-border-strong: #7C8BA1; /* form-control boundaries, 3:1+ on bg and surface */
  --color-focus-ring: #05598F;
  --color-success: #137A50;
  --color-warning: #8A5700;
  --color-danger: #B42332;
}
```

All text-bearing pairs above reach at least 4.5:1 on bg and surface (accent 4.89:1, white on accent 5.25:1). Re-check any new foreground/background pair before shipping it.

## 4a. Additional token groups (starting values)

Define these in `tokens.css` alongside color. They are not theme-specific unless noted.

```css
:root {
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; /* final fonts: OPEN_DECISIONS D-04 */
  --font-display: var(--font-sans);
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-6: 1.5rem;  --space-8: 2rem;   --space-12: 3rem;
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px; --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.12);
  --shadow-md: 0 8px 24px rgb(0 0 0 / 0.18);
  --scrim-hero: linear-gradient(to top, rgb(8 13 24 / 0.78), rgb(8 13 24 / 0.15)); /* keeps text readable over photos */
  --motion-fast: 150ms; --motion-base: 250ms;
}
```

## 5. Components and visual rules

- Reuse tokens for color, border, spacing, radii, and elevation.
- Prefer CSS Modules or organized component styles over long inline utility-class strings.
- Keep shared UI primitives small and consistent: buttons, icon buttons, inputs, cards, badges, skeletons, empty states, error states, and tooltips.
- Use a restrained type scale and clear hierarchy; avoid relying on color alone to convey weather severity.
- Weather icons should be consistent in style and have text equivalents where meaningful.
- Use charts only when they clarify trends; ensure units and labels are visible.
- Use a coherent icon set such as Lucide React.
- Images should have suitable fallbacks and avoid obscuring text.

## 6. Motion

- Use brief, purposeful transitions for theme changes, menus, and state changes.
- Avoid animation that delays access to weather information.
- Respect `prefers-reduced-motion`.
- Do not animate every card or add parallax without a clear UX benefit.

## 7. Accessibility

- Semantic headings and landmarks.
- Keyboard-accessible navigation, search, menus, map controls, and chat form.
- Visible focus states in both themes.
- Sufficient text and control contrast.
- Accessible chart summaries and meaningful alternative text for informative images.
- Do not communicate conditions using color alone.
- Touch targets should be comfortable on mobile.

## 8. Responsive behavior

Use content-driven breakpoints. A desktop-first CSS workflow is acceptable, but every page must be validated at mobile widths as well. Avoid hard-coded widths that cause overflow. The 768px breakpoint may be used as an initial tablet/mobile boundary, then refined from real layouts.

## 9. Photography requirements

The visual identity depends on photography, so the asset plan is part of the spec. The source is an open decision (OPEN_DECISIONS D-13); these requirements apply whichever source is chosen.

- **Coverage:** day and night variants for clear, partly cloudy, overcast, rain, thunderstorm, snow, and fog/mist, plus one neutral fallback used when the condition is unknown or an image fails.
- **Mapping:** one module maps normalized condition + day/night to a scene. Components never choose images ad hoc.
- **Licensing:** only photos whose license permits this use. Record source URL, photographer, and license for every image in `docs/CREDITS.md`, and show credit in the UI or README where the license requires it.
- **Performance:** serve responsive sizes in a modern format (AVIF/WebP) with a JPEG fallback or equivalent; give each image explicit dimensions and a solid-color or blurred placeholder; load only the scene currently needed. Do not ship multi-megabyte originals.
- **Readability and accessibility:** text over a photo always sits on `--scrim-hero` or an equivalent that keeps 4.5:1 contrast. The photo is decorative (`alt=""`); the condition is always also stated in text.
- **Honesty:** a photo illustrates the condition category; it must never imply a live camera or a photo of the actual location.

## 10. Quality bar

Each page should include polished loading, empty, error, and success states. Layouts should remain stable while data loads. Avoid fake production data being mistaken for live conditions. Placeholder fixtures are allowed only in isolated development/test contexts and must be labeled clearly.
