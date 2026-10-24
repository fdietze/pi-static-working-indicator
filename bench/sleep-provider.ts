// Fake model for the benchmark: the first request calls `bash sleep 61.4142`, every later one ends the turn.
import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";

export default function sleepProvider(pi: any) {
  let step = 0;
  pi.registerProvider("fake", {
    baseUrl: "http://127.0.0.1:9",
    apiKey: "unused",
    api: "fake-api",
    models: [{ id: "sleep", name: "Sleep", reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1_000_000, maxTokens: 1000 }],
    streamSimple(model: any) {
      const first = step++ === 0;
      const stream = createAssistantMessageEventStream();
      const message: any = {
        role: "assistant", content: [], api: model.api, provider: model.provider, model: model.id,
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
        stopReason: first ? "toolUse" : "stop", timestamp: Date.now(),
      };
      queueMicrotask(() => {
        stream.push({ type: "start", partial: message });
        message.content.push(first
          ? { type: "toolCall", id: "call_sleep", name: "bash", arguments: { command: "sleep 61.4142" } }
          : { type: "text", text: "done" });
        stream.push({ type: "done", reason: message.stopReason, message });
        stream.end();
      });
      return stream;
    },
  });
}
