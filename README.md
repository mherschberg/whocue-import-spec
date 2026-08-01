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

## Repository Status

The GitHub remote is:

```text
https://github.com/mherschberg/whocue-import-spec
```

The repository has been split into a standalone Git repository at
`Code/whocue-import-spec/` and pushed to GitHub. It is intentionally private
until launch. When the owner is ready for public LLM/user access, change the
GitHub repository visibility to public.

Current remote setup:

```bash
git remote -v
origin  https://github.com/mherschberg/whocue-import-spec.git (fetch)
origin  https://github.com/mherschberg/whocue-import-spec.git (push)
```

## Architecture Pointers

The private WhoCue docs hub governs the implementation decisions behind this
public contract. Relevant private paths are:

- `Code/whocue-docs/architecture/08-infrastructure-deployment.md`
- `Code/whocue-docs/architecture/09-environments.md`
- `Code/whocue-docs/architecture/11-interface-contracts.md`
- `Code/whocue-docs/architecture/12-test-strategy.md`
- `Code/whocue-docs/adr/ADR-0002-use-public-json-schema-import-spec-repo.md`

This public repo should remain useful without access to those private files.
They are listed for maintainers and future agents working inside the full
WhoCue workspace.

## Licensing

See [`LICENSING.md`](LICENSING.md). No project `LICENSE` is present because the
current project-license posture is proprietary. `LICENSE-THROUGHSTONE` applies
only to retained Throughstone-authored scaffold material.

## Artifact Layout

```text
schema/         JSON Schema contract files, starting with whocue-import-v1.schema.json.
examples/       Synthetic valid and invalid fixture files.
instructions/   Human-facing and LLM-facing import instructions.
scripts/        Local validation tooling used by npm scripts and CI.
PROTOCOL.md     Concise public file-format protocol.
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
