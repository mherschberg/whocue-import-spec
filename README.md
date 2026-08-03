# WhoCue Import Spec

This repository is the public source of truth for the WhoCue import contract:
JSON Schema files, examples, and LLM-facing instructions for creating import
files that the WhoCue mobile app can validate and load.

## Current Contract Status

Schema v1 is represented by:

- `PROTOCOL.md` - concise public protocol reference for LLMs and humans.
- `schema/whocue-import-v1.schema.json` - JSON Schema draft 2020-12 contract.
- `schema/README.md` - schema summary, limits, and rules enforced outside plain
  JSON Schema.
- `examples/valid/` - synthetic fixtures that must pass validation.
- `examples/invalid/` - synthetic fixtures that must fail validation.
- `examples/valid/realistic-demo.zip` - ready-to-import package form of the
  realistic demo, including synthetic local headshot image files.
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
validation groups surfaced by the WhoCue app.

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
   the phone through WhoCue's document picker.
7. Return JSON only when the user is ready for an import file.

The protocol is intentionally small: one event object plus 1-250 people. For
each selected person, prefer practical recognition and conversation details:
name, role, organization, why the user may want to meet them, and a concise
connection topic. Use `identity_uncertain: true` when the selected profile may
not identify the intended person. Do not include private notes or guessed
personal data.

## Quick Start For Handoff Export Processing

When a user gives an external LLM or human workflow a WhoCue event handoff
export, read `instructions/handoff-export-processing.md`. Handoff exports are
private user-controlled JSON documents whose root `format` is
`whocue_event_handoff`. They include latest local app state such as meeting
notes, app-updated status and priority, newly added people, and standard
followup ownership states.

Do not treat a handoff export as a WhoCue import file. If the user wants a fresh
WhoCue import file from exported state, create a separate v1 import JSON using
only the supported fields from `PROTOCOL.md` and validate it against the schema.

## Repository

Source and issues:

```text
https://github.com/mherschberg/whocue-import-spec
```

## Licensing

See [`LICENSE`](LICENSE) and [`LICENSING.md`](LICENSING.md). Copyright is held by
Cognosco Media LLC, which retains all rights and grants a limited permission to
use these files for generating, validating, or authoring WhoCue import files
(including by a large language model) for use with the WhoCue application; all
other rights are reserved. The `LICENSE` expressly permits this LLM use despite
the general AI-use restrictions in Cognosco Media's
[Terms](https://www.cognoscomedia.com/terms) and
[User Guidelines](https://www.cognoscomedia.com/user-guidelines), and requires
personal data in import files to be handled per the
[Privacy Policy](https://www.cognoscomedia.com/privacy).
`LICENSE-THROUGHSTONE` applies only to retained Throughstone-authored scaffold
material.

## Artifact Layout

```text
schema/         JSON Schema contract files, starting with whocue-import-v1.schema.json.
examples/       Synthetic valid and invalid fixture files.
instructions/   Human-facing and LLM-facing import and handoff instructions.
scripts/        Local validation tooling used by npm scripts and CI.
PROTOCOL.md     Concise public import file-format protocol.
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

The validation command compiles `schema/whocue-import-v1.schema.json`, enforces
JSON Schema `format` checks through AJV, requires every file under
`examples/valid/` to pass, and requires every file under `examples/invalid/` to
fail. It also performs supplemental semantic checks for duplicate person merge
keys within one import and canonical embedded-image base64, plus generated edge
cases for large count and length boundaries.

To run both local gates:

```bash
npm run check
```

## GitHub Actions

The workflow in `.github/workflows/ci.yml` runs the structural check, installs
the locked Node dependencies with `npm ci`, and runs `npm run validate`.

## Privacy And Example Data

All checked-in examples and docs must use synthetic people, organizations,
events, notes, image payloads, and URLs. Do not commit private attendee lists,
copied profile data, personal photos, private notes, production URLs, or raw
import files from real users.

## Scope Guard

This repository owns the public import contract artifacts only. Do not implement
WhoCue app-side parsing, local schema-copy consistency checks, SQLite merge
behavior, image processing, or mobile UI here; those belong in the private app
repo.
