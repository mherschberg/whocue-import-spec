# Instructions

This directory contains public instructions for creating WhoCue v1 import files.
Use these files with the schema and examples in this repository; normal import
authors should not need access to the private WhoCue architecture docs.

## Files

| File | Intended use |
|------|--------------|
| `human-authoring-guide.md` | Human-readable guide for writing or reviewing a v1 import JSON file. |
| `llm-generator-instructions.md` | Prompt/instruction text for an LLM or other generator that produces v1 import JSON. |

## Contract References

- Machine-readable schema: `../schema/whocue-import-v1.schema.json`
- Schema summary and limits: `../schema/README.md`
- Valid and invalid fixtures: `../examples/`
- Local validation command: `npm run validate`

## Privacy

Public examples, demos, tests, and prompt outputs should use synthetic data unless
the importing user supplies real data for their own local use. Do not add private
attendee lists, copied profile data, personal photos, private notes, or production
URLs to this repository.
