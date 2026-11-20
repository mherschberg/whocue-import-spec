import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const repo_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema_path = path.join(
  repo_root,
  "schema/whocue-event-prep-prompt-catalog-v1.schema.json",
);
const catalog_path = path.join(repo_root, "prompts/event-prep-prompt-catalog-v1.json");
const app_copy_path = path.resolve(
  repo_root,
  "../../app/assets/prompts/event-prep-prompt-catalog-v1.json",
);

function read_json(file_path) {
  return JSON.parse(readFileSync(file_path, "utf8"));
}

function validator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(read_json(schema_path));
}

function occurrences(value, token) {
  return value.split(token).length - 1;
}

test("the published Event Prep catalog satisfies its schema", () => {
  const validate = validator();
  const catalog = read_json(catalog_path);

  assert.equal(validate(catalog), true, JSON.stringify(validate.errors, null, 2));
});

test("catalog identities, versions, and authoring labels are coherent", () => {
  const catalog = read_json(catalog_path);
  const prompt = catalog.general_prompt;
  const instruction = prompt.instruction_set;
  const template_ids = catalog.brief_templates.map((template) => template.id);
  const normalized_titles = catalog.brief_templates.map((template) =>
    template.title.trim().toLocaleLowerCase("en-US"),
  );

  assert.equal(new Set(template_ids).size, template_ids.length);
  assert.equal(new Set(normalized_titles).size, normalized_titles.length);
  assert.equal(occurrences(prompt.prompt_template, prompt.brief_placeholder), 1);
  assert.match(prompt.prompt_template, new RegExp(`${prompt.id}@${prompt.version}`));
  assert.match(prompt.prompt_template, new RegExp(`${instruction.id}@${instruction.version}`));
  assert.ok(prompt.prompt_template.includes(instruction.url));
  assert.ok(instruction.url.endsWith(`event-prep-v${instruction.version}.md`));

  assert.deepEqual(
    catalog.brief_templates.map((template) => template.title),
    ["General networking", "Customers", "Investors", "Partners", "Candidates", "Employers"],
  );
  for (const template of catalog.brief_templates) {
    for (const label of [
      "Goal:",
      "My context:",
      "Prioritize:",
      "Deprioritize:",
      "List size:",
    ]) {
      assert.ok(template.context.includes(label), `${template.id} lacks ${label}`);
    }
  }
});

test(
  "the app's offline catalog is byte-for-byte identical",
  { skip: !existsSync(app_copy_path) },
  () => {
    assert.equal(readFileSync(app_copy_path, "utf8"), readFileSync(catalog_path, "utf8"));
  },
);

test("unsupported versions and malformed prompt metadata are rejected", () => {
  const validate = validator();
  const catalog = read_json(catalog_path);

  for (const mutate of [
    (copy) => {
      copy.format_version = "2.0";
    },
    (copy) => {
      copy.general_prompt.version = "1";
    },
    (copy) => {
      copy.general_prompt.instruction_set.url = "https://example.com/instructions.md";
    },
    (copy) => {
      copy.brief_templates[0].title = " ";
    },
    (copy) => {
      copy.brief_templates[0].context = "x".repeat(1501);
    },
  ]) {
    const invalid = structuredClone(catalog);
    mutate(invalid);
    assert.equal(validate(invalid), false);
  }
});
