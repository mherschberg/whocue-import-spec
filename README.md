# WhoCue Import Spec

This repository is the public source of truth for the WhoCue import contract:
JSON Schema files, examples, and LLM-facing instructions for creating import
files that the WhoCue mobile app can validate and load.

## Current Scaffold Status

This is a skeleton created during STEP-2. Schema v1, valid and invalid fixture
files, numeric limits, image-mode decisions, and final prompt instructions are
intentionally planned for STEP-3. Until STEP-3 lands, this repository defines the
artifact layout and baseline checks only.

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
schema/        JSON Schema contract files, starting with v1 in STEP-3.
examples/      Synthetic valid and invalid fixture files, starting in STEP-3.
instructions/  LLM-facing and human-facing import instructions, starting in STEP-3.
```

The placeholder README files in those directories exist so the structure is
clear before the contract artifacts are authored.

## Local Checks

Run the same structural check used by CI:

```bash
bash .github/scripts/check-structure.sh
```

This check only verifies the skeleton shape. It does not validate schema or
examples yet because those artifacts do not exist until STEP-3.

## GitHub Actions

The baseline workflow in `.github/workflows/ci.yml` runs the structural check
without network access. After STEP-3 adds schema and fixtures, extend CI to
validate the JSON Schema and all valid and invalid examples.

## Scope Guard

Do not add real import schema semantics, production fixtures, numeric limits, or
image-mode rules in this scaffold step. Those decisions belong to STEP-3.
