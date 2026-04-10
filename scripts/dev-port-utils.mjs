import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(currentFile);
export const projectRoot = path.dirname(scriptsDir);
export const tauriConfigPath = path.join(projectRoot, "src-tauri", "tauri.conf.json");
export const generatedConfigPath = path.join(projectRoot, "src-tauri", "tauri.dev.generated.json");

export async function findFreePort(preferredPort = 1420, host = "127.0.0.1") {
  for (let port = preferredPort; port < preferredPort + 200; port += 1) {
    if (await isPortFree(port, host)) {
      return port;
    }
  }

  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen({ host, port: 0 }, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : preferredPort;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}

export function waitForHttp(url, timeoutMs = 30_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const poll = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for dev server at ${url}`));
          return;
        }

        setTimeout(poll, 250);
      });
    };

    poll();
  });
}

export async function writeGeneratedTauriConfig(devUrl) {
  const raw = await readFile(tauriConfigPath, "utf8");
  const config = JSON.parse(raw);
  config.build = {
    ...config.build,
    beforeDevCommand: null,
    devUrl,
  };

  await mkdir(path.dirname(generatedConfigPath), { recursive: true });
  await writeFile(generatedConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return generatedConfigPath;
}

export async function cleanupGeneratedTauriConfig() {
  try {
    await access(generatedConfigPath);
    await rm(generatedConfigPath);
  } catch {
    // Ignore cleanup errors for a missing temp config.
  }
}

async function isPortFree(port, host) {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen({ port, host }, () => {
      server.close(() => resolve(true));
    });
  });
}
