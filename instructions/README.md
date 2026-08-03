# Instructions

This directory contains public instructions for creating WhoCue v1 import files.
Use these files with the schema and examples in this repository; they are
self-contained and require no additional documentation.

## Files

| File | Intended use |
|------|--------------|
| `generation-workflow.md` | End-to-end external generation workflow, reusable LLM prompt template, final checklist, validation, and phone transfer guidance. |
| `handoff-export-processing.md` | Instructions for external LLMs, humans, or user-controlled systems processing WhoCue event handoff exports after app updates. |
| `human-authoring-guide.md` | Human-readable guide for writing or reviewing a v1 import JSON file. |
| `llm-generator-instructions.md` | Prompt/instruction text for an LLM or other generator that produces v1 import JSON. |
| `people-selection-guide.md` | Guidance for an LLM that must find and rank event-relevant people before producing JSON. |

## Suggested Order

1. Start with `generation-workflow.md` for the full process.
2. Use `people-selection-guide.md` while researching or narrowing candidates.
3. Use `llm-generator-instructions.md` when producing final JSON.
4. Use `human-authoring-guide.md` to review and repair a file by hand.
5. Use `handoff-export-processing.md` when a user exports updated WhoCue event
   state for external follow-up processing.

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
