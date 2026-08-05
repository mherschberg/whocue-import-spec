# WhoCue v1 Import Authoring Guide

Use this guide to write or review a WhoCue import file by hand. The
machine-readable contract is `schema/whocue-import-v1.schema.json`; this guide
explains the same v1 rules in authoring terms.

For the full external workflow, including source gathering, shortlist review,
LLM prompt guidance, validation, and phone transfer, start with
`generation-workflow.md`.

## File Shape

A v1 import is one JSON object for one event-scoped people list:

```json
{
  "schema_version": "1.0",
  "event": {
    "name": "Demo Networking Breakfast"
  },
  "people": [
    {
      "name": "Alex Morgan"
    }
  ]
}
```

Required top-level fields:

| Field | Rule |
|-------|------|
| `schema_version` | Must be exactly `"1.0"`. |
| `event` | Object describing the event. `event.name` is required. |
| `people` | Array with 1-250 person records. Each person requires `name`. |

The schema is strict. Unknown fields are rejected, and optional fields should be
omitted when unknown. Do not use `null` unless a future schema version explicitly
allows it.

Keep shortlist research outside the final JSON. Unsupported fields such as
`citation`, `confidence`, `speaker_session`, `source`, and `reason` are
rejected by v1. If a public fact helps event-day recognition or conversation,
summarize it briefly in `notes` or `connection_topic`; otherwise leave it out.
Use `email` only for user-supplied addresses or addresses found through an
explicit user-approved email lookup. Use `phone` only for user-supplied phone
numbers; do not research phone numbers while creating an initial event list.

## Event Fields

| Field | Required | Rule |
|-------|----------|------|
| `name` | Yes | 1-120 characters, non-blank. This is the event merge key. |
| `source_id` | No | 1-128 characters, non-blank. External traceability only. |
| `start_at` | No | RFC 3339 date-time string with `Z` or numeric timezone offset. |
| `end_at` | No | RFC 3339 date-time string with `Z` or numeric timezone offset. |
| `timezone` | No | IANA-style area/location value, such as `America/New_York`. |
| `location` | No | 1-160 characters, non-blank. |
| `description` | No | 1-1,000 characters, non-blank. |

When only an event date is known, use `start_at` at local `00:00:00`,
`end_at` at local `23:59:59`, include the offset in each timestamp, and include
the event `timezone`. For example, use `2026-09-14T09:00:00-04:00`, not
`2026-09-14T09:00:00`.

## Person Fields

| Field | Required | Rule |
|-------|----------|------|
| `name` | Yes | 1-120 characters, non-blank. This is the person merge key inside the event. |
| `source_id` | No | 1-128 characters, non-blank. External traceability only. |
| `title` | No | 1-120 characters, non-blank. |
| `company` | No | 1-120 characters, non-blank. |
| `affiliation` | No | 1-120 characters, non-blank. |
| `notes` | No | 1-2,000 characters, non-blank. |
| `email` | No | 1-254 characters, non-blank. Optional lookup requires explicit user approval; never guess. |
| `phone` | No | 1-40 characters, non-blank. User-supplied only; never research ahead of the event. |
| `connection_topic` | No | 1-500 characters, non-blank. |
| `identity_uncertain` | No | Boolean. Use `true` when the record may not refer to the intended person. Omit or use `false` when identity is sufficiently certain. |
| `priority` | No | One of `low`, `medium`, or `high`. |
| `status` | No | One of `not_met` or `met`. |
| `tags` | No | Up to 12 unique strings, each 1-40 characters and non-blank. The 12 limit is a hard cap, not a target; keep the event's tag set small and shared (see the tag budget in `people-selection-guide.md`). |
| `links` | No | Object containing at least one supported HTTPS link. |
| `image` | No | Image object using one supported image mode. |

Within one import file, person names must be unique after trimming, collapsing
repeated whitespace, and case-insensitive comparison. If the file contains two
records that normalize to the same name, WhoCue rejects the import rather than
guessing how to merge them.

## Links

`links` may contain these keys only:

- `linkedin`
- `x`
- `instagram`
- `facebook`
- `website`
- `blog`

Every link must be an HTTPS URL and no longer than 2,048 characters. If no links
are known, omit the `links` object.

## Images

A person may omit `image`, or provide exactly one image object.

Supported v1 image modes:

| Mode | Required fields | Use when |
|------|-----------------|----------|
| `none` | `mode` | You want to explicitly say no image is supplied. |
| `embedded` | `mode`, `mime_type`, `data` | The image is small and should travel inside the JSON file. |
| `package_file` | `mode`, `path`, `mime_type` | The import will be a ZIP package with image files next to the manifest. |
| `remote_url` | `mode`, `url` | WhoCue should fetch an HTTPS image URL during import. |

Supported image MIME types are `image/jpeg`, `image/png`, and `image/webp`.

Embedded images use canonical padded base64 with no whitespace, data URI prefix,
or missing padding, and are limited to 1,398,104 characters, approximately 1 MiB
decoded. Package and remote images must stay within a 2 MiB image-file limit and
a 2048 x 2048 decoded-image envelope.

`package_file.path` must be a safe relative path inside the ZIP package. It may
not be absolute, contain `.` or `..` path segments, contain double slashes, or
point to anything other than `.jpg`, `.jpeg`, `.png`, or `.webp`.

`remote_url.url` must use HTTPS. Remote image downloads may follow at most 2
redirects and must complete within a 10 second per-image timeout. Optional
`storage_preference` values are `save_locally` and `remote_reference`.

Raw `local_file` references outside a ZIP package are not supported in v1.

## Size Limits

- Standalone JSON import file: maximum 10 MiB.
- ZIP import package: maximum 50 MiB compressed size.
- People per import: 1-250.
- One image per person.

The app may reject an otherwise schema-valid file if these importer-level limits
are exceeded.

## Privacy And Data Quality

Use only data the importing user is allowed to store in WhoCue. Do not include
private attendee lists, copied profile data, personal photos, private notes, or
production URLs in public examples or test fixtures.

For examples, demos, and fixtures, use synthetic people, organizations, events,
notes, URLs, and image payloads. The published fixtures under `examples/` are
synthetic references for the expected style.

## Validate Before Import

Install dependencies once:

```bash
npm ci
```

Validate the schema and fixture corpus:

```bash
npm run validate
```

Run the full local import-spec check:

```bash
npm run check
```

The validation command compiles the schema, checks all valid and invalid
fixtures, and adds supplemental semantic checks that JSON Schema alone does not
cover.

## Repair Common Validation Failures

When WhoCue rejects a file, the app groups the scrubbed paths by repair area:

| App group | What to check |
|-----------|---------------|
| File structure and version | The file is valid JSON, the root is one object, `schema_version` is exactly `"1.0"`, and every object uses only v1 fields. |
| Missing required content | Required objects and names are present: `event`, `event.name`, `people`, and every person `name`. Blank required strings must become non-blank or the record should be removed. |
| Field types and formats | Strings are strings, booleans are booleans, enums use exact lowercase values, date-times include `Z` or an offset, timezones look like `Area/Location`, and URLs are HTTPS. |
| Import limits | The JSON file, people count, tag count, image payloads, and string lengths fit the limits in this guide. |
| Duplicates | Person names are unique within the event after trimming/case normalization, and tags are not repeated within one person. |
| Image references | The `image` object uses exactly one supported mode; embedded data is canonical padded base64; package paths are safe relative image paths; remote image URLs are HTTPS. |

The app examples are intentionally scrubbed. Use paths such as
`$.people[0].name` to find the field, but avoid copying private notes, profile
URLs, image data, or raw records into diagnostics.

Validation is not a research-quality review. After the file validates, still
check that selected people are relevant to the event, notes are current and
useful, tags stay within a small shared vocabulary the user approved, identities
are not confused, and remote images or package contents are actually available
where the JSON says they are.
