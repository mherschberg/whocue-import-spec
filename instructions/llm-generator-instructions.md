# WhoCue v1 LLM Generator Instructions

Use these instructions when generating a WhoCue v1 import JSON file for a user.
The output must validate against `schema/whocue-import-v1.schema.json`.

For the full source-gathering, shortlist confirmation, validation, and phone
transfer sequence, start with `generation-workflow.md`.

If the user also asks you to find people for an event, first use
`instructions/people-selection-guide.md`. That guide covers public-source
research, relevance ranking, privacy limits, and how to map event value into
WhoCue fields. Use this file for the final JSON protocol.

## Output Rule

When the user asks for a WhoCue import file, output JSON only: no Markdown code
fence, no explanation, and no extra text before or after the JSON.

If required facts are missing and the user has not asked you to use synthetic
demo data, ask concise clarification questions instead of inventing real private
data.

During research or selection, you may summarize candidates and ask the user to
confirm the shortlist. Once producing the import file, output JSON only.

## Transfer To The Phone

WhoCue imports files on the phone through the native document picker. If the
user is working with an LLM on a laptop or desktop, suggest this workflow before
the final JSON-only output:

1. Save the generated WhoCue import as a `.json` file, or as a `.zip` package
   when using `package_file` images.
2. Put that file in a cloud-synced folder or drive that is also available on the
   phone, such as Google Drive, OneDrive, Dropbox, or iCloud Drive.
3. On the phone, open WhoCue, choose Import, and select the `.json` or `.zip`
   file from the document picker.

For imports with local images, prefer a ZIP package that contains the JSON
manifest and referenced image files. Do not suggest raw local file paths next to
the JSON file; mobile document pickers do not reliably grant access to sibling
files across iOS and Android, and v1 does not support `local_file` image
references.

## Privacy Rule

Do not invent real private people, organizations, attendee lists, notes, photos,
or profile URLs. Use only facts supplied by the user or clearly synthetic demo
data. Public examples must use synthetic names, organizations, events, notes,
URLs, and image payloads.

Do not include guessed private contact details, sensitive personal data,
inferred protected traits, or unverified claims. If a fact is uncertain, omit it
or put a short neutral caveat in `notes`.

When creating an initial event list, ask the user whether they want you to spend
extra effort looking for email addresses. Email lookup is optional because it may
cost additional searches, may not find anything, and may be awkward if the user
already has the person's contact information. If the user opts in, include only
email addresses you actually find from sources the user wants represented. Never
fabricate, pattern-match, or guess an email address. Never look up phone numbers
ahead of the event; include `phone` only when the user supplied it.

When the user's sources do not already include photos, tell the user you will
search public sources for headshots and proceed unless they decline. Use only
public, appropriate images; never copy photos from private or login-gated pages,
and never invent or misattribute a photo.

Keep research evidence out of the final JSON. Citations, confidence scores,
source URLs used as evidence, ranking rationale, and speaker-session notes may
be useful while discussing the shortlist, but v1 has no fields for them. Use
`notes` or `connection_topic` only for concise context the user will benefit
from seeing during the event.

## Required Structure

Generate one JSON object with exactly these required top-level fields:

```json
{
  "schema_version": "1.0",
  "event": {
    "name": "Synthetic Event Name"
  },
  "people": [
    {
      "name": "Synthetic Person Name"
    }
  ]
}
```

Rules:

- Use `snake_case` field names.
- Set `schema_version` to exactly `"1.0"`.
- Include `event.name`.
- Include `people` with 1-250 person objects.
- Include `name` for every person.
- Reject unknown fields; use only fields listed in these instructions.
- Omit unknown optional fields. Do not output `null`.
- Do not output empty or whitespace-only strings.

## Event Object

Allowed `event` fields:

- `name`: required, 1-120 characters.
- `source_id`: optional, 1-128 characters.
- `start_at`: optional RFC 3339 date-time with `Z` or numeric timezone offset.
- `end_at`: optional RFC 3339 date-time with `Z` or numeric timezone offset.
- `timezone`: optional IANA-style value such as `America/New_York`.
- `location`: optional, 1-160 characters.
- `description`: optional, 1-1,000 characters.

If only an event date is known, use local `00:00:00` for `start_at`, local
`23:59:59` for `end_at`, include the offset in each timestamp, and include
`timezone` when known. For example, use `2026-09-14T09:00:00-04:00`, not
`2026-09-14T09:00:00`.

## Person Object

Allowed person fields:

- `name`: required, 1-120 characters.
- `source_id`: optional, 1-128 characters.
- `title`: optional, 1-120 characters.
- `company`: optional, 1-120 characters.
- `affiliation`: optional, 1-120 characters.
- `notes`: optional, 1-2,000 characters.
- `connection_topic`: optional, 1-500 characters.
- `identity_uncertain`: optional boolean; set to `true` only when the record
  may not refer to the intended person. Omit or use `false` when identity is
  sufficiently certain.
- `priority`: optional; allowed values are `low`, `medium`, and `high`.
- `status`: optional; allowed values are `not_met` and `met`.
- `tags`: optional array of up to 12 unique non-blank strings, each 1-40
  characters. The 12 limit is a hard cap, not a target; keep the event's tag set
  small and shared (see the tag budget in `people-selection-guide.md`).
- `links`: optional object with at least one supported HTTPS link.
- `image`: optional image object using one supported image mode.

Person names must be unique within the import after trimming, collapsing
repeated whitespace, and case-insensitive comparison. If two supplied people
appear to have the same name, ask the user how to disambiguate them or omit one;
do not create duplicate merge keys.

Use `connection_topic` for the main reason the user may want to talk to the
person at this event. Use `notes` for short public context that helps recognition
or conversation. Use `identity_uncertain` only for person-identity uncertainty,
not as a general confidence score for every field. Do not guess or infer
`email` or `phone`; phone numbers are user-supplied only. Do not add unsupported
fields such as `reason`, `confidence`, `citation`, or `speaker_session`.

## Links

Allowed `links` keys:

- `linkedin`
- `x`
- `instagram`
- `facebook`
- `website`
- `blog`

Every link value must be an HTTPS URL and no longer than 2,048 characters. Omit
`links` if no supported link is available.

## Image Modes

A person may omit `image`, or include exactly one of these image objects.

No image:

```json
{ "mode": "none" }
```

Embedded image:

```json
{
  "mode": "embedded",
  "mime_type": "image/png",
  "data": "BASE64_IMAGE_DATA"
}
```

Package file image:

```json
{
  "mode": "package_file",
  "path": "images/person-name.webp",
  "mime_type": "image/webp"
}
```

Remote URL image:

```json
{
  "mode": "remote_url",
  "url": "https://example.com/images/person-name.png",
  "expected_mime_type": "image/png",
  "storage_preference": "save_locally"
}
```

Image rules:

- Supported MIME types are `image/jpeg`, `image/png`, and `image/webp`.
- Do not use raw `local_file`; it is unsupported in v1.
- Remote image URLs must use HTTPS.
- `storage_preference`, when present, must be `save_locally` or
  `remote_reference`.
- Embedded image data must be canonical padded base64 with no whitespace, data
  URI prefix, or missing padding, and no more than 1,398,104 characters,
  approximately 1 MiB decoded.
- Package image paths must be relative paths inside the ZIP package. They must
  not be absolute, include `.` or `..` path segments, include double slashes, or
  point to unsupported file extensions.
- Package and remote images must stay within a 2 MiB image-file limit and a 2048
  x 2048 decoded-image envelope.

## Final Self-Check Before Output

Before producing JSON, check:

- The top-level object has only `schema_version`, `event`, and `people`.
- Every object uses only allowed fields.
- `event.name` and every `person.name` are present and non-blank.
- Every selected person has a clear event-specific relevance reason in
  `connection_topic`, `notes`, `priority`, `tags`, or a combination of those
  fields.
- No optional field is `null`, blank, or invented from private data.
- Email addresses are user-supplied or were found only after explicit user
  approval; no email address is guessed.
- Phone numbers are user-supplied only; no phone number was researched ahead of
  the event.
- No guessed private contact details, sensitive personal data, or unsupported
  research metadata fields are present.
- Enum values exactly match the allowed lowercase values.
- All URLs use HTTPS.
- Date-time fields include `Z` or a numeric timezone offset.
- Embedded image data is canonical padded base64, not a data URI.
- Image objects use exactly one supported mode.
- Person names are unique within the event.
- The JSON is valid, with no comments or trailing commas.

Validation catches strict shape problems such as unknown fields, `null` optional
values, duplicate names, non-HTTPS URLs, unsafe package paths, raw `local_file`
image modes, and data URI prefixes in embedded image data. It does not prove
that the selected people are relevant, that public facts are current, or that a
remote image URL will be reachable when imported. Review those quality issues
before final output.

## If WhoCue Reports A Validation Group

When repairing a rejected file, preserve the user's requested list but fix the
reported group directly:

- File structure and version: output one JSON object, keep
  `schema_version: "1.0"`, and remove unsupported fields.
- Missing required content: add or repair required event/person names; remove
  records that cannot be named.
- Field types and formats: fix JSON types, exact enum values, date-time
  offsets, IANA-style timezones, and HTTPS URLs.
- Import limits: shorten over-limit text, reduce tags, split lists over 250
  people, or avoid oversized embedded images.
- Duplicates: disambiguate same-name people or remove duplicates; remove
  repeated tags.
- Image references: use `none`, `embedded`, `package_file`, or `remote_url`
  exactly; use canonical padded base64, safe package paths, supported MIME
  types, and HTTPS remote URLs.

Return the repaired JSON only when the user is ready for the final import file.
