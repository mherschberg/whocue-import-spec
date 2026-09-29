# WhoCue v1 Import Authoring Guide

> **You can adapt these instructions.** Download a copy of this file to your
> computer or phone and adapt it for your own use in creating WhoCue import
> files. Keep changes to your own copy; see the [`LICENSE`](../LICENSE) for what
> is permitted.

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
| `start_at` | No | RFC 3339 date-time in the form `YYYY-MM-DDTHH:MM:SS`, with an optional fraction of a second, then `Z` or a `±HH:MM` offset. Use an uppercase `T` and `Z`, include seconds, and use only real dates and times. |
| `end_at` | No | Same form as `start_at`. Must not be before `start_at`; it may equal it. |
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
| `affiliation` | No | 1-120 characters, non-blank. WhoCue keeps one organization per person: when both are present, `company` is used and `affiliation` is ignored, but both must still be valid. |
| `notes` | No | 1-2,000 characters, non-blank. |
| `email` | No | 1-254 characters, non-blank. Optional lookup requires explicit user approval; never guess. |
| `phone` | No | 1-40 characters, non-blank. User-supplied only; never research ahead of the event. |
| `connection_topic` | No | 1-500 characters, non-blank. |
| `identity_uncertain` | No | Boolean. Use `true` when the record may not refer to the intended person. Omit or use `false` when identity is sufficiently certain. |
| `priority` | No | One of `low`, `medium`, or `high`. Re-importing without it keeps the priority set in the app. |
| `status` | No | One of `not_met` or `met`. Leave it out unless you have already met the person; a re-import never un-marks someone you met. |
| `tags` | No | Up to 12 unique strings, each 1-40 characters and non-blank. The 12 limit is a hard cap, not a target; keep the event's tag set small and shared (see the tag budget in `people-selection-guide.md`). |
| `links` | No | Object containing at least one supported HTTPS link. |
| `image` | No | Image object using one supported image mode. |

Within one import file, person names must be unique after trimming, collapsing
repeated whitespace, and case-insensitive comparison. If the file contains two
records that normalize to the same name, WhoCue rejects the import rather than
guessing how to merge them.

Importing a file for an event that is already in WhoCue updates it: matching
people are updated, new people are added, and nobody is deleted. Fields you
leave out are cleared, except `status`, `priority`, and `image` (left out or
`"mode": "none"`), which keep what the app has, so a refreshed file should keep every detail you want to
stay. Meeting notes and followups are never touched. `../PROTOCOL.md`,
"Re-Importing Into An Existing Event", has the full rules.

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
| `remote_url` | `mode`, `url` | WhoCue should download an HTTPS image once, during import, and keep a copy. |

Supported image MIME types are `image/jpeg`, `image/png`, and `image/webp`.

Embedded images use canonical padded base64 with no whitespace, data URI prefix,
or missing padding, and are limited to 1,398,104 characters, approximately 1 MiB
decoded. Package and remote images must stay within a 2 MiB image-file limit and
a 2048 x 2048 decoded-image envelope.

`package_file.path` is relative to the root of the ZIP package and must match an
entry's path exactly, case included. It has 1-255 characters of letters,
digits, `.`, `_`, `-`, space, and `/`; no leading `/`, no `//`, and no `.` or
`..` segment; and it ends in a lowercase `.jpg`, `.jpeg`, `.png`, or `.webp`.

To build the package, select the manifest and its image folder together and
compress them. On a Mac, Finder's Compress works: WhoCue ignores the `__MACOSX`
metadata it adds. Don't compress the folder that holds them, which would put
every path under that folder's name. WhoCue refuses a package with an unsafe
entry path, a repeated path, or an archive inside it, and ignores unreferenced
images and other files (`PROTOCOL.md`, "ZIP Packages").

`remote_url.url` must use HTTPS. Remote image downloads may follow at most 2
redirects and must complete within a 10 second per-image timeout. The optional
`storage_preference` is `save_locally` (the default): WhoCue downloads the image
once, during the import, and keeps its own copy. With `remote_reference`, WhoCue
keeps only the link, never downloads the image, and shows a placeholder saying
the photo wasn't downloaded; use it only when a copy mustn't be kept.

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

These commands work in a clone of the import-spec repository
(https://github.com/mherschberg/whocue-import-spec), not in the testers' package, which carries no validator. Install
the dependencies once:

```bash
npm ci
```

Validate your own file:

```bash
npm run validate -- path/to/my-event.json
```

It prints `ok` or the file's errors for each file named, as an import v1 file,
or as a handoff export when the file is one. It checks the JSON only: for a ZIP
package, validate the manifest JSON before zipping. The app itself enforces the
ZIP rules, file sizes, and image checks (`PROTOCOL.md`, "ZIP Packages").

With no file named, `npm run validate` checks the repository's own schemas and
fixture corpus, and `npm run check` runs every repository check.

## Repair Common Validation Failures

When WhoCue rejects a file, the app groups the scrubbed paths by repair area:

| App group | What to check |
|-----------|---------------|
| File structure and version | The file is valid JSON, the root is one object, `schema_version` is exactly `"1.0"`, and every object uses only v1 fields. |
| Missing required content | Required objects and names are present: `event`, `event.name`, `people`, and every person `name`. Blank required strings must become non-blank or the record should be removed. |
| Field types and formats | Strings are strings, booleans are booleans, enums use exact lowercase values, date-times use an uppercase `T`, seconds, and `Z` or a `±HH:MM` offset, an event ends no earlier than it starts, timezones look like `Area/Location`, and URLs are HTTPS. |
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
