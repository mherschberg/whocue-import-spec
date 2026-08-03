import { Buffer } from "node:buffer";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const script_dir = path.dirname(fileURLToPath(import.meta.url));
const repo_root = path.resolve(script_dir, "..");
const schema_path = path.join(repo_root, "schema", "whocue-import-v1.schema.json");
const valid_examples_dir = path.join(repo_root, "examples", "valid");
const invalid_examples_dir = path.join(repo_root, "examples", "invalid");

/**
 * Reads and parses a JSON file with an error message that names the fixture.
 */
async function read_json(file_path) {
  const content = await readFile(file_path, "utf8");
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`${relative_path(file_path)} is not valid JSON: ${error.message}`);
  }
}

/**
 * Lists JSON fixtures in a directory in stable order.
 */
async function list_json_files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

/**
 * Formats a path relative to the repository root for stable local/CI output.
 */
function relative_path(file_path) {
  return path.relative(repo_root, file_path);
}

/**
 * Creates the draft 2020-12 AJV validator and verifies the schema itself.
 */
function create_validator(schema) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: true,
  });
  addFormats(ajv);

  if (!ajv.validateSchema(schema)) {
    throw new Error(`schema/whocue-import-v1.schema.json is not a valid JSON Schema:\n${format_errors(ajv.errors)}`);
  }

  return ajv.compile(schema);
}

/**
 * Formats AJV errors as compact path-plus-message diagnostics.
 */
function format_errors(errors) {
  if (!errors || errors.length === 0) {
    return "unknown validation error";
  }

  return errors
    .map((error) => {
      const instance_path = error.instancePath || "/";
      return `${instance_path} ${error.message}`;
    })
    .join("\n");
}

/**
 * Normalizes merge keys the same way fixture validation compares person names.
 */
function normalize_merge_key(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

/**
 * Performs contract checks that are intentionally outside portable JSON Schema.
 */
function validate_semantics(document) {
  const errors = [];

  if (Array.isArray(document.people)) {
    const seen_names = new Map();

    for (let index = 0; index < document.people.length; index += 1) {
      const person = document.people[index];
      if (typeof person.name === "string") {
        const merge_key = normalize_merge_key(person.name);
        const first_index = seen_names.get(merge_key);

        if (first_index !== undefined) {
          errors.push(`/people/${index}/name duplicates /people/${first_index}/name after merge-key normalization`);
        } else {
          seen_names.set(merge_key, index);
        }
      }

      if (person.image?.mode === "embedded" && typeof person.image.data === "string") {
        const decoded = Buffer.from(person.image.data, "base64");
        if (decoded.length === 0 || decoded.toString("base64") !== person.image.data) {
          errors.push(`/people/${index}/image/data is not canonical base64`);
        }
      }
    }
  }

  return errors;
}

/**
 * Builds a minimal valid import document, with shallow overrides for edge tests.
 */
function minimal_document(overrides = {}) {
  return {
    schema_version: "1.0",
    event: {
      name: "Generated Edge Case Event",
      ...(overrides.event ?? {}),
    },
    people: overrides.people ?? [
      {
        name: "Generated Person",
      },
    ],
  };
}

/**
 * Runs schema and supplemental semantic validation for one in-memory test case.
 */
function validate_document(validate, document) {
  const schema_ok = validate(document);
  const schema_errors = schema_ok ? [] : [...(validate.errors ?? [])];
  const semantic_errors = validate_semantics(document);

  return { schema_ok, schema_errors, semantic_errors };
}

/**
 * Requires generated edge cases to pass or fail without bloating fixture files.
 */
function validate_generated_cases(validate) {
  const max_people = Array.from({ length: 250 }, (_, index) => ({
    name: `Generated Person ${index + 1}`,
  }));
  const too_many_people = Array.from({ length: 251 }, (_, index) => ({
    name: `Generated Person ${index + 1}`,
  }));

  const cases = [
    {
      name: "max people count passes",
      should_pass: true,
      document: minimal_document({ people: max_people }),
    },
    {
      name: "too many people fails",
      should_pass: false,
      document: minimal_document({ people: too_many_people }),
    },
    {
      name: "maximum event and person field lengths pass",
      should_pass: true,
      document: minimal_document({
        event: {
          name: "E".repeat(120),
          source_id: "S".repeat(128),
          location: "L".repeat(160),
          description: "D".repeat(1000),
        },
        people: [
          {
            name: "P".repeat(120),
            source_id: "I".repeat(128),
            title: "T".repeat(120),
            company: "C".repeat(120),
            affiliation: "A".repeat(120),
            notes: "N".repeat(2000),
            connection_topic: "Q".repeat(500),
            tags: ["G".repeat(40)],
            links: {
              website: `https://example.com/${"w".repeat(2028)}`,
            },
          },
        ],
      }),
    },
    {
      name: "over maximum notes length fails",
      should_pass: false,
      document: minimal_document({
        people: [
          {
            name: "Generated Person",
            notes: "N".repeat(2001),
          },
        ],
      }),
    },
    {
      name: "zero-length source id fails",
      should_pass: false,
      document: minimal_document({
        event: {
          source_id: "",
        },
      }),
    },
  ];

  let failures = 0;

  for (const test_case of cases) {
    const result = validate_document(validate, test_case.document);
    const passed = result.schema_ok && result.semantic_errors.length === 0;

    if (passed !== test_case.should_pass) {
      failures += 1;
      console.error(`generated edge case failed: ${test_case.name}`);
      if (result.schema_errors.length > 0) {
        console.error(format_errors(result.schema_errors));
      }
      if (result.semantic_errors.length > 0) {
        console.error(result.semantic_errors.join("\n"));
      }
    }
  }

  return { checked: cases.length, failures };
}

/**
 * Requires every valid fixture to pass both schema and semantic validation.
 */
async function validate_valid_examples(validate) {
  const files = await list_json_files(valid_examples_dir);
  let failures = 0;

  for (const file of files) {
    const document = await read_json(file);
    const schema_ok = validate(document);
    const semantic_errors = validate_semantics(document);

    if (!schema_ok || semantic_errors.length > 0) {
      failures += 1;
      console.error(`valid fixture failed: ${relative_path(file)}`);
      if (!schema_ok) {
        console.error(format_errors(validate.errors));
      }
      if (semantic_errors.length > 0) {
        console.error(semantic_errors.join("\n"));
      }
    }
  }

  return { checked: files.length, failures };
}

/**
 * Requires every invalid fixture to fail either schema or semantic validation.
 */
async function validate_invalid_examples(validate) {
  const files = await list_json_files(invalid_examples_dir);
  let failures = 0;

  for (const file of files) {
    const document = await read_json(file);
    const schema_ok = validate(document);
    const semantic_errors = validate_semantics(document);

    if (schema_ok && semantic_errors.length === 0) {
      failures += 1;
      console.error(`invalid fixture unexpectedly passed: ${relative_path(file)}`);
    }
  }

  return { checked: files.length, failures };
}

/**
 * Runs schema, valid fixture, and invalid fixture validation.
 */
async function main() {
  const schema = await read_json(schema_path);
  const validate = create_validator(schema);
  const valid_result = await validate_valid_examples(validate);
  const invalid_result = await validate_invalid_examples(validate);
  const generated_result = validate_generated_cases(validate);
  const failures = valid_result.failures + invalid_result.failures + generated_result.failures;

  if (failures > 0) {
    console.error(`validation failed: ${failures} fixture check(s) failed`);
    process.exitCode = 1;
    return;
  }

  console.log(`schema ok: ${relative_path(schema_path)}`);
  console.log(`valid fixtures ok: ${valid_result.checked}`);
  console.log(`invalid fixtures rejected: ${invalid_result.checked}`);
  console.log(`generated edge cases ok: ${generated_result.checked}`);
}

await main();
