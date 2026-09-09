# Fed-ResViT design context

## Product and audience
Research and educational platform for trust-aware federated skin lesion classification. Researchers inspect protocol, threat models, planned comparisons and evidence; clinicians view the image workflow. This is not a standalone diagnostic system. English interface; no Japan-specific market scope.

## Visual identity
Preserve pure white canvas, deep navy #111936, blue-purple #242D62, violet #5545DA / #6B5CF6 and cyan #19B8C7. Orange #DF6949 identifies attack examples. Pale lavender #F5F3FF and blue-grey #F8F9FD organize supporting surfaces. Never imply scientific outcomes through color alone.

## Typography and composition
Avenir Next / Inter / sans-serif for interface and headings; monospace for scientific identifiers and code. Numeric values use tabular figures. Primary workspaces operate and explain: prioritize actual scientific relationships over decorative KPI cards. Shared panel headings 21px, body 14–16px, major heading 29–38px. Preserve the ten-client federation signature visualization.

## Runtime owners
app/globals.css defines --research-ink, --research-secondary, --research-line, --research-violet, --research-shadow and --research-radius. Existing Tailwind theme and Base UI primitives own widgets. components/research/common.tsx owns Panel, Pick, Badge, TabBar, Note. Extend these rather than introduce competing widget primitives.

## Evidence semantics
Protocol-derived counts are configured jobs, not measured performance or completed runs. No result values are ingested. Simulations use explicit DEMONSTRATION labels. Keep notebook provenance, configuration, execution, artifact verification and findings distinct. Do not pool pilots into full runs.

## Interaction
Charts that encode configured study coverage are selectable and lead to matching jobs. Selected controls use white on deep violet with visible cyan keyboard focus. Tables and diagrams scroll inside their own bounds at narrow widths. No automatic motion; playback is controllable and respects reduced-motion preferences. Never require hover for essential information.
