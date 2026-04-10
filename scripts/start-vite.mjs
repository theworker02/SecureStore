import { spawn } from "node:child_process";
import path from "node:path";

import { findFreePort, projectRoot } from "./dev-port-utils.mjs";

const host = "127.0.0.1";
const preferredPort = Number(process.env.SECURESTORE_DEV_PORT ?? 1420);
const port = await findFreePort(preferredPort, host);
const viteBinary = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vite.cmd" : "vite",
);
const useShell = process.platform === "win32";

console.log(`SecureStore dev server starting on http://${host}:${port}`);

const child = spawn(
  viteBinary,
  ["--host", host, "--port", String(port), "--strictPort"],
  {
    cwd: projectRoot,
    stdio: "inherit",
    shell: useShell,
    env: {
      ...process.env,
      SECURESTORE_DEV_HOST: host,
      SECURESTORE_DEV_PORT: String(port),
      SECURESTORE_DEV_STRICT_PORT: "true",
    },
  },
);

child.on("error", (error) => {
  console.error(`Failed to start Vite: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
