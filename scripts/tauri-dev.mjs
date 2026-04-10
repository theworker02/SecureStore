import { spawn } from "node:child_process";
import path from "node:path";

import {
  cleanupGeneratedTauriConfig,
  findFreePort,
  generatedConfigPath,
  projectRoot,
  waitForHttp,
  writeGeneratedTauriConfig,
} from "./dev-port-utils.mjs";

const host = "127.0.0.1";
const preferredPort = Number(process.env.SECURESTORE_DEV_PORT ?? 1420);
const port = await findFreePort(preferredPort, host);
const devUrl = `http://${host}:${port}`;
const viteBinary = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vite.cmd" : "vite",
);
const tauriBinary = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tauri.cmd" : "tauri",
);
const useShell = process.platform === "win32";

let viteProcess;
let tauriProcess;

const shutdown = async (exitCode = 0) => {
  if (tauriProcess && !tauriProcess.killed) {
    tauriProcess.kill();
  }

  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill();
  }

  await cleanupGeneratedTauriConfig();
  process.exit(exitCode);
};

process.on("SIGINT", () => {
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});

process.on("exit", () => {
  void cleanupGeneratedTauriConfig();
});

try {
  await writeGeneratedTauriConfig(devUrl);
  console.log(`SecureStore dev environment using ${devUrl}`);

  viteProcess = spawn(
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

  viteProcess.on("error", (error) => {
    console.error(`Failed to start Vite: ${error.message}`);
    void cleanupGeneratedTauriConfig().finally(() => {
      process.exit(1);
    });
  });

  viteProcess.on("exit", (code) => {
    if (tauriProcess && !tauriProcess.killed) {
      tauriProcess.kill();
    }

    void cleanupGeneratedTauriConfig().finally(() => {
      process.exit(code ?? 0);
    });
  });

  await waitForHttp(devUrl);

  tauriProcess = spawn(
    tauriBinary,
    ["dev", "--config", generatedConfigPath],
    {
      cwd: projectRoot,
      stdio: "inherit",
      shell: useShell,
      env: process.env,
    },
  );

  tauriProcess.on("error", (error) => {
    console.error(`Failed to start Tauri: ${error.message}`);
    if (viteProcess && !viteProcess.killed) {
      viteProcess.kill();
    }

    void cleanupGeneratedTauriConfig().finally(() => {
      process.exit(1);
    });
  });

  tauriProcess.on("exit", (code) => {
    if (viteProcess && !viteProcess.killed) {
      viteProcess.kill();
    }

    void cleanupGeneratedTauriConfig().finally(() => {
      process.exit(code ?? 0);
    });
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to start SecureStore dev environment: ${message}`);
  await cleanupGeneratedTauriConfig();
  process.exit(1);
}
