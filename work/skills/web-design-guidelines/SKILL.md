---
name: web-design-guidelines
source: vercel-labs/agent-skills@web-design-guidelines (installed from Drive 02-Skills)
drive_file_id: 1VNqceaFatTgz4-knptC3r8EHELQEPdjL
---
# Web Design Guidelines (Vercel engineering)
Live ruleset: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
(blocked in this sandbox — raw.githubusercontent.com is not reachable; the checklist below is the working copy)

## Audit checklist used before every hand-off
- Semantics: one h1, heading order, landmarks (header/nav/main/footer), lang + dir on html.
- Focus: every interactive element reachable by keyboard, visible focus ring, no outline:none without replacement.
- Forms: labels bound to inputs, autocomplete hints, inline error text, no placeholder-as-label.
- States: loading / empty / error / success all designed, never a bare spinner or vague apology.
- Motion: respects prefers-reduced-motion; no parallax that hijacks scroll; no animation longer than 400ms for feedback.
- Contrast: body text >= 4.5:1, large text >= 3:1, focus ring >= 3:1 against both surfaces.
- RTL: logical properties (margin-inline, padding-inline), no left/right hard-coding, mirrored icons for direction.
- Responsive: 360 / 768 / 1024 / 1440 verified, no horizontal scroll, hit targets >= 44px.
- Performance: no external requests, images have width/height, fonts preloaded or font-display: swap, JS < 30KB.
- Content: no lorem, no fake English leftovers in a Persian UI, numbers localized consistently.
