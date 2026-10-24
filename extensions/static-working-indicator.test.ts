import assert from "node:assert/strict";
import test from "node:test";
import type { ExtensionAPI, WorkingIndicatorOptions } from "@earendil-works/pi-coding-agent";
import staticWorkingIndicator from "./static-working-indicator.ts";

/** Registers the extension against a fake Pi and fires session_start once. */
function startSession(hasUI: boolean): (WorkingIndicatorOptions | undefined)[] {
  const handlers: Record<string, (event: unknown, ctx: unknown) => void> = {};
  staticWorkingIndicator({
    on: (event: string, handler: (event: unknown, ctx: unknown) => void) => {
      handlers[event] = handler;
    },
  } as unknown as ExtensionAPI);

  const calls: (WorkingIndicatorOptions | undefined)[] = [];
  handlers.session_start!({ type: "session_start", reason: "startup" }, {
    hasUI,
    ui: {
      theme: { fg: (color: string, text: string) => `<${color}>${text}` },
      setWorkingIndicator: (options?: WorkingIndicatorOptions) => calls.push(options),
    },
  });
  return calls;
}

test("sets a single colored frame, which starts no animation timer", () => {
  assert.deepEqual(startSession(true), [{ frames: ["<accent>●"] }]);
});

test("leaves sessions without a UI alone", () => {
  assert.deepEqual(startSession(false), []);
});
