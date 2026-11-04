#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, realpathSync, chmodSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://www.userflowlibrary.com";
const digest = (value) => createHash("sha256").update(value).digest("hex");

export function repositoryRoot(cwd) {
  try {
    return realpathSync(execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim());
  } catch {
    return realpathSync(cwd);
  }
}

export async function run(command, input, {
  cwd = process.cwd(),
  stateHome = process.env.UFL_AGENT_HOME || join(homedir(), ".config", "ufl-agent"),
  fetchImpl = fetch,
} = {}) {
  const repo = repositoryRoot(cwd);
  const directory = join(stateHome, digest(repo));
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  const stateFile = join(directory, "state.json");
  const lockFile = join(directory, "operation.lock");
  try {
    writeFileSync(lockFile, `${process.pid}\n`, { flag: "wx", mode: 0o600 });
  } catch {
    throw new Error("Another operation holds this repository's lock. Check whether it is still running before removing operation.lock.");
  }
  try {
    let state;
    try {
      state = JSON.parse(readFileSync(stateFile, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw new Error("Cannot read saved UFL state; do not overwrite it.");
      state = {
        token: `ufl_guest_${randomBytes(32).toString("hex")}`,
        name: basename(repo),
        ingests: {},
      };
    }
    const save = () => {
      const temp = `${stateFile}.tmp`;
      writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
      chmodSync(temp, 0o600);
      renameSync(temp, stateFile);
    };
    // Persist the credential before the first request, so bootstrap is safely
    // resumable even if the connection is lost after project creation.
    save();
    const api = async (path, method = "GET", body) => {
      let response;
      try {
        response = await fetchImpl(`${ORIGIN}${path}`, {
          method,
          redirect: "error",
          headers: { authorization: `Bearer ${state.token}`, "content-type": "application/json" },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: AbortSignal.timeout(330_000),
        });
      } catch {
        throw new Error("Network outcome uncertain. Run status before retrying any write; credentials have been retained.");
      }
      let data;
      try { data = await response.json(); } catch {
        throw new Error(`HTTP ${response.status}: unexpected response. Run status before retrying.`);
      }
      if (!response.ok) {
        // Do not echo arbitrary server bodies, which may contain request data.
        const code = typeof data.code === "string" && /^[A-Z_]+$/.test(data.code) ? ` (${data.code})` : "";
        throw new Error(`HTTP ${response.status}${code}. No automatic retry or browser authentication was attempted.`);
      }
      return data;
    };
    const bootstrap = async () => {
      state.trial = await api("/api/agent/bootstrap", "POST", { name: state.name });
      save();
      return { ...state.trial, workDirectory: directory };
    };
    if (command === "init") return await bootstrap();
    if (!state.trial?.projectId) throw new Error("Run init first.");
    const base = `/api/projects/${state.trial.projectId}`;
    if (command === "status") {
      const trial = await bootstrap();
      const screens = await api(`${base}/screens`);
      const rows = Array.isArray(screens) ? screens : screens.screens ?? [];
      return {
        ...trial,
        screens: rows.map(({ id, title, path, tags }) => ({ id, title, path, tags })),
        operations: Object.entries(state.ingests).map(([hash, value]) => ({ hash, status: value.status })),
        organizeStatus: state.organize?.status ?? "not_started",
      };
    }
    if (command === "ingest") {
      if (!input) throw new Error("Provide the path to routes.json.");
      const body = JSON.parse(readFileSync(resolve(cwd, input), "utf8"));
      if (!Array.isArray(body.routes) || body.routes.length < 1 || body.routes.length > 5) {
        throw new Error("Accountless ingestion requires 1–5 routes.");
      }
      if (JSON.stringify(body).length > 300_000) throw new Error("Trial payload exceeds 300,000 characters.");
      const hash = digest(JSON.stringify(body));
      const previous = state.ingests[hash];
      if (previous?.status === "completed") return previous.result;
      if (previous) throw new Error("This ingest has an uncertain outcome. Run status and inspect existing screens; do not blindly replay it.");
      const trial = await bootstrap();
      if (trial.remainingRenders < body.routes.length) throw new Error("Insufficient trial render budget. Keep the existing project; do not create another trial to bypass it.");
      state.ingests[hash] = { status: "uncertain" };
      save();
      const result = await api(`${base}/ingest-screens`, "POST", body);
      state.ingests[hash] = { status: "completed", result };
      save();
      return result;
    }
    if (command === "organize") {
      if (state.organize?.status === "completed") return state.organize.result;
      if (state.organize) throw new Error("Organization has an uncertain outcome. Run status before attempting further changes.");
      state.organize = { status: "uncertain" };
      save();
      const result = await api(`${base}/organize`, "POST");
      state.organize = { status: "completed", result };
      save();
      return result;
    }
    if (command === "share") {
      const result = await api(`${base}/share`);
      return { ...result, projectUrl: state.trial.projectUrl, accountless: true };
    }
    if (command === "unshare") return await api(`${base}/share`, "DELETE");
    throw new Error("Commands: init, status, ingest <routes.json>, organize, share, unshare");
  } finally {
    unlinkSync(lockFile);
  }
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  run(process.argv[2], process.argv[3])
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(JSON.stringify({ error: error.message }));
      process.exitCode = 1;
    });
}
