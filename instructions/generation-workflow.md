# WhoCue External Generation Workflow

Use this workflow when an external LLM, a human author, or a mixed
research-and-review process creates a WhoCue v1 import file. It keeps research
and shortlist decisions separate from the final import JSON so the finished file
can validate cleanly and be imported on the phone.

WhoCue does not research people, call an LLM, or sync data. This import
workflow is for bringing data into WhoCue. For processing updated event state
exported back out of the app, use `handoff-export-processing.md`. The app
imports a user-selected `.json` file or `.zip` package through the phone
document picker.

## Source Files To Use

- `../PROTOCOL.md` - concise v1 field and validation protocol.
- `people-selection-guide.md` - public-source and shortlist guidance.
- `llm-generator-instructions.md` - final JSON generation rules.
- `human-authoring-guide.md` - human review and validation reference.
- `../schema/whocue-import-v1.schema.json` - machine-readable schema.
- `../examples/valid/` - synthetic valid output models.
- `../examples/invalid/` - examples of rejected shapes.

## Workflow

### 1. Gather Event And Source Inputs

Collect only the inputs needed for a focused event-day list:

- Event name, date, timezone, location, and public event URL when available.
- The user's goal for the event.
- Desired list size. Default to 10-30 people unless the user asks otherwise.
- Must-include and must-exclude people, organizations, roles, or topics.
- Public event sources, pasted lists, screenshots, or user-supplied notes.
- Whether to spend extra effort looking for email addresses for selected
  people. Default to no lookup unless the user asks for it or opts in.
- Image preference: no images, public HTTPS image URLs, embedded small images,
  or a ZIP package with image files.

If the user asks for a demo or sample, use synthetic people and organizations.
Do not research or invent real people for demos.

### 2. Build A Candidate List

Use public, event-relevant sources first: official agenda, speaker page,
sponsor or exhibitor page, awards page, attendee directory supplied by the user,
organization pages, and public professional profiles. Do not bypass logins,
paywalls, privacy settings, robots restrictions, or private attendee systems.

Keep research notes outside the final JSON. They can help decide who belongs on
the list, but WhoCue v1 does not support research metadata fields.

### 3. Confirm The Shortlist Before Final JSON

Before producing the import file, show the user a concise shortlist for review.
For each candidate, include:

- Name.
- Public role or organization when known.
- Why this person is relevant to the user's event goal.
- Any uncertainty that needs user confirmation.
- Proposed priority or tags when helpful.

Ask the user to confirm additions, removals, and corrections. Keep the final
list within the user's requested size and the v1 limit of 250 people.

### 4. Enrich Only With Public Or User-Supplied Facts

After shortlist confirmation, optionally enrich the selected people with public
or user-supplied facts that help recognition and conversation. Good enrichment
targets are current title, company, affiliation, public profile links, short
event-relevant notes, and a concise connection topic. Email lookup is optional:
ask the user before doing it because it may add cost, may fail, and may be
unwanted if the user already has the contact information. If the user opts in,
include only email addresses actually found from sources the user wants
represented. Never fabricate, pattern-match, or guess an email address. Never
look up phone numbers ahead of the event; include `phone` only when the user
supplied it.

Omit uncertain ordinary fields rather than guessing. Use
`identity_uncertain: true` only when the selected profile may not identify the
intended person. Do not use it as a general confidence score.

Do not include guessed private contact details, sensitive personal data,
inferred protected traits, rumors, copied private profile content, personal
photos, or private notes unless the user explicitly supplied the data for their
own local import.

### 5. Map Details Into V1 Fields

Map the confirmed details into supported WhoCue v1 fields only:

- Event: `name`, `source_id`, `start_at`, `end_at`, `timezone`, `location`,
  `description`.
- Person: `name`, `source_id`, `title`, `company`, `affiliation`, `notes`,
  `email`, `phone`, `connection_topic`, `identity_uncertain`, `priority`,
  `status`, `tags`, `links`, `image`.
- Links: `linkedin`, `x`, `instagram`, `facebook`, `website`, `blog`.
- Images: `none`, `embedded`, `package_file`, or `remote_url`.

Do not guess or infer `email` or `phone`; phone numbers are user-supplied only.
Do not add unsupported fields, including `citation`, `confidence`,
`speaker_session`, `reason`, `source`, raw `local_file`, activity summaries,
research notes, ranking rationale, citations, or evidence lists. The v1 schema
rejects unknown fields.

### 6. Choose The Image Mode

Choose one image approach per person:

| Situation | Recommended v1 representation |
|-----------|-------------------------------|
| No reliable image | Omit `image` or use `{ "mode": "none" }`. |
| Small image should live inside the JSON | Use `embedded` with canonical padded base64 and a supported MIME type. |
| Local image files should travel with the import | Create a ZIP package and use `package_file` paths inside the package. |
| Public HTTPS image should be fetched during import | Use `remote_url`; prefer `storage_preference: "save_locally"` for event-day reliability. |

Do not use raw local filesystem paths. A path such as
`/Users/name/Desktop/headshot.jpg` or `C:\Users\name\headshot.jpg` cannot be
resolved reliably by mobile document pickers and is unsupported in v1.

### 7. Produce Final JSON Only

When the user says the shortlist is final, output the import file as JSON only:
no Markdown fence, comments, explanation, citations, or text before or after the
JSON. The root object must contain only `schema_version`, `event`, and `people`.

If facts are missing, omit optional fields. Do not output `null`, blank strings,
or placeholder values for unknown real data.

### 8. Validate And Repair

Install dependencies once in the import-spec repo:

```bash
npm ci
```

Validate the repository schema and fixture corpus:

```bash
npm run validate
```

Run the full local check:

```bash
npm run check
```

Use `../schema/whocue-import-v1.schema.json`, `../PROTOCOL.md`, and the valid
fixtures as the contract while reviewing a generated file. The current repo
command validates the checked-in schema and examples; WhoCue also validates the
selected `.json` or `.zip` during import and reports grouped repair guidance.

If WhoCue reports a validation group, repair the smallest relevant part of the
file. Fix structure and version first, then required content, field formats,
limits, duplicates, and image references. Do not paste private records, notes,
URLs, or image data into diagnostics or bug reports.

### 9. Transfer The File To The Phone

Save the final import as either:

- A standalone `.json` file when there are no package images.
- A `.zip` package when using `package_file` images.

Move that `.json` or `.zip` file to a location visible from the phone, such as
Google Drive, OneDrive, Dropbox, iCloud Drive, AirDrop, or another ordinary file
transfer route. On the phone, open WhoCue, choose Import, and select the file
through the document picker.

Do not tell users to import sibling image files next to a JSON file. If local
images are needed, put the JSON manifest and image files in a ZIP package and
reference package-relative paths.

## Reusable Prompt Template

Use this prompt with an external LLM when the user wants help creating a real
WhoCue import file:

```text
You are helping me create a WhoCue v1 import file for one event.

Goal:
- Build a focused event-day list of people I may want to recognize and meet.
- Keep research and shortlist discussion separate from the final import JSON.
- When I approve the shortlist, output final JSON only.

Inputs:
- Event:
- Event date/time/timezone:
- Location:
- My goal for the event:
- Desired list size:
- Must include:
- Must exclude:
- Sources I provide:
- Image preference: no images / public HTTPS URLs / embedded small images / ZIP package images
- Email lookup: no / yes, try to find email addresses for selected people

Workflow:
1. Ask concise questions if required event or goal details are missing.
2. Use only public sources or data I provide.
3. Propose a focused shortlist with name, role or organization, relevance reason,
   uncertainty, and suggested priority or tags.
4. Wait for my confirmation before final JSON.
5. Map only to WhoCue v1 fields from PROTOCOL.md.
6. Omit unknown optional fields. Do not use nulls.
7. Use identity_uncertain only when the selected profile may not identify the intended person.
8. Ask before trying to find email addresses. If I approve email lookup, include only found
   addresses and never make up or guess an email.
9. Never look up phone numbers ahead of time. Include phone only when I provide it.
10. Do not include guessed private contact details, sensitive personal data, copied private
   profile data, or unsupported fields such as citation, confidence, speaker_session,
   reason, source, local_file, activity summaries, research notes, or evidence lists.
11. For local images, use a ZIP package with package_file paths. Do not use raw local paths.
12. After I approve the shortlist, output JSON only with no Markdown fence or explanation.
```

## Final Checklist

Before import, confirm:

- The shortlist was reviewed or intentionally skipped by the user.
- The final output is JSON only.
- The root object has only `schema_version`, `event`, and `people`.
- All objects use only supported v1 fields.
- Required names are present, non-blank, and unique within the event.
- Optional unknowns are omitted, not `null`.
- Date-times include `Z` or a numeric timezone offset.
- URLs use HTTPS.
- Images use only `none`, `embedded`, `package_file`, or `remote_url`.
- Raw `local_file` paths and sibling image-file workflows are absent.
- Email addresses are user-supplied or were found only after explicit user
  approval; no email address is guessed.
- Phone numbers are user-supplied only; no phone number was researched ahead of
  the event.
- Guessed private contact details, sensitive personal data, citations,
  confidence scores, research metadata, and unsupported fields are absent.
- The file or ZIP package has been reviewed against the v1 schema and is ready
  for WhoCue import validation.
- The user has a path to transfer the `.json` or `.zip` to the phone document
  picker.
