# pi-static-working-indicator

A [Pi](https://pi.dev/) extension that replaces the animated working spinner with a static `●`. Long sessions stop re-rendering 12.5 times per second while the agent waits on a tool.

## Install

```bash
pi install npm:pi-static-working-indicator
```

Start a new session after installing.

## Why

Every spinner frame requests a TUI render, and a render walks the whole transcript. The cost grows with the session, while the only visible change is one character. A single static frame starts no timer. The "Working..." text still shows that the agent is busy.

## Measured

Pi 1.3.0, a real 4 MB session, the agent waiting on a 60 s `bash` tool call. 15 s warmup, 20 s sample, median of 3 interleaved runs, 160×48 terminal:

| TUI mode | Pi CPU, spinner → static | Terminal output, spinner → static |
| --- | --- | --- |
| regular | 32.8% → 3.7% of a core | 7.4 → 0.24 kB/s |
| fullscreen | 6.2% → 1.5% of a core | 7.4 → 0.24 kB/s |

The remaining output is Pi's elapsed-time display on the running tool, which updates once per second.

To reproduce, run `python3 bench/drive.py "$(command -v pi)" <regular|fullscreen> <none|extensions/static-working-indicator.ts> <session.jsonl>`. It prints CPU percent, terminal reads and bytes.

## Scope

Only the main working indicator becomes static, because that is what Pi's `setWorkingIndicator` API controls. Pi's other loaders keep their spinner: `!command` runs, compaction, retries and some dialogs. They run rarely or briefly.

## Credits

Written by Felix Rath ([futile](https://github.com/futile)) and published here with his permission.
