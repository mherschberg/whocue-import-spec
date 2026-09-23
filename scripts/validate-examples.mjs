import { Buffer } from "node:buffer";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const script_dir = path.dirname(fileURLToPath(import.meta.url));
const repo_root = path.resolve(script_dir, "..");
const import_schema_path = path.join(repo_root, "schema", "whocue-import-v1.schema.json");
const handoff_schema_path = path.join(repo_root, "schema", "whocue-handoff-v1.schema.json");

/**
 * Standard followup actions carried by every handoff person record.
 */
const followup_actions = [
  "email",
  "call",
  "schedule_meeting",
  "send_documents",
  "introduce",
  "resume",
];

/**
 * Import v1 person fields the handoff generator deliberately never emits.
 *
 * The handoff snapshot restates the import field set rather than `$ref`-ing it
 * (see `schema/README.md`), so these omissions are declared here instead of
 * being invisible. Adding either field to the generator means adding it to the
 * handoff schema and removing it from this list.
 */
const snapshot_omitted_person_fields = ["affiliation", "image"];

/**
 * Snapshot person fields required by the handoff generator but optional in
 * import v1, because the generator always emits them.
 */
const snapshot_extra_required_person_fields = ["status"];

/**
 * `$defs` the handoff schema restates verbatim from the import schema. These
 * must stay byte-identical; anything that legitimately diverges belongs in the
 * limits table in `schema/README.md`, not here.
 */
const shared_defs = ["https_url", "person_links"];

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
function create_validator(schema, schema_path) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: true,
  });
  addFormats(ajv);

  if (!ajv.validateSchema(schema)) {
    throw new Error(`${relative_path(schema_path)} is not a valid JSON Schema:\n${format_errors(ajv.errors)}`);
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
 * Performs import contract checks that are intentionally outside portable JSON Schema.
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
 * Counts followup actions in one handoff state person that carry [state].
 */
function count_followups(person, state) {
  const followups = person?.followups;
  if (followups === null || typeof followups !== "object") {
    return 0;
  }
  return followup_actions.filter((action) => followups[action] === state).length;
}

/**
 * Performs handoff contract checks that plain JSON Schema cannot express:
 * internal consistency between the summary counts, the import-shaped snapshot,
 * and the app-state section that the generator derives from one sorted list.
 */
function validate_handoff_semantics(document) {
  const errors = [];
  const summary = document.summary;
  const snapshot = document.import_compatible_snapshot;
  const state = document.who_cue_state;
  const snapshot_people = Array.isArray(snapshot?.people) ? snapshot.people : null;
  const state_people = Array.isArray(state?.people) ? state.people : null;

  if (snapshot_people === null || state_people === null || summary === null || typeof summary !== "object") {
    // Structural problems are the schema's job; skip the cross-section checks.
    return errors;
  }

  if (snapshot_people.length !== state_people.length) {
    errors.push(
      `/who_cue_state/people has ${state_people.length} record(s) but /import_compatible_snapshot/people has ${snapshot_people.length}`,
    );
  } else {
    for (let index = 0; index < snapshot_people.length; index += 1) {
      if (snapshot_people[index]?.name !== state_people[index]?.name) {
        errors.push(`/who_cue_state/people/${index}/name does not match /import_compatible_snapshot/people/${index}/name`);
      }
    }
  }

  const event_names = new Set([summary.event_name, snapshot?.event?.name, state?.event?.name]);
  if (event_names.size !== 1) {
    errors.push("/summary/event_name, /import_compatible_snapshot/event/name, and /who_cue_state/event/name disagree");
  }

  const expected = {
    people_count: state_people.length,
    met_count: state_people.filter((person) => person?.status === "met").length,
    not_met_count: state_people.filter((person) => person?.status === "not_met").length,
    followup_me_count: state_people.reduce((total, person) => total + count_followups(person, "me"), 0),
    followup_other_count: state_people.reduce((total, person) => total + count_followups(person, "other"), 0),
  };

  for (const [field, value] of Object.entries(expected)) {
    if (summary[field] !== value) {
      errors.push(`/summary/${field} is ${summary[field]} but the exported records give ${value}`);
    }
  }

  const seen_local_ids = new Map();
  for (let index = 0; index < state_people.length; index += 1) {
    const local_id = state_people[index]?.local_id;
    if (typeof local_id !== "string") {
      continue;
    }
    const first_index = seen_local_ids.get(local_id);
    if (first_index !== undefined) {
      errors.push(`/who_cue_state/people/${index}/local_id duplicates /who_cue_state/people/${first_index}/local_id`);
    } else {
      seen_local_ids.set(local_id, index);
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
 * Builds one generated handoff person pair (snapshot record plus state record).
 */
function generated_handoff_person(index) {
  const name = `Generated Person ${index + 1}`;
  return {
    snapshot: { name, status: "not_met" },
    state: {
      local_id: `generated-local-id-${index + 1}`,
      name,
      status: "not_met",
      identity_uncertain: false,
      followups: Object.fromEntries(followup_actions.map((action) => [action, "off"])),
      created_at: "2026-09-19T02:00:00.000Z",
      updated_at: "2026-09-19T02:00:00.000Z",
    },
  };
}

/**
 * Builds a minimal valid handoff document with [people_count] generated people,
 * then applies shallow overrides for edge tests.
 */
function minimal_handoff_document(people_count = 1, overrides = {}) {
  const people = Array.from({ length: people_count }, (_, index) => generated_handoff_person(index));

  return {
    format: "whocue_event_handoff",
    format_version: "1.0",
    generated_at: "2026-09-19T02:00:00.000Z",
    purpose: "External handoff of current WhoCue event state for user-controlled follow-up processing.",
    not_a_whocue_import_file: true,
    suggested_file_name: "whocue-generated-edge-case-handoff-2026-09-19T02-00-00.000Z.json",
    instructions: {
      privacy: "Generated edge-case privacy note.",
      use: "Generated edge-case use note.",
      import_note: "Generated edge-case import note.",
    },
    summary: {
      event_name: "Generated Edge Case Event",
      people_count,
      met_count: 0,
      not_met_count: people_count,
      followup_me_count: 0,
      followup_other_count: 0,
    },
    import_compatible_snapshot: {
      schema_version: "1.0",
      event: { name: "Generated Edge Case Event" },
      people: people.map((person) => person.snapshot),
    },
    who_cue_state: {
      event: {
        local_id: "generated-event-local-id",
        name: "Generated Edge Case Event",
        created_at: "2026-09-19T02:00:00.000Z",
        updated_at: "2026-09-19T02:00:00.000Z",
      },
      people: people.map((person) => person.state),
    },
    ...overrides,
  };
}

/**
 * Runs schema and supplemental semantic validation for one in-memory test case.
 */
function validate_document(contract, validate, document) {
  const schema_ok = validate(document);
  const schema_errors = schema_ok ? [] : [...(validate.errors ?? [])];
  const semantic_errors = contract.validate_semantics(document);

  return { schema_ok, schema_errors, semantic_errors };
}

/**
 * Import edge cases that must pass or fail without bloating fixture files.
 */
function import_generated_cases() {
  const max_people = Array.from({ length: 250 }, (_, index) => ({
    name: `Generated Person ${index + 1}`,
  }));
  const too_many_people = Array.from({ length: 251 }, (_, index) => ({
    name: `Generated Person ${index + 1}`,
  }));

  return [
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
}

/**
 * Handoff edge cases covering mechanical boundaries and the Q1 strictness
 * decision, without committing large or near-duplicate fixture files.
 */
function handoff_generated_cases() {
  const permissive_state = minimal_handoff_document();
  permissive_state.who_cue_state.people[0].app_only_future_field = "allowed";

  const strict_envelope = minimal_handoff_document();
  strict_envelope.future_section = { note: "rejected" };

  const strict_snapshot = minimal_handoff_document();
  strict_snapshot.import_compatible_snapshot.people[0].confidence = "high";

  const miscounted_summary = minimal_handoff_document(2);
  miscounted_summary.summary.met_count = 1;

  const app_domain_lengths = minimal_handoff_document();
  app_domain_lengths.summary.event_name = "E".repeat(200);
  app_domain_lengths.import_compatible_snapshot.event.name = "E".repeat(200);
  app_domain_lengths.who_cue_state.event.name = "E".repeat(200);
  app_domain_lengths.import_compatible_snapshot.people[0].notes = "N".repeat(4000);
  app_domain_lengths.import_compatible_snapshot.people[0].tags = ["G".repeat(80)];
  app_domain_lengths.who_cue_state.people[0].notes = "N".repeat(4000);
  app_domain_lengths.who_cue_state.people[0].meeting_notes = "M".repeat(4000);

  const over_app_domain_length = minimal_handoff_document();
  over_app_domain_length.who_cue_state.people[0].meeting_notes = "M".repeat(4001);

  return [
    {
      name: "250-person export passes",
      should_pass: true,
      document: minimal_handoff_document(250),
    },
    {
      name: "over-250-person export still passes because the app caps import, not events",
      should_pass: true,
      document: minimal_handoff_document(251),
    },
    {
      name: "zero-person export passes",
      should_pass: true,
      document: minimal_handoff_document(0),
    },
    {
      name: "app-domain maximum lengths pass",
      should_pass: true,
      document: app_domain_lengths,
    },
    {
      name: "over app-domain meeting notes length fails",
      should_pass: false,
      document: over_app_domain_length,
    },
    {
      name: "unknown member inside who_cue_state passes",
      should_pass: true,
      document: permissive_state,
    },
    {
      name: "unknown envelope section fails",
      should_pass: false,
      document: strict_envelope,
    },
    {
      name: "unknown field inside import_compatible_snapshot fails",
      should_pass: false,
      document: strict_snapshot,
    },
    {
      name: "summary counts that disagree with the records fail",
      should_pass: false,
      document: miscounted_summary,
    },
  ];
}

/**
 * Requires generated edge cases to pass or fail as declared.
 */
function validate_generated_cases(contract, validate) {
  const cases = contract.generated_cases();
  let failures = 0;

  for (const test_case of cases) {
    const result = validate_document(contract, validate, test_case.document);
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
async function validate_valid_examples(contract, validate) {
  const files = await list_json_files(contract.valid_dir);
  let failures = 0;
  const documents = [];

  for (const file of files) {
    const document = await read_json(file);
    documents.push({ file, document });
    const schema_ok = validate(document);
    const semantic_errors = contract.validate_semantics(document);

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

  return { checked: files.length, failures, documents };
}

/**
 * Requires every invalid fixture to fail either schema or semantic validation.
 */
async function validate_invalid_examples(contract, validate) {
  const files = await list_json_files(contract.invalid_dir);
  let failures = 0;

  for (const file of files) {
    const document = await read_json(file);
    const schema_ok = validate(document);
    const semantic_errors = contract.validate_semantics(document);

    if (schema_ok && semantic_errors.length === 0) {
      failures += 1;
      console.error(`invalid fixture unexpectedly passed: ${relative_path(file)}`);
    }
  }

  return { checked: files.length, failures };
}

/**
 * Compares two key sets and reports what the first has that the second lacks.
 */
function missing_from(expected, actual) {
  return expected.filter((key) => !actual.includes(key));
}

/**
 * Proves the restated `import_compatible_snapshot` still mirrors import v1's
 * field set, required fields, enums, and shared `$defs`.
 *
 * The handoff schema deliberately restates the import subset instead of
 * `$ref`-ing it, so nothing keeps the two files in lockstep on its own. This
 * check is that mechanism: it compares shape, not value limits, because the
 * snapshot carries app-local values bounded by the app's looser limits
 * (`schema/README.md`).
 */
function check_snapshot_mirrors_import(handoff_schema, import_schema) {
  const errors = [];
  const handoff_defs = handoff_schema.$defs;
  const import_defs = import_schema.$defs;
  const snapshot = handoff_defs.import_compatible_snapshot;

  /** Reports both directions of a key-set difference under one label. */
  const compare_keys = (label, expected, actual, allowed_missing = []) => {
    const absent = missing_from(expected, [...actual, ...allowed_missing]);
    const extra = missing_from(actual, expected);
    if (absent.length > 0) {
      errors.push(`${label} is missing import v1 field(s): ${absent.join(", ")}`);
    }
    if (extra.length > 0) {
      errors.push(`${label} declares field(s) import v1 does not have: ${extra.join(", ")}`);
    }
  };

  compare_keys(
    "$defs.import_compatible_snapshot.properties",
    Object.keys(import_schema.properties),
    Object.keys(snapshot.properties),
  );
  compare_keys(
    "$defs.import_compatible_snapshot.required",
    import_schema.required,
    snapshot.required,
  );
  compare_keys(
    "$defs.snapshot_event.properties",
    Object.keys(import_defs.event.properties),
    Object.keys(handoff_defs.snapshot_event.properties),
  );
  compare_keys(
    "$defs.snapshot_event.required",
    import_defs.event.required,
    handoff_defs.snapshot_event.required,
  );
  compare_keys(
    "$defs.snapshot_person.properties",
    Object.keys(import_defs.person.properties),
    Object.keys(handoff_defs.snapshot_person.properties),
    snapshot_omitted_person_fields,
  );
  compare_keys(
    "$defs.snapshot_person.required",
    [...import_defs.person.required, ...snapshot_extra_required_person_fields],
    handoff_defs.snapshot_person.required,
  );

  for (const field of ["priority", "status"]) {
    const import_enum = import_defs.person.properties[field].enum;
    const handoff_enum = handoff_defs[field].enum;
    if (JSON.stringify(import_enum) !== JSON.stringify(handoff_enum)) {
      errors.push(`$defs.${field}.enum does not match import v1 person.${field}.enum`);
    }
  }

  for (const name of shared_defs) {
    if (JSON.stringify(import_defs[name]) !== JSON.stringify(handoff_defs[name])) {
      errors.push(`$defs.${name} is no longer identical to the import v1 definition`);
    }
  }

  if (!snapshot.properties.people.items.$ref.endsWith("snapshot_person")) {
    errors.push("$defs.import_compatible_snapshot.properties.people.items no longer references snapshot_person");
  }

  if (errors.length > 0) {
    console.error("handoff snapshot no longer mirrors import v1:");
    console.error(errors.join("\n"));
  }

  return { checked: errors.length === 0 ? 1 : 0, failures: errors.length > 0 ? 1 : 0 };
}

/**
 * Requires each published handoff fixture whose snapshot fits import v1's
 * people bounds to carry a snapshot that really is a valid import v1 document.
 *
 * Snapshots outside 1-250 people are reported as skipped rather than failed:
 * the app caps imports at 250 people but does not cap an event, so those are
 * real generator output that is legitimately not importable as-is.
 */
function check_snapshots_import_cleanly(documents, validate_import) {
  let checked = 0;
  let skipped = 0;
  let failures = 0;

  for (const { file, document } of documents) {
    const snapshot = document.import_compatible_snapshot;
    const people = Array.isArray(snapshot?.people) ? snapshot.people : null;
    if (people === null) {
      continue;
    }
    if (people.length < 1 || people.length > 250) {
      skipped += 1;
      continue;
    }

    checked += 1;
    if (!validate_import(snapshot) || validate_semantics(snapshot).length > 0) {
      failures += 1;
      console.error(`handoff snapshot is not a valid import v1 document: ${relative_path(file)}`);
      console.error(format_errors(validate_import.errors));
    }
  }

  return { checked, skipped, failures };
}

/**
 * Validates one contract's schema, fixture corpus, and generated edge cases.
 */
async function validate_contract(contract) {
  const schema = await read_json(contract.schema_path);
  const validate = create_validator(schema, contract.schema_path);
  const valid_result = await validate_valid_examples(contract, validate);
  const invalid_result = await validate_invalid_examples(contract, validate);
  const generated_result = validate_generated_cases(contract, validate);

  return {
    schema,
    validate,
    failures: valid_result.failures + invalid_result.failures + generated_result.failures,
    lines: [
      `schema ok: ${relative_path(contract.schema_path)}`,
      `valid fixtures ok: ${valid_result.checked}`,
      `invalid fixtures rejected: ${invalid_result.checked}`,
      `generated edge cases ok: ${generated_result.checked}`,
    ],
    documents: valid_result.documents,
  };
}

/**
 * Validates every published contract plus the cross-contract drift checks.
 */
async function main() {
  const contracts = [
    {
      name: "import v1",
      schema_path: import_schema_path,
      valid_dir: path.join(repo_root, "examples", "valid"),
      invalid_dir: path.join(repo_root, "examples", "invalid"),
      validate_semantics,
      generated_cases: import_generated_cases,
    },
    {
      name: "handoff v1",
      schema_path: handoff_schema_path,
      valid_dir: path.join(repo_root, "examples", "handoff", "valid"),
      invalid_dir: path.join(repo_root, "examples", "handoff", "invalid"),
      validate_semantics: validate_handoff_semantics,
      generated_cases: handoff_generated_cases,
    },
  ];

  const results = new Map();
  let failures = 0;

  for (const contract of contracts) {
    const result = await validate_contract(contract);
    results.set(contract.name, result);
    failures += result.failures;
  }

  const import_result = results.get("import v1");
  const handoff_result = results.get("handoff v1");
  const mirror_result = check_snapshot_mirrors_import(handoff_result.schema, import_result.schema);
  const snapshot_result = check_snapshots_import_cleanly(handoff_result.documents, import_result.validate);
  failures += mirror_result.failures + snapshot_result.failures;

  if (failures > 0) {
    console.error(`validation failed: ${failures} fixture check(s) failed`);
    process.exitCode = 1;
    return;
  }

  for (const contract of contracts) {
    for (const line of results.get(contract.name).lines) {
      console.log(line);
    }
  }
  console.log("handoff snapshot mirrors import v1 field set: ok");
  console.log(
    `handoff snapshots validated as import v1: ${snapshot_result.checked} (${snapshot_result.skipped} outside the import people bounds)`,
  );
}

await main();
