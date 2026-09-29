# WhoCue Import Instructions For Testers

This package contains the public WhoCue v1 import-file directions and a few
synthetic examples. It is a small email-friendly substitute for the full
import-spec repository.

## What To Import

Do not import this outer ZIP into WhoCue.

Unzip this package first. To try the app with sample data, import:

```text
examples/valid/realistic-demo.zip
```

That ZIP is a ready-to-import WhoCue package with synthetic event data and
synthetic local headshot images.

For a minimal JSON-only import example, use:

```text
examples/valid/minimal.json
```

For a richer JSON example, use:

```text
examples/valid/realistic-demo.json
```

It is the same event as the ZIP, but its people's photos live in the ZIP, so
imported on its own it shows a placeholder for each of the three photos.

## How To Create Your Own Import File

- Read `instructions/human-authoring-guide.md` if writing or reviewing the JSON
  yourself.
- Read `instructions/llm-generator-instructions.md` if asking an AI tool to
  generate the final JSON, and `instructions/generation-workflow.md` for the
  end-to-end workflow and a reusable prompt.
- Read `instructions/people-selection-guide.md` if asking an AI tool to decide
  which event-relevant people should be included.
- Use `PROTOCOL.md` for a concise reference. Its "Re-Importing Into An Existing
  Event" section explains what happens when you import an updated list for an
  event already in WhoCue. Someone you marked met stays met, whatever the file
  says. Your priorities and photos stay unless the file sets new ones. Other
  fields the file leaves out are cleared.
- Use `schema/whocue-import-v1.schema.json` if your tool can validate JSON
  Schema.
- To send photos with your file, select the JSON file and its images folder
  together and compress them into a ZIP (Finder's Compress on a Mac works). Don't
  compress the folder that holds them: image paths in the JSON are relative to
  the ZIP's top level.

WhoCue v1 imports one event plus 1-250 people. Public examples should use
synthetic data unless you are creating a private file for your own local use.

## After The Event

**Export event** in WhoCue saves, copies, or shares the event's current state.
`instructions/handoff-export-processing.md` explains what that export contains
and how to ask an AI tool for a recap, follow-ups, or a fresh import file.

See `LICENSE` for what you may do with these files.
