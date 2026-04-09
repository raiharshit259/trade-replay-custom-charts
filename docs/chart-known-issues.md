# Chart Known Issues

## Resolved
- Zoom anchored at cursor now uses normalized wheel deltas and frame-coalesced updates.
- Overlay persistence and ghosting are fixed by explicit per-frame clearing and DPR resets.
- Selected drawings can be moved as whole objects and canceled with Escape.
- Pane divider dragging now updates pane heights from chart engine state.
- Drawing rows and delete actions now expose stable data-testid hooks for e2e tests.
- Performance benchmarking is now codified with a dev-only route, a Playwright runner, and a 10k regression test.

## In Progress
- Screenshot export of chart + drawings is not implemented yet.
- Indicator count is now 101 and the next target is continued expansion plus cleanup.

## Repro Notes
- For delete regression checks, use object-tree controls keyed by drawing data-testid attributes.
