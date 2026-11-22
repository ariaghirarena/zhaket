---
name: frontend-design
source: anthropics/skills@frontend-design (installed from Drive 02-Skills)
drive_file_id: 18hlCQBcrwE7MlTFcnJSniH4uTMpRqo_6
---
# Frontend Design (Anthropic official guidelines)
Mandate: give every UI a distinct, calm, intentional identity — never a generic SaaS template.

## Pass 1 — compact design plan (before any code)
- Color: 4–6 deliberate hex tokens grounded in the subject (never cliché warm-cream+terracotta or neon-on-black by default).
- Typography: 1–2 intentional typefaces, crisp scale, readable measure (<80 chars). Persian RTL: clean Persian type (Morabba titles / Peyda body) + monospace for IDs, code, URLs.
- Layout: prose + ASCII wireframe, clear hierarchy and spatial rhythm; do not chop everything into identical rounded cards with the same shadow.
- Restraint: one bold focal point; quiet chrome; delete decoration that carries no meaning.

## Pass 2 — self-critique before building
- Remove tells: ALL-CAPS eyebrows above every heading, pointless 01/02/03 numbering, hover-bounce on every card, gradient washes as filler.
- Verify responsive behaviour, keyboard focus, reduced motion, contrast, RTL polish.

## UI copy
Plain active voice from the user's perspective; consistent action naming end-to-end;
empty/error states give a concrete next action; motion only answers a user action.

## Project notes (applied to ARIAGH.AIWRITER demo)
- Focal point = hero; everything else quiet.
- Icons are inline SVG strokes, never emoji.
- No entrance animation on every section: reveal only on scroll into view, respects prefers-reduced-motion.
