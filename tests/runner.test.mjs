import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../skills/user-flow-library/scripts/ufl.mjs";

test("runs in arbitrary repos, resumes credentials, and never replays uncertain ingestion", async () => {
  const temp = mkdtempSync(join(tmpdir(), "ufl-skill-test-"));
  try {
    const repoA = join(temp, "app-a");
    const repoB = join(temp, "app-b");
    mkdirSync(repoA);
    mkdirSync(repoB);
    const tokens = [];
    let ingestCalls = 0;
    const fetchImpl = async (url, options) => {
      assert.equal(options.redirect, "error");
      if (url.endsWith("/bootstrap")) {
        tokens.push(options.headers.authorization);
        return Response.json({ projectId: "project", remainingRenders: 5 });
      }
      if (url.endsWith("/ingest-screens")) {
        ingestCalls++;
        throw new Error("Connection lost");
      }
      throw new Error(`Unexpected URL: ${url}`);
    };
    const options = { cwd: repoA, stateHome: join(temp, "private"), fetchImpl };
    const first = await run("init", undefined, options);
    await run("init", undefined, options);
    assert.equal(tokens[0], tokens[1]);
    assert.ok(!JSON.stringify(first).includes("ufl_guest_"));
    assert.equal(statSync(join(first.workDirectory, "state.json")).mode & 0o777, 0o600);
    await run("init", undefined, { ...options, cwd: repoB });
    assert.notEqual(tokens[0], tokens[2]);
    writeFileSync(join(repoA, "routes.json"), JSON.stringify({
      routes: [{ path: "/", title: "Home", source: "export default function Home() {}" }],
    }));
    await assert.rejects(run("ingest", "routes.json", options), /uncertain/);
    await assert.rejects(run("ingest", "routes.json", options), /uncertain/);
    assert.equal(ingestCalls, 1);
    const saved = JSON.parse(readFileSync(join(first.workDirectory, "state.json"), "utf8"));
    assert.match(saved.token, /^ufl_guest_[a-f0-9]{64}$/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("a completed ingest is reused instead of spending twice", async () => {
  const temp = mkdtempSync(join(tmpdir(), "ufl-skill-cache-"));
  try {
    let ingests = 0;
    const options = {
      cwd: temp,
      stateHome: join(temp, "state"),
      fetchImpl: async (url) => {
        if (url.endsWith("/bootstrap")) return Response.json({ projectId: "project", remainingRenders: 5 });
        ingests++;
        return Response.json({ renderedCount: 1, failedCount: 0 });
      },
    };
    await run("init", undefined, options);
    writeFileSync(join(temp, "routes.json"), JSON.stringify({ routes: [{ path: "/", title: "Home", source: "real source" }] }));
    await run("ingest", "routes.json", options);
    const second = await run("ingest", "routes.json", options);
    assert.equal(second.renderedCount, 1);
    assert.equal(ingests, 1);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
