#!/usr/bin/env python3
"""Run pi in a pty on a copy of a large session, let the fake model start `bash sleep 61.4142`,
then sample pi's CPU time and terminal output while the agent waits on that tool call.
usage: drive.py <pi-bin> <tuiMode> <extension-or-'none'> <session.jsonl>
prints: cpu_percent writes bytes"""
import fcntl, json, os, pty, select, shutil, signal, struct, sys, tempfile, termios, time

pi_bin, mode, ext, session = sys.argv[1:5]
WARMUP, SAMPLE = 15.0, 20.0

agent = tempfile.mkdtemp(prefix="pi-agent-")
json.dump({"tuiMode": mode}, open(os.path.join(agent, "settings.json"), "w"))
sess = os.path.join(tempfile.mkdtemp(prefix="pi-sess-"), os.path.basename(session))
shutil.copy(session, sess)

args = [pi_bin, "-ne", "-e", os.path.join(os.path.dirname(os.path.abspath(__file__)), "sleep-provider.ts")]
if ext != "none":
    args += ["-e", ext]
args += ["--model", "fake/sleep", "--session", sess]
env = {k: v for k, v in os.environ.items() if not k.startswith("PI_")}
env.update(PI_CODING_AGENT_DIR=agent, TERM="xterm-256color")

pid, fd = pty.fork()
if pid == 0:
    os.execve(pi_bin, args, env)
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 48, 160, 0, 0))

def drain(seconds):
    """Read pty output for `seconds`; return (reads, bytes)."""
    reads = nbytes = 0
    end = time.time() + seconds
    while time.time() < end:
        r, _, _ = select.select([fd], [], [], 0.05)
        if r:
            try:
                data = os.read(fd, 65536)
            except OSError:
                break
            reads += 1
            nbytes += len(data)
    return reads, nbytes

def cpu_ticks():
    f = open(f"/proc/{pid}/stat").read().rsplit(")", 1)[1].split()
    return int(f[11]) + int(f[12])  # utime + stime of the pi process

drain(10)  # startup and initial render of the large session
os.write(fd, b"go\r")
drain(WARMUP)
t0, c0 = time.time(), cpu_ticks()
reads, nbytes = drain(SAMPLE)
t1, c1 = time.time(), cpu_ticks()
clk = os.sysconf("SC_CLK_TCK")
print(f"{100 * (c1 - c0) / clk / (t1 - t0):.2f} {reads} {nbytes}")
os.kill(pid, signal.SIGKILL)
os.waitpid(pid, 0)
