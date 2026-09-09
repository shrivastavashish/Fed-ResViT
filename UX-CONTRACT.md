# Research interface behavior

## Canonical UI Map
- Select/Listbox: authored Pick in components/research/common.tsx, backed by components/ui/select.tsx; persistent accessible label, keyboard and popup navigation.
- Form: shared Pick and components/ui/slider.tsx; configuration edits create drafts and do not start training.
- Scrollbar: app/globals.css; internal overflow for wide scientific diagrams and tables, never body-wide horizontal overflow.
- Navigation: app/page.tsx owns hash routes, navigation-tools.tsx owns workspace search and guided walkthrough. Research tabs use shared TabBar.
- Disclosure: native details/summary for supporting configuration and artifact explanations.
- Download: lib/project.ts download; user-triggered local JSON or CSV exports. No external upload.
- Selection: scientific coverage cells are ordinary keyboard-operable buttons; a selected cell yields exact matching configured jobs and a named detail region. No server table selection or bulk mutation.

## State and evidence
Configured, supported, demonstration and awaiting-artifacts states remain visible. Empty results never render a fake zero or curve. No job dispatch, authentication, CRUD, patient upload service or live telemetry is connected. No success notification may claim those actions.

## Verification
Run TypeScript, lint, production build and server-rendered smoke checks. Exercise selected coverage, empty filter combinations, clear selection, exact export scope and keyboard navigation in a browser at desktop and narrow widths. Preserve studyPlan results and scientific identity.
