import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Pi's default working indicator is a spinner. Every frame (12.5 per second) requests a TUI render,
// and a render walks the whole transcript, so long sessions burn CPU while the agent waits on
// tools. A single frame starts no animation timer; the message text ("Working...") still shows
// that the agent is busy.
export default function staticWorkingIndicator(pi: ExtensionAPI): void {
  // session_start also fires on /reload, which resets the indicator to pi's default.
  pi.on("session_start", (_event, ctx) => {
    // Explicit frames are rendered verbatim, so they carry their own color.
    if (ctx.hasUI) ctx.ui.setWorkingIndicator({ frames: [ctx.ui.theme.fg("accent", "●")] });
  });
}
