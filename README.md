# WhoCue Import Spec

This repository is the public source of truth for the WhoCue file contracts:
JSON Schema files, examples, and LLM-facing instructions for creating import
files that the WhoCue mobile app can validate and load, and for processing the
event handoff exports the app produces.

## Current Contract Status

The repository publishes **two** contracts. They are separate and point in
opposite directions:

| Contract | Schema | Direction |
|----------|--------|-----------|
| Import v1 | `schema/whocue-import-v1.schema.json` | Into the app: one event-scoped people list. |
| Event handoff export v1 | `schema/whocue-handoff-v1.schema.json` | Out of the app: one event's current local state. |

A handoff export is **not** a WhoCue import file, and import schema v1 does not
accept one. Publishing a schema for the handoff format does not change that.
The WhoCue app can still re-import an unmodified handoff export it produced, by
reading only its `import_compatible_snapshot` as strict import v1 — an app-side
convenience, not part of either contract (see `PROTOCOL.md`).

### Import v1

Schema v1 is represented by:

- `PROTOCOL.md` - concise public protocol reference for LLMs and humans.
- `schema/whocue-import-v1.schema.json` - JSON Schema draft 2020-12 contract.
- `schema/README.md` - schema summary, limits, and rules enforced outside plain
  JSON Schema.
- `examples/valid/` - synthetic fixtures that must pass validation.
- `examples/invalid/` - synthetic fixtures that must fail validation.
- `examples/valid/realistic-demo.zip`, `realistic-demo-2.zip`, and
  `realistic-demo-3.zip` - ready-to-import package forms of the three realistic
  demo events (3, 6, and 10 people), including synthetic local headshot image
  files.
- `instructions/human-authoring-guide.md` - guide for people writing or
  reviewing import files.
- `instructions/generation-workflow.md` - end-to-end workflow and reusable
  prompt/checklist for external generation.
- `instructions/handoff-export-processing.md` - guidance for external LLMs,
  humans, and user-controlled systems processing updated WhoCue handoff exports.
- `instructions/llm-generator-instructions.md` - prompt/instruction text for
  LLMs or other generators.
- `instructions/people-selection-guide.md` - public guidance for LLMs that need
  to find relevant people for an event before generating the import file.

The v1 contract uses strict unknown-field rejection, required top-level
`schema_version`, `event`, and `people`, explicit image modes, bounded field and
record counts, and synthetic-only public examples. `PROTOCOL.md`, the human
guide, LLM instructions, and examples README now describe how to repair the
validation groups surfaced by the WhoCue app. `PROTOCOL.md` also says what a
re-import into an existing event changes and what it keeps, such as the
people the user marked met and the priorities they set.

### Event Handoff Export v1

The handoff export format is represented by:

- `schema/whocue-handoff-v1.schema.json` - JSON Schema draft 2020-12 contract
  for the `whocue_event_handoff` document.
- `schema/README.md` - envelope reference, limits, the strictness decision, and
  why the schema restates the import field set instead of referencing it.
- `examples/handoff/valid/` - synthetic exports that must pass validation.
- `examples/handoff/invalid/` - synthetic exports that must fail validation.
- `instructions/handoff-export-processing.md` - guidance for external LLMs,
  humans, and user-controlled systems processing a handoff export.

The envelope rejects unknown root sections and unknown fields inside
`import_compatible_snapshot`, while `who_cue_state` stays permissive so a new
app-local field does not break external validators mid-version. The snapshot is
import-*shaped*, not import-*valid*: it carries app-local values bounded by the
app's looser limits. `schema/README.md` has the full comparison.

## Quick Start For LLMs

When a user asks an LLM to create a WhoCue file for an event:

1. Read `instructions/generation-workflow.md` for the end-to-end sequence from
   source gathering to phone import.
2. Read `instructions/people-selection-guide.md` to decide who belongs in the
   user's event-day list and what evidence is relevant.
3. Read `PROTOCOL.md` for the concise public file-format protocol.
4. Read `instructions/llm-generator-instructions.md` to produce the final JSON
   shape.
5. Use `schema/whocue-import-v1.schema.json` as the machine-readable protocol
   and choose the closest output model: `examples/valid/minimal.json`,
   `examples/valid/realistic-demo.json`,
   `examples/valid/llm-researched-shortlist.json`,
   `examples/valid/manual-sparse-shortlist.json`, or
   `examples/valid/image-package-shortlist.json`.
6. If the user is generating the file on a laptop or desktop, suggest saving
   the `.json` file, or image-heavy `.zip` package, into a synced folder such
   as Google Drive, OneDrive, Dropbox, or iCloud Drive, then importing it from
   the phone through WhoCue's document picker. If the user is chatting with you
   on the phone itself, they can instead copy the JSON (a single fenced
   ```` ```json ```` block is fine) and tap **Paste JSON** on WhoCue's Events
   tab — no file needed.
7. Return JSON only when the user is ready for an import file.

The protocol is intentionally small: one event object plus 1-250 people. For
each selected person, prefer practical recognition and conversation details:
name, role, organization, why the user may want to meet them, and a concise
connection topic. Use `identity_uncertain: true` when the selected profile may
not identify the intended person. Do not include private notes or guessed
personal data.

## Quick Start For Handoff Export Processing

When a user gives an external LLM or human workflow a WhoCue event handoff
export:

1. Read `instructions/handoff-export-processing.md` for the processing rules and
   a reusable prompt.
2. Validate the document against `schema/whocue-handoff-v1.schema.json` before
   acting on it, and read `schema/README.md` for the envelope reference.
3. Use `examples/handoff/valid/` as the model for what a real export looks like.

Handoff exports are private user-controlled JSON documents whose root `format`
is `whocue_event_handoff`. They include latest local app state such as meeting
notes, app-updated status and priority, newly added people, and standard
followup ownership states.

Do not treat a handoff export as a WhoCue import file. If the user wants a fresh
WhoCue import file from exported state, create a separate v1 import JSON using
only the supported fields from `PROTOCOL.md` and validate it against the import
schema. The snapshot inside a handoff export is a useful starting point, not a
drop-in import file: it may carry values that exceed import v1's limits. The
one exception is the WhoCue app itself, which re-imports an unmodified export
it produced when that snapshot fits import v1; see
`instructions/handoff-export-processing.md`.

## Repository

Source and issues:

```text
https://github.com/mherschberg/whocue-import-spec
```

## Licensing

See [`LICENSE`](LICENSE) and [`LICENSING.md`](LICENSING.md). Copyright is held by
Cognosco Media LLC, which retains all rights and grants a limited permission to
use these files -- and to download and adapt a personal copy -- for generating,
validating, or authoring WhoCue import files (including by a large language
model) for use with the WhoCue application; all other rights (including
publishing, distributing, or otherwise sharing the files or an adapted copy) are
reserved. The `LICENSE` expressly permits this LLM use despite
the general AI-use restrictions in Cognosco Media's
[Terms](https://www.cognoscomedia.com/terms) and
[User Guidelines](https://www.cognoscomedia.com/user-guidelines), and requires
personal data in import files to be handled per the
[Privacy Policy](https://www.cognoscomedia.com/privacy).
`LICENSE-THROUGHSTONE` applies only to retained Throughstone-authored scaffold
material.

## Artifact Layout

```text
schema/          JSON Schema contract files: whocue-import-v1 and whocue-handoff-v1.
examples/        Synthetic valid and invalid import fixture files.
examples/handoff/ Synthetic valid and invalid handoff export fixture files.
instructions/    Human-facing and LLM-facing import and handoff instructions.
scripts/         Local validation and packaging tooling used by npm scripts and CI.
packaging/       Sources for packages built from this repo, such as the testers' ZIP.
PROTOCOL.md      Concise public import file-format protocol.
```

Key v1 choices are documented in the directory README files. The schema is the
machine-readable source of truth; Markdown explains authoring rules, validation
workflow, and importer-level constraints that JSON Schema does not express
portably.

## Local Checks

Install the locked validator dependencies:

```bash
npm ci
```

Run the same structural check used by CI:

```bash
bash .github/scripts/check-structure.sh
```

Validate the schema and fixture corpus:

```bash
npm run validate
```

The validation command runs both contracts through one generalized path. For
each contract it compiles the schema, enforces JSON Schema `format` checks
through AJV, requires every valid fixture to pass, requires every invalid
fixture to fail, and runs generated edge cases for count and length boundaries
that would bloat the corpus as files.

Supplemental semantic checks cover what JSON Schema cannot express: duplicate
person merge keys and canonical embedded-image base64 for imports; summary
counts, cross-section agreement, and unique local IDs for handoff exports.

Two cross-contract checks then run:

- The handoff schema's `import_compatible_snapshot` must still mirror import
  v1's field names, required fields, enums, and shared definitions. This is what
  keeps the restated subset from drifting.
- Every published handoff fixture's snapshot must validate as a real import v1
  document, unless its people count falls outside import v1's 1-250 bound.

To run both local gates:

```bash
npm run check
```

Build the testers' package, an email-friendly ZIP of the directions, both
schemas, and a few synthetic examples, at
`dist/whocue-import-instructions-for-testers.zip`:

```bash
npm run package:testers
```

Its top-level README is `packaging/testers/README.md`; every other file is
copied unchanged from the repo, and the build fails if a packaged document
names a file the package doesn't carry. Rebuild it after changing any packaged
file before sending it to testers.

## GitHub Actions

The workflow in `.github/workflows/ci.yml` runs the structural check, installs
the locked Node dependencies with `npm ci`, runs `npm run validate`, and builds
the testers' package to prove it still has no dangling references.

## Privacy And Example Data

All checked-in examples and docs must use synthetic people, organizations,
events, notes, image payloads, and URLs. Do not commit private attendee lists,
copied profile data, personal photos, private notes, production URLs, or raw
import files from real users.

## Scope Guard

This repository owns the public contract artifacts only — the import v1 and
event handoff export v1 schemas, their examples, and their instructions. Do not
implement WhoCue app-side parsing (including the app's handoff unwrap), local schema-copy consistency checks, SQLite merge
behavior, image processing, or mobile UI here; those belong in the private app
repo.
