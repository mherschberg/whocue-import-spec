# WhoCue Import Protocol v1

This is the public prose reference for the WhoCue v1 import file format. The
machine-readable source of truth is
`schema/whocue-import-v1.schema.json`.

Use this protocol to create one event-scoped people list that the WhoCue mobile
app can upload, validate, and import.

## File Type

- Format: JSON.
- Root value: one object.
- Schema version: `"1.0"`.
- One file describes one event and 1-250 people for that event.
- Unknown fields are rejected. Use only the fields listed here or in the schema.
- Omit unknown optional fields. Do not output `null` in v1.

Smallest valid file:

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

## Top-Level Object

| Field | Required | Rule |
|-------|----------|------|
| `schema_version` | Yes | Must be exactly `"1.0"`. |
| `event` | Yes | Event object. `event.name` is required. |
| `people` | Yes | Array of 1-250 person objects. Each person requires `name`. |

## Event Object

Allowed fields:

| Field | Required | Rule |
|-------|----------|------|
| `name` | Yes | 1-120 characters, non-blank. Event merge key. |
| `source_id` | No | 1-128 characters, non-blank. External traceability only. |
| `start_at` | No | RFC 3339 date-time with `Z` or numeric timezone offset. |
| `end_at` | No | RFC 3339 date-time with `Z` or numeric timezone offset. |
| `timezone` | No | IANA-style value, such as `America/New_York`. |
| `location` | No | 1-160 characters, non-blank. |
| `description` | No | 1-1,000 characters, non-blank. |

If only the event date is known, use local `00:00:00` for `start_at`, local
`23:59:59` for `end_at`, include the offset in each timestamp, and include
`timezone` when known. Example: `2026-09-14T09:00:00-04:00`, not
`2026-09-14T09:00:00`.

## Person Object

Allowed fields:

| Field | Required | Rule |
|-------|----------|------|
| `name` | Yes | 1-120 characters, non-blank. Person merge key inside the event. |
| `source_id` | No | 1-128 characters, non-blank. External traceability only. |
| `title` | No | 1-120 characters, non-blank. |
| `company` | No | 1-120 characters, non-blank. |
| `affiliation` | No | 1-120 characters, non-blank. |
| `notes` | No | 1-2,000 characters, non-blank. |
| `email` | No | 1-254 characters, non-blank. Include only user-supplied email addresses, or addresses found through an explicit user-approved email lookup. Never guess. |
| `phone` | No | 1-40 characters, non-blank. Include only user-supplied phone numbers. Do not research phone numbers while creating an initial event list. |
| `connection_topic` | No | 1-500 characters, non-blank. |
| `identity_uncertain` | No | Boolean. Use `true` when the record may not refer to the intended person. Omit or use `false` when identity is sufficiently certain. |
| `priority` | No | One of `low`, `medium`, or `high`. |
| `status` | No | One of `not_met` or `met`. |
| `tags` | No | Up to 12 unique non-blank strings, each 1-40 characters. The 12 limit is a hard cap, not a target; keep the event's tag set small and shared. |
| `links` | No | Object containing at least one supported HTTPS link. |
| `image` | No | Image object using one supported image mode. |

Person names must be unique within the file after trimming, collapsing repeated
whitespace, and case-insensitive comparison. If two people have the same merge
key, the app rejects the import rather than guessing.

Use `connection_topic` for the main reason to talk with the person at this
event. Use `notes` for short public context that helps recognition or
conversation. Use `identity_uncertain: true` only to flag uncertainty that the
profile identifies the intended person; do not use it as a general confidence
score. Before looking for email addresses, ask whether the user wants that extra
research. If they say yes, include only found email addresses from sources the
user wants represented, and never fabricate or guess an address. Never look up
phone numbers while creating an initial event list. Do not add unsupported
fields such as `reason`, `confidence`, `citation`, or `speaker_session`.

## Links

`links` may contain these keys only:

- `linkedin`
- `x`
- `instagram`
- `facebook`
- `website`
- `blog`

Every link value must be an HTTPS URL and no longer than 2,048 characters.

## Images

A person may omit `image`, or provide exactly one image object.

Supported modes:

```json
{ "mode": "none" }
```

```json
{
  "mode": "embedded",
  "mime_type": "image/png",
  "data": "BASE64_IMAGE_DATA"
}
```

```json
{
  "mode": "package_file",
  "path": "images/person-name.webp",
  "mime_type": "image/webp"
}
```

```json
{
  "mode": "remote_url",
  "url": "https://example.com/images/person-name.png",
  "expected_mime_type": "image/png",
  "storage_preference": "save_locally"
}
```

Image rules:

- Supported MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Raw `local_file` image references are unsupported in v1.
- Remote image URLs must use HTTPS.
- `storage_preference`, when present, must be `save_locally` or
  `remote_reference`.
- Embedded image data must be canonical padded base64 with no whitespace, data
  URI prefix, or missing padding, and no more than 1,398,104 characters,
  approximately 1 MiB decoded.
- Package image paths must be safe relative paths inside the ZIP package.
- Package and remote images must stay within a 2 MiB image-file limit and a
  2048 x 2048 decoded-image envelope.

## File And Package Limits

- Standalone JSON import file: maximum 10 MiB.
- ZIP import package: maximum 50 MiB compressed size.
- People per import: 1-250.
- Images per person: 0-1.

## Repairing Validation Failures

WhoCue groups validation failures by repair area. Use the group label shown by
the app to choose the smallest useful fix:

| App group | Repair |
|-----------|--------|
| File structure and version | Make the root a single JSON object, set `schema_version` to `"1.0"`, and remove fields that are not listed in this protocol. |
| Missing required content | Add required `event`, `event.name`, `people`, and each person `name`; replace blank required text with non-blank text. |
| Field types and formats | Use the exact JSON types, enum values, RFC 3339 date-times with offsets, IANA-style timezones, and HTTPS URLs required by v1. |
| Import limits | Reduce people, tags, image payloads, file size, or over-long strings to the v1 limits. |
| Duplicates | Remove or rename duplicate person merge keys within the event and repeated tags within one person. |
| Image references | Use one supported image mode, supported MIME types, canonical padded base64 for embedded data, safe package paths, and HTTPS remote URLs. |

Repair structure/version problems first, then required content, then individual
field and image issues. Do not paste raw private records into bug reports or
diagnostics; use the app's scrubbed paths such as `$.people[0].image.url`.

## LLM Output Rule

When producing a final WhoCue import file, output JSON only: no Markdown code
fence, no explanation, no comments, and no text before or after the JSON.

Before output, verify that:

- The root object has only `schema_version`, `event`, and `people`.
- Every object uses only allowed fields.
- Required names are present and non-blank.
- Optional fields are omitted when unknown.
- Date-time fields include `Z` or a numeric timezone offset.
- Enum values exactly match the protocol.
- URLs use HTTPS.
- Embedded image data is canonical padded base64, not a data URI.
- Person names are unique within the event.
- No guessed private contact details, sensitive personal data, or unsupported
  research metadata fields are present.
