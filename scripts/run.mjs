import { existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const candidates = [
  process.env.HAS_NODE_BINARY,
  process.execPath,
  join(
    homedir(),
    ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node",
  ),
  "/opt/homebrew/bin/node",
].filter(Boolean);
const runtime = candidates.find((candidate) => {
  if (!existsSync(candidate)) return false;
  try {
    const version = execFileSync(candidate, ["-p", "process.versions.node"], {
      encoding: "utf8",
    }).trim();
    const [major, minor] = version.split(".").map(Number);
    return major > 22 || (major === 22 && minor >= 12);
  } catch {
    return false;
  }
});
if (!runtime) {
  console.error(
    "HAS requires Node.js 22.12 or newer. Install a current Node LTS, or set HAS_NODE_BINARY to its executable.",
  );
  process.exit(1);
}
const [task, ...extra] = process.argv.slice(2);
const commands = {
  dev: [["vite/bin/vite.js", "--host", "127.0.0.1", ...extra]],
  preview: [["vite/bin/vite.js", "preview", "--host", "127.0.0.1", ...extra]],
  build: [
    ["typescript/bin/tsc", "-b"],
    ["vite/bin/vite.js", "build", ...extra],
  ],
  test: [["vitest/vitest.mjs", "run", ...extra]],
  format: [
    [
      "prettier/bin/prettier.cjs",
      "--write",
      "src",
      "tests",
      "scripts",
      "*.json",
      "*.ts",
      "*.md",
      ...extra,
    ],
  ],
};
if (!(task in commands)) {
  console.error("Unknown task:", task);
  process.exit(1);
}
for (const [entry, ...args] of commands[task]) {
  const result = spawnSync(
    runtime,
    [join(root, "node_modules", entry), ...args],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: `${dirname(runtime)}:${process.env.PATH ?? ""}`,
      },
    },
  );
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
