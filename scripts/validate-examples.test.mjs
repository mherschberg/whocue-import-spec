// Tests for the validator's file-argument mode, `npm run validate -- <file>`.
// Run with `npm test` (Node's built-in test runner; no extra dependency).

import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const repo_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Runs the validator from the repository root with [args], as npm does, and
 * with `INIT_CWD` set to [init_cwd] when given.
 */
function run_validator(args, init_cwd) {
  const env = { ...process.env };
  delete env.INIT_CWD;
  if (init_cwd !== undefined) {
    env.INIT_CWD = init_cwd;
  }
  return spawnSync(process.execPath, ["scripts/validate-examples.mjs", ...args], {
    cwd: repo_root,
    env,
    encoding: "utf8",
  });
}

test("a valid import file passes and names its contract", () => {
  const result = run_validator(["examples/valid/minimal.json"]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "ok examples/valid/minimal.json (import v1)");
});

test("an invalid file fails with its schema errors", () => {
  const result = run_validator(["examples/invalid/null-tags.json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /^fail examples\/invalid\/null-tags\.json \(import v1\)$/m);
  assert.match(result.stderr, /^ {2}\/people\/0\/tags must be array$/m);
});

test("a semantic failure is reported as well as a schema one", () => {
  const result = run_validator(["examples/invalid/event-end-before-start.json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\/event\/end_at is before \/event\/start_at/);
});

test("a handoff envelope is validated as a handoff export", () => {
  const result = run_validator(["examples/handoff/valid/minimal-single-person.json"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /\(handoff v1\)$/m);
});

test("every file is reported, and one failure fails the run", () => {
  const result = run_validator(["examples/valid/minimal.json", "examples/invalid/null-links.json"]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /^ok examples\/valid\/minimal\.json/m);
  assert.match(result.stderr, /^fail examples\/invalid\/null-links\.json/m);
});

test("a missing file and a non-JSON file fail clearly, without a stack trace", () => {
  const result = run_validator(["examples/no-such-file.json", "README.md"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /^fail examples\/no-such-file\.json: cannot read: ENOENT$/m);
  assert.match(result.stderr, /^fail README\.md: not valid JSON: /m);
  assert.doesNotMatch(result.stderr, /at .*\.mjs:\d+/);
});

test("relative paths resolve against the directory npm was started from", () => {
  const result = run_validator(["valid/minimal.json"], path.join(repo_root, "examples"));

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "ok valid/minimal.json (import v1)");
});

test("with no arguments the corpus is validated", () => {
  const result = run_validator([]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^schema ok: schema\/whocue-import-v1\.schema\.json$/m);
  assert.match(result.stdout, /^handoff snapshot mirrors import v1 field set: ok$/m);
});
