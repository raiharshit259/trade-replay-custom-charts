# Chart Known Issues

## Resolved
- Zoom anchored at cursor now uses normalized wheel deltas and frame-coalesced updates.
- Overlay persistence and ghosting are fixed by explicit per-frame clearing and DPR resets.

## In Progress
- Whole-object drag move is now partially supported for drawings; anchor drag still exists separately and some edge cases may need refinement.
- Pane resizing exists in the chart engine and still needs a polished visible UI workflow.

## Repro Notes
- If a drawing does not move with the body as expected, click a selected drawing and drag again. The interaction path is still being hardened.
- If a subpane divider is not visible in a page flow, the pane layout is still being driven by engine state rather than a dedicated UI panel.
