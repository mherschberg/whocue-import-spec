# WhoCue Import Spec

This repository is the public source of truth for the WhoCue import contract:
JSON Schema files, examples, and LLM-facing instructions for creating import
files that the WhoCue mobile app can validate and load.

## Current Contract Status

Schema v1 is represented by:

- `schema/whocue-import-v1.schema.json` - JSON Schema draft 2020-12 contract.
- `schema/README.md` - schema summary, limits, and rules enforced outside plain
  JSON Schema.
- `examples/valid/` - synthetic fixtures that must pass validation.
- `examples/invalid/` - synthetic fixtures that must fail validation.
- `instructions/human-authoring-guide.md` - guide for people writing or
  reviewing import files.
- `instructions/llm-generator-instructions.md` - prompt/instruction text for
  LLMs or other generators.

The v1 contract uses strict unknown-field rejection, required top-level
`schema_version`, `event`, and `people`, explicit image modes, bounded field and
record counts, and synthetic-only public examples.

## Repository Status

The intended public GitHub remote is:

```text
https://github.com/mherschberg/whocue-import-spec
```

Remote creation is pending. This workspace is currently in a mono-repo-for-now
topology, so this folder is scaffolded locally without nested Git metadata. When
the public repo is created or split, attach that remote to the standalone
`whocue-import-spec` checkout.

Suggested remote setup after creating the GitHub repository:

```bash
git remote add origin git@github.com:mherschberg/whocue-import-spec.git
git branch -M main
git push -u origin main
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
behavior, or mobile UI here; those belong to later app implementation STEPs.
