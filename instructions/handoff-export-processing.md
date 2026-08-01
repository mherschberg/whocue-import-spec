# WhoCue Handoff Export Processing

Use this guide when a user gives an external LLM, human assistant, CRM helper,
or other user-controlled workflow a WhoCue event handoff export. A handoff
export carries the latest local app state after an event, including app edits
that may not exist in the original import file.

WhoCue handoff exports are private user-provided data. Treat them as sensitive
local context and do not upload, store, forward, or act on them beyond the
user's explicit request.

## Import Files vs Handoff Exports

WhoCue has two different JSON shapes:

| Shape | Purpose | How to recognize it |
|-------|---------|---------------------|
| Import file | Bring a focused event people list into WhoCue | Root fields are `schema_version`, `event`, and `people`; validated by `../schema/whocue-import-v1.schema.json` |
| Handoff export | Take current WhoCue app state out for external follow-up processing | Root field `format` is `whocue_event_handoff`; includes `import_compatible_snapshot` and `who_cue_state`; not accepted by the WhoCue import schema |

Do not paste a full handoff export back into WhoCue's import flow. If a user
wants to create a new import file from exported state, produce a separate v1
import JSON using only the supported import fields and validate it against the
schema.

## What The Export Contains

A handoff export may include:

- Export metadata: format, format version, generated timestamp, suggested file
  name, and processing instructions.
- Summary counts: total people, met/not-met counts, and follow-up ownership
  counts.
- `import_compatible_snapshot`: event and person fields that overlap the v1
  import contract, such as names, source IDs, title, company, notes, connection
  topic, identity uncertainty, priority, status, tags, and profile links.
- `who_cue_state`: app-local event/person state, including local IDs, creation
  and update timestamps, meeting notes, and standard followup states.

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
    `local_id`, `created_at`, and `updated_at`.

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

## Privacy Checklist

Before processing or sharing results, confirm:

- The user intentionally provided the handoff export.
- The requested output is clear.
- Private notes and meeting notes are not copied into public channels.
- Draft messages are reviewed by the user before sending.
- CRM/task/email/spreadsheet output matches the user's named system and fields.
- A generated WhoCue import file uses only supported v1 import fields.
