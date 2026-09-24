# WhoCue Handoff Export Processing

Use this guide when a user gives an external LLM, human assistant, CRM helper,
or other user-controlled workflow a WhoCue event handoff export. A handoff
export carries the latest local app state after an event, including app edits
that may not exist in the original import file.

WhoCue handoff exports are private user-provided data. Treat them as sensitive
local context and do not upload, store, forward, or act on them beyond the
user's explicit request.

The export can reach you as an attached `.json` file (sent from the app's
**Share** action or saved with **Export file**) or as pasted JSON text (**Copy
JSON**). The document is identical either way.

## The Machine-Readable Contract

The handoff format has a published JSON Schema:
`../schema/whocue-handoff-v1.schema.json` (draft 2020-12). Validate a document
against it before acting on the contents. `../schema/README.md`, section
"Handoff Export v1", is the field-by-field reference, and
`../examples/handoff/valid/` shows what real exports look like.

This guide is the prose companion to that schema. Where the two disagree, the
schema wins, because the schema is derived from the app's generator.

## Import Files vs Handoff Exports

WhoCue has two different JSON shapes:

| Shape | Purpose | How to recognize it |
|-------|---------|---------------------|
| Import file | Bring a focused event people list into WhoCue | Root fields are `schema_version`, `event`, and `people`; validated by `../schema/whocue-import-v1.schema.json` |
| Handoff export | Take current WhoCue app state out for external follow-up processing | Root field `format` is `whocue_event_handoff` and `not_a_whocue_import_file` is `true`; includes `import_compatible_snapshot` and `who_cue_state`; validated by `../schema/whocue-handoff-v1.schema.json`; not accepted by the WhoCue import schema |

A handoff export is not a WhoCue import file: it does not validate against
`../schema/whocue-import-v1.schema.json`, and nothing in this repo's contracts
changes that. The WhoCue app itself can, however, re-import an unmodified
handoff export it produced. It recognizes the exact
`format: "whocue_event_handoff"` marker, reads only `import_compatible_snapshot`,
and validates that section with the full, strict import v1 rules; everything
else in the envelope is ignored. So:

- If the user just wants yesterday's event back in WhoCue as-is, they can give
  the unmodified handoff export to the app. It succeeds only when the snapshot
  happens to be import-valid (see below).
- If you are producing something for WhoCue to import — a changed, cleaned, or
  merged list — output a separate v1 import JSON using only the supported
  import fields and validate it against `../schema/whocue-import-v1.schema.json`.
  Do not hand back an edited handoff envelope: other tools that follow the
  published contracts will not accept it, and the app ignores any changes you
  make outside `import_compatible_snapshot`.

### Import-Shaped Is Not Import-Valid

`import_compatible_snapshot` uses import v1's field names, types, and enums, and
rejects unknown fields the same way. It is still not guaranteed to be a valid
import v1 document, because it carries app-local values and the app's limits are
looser than the import contract's. A snapshot can legitimately contain zero
people, more than 250 people, a 200-character person name, notes longer than
2,000 characters, more than 12 tags, or an 80-character tag — all of which
import v1 rejects.

Treat the snapshot as the best starting point for a new import file, not as a
file WhoCue is guaranteed to accept. When the app re-imports a handoff export
whose snapshot breaks an import v1 limit, it rejects the whole import with the
same validation errors an ordinary import file would get. `../schema/README.md` has the limit-by-limit
comparison.

## What The Export Contains

Every handoff export carries all of these. None of them is optional:

- Export metadata: `format`, `format_version`, `generated_at`,
  `not_a_whocue_import_file`, `suggested_file_name`, `purpose`, and an
  `instructions` object with `privacy`, `use`, and `import_note` notes.
- `summary`: `event_name`, `people_count`, `met_count`, `not_met_count`,
  `followup_me_count`, and `followup_other_count`.
- `import_compatible_snapshot`: event and person fields that overlap the v1
  import contract, such as names, source IDs, title, company, notes, connection
  topic, identity uncertainty, priority, status, tags, and profile links.
- `who_cue_state`: app-local event/person state, including local IDs, creation
  and update timestamps, meeting notes, and standard followup states.

`generated_at` and every timestamp inside the document are UTC with a trailing
`Z`. Optional fields are omitted when unknown; the export never writes `null`.
The two people arrays come from one sorted list, so the record at a given index
in `import_compatible_snapshot.people` is the same person as the record at that
index in `who_cue_state.people`.

An export can also carry an event with no people, in which case both people
arrays are empty and every summary count is zero.

The standard followup actions are:

- `email`
- `call`
- `schedule_meeting`
- `send_documents`
- `introduce`
- `resume`

Each followup action uses one state:

- `off`: no follow-up marked.
- `me`: the WhoCue user owns this follow-up.
- `other`: the other person owns this follow-up.

The export can include people added manually inside WhoCue after the original
import, plus app-updated status, priority, notes, meeting notes, tags, links,
identity uncertainty, and followup states.

## Processing Rules For External LLMs

When processing a handoff export:

1. Treat all contents as private user-provided data.
2. Preserve event context and person names exactly unless the user asks for
   cleanup or normalization.
3. Use `who_cue_state` as the latest app state. Use
   `import_compatible_snapshot` only when the user specifically needs an import
   shaped view.
4. Pay attention to newly added people and records whose `updated_at` values
   show recent changes.
5. Use `status`, `priority`, `meeting_notes`, `notes`, and `followups` to
   propose follow-up work.
6. Separate proposed actions from executed actions. Do not send messages,
   update a CRM, create tasks, schedule meetings, or contact anyone unless the
   user explicitly approves that downstream workflow and supplies the required
   system access.
7. If the user has a CRM, task manager, email system, or spreadsheet, ask which
   fields and workflow they want before producing system-specific output.
8. Do not infer private contact information, sensitive traits, or relationship
   history from sparse event notes.
9. Do not expose raw local IDs to people outside the user's workflow unless the
   IDs are needed to reconcile rows in a user-controlled file.
10. If asked to create a new WhoCue import file, output only a fresh v1 import
    JSON and omit app-only fields such as `meeting_notes`, `followups`,
    `local_id`, `created_at`, and `updated_at`. Check the result against import
    v1's tighter limits; values copied straight from the snapshot may exceed
    them.
11. Validate the export against `../schema/whocue-handoff-v1.schema.json` before
    relying on its structure. A document that fails is not a WhoCue handoff
    export, whatever it claims in `format`.

## Common Outputs

Useful user-controlled outputs include:

- A concise post-event recap.
- A prioritized follow-up list grouped by owner (`me`, `other`, or no owner).
- Draft email/message text for the user to review and send manually.
- A spreadsheet-ready table.
- CRM import mapping suggestions, if the user names the CRM and desired fields.
- A cleaned WhoCue v1 import file, if the user wants to reuse selected event
  data in a future import.

Do not assume one universal CRM, outreach sequence, task model, or sales process.
Different users will map the same handoff data into different systems.

## Reusable Prompt Template

Use this prompt with an external LLM when processing a WhoCue handoff export:

```text
You are helping me process a WhoCue event handoff export.

Treat the JSON I provide as private user-provided data. Do not send messages,
update external systems, create tasks, or assume a CRM unless I explicitly ask.

Goals:
- Read the latest local WhoCue state from who_cue_state.
- Use import_compatible_snapshot only as a schema-shaped reference.
- Account for newly added people and app-updated fields.
- Use status, priority, notes, meeting_notes, and followups to propose useful next steps.
- Keep proposed actions separate from actions taken.

First, summarize:
1. Event name and generated timestamp.
2. Total people, met/not-met counts, and follow-up ownership counts.
3. High-priority people needing follow-up.
4. People with meeting notes.
5. Followups assigned to me and to the other person.

Then ask me what output I want:
- post-event recap;
- prioritized follow-up list;
- draft messages;
- spreadsheet-ready table;
- CRM-specific mapping;
- a fresh WhoCue v1 import JSON;
- something else.

When producing CRM, email, task, or spreadsheet output, ask for the target system
and field mapping first. When producing a fresh WhoCue import file, output only
valid v1 import JSON and omit handoff-only fields such as meeting_notes,
followups, local_id, created_at, and updated_at.
```

### In-App Follow-Up Prompt

The WhoCue app's **Export event** dialog offers a condensed, phone-sized version
of the template above. It points the LLM back at this guide for the full rules.
Its exact text is reproduced here so that an editor of either one sees both:

```text
Read the WhoCue handoff guide at
https://github.com/mherschberg/whocue-import-spec/blob/main/instructions/handoff-export-processing.md,
then process the WhoCue event export I have attached or pasted. Treat it as
private. Do not send messages, update any system, or assume a CRM unless I ask.
First summarize the event: people met, high-priority people needing follow-up,
meeting notes, and follow-ups assigned to me and to others. Then ask what I want
next: a recap, a prioritized follow-up list, draft messages, a spreadsheet
table, CRM updates, or a fresh WhoCue import file.
```

When you change the reusable template, check that the condensed prompt still
gives the same advice, and change both together. Conflicting prompts give users
contradictory advice. The WhoCue app's tests compare this block with the in-app
text (ignoring line wrapping), so a change to only one of them fails the app's
next test run.

## Privacy Checklist

Before processing or sharing results, confirm:

- The user intentionally provided the handoff export.
- The requested output is clear.
- Private notes and meeting notes are not copied into public channels.
- Draft messages are reviewed by the user before sending.
- CRM/task/email/spreadsheet output matches the user's named system and fields.
- A generated WhoCue import file uses only supported v1 import fields.
