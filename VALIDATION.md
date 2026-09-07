# Validation record

- 12 Python tests passed: the 8-run grid and 240 round sequences; matrix/report accuracy, precision, recall, F1 and ASR agreement; class totals; rolling flag windows; rounded weight reconstruction; summary means/SD; SQLite relationships; API unavailable states; artifact boundaries; recorded WebSocket replay.
- 20 non-browser server-render smoke states passed across the main workspaces, all Observatory tabs, Clinical tabs, Federation tabs, Trust/Poisoning and an unexecuted condition.
- TypeScript check and authored-application lint passed. The untouched generated component catalog has upstream lint findings; the application lint command targets authored application modules.
- Production Sites/Vinext build passed. The local root route and health endpoint returned successful responses.
- No training or live checkpoint inference was run. The user's current hardware-constrained experiments remain unchanged.
- Docker Compose files are included, but Docker was not available in this environment, so container startup was not verified.
- Browser interaction/visual QA was not performed. It was not explicitly requested for this build.
- An optional feature-detected WebMCP round-inspection tool is included. No supported modelContext validation surface was available, so its browser registration was not verified.

Scientific availability is recorded in the application: only the embedded matrix/per-class run has those granular artifacts. Other original checkpoints and prediction arrays remain listed-only. No unavailable metrics were synthesized.
