# Examples

This directory contains synthetic valid and invalid WhoCue import examples.

Fixtures are part of the public import contract. The WhoCue app uses this corpus
for parser, import-service, and schema-copy contract tests, so filenames should
remain stable once published.

## Directory Layout

```text
valid/    JSON files that should pass v1 schema and semantic validation.
invalid/  JSON files that should parse as JSON but fail v1 validation.
valid/images/  Synthetic local image files referenced by package fixtures.
```

Malformed JSON coverage belongs in app-side parser tests or a separate,
clearly named non-JSON fixture if this repository's validation tooling adds
explicit support for it. Every `.json` fixture in this directory must remain
valid JSON.

## Valid Fixtures

| Fixture | Purpose |
|---------|---------|
| `valid/minimal.json` | Smallest practical v1 import: schema version, event name, and one named person. |
| `valid/realistic-demo.json` | Realistic multi-person event with optional event fields, tags, status, priority, notes, connection topics, links, and package-file headshot references. |
| `valid/realistic-demo.zip` | Ready-to-import package form of `realistic-demo.json` with the referenced synthetic headshots under `images/`. |
| `valid/embedded-image.json` | Embedded image mode with a tiny synthetic PNG payload. |
| `valid/package-file-image.json` | ZIP package image mode with a safe relative image path. |
| `valid/remote-url-image.json` | HTTPS remote image mode with expected MIME type and storage preference. |
| `valid/remote-url-reference-preference.json` | HTTPS remote image mode using the alternate `remote_reference` storage preference. |
| `valid/boundary-tags-and-fields.json` | Readable boundary-oriented fixture with all 12 allowed tags and longer optional fields. |
| `valid/empty-tags-and-none-image.json` | Explicitly empty optional `tags` array and explicit no-image mode. |
| `valid/numeric-looking-strings.json` | String fields containing `"0"` remain valid because the contract cares about JSON types, not numeric-looking text. |

## Invalid Fixtures

| Fixture | Expected failure |
|---------|------------------|
| `invalid/missing-schema-version.json` | Required top-level `schema_version` field is missing. |
| `invalid/unsupported-schema-version.json` | `schema_version` is not `"1.0"`. |
| `invalid/missing-event.json` | Required top-level `event` object is missing. |
| `invalid/empty-event-object.json` | `event` object is present but lacks required `name`. |
| `invalid/missing-people.json` | Required top-level `people` array is missing. |
| `invalid/null-people.json` | Required top-level `people` array is present as `null`. |
| `invalid/people-not-array.json` | `people` is present but is not an array. |
| `invalid/missing-person-name.json` | Required nested `person.name` field is missing. |
| `invalid/empty-person-object.json` | Person object is present but lacks required `name`. |
| `invalid/empty-people.json` | `people` is empty; v1 requires 1-250 people. |
| `invalid/blank-event-name.json` | Event merge key contains no non-whitespace characters. |
| `invalid/null-event-name.json` | Required event merge key is `null` instead of a string. |
| `invalid/blank-person-name.json` | Person merge key contains no non-whitespace characters. |
| `invalid/person-name-too-long.json` | Person name exceeds the 120-character v1 limit. |
| `invalid/null-optional-field.json` | Optional fields are omitted when unknown; `null` is not accepted in v1. |
| `invalid/numeric-source-id.json` | `source_id` must be a string even when the source identifier looks numeric. |
| `invalid/unknown-field.json` | Strict v1 rejects an undeclared person field. |
| `invalid/unknown-image-field.json` | Strict v1 rejects an undeclared nested image field. |
| `invalid/invalid-enum-value.json` | `priority` and `status` use unsupported enum values. |
| `invalid/invalid-date-time.json` | Event timestamps are not RFC 3339 date-time strings; requires validator `format` assertion or an equivalent custom check. |
| `invalid/invalid-timezone.json` | Event timezone is not an IANA-style area/location value. |
| `invalid/invalid-link-url.json` | Person link is not a valid HTTPS URL. |
| `invalid/empty-links.json` | Person links object is present but contains no supported links. |
| `invalid/invalid-image-mime-type.json` | Embedded image declares an unsupported MIME type. |
| `invalid/invalid-embedded-base64.json` | Embedded image data contains characters outside the v1 base64 pattern. |
| `invalid/empty-embedded-image-data.json` | Embedded image data is empty. |
| `invalid/empty-image-object.json` | Image object is present but does not declare a valid mode. |
| `invalid/missing-embedded-image-data.json` | Embedded image omits required mode-specific `data`. |
| `invalid/invalid-storage-preference.json` | Remote image uses an unsupported storage preference. |
| `invalid/too-many-tags.json` | Person has 13 tags; v1 allows at most 12. |
| `invalid/duplicate-tags.json` | Person repeats the same tag; v1 requires unique tag values per person. |
| `invalid/empty-tag.json` | Tag value is empty. |
| `invalid/event-name-too-long.json` | Event name exceeds the 120-character v1 limit. |
| `invalid/duplicate-person-name.json` | Duplicate person merge key inside one event. |
| `invalid/disallowed-local-file-image.json` | Raw `local_file` image references are unsupported in v1. |
| `invalid/non-https-remote-image.json` | Remote image URL uses HTTP instead of HTTPS. |
| `invalid/package-file-path-traversal.json` | ZIP package image path attempts to escape the package root. |

## Validation Notes

Most invalid fixtures should fail plain JSON Schema validation. The validator is
configured to enforce `format` checks so bad date-time and URI fixtures fail
consistently. Some validator installs treat `format` as annotation unless extra
dependencies or options are enabled; `invalid/invalid-date-time.json` exists to
catch that configuration gap.

Some v1 rules are semantic or package-level checks rather than portable JSON
Schema constraints:

- `invalid/duplicate-person-name.json` must fail a custom duplicate merge-key
  check after schema validation.
- Generated edge cases in `scripts/validate-examples.mjs` cover large mechanical
  boundaries such as 250 valid people, 251 invalid people, maximum field lengths,
  and just-over-limit values without committing oversized fixture files.
- Embedded image data may need custom decode validation beyond the schema's
  conservative base64 character pattern and size limit.
- ZIP package constraints such as undeclared files, duplicate entries, nested
  archives, compressed size, and actual image decode dimensions require package
  validation outside the manifest schema.
- Remote image timeout, redirect, download-size, response MIME, and decoded-image
  constraints require app/tooling validation outside the manifest schema.

## Naming

Use lowercase kebab-case filenames that name the behavior being tested, such as
`minimal.json` or `non-https-remote-image.json`. Keep each fixture focused on
one primary behavior so validation failures are easy to diagnose.

## Privacy

All examples must use synthetic people, organizations, events, notes, image
payloads, and URLs. Do not add real attendee lists, private notes, personal
photos, production URLs, or copied profile data.
