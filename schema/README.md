# Schema

This directory contains the machine-readable WhoCue import contract.

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
