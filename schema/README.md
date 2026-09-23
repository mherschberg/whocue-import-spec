# Schema

This directory contains the machine-readable WhoCue contracts. There are two,
and they point in opposite directions:

| Contract | File | Direction |
|----------|------|-----------|
| Import v1 | `whocue-import-v1.schema.json` | Into the app: one event-scoped people list the app validates and loads. |
| Event handoff export v1 | `whocue-handoff-v1.schema.json` | Out of the app: one event's current local state, for user-controlled external follow-up processing. |

They are separate contracts. A handoff export is **not** a WhoCue import file
and is not accepted by the import schema. See
[Handoff Export v1](#handoff-export-v1) below and
`../instructions/handoff-export-processing.md`.

## v1 Artifact

- `whocue-import-v1.schema.json`
- JSON Schema draft: 2020-12
- Required top-level fields: `schema_version`, `event`, and `people`
- Supported `schema_version`: `"1.0"`

The v1 schema is strict: every object sets `additionalProperties: false`, so
unknown fields are rejected instead of ignored.

## v1 Structure

Each import file describes one event-scoped people list.

- `event.name` is required and is the event merge key.
- `event.start_at`, `event.end_at`, and `event.timezone` are optional. Date-time
  values must include `Z` or a numeric timezone offset. When an event date is
  known but exact times are not, generators should use `00:00:00` and
  `23:59:59` with the local offset, plus `timezone` for the named event
  timezone.
- `people` must contain 1-250 person records.
- Each person requires `name`; the person name is the merge key within the
  event.
- Optional source IDs may be included for traceability, but WhoCue still mints
  local app-owned IDs during import.
- Optional status values are `not_met` and `met`.
- Optional priority values are `low`, `medium`, and `high`.
- Optional `identity_uncertain` is a boolean marker for records that may not
  identify the intended person.
- Tags are shallow strings, limited to 12 unique tags per person and 40
  characters per tag.
- Optional person links are allowed for `linkedin`, `x`, `instagram`,
  `facebook`, `website`, and `blog`. All links must use HTTPS.

## v1 Limits

Schema-enforced limits:

| Limit | v1 value |
|-------|----------|
| People per import | 1-250 |
| Event name | 1-120 characters |
| Event timezone | 1-64 characters, IANA-style such as `America/New_York` |
| Event location | 1-160 characters |
| Event description | 1-1,000 characters |
| Person name, title, company, affiliation | 1-120 characters |
| Person notes | 1-2,000 characters |
| Person email | 1-254 characters |
| Person phone | 1-40 characters |
| Connection topic | 1-500 characters |
| Tags per person | 0-12 |
| Tag length | 1-40 characters |
| Source ID length | 1-128 characters |
| HTTPS URL length | 2,048 characters |
| Embedded image base64 payload | 1,398,104 characters, approximately 1 MiB decoded |

Rules enforced by import tooling, fixtures, or app implementation rather than
plain JSON Schema:

- Total import JSON file size must not exceed 10 MiB.
- Person names must be unique within a single import file after app-defined
  merge-key normalization.
- If only an event date is known, import authors should provide `start_at` at
  local midnight and `end_at` at local `23:59:59`, include the offset in each
  timestamp, and use `timezone` to identify the named event timezone.
- Embedded image data must be canonical padded base64. Supplemental validation
  rejects data URI prefixes, whitespace, malformed content, and missing padding
  that can pass the schema's conservative character pattern.
- If an existing local event has duplicate matching person names, the app must
  reject the merge as ambiguous rather than guessing.
- Embedded, packaged, and downloaded images must decode successfully, use JPEG,
  PNG, or WebP, and fit within a 2048 x 2048 decoded-pixel envelope.
- Remote image downloads must use HTTPS, follow at most 2 redirects, complete
  within a 10 second per-image timeout, and stay within a 2 MiB download limit.
- ZIP import packages may contain one manifest JSON file plus referenced image
  files. ZIP packages must reject absolute paths, `.` / `..` path segments, nested
  archives, unsupported file types, undeclared image files, duplicate entry
  paths, and packages over 50 MiB total compressed size.
- Image failures are non-fatal for otherwise valid structured imports unless a
  later schema version adds an explicit required-image rule.

## Image Modes

v1 supports:

- `none`: no image supplied. A person may also omit `image` entirely.
- `embedded`: base64 image data with a declared `mime_type`.
- `package_file`: image file packaged next to the manifest inside a ZIP import,
  referenced by safe relative path and declared `mime_type`.
- `remote_url`: HTTPS URL fetched during explicit import, with optional
  `expected_mime_type` and `storage_preference`.

Embedded images are valid in v1 and are convenient for small, self-contained
imports. For image-heavy imports, prefer a ZIP package with `package_file`
references so the manifest stays readable and the app can validate files under
one user-selected package.

Raw `local_file` references outside a package are intentionally not supported in
v1. Mobile document-picker behavior does not give a reliable portable way for an
import JSON file to reference arbitrary sibling local files across iOS and
Android.

## Handoff Export v1

- `whocue-handoff-v1.schema.json`
- JSON Schema draft: 2020-12
- Root `format` is the constant `whocue_event_handoff`
- Supported `format_version`: `"1.0"`

The WhoCue app generates this document when a user explicitly exports one
event. The schema is derived from the app's generator
(`app/lib/src/export_handoff/event_handoff_export.dart`), not from prose: where
the two disagreed, the generator won and the prose was corrected.

### Envelope

Every export carries all ten root members:

| Field | Rule |
|-------|------|
| `format` | Exactly `"whocue_event_handoff"`. |
| `format_version` | Exactly `"1.0"`. |
| `generated_at` | RFC 3339 date-time. The app emits UTC with a trailing `Z`. |
| `purpose` | Human-readable prose. Do not parse it. |
| `not_a_whocue_import_file` | Exactly `true`. The published boundary marker. |
| `suggested_file_name` | A safe file name ending in `.json`, with no path separators, that a consumer may write to disk. |
| `instructions` | `privacy`, `use`, and `import_note` prose strings. |
| `summary` | `event_name` plus five non-negative counts. |
| `import_compatible_snapshot` | Import-shaped view of the event. See below. |
| `who_cue_state` | App-local state: local IDs, timestamps, meeting notes, and followups. |

`who_cue_state` person records carry all six standard followup actions
(`email`, `call`, `schedule_meeting`, `send_documents`, `introduce`, `resume`),
each in state `off`, `me`, or `other`.

The app's actual file-name scheme is
`whocue-<event-slug>-handoff-<timestamp>.json`, but the contract deliberately
does not pin that pattern. What matters to a consumer is that the value is safe
to write to disk; the exact slug and timestamp layout are an app detail that may
change without a `format_version` bump.

### Q1 Decision: Strictness

**Decided:** `additionalProperties: false` on the envelope and on
`import_compatible_snapshot`; permissive inside `who_cue_state`. Any new
envelope section bumps `format_version`.

The two halves of the document have different audiences, so they get different
rules:

- The **envelope and snapshot** are the part external consumers read as a
  contract. Strict rejection turns a typo'd or invented section into a loud
  failure instead of a silently ignored one, and it matches import v1's posture.
  The cost is real: an added envelope section breaks third-party validators
  until they update, which is exactly why adding one is a `format_version` bump.
- **`who_cue_state`** is app-local state, not a contract surface. It changes
  whenever the app grows a field, and none of those additions change how a
  consumer should process the document. Locking it would make every app release
  a potential breaking change for external validators while buying nothing.
  Unknown members there are allowed; the *values* of known members are still
  constrained, so an unrecognized followup state is still rejected.

### `$ref` vs. Restate

**Decided:** `import_compatible_snapshot` **restates** the import v1 field set
rather than `$ref`-ing `whocue-import-v1.schema.json`, and a CI check keeps the
restatement honest.

A `$ref` was rejected for two reasons:

1. **It would not resolve.** The published `$id` values are
   `https://github.com/mherschberg/whocue-import-spec/schema/...`, which are
   repository page URLs, not fetchable JSON. An external consumer who downloads
   only the handoff schema would get an unresolvable reference. Keeping each
   contract file standalone is the whole point of publishing it.
2. **It would be wrong.** The snapshot is import-*shaped*, not import-*valid*.
   It carries app-local values, so its bounds follow the app's limits, which are
   looser than import v1's (see the table below). A `$ref` would reject real
   generator output.

The drift hazard a `$ref` would have prevented is handled mechanically instead.
`scripts/validate-examples.mjs` compares the two schemas on every run and fails
if the snapshot's field names, required fields, enum values, or shared `$defs`
stop mirroring import v1. Fields the generator deliberately never emits
(`affiliation`, `image`) are declared in that check rather than left invisible.
The script additionally validates every published handoff fixture's snapshot
against the real import v1 schema.

### Import-Shaped, Not Import-Valid

`import_compatible_snapshot` uses import v1's field names, types, and enums, and
rejects unknown fields the same way. It is **not** guaranteed to be a valid
import v1 document, because the app's own limits are looser than the import
contract's:

| Limit | Import v1 | Handoff snapshot (app domain) |
|-------|-----------|-------------------------------|
| People per document | 1-250 | 0 or more; the app caps imports, not events |
| Event name | 1-120 | 1-200 |
| Event timezone | 1-64, IANA-style pattern | 1-100, no pattern |
| Event location | 1-160 | 1-300 |
| Person name, title, company | 1-120 | 1-200 |
| Person notes | 1-2,000 | 1-4,000 |
| Source ID | 1-128 | 1-200 |
| Tags per person | 0-12 | Unbounded |
| Tag length | 1-40 | 1-80 |

Event description, email, phone, connection topic, and links are identical in
both contracts.

Two consequences follow, and both are deliberate:

- A snapshot round-trips into WhoCue only when its values happen to fit import
  v1's tighter bounds. A zero-person event, a 251-person event, a 150-character
  person name, or a 13th tag all produce a valid handoff export whose snapshot
  import v1 rejects.
- Two snapshot fields are stricter than import v1 rather than looser, because
  the generator always emits one and only ever emits the other as `true`:
  `status` is required, and `identity_uncertain` is present only when the record
  is uncertain.

If you need a file WhoCue will import, build a fresh v1 import document from the
snapshot and validate it against `whocue-import-v1.schema.json`. Do not hand the
handoff export to the import flow and expect the contract to accept it.

### Rules Enforced Outside Plain JSON Schema

`scripts/validate-examples.mjs` also checks internal consistency that JSON
Schema cannot express:

- `summary.people_count`, `met_count`, `not_met_count`, `followup_me_count`, and
  `followup_other_count` must agree with the exported records.
- `summary.event_name`, `import_compatible_snapshot.event.name`, and
  `who_cue_state.event.name` must be the same value.
- The two people arrays are derived from one sorted list, so they must be the
  same length and in the same name order.
- `who_cue_state` local IDs must be unique within one export.

### Versioning

`format_version` is `"1.0"`. Bump it when the envelope gains or loses a section,
when a section's meaning changes, or when a snapshot field is added or removed.
Adding an app-local field inside `who_cue_state` is not a version bump, which is
what the permissive rule in the Q1 decision buys.
