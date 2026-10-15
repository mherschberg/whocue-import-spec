# Instructions

This directory contains public instructions for creating WhoCue v1 import files,
writing Event Prep Briefs, and processing the event handoff exports the app produces. Use these files
with the schemas and examples in this repository; they are self-contained and
require no additional documentation.

## Files

| File | Intended use |
|------|--------------|
| `generation-workflow.md` | End-to-end external generation workflow, reusable LLM prompt template, final checklist, validation, and phone transfer guidance. |
| `event-prep-v1.0.0.md` | Version-pinned full instructions referenced by WhoCue Event Prep prompt 1.0.0. |
| `event-prep-brief-guide.md` | Guidance and examples for locally saved Event Prep Briefs and advanced custom instructions. |
| `handoff-export-processing.md` | Instructions for external LLMs, humans, or user-controlled systems processing WhoCue event handoff exports after app updates. |
| `human-authoring-guide.md` | Human-readable guide for writing or reviewing a v1 import JSON file. |
| `llm-generator-instructions.md` | Prompt/instruction text for an LLM or other generator that produces v1 import JSON. |
| `people-selection-guide.md` | Guidance for an LLM that must find and rank event-relevant people before producing JSON. |

## Suggested Order

1. When WhoCue supplies an Event Prep prompt, start with its pinned
   `event-prep-v<version>.md` instruction URL.
2. Use `event-prep-brief-guide.md` to write or improve the user's targeting context.
3. Otherwise start with `generation-workflow.md` for the full process.
4. Use `people-selection-guide.md` while researching or narrowing candidates.
5. Use `llm-generator-instructions.md` when producing final JSON.
6. Use `human-authoring-guide.md` to review and repair a file by hand.
7. Use `handoff-export-processing.md` when a user exports updated WhoCue event
   state for external follow-up processing.

## Contract References

- Machine-readable import schema: `../schema/whocue-import-v1.schema.json`
- Machine-readable handoff export schema:
  `../schema/whocue-handoff-v1.schema.json`
- Machine-readable Event Prep prompt catalog schema:
  `../schema/whocue-event-prep-prompt-catalog-v1.schema.json`
- Event Prep prompt catalog: `../prompts/event-prep-prompt-catalog-v1.json`
- Schema summaries, limits, and the two contracts' relationship:
  `../schema/README.md`
- Valid and invalid import fixtures: `../examples/`
- Valid and invalid handoff export fixtures: [examples/handoff](https://github.com/mherschberg/whocue-import-spec/tree/main/examples/handoff)
  in the import-spec repository
- Local validation command: `npm run validate`

A handoff export is not a WhoCue import file. The two contracts are separate,
and `handoff-export-processing.md` explains how to move from one to the other.

## Using And Adapting These Files

You may download a copy of these instructions to your computer or phone and
adapt them for your own use in creating WhoCue import files or processing WhoCue
handoff exports -- for example, tailoring the reusable prompt to a specific
event. Keep changes to your own copy; publishing, distributing, or otherwise
sharing the files or an adapted copy is not permitted. See the repository
[`LICENSE`](../LICENSE) for the full terms.

## Privacy

Public examples, demos, tests, and prompt outputs should use synthetic data unless
the importing user supplies real data for their own local use. Do not add private
attendee lists, copied profile data, personal photos, private notes, or production
URLs to this repository.
