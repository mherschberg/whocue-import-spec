# WhoCue People Selection Guide For LLMs

Use this guide before generating a WhoCue v1 import file when the user wants an
LLM to identify people worth meeting at an event.

WhoCue is not a contact database. It is an event-day recognition and
conversation aid. Select a focused set of people the user can realistically
notice, remember, and approach during one event.

## Inputs To Ask For

If the user has not already provided them, ask concise questions for:

- Event name and date, or a public event page.
- The user's goal for the event: customers, partners, investors, hiring,
  press, mentors, peers, speakers, community leaders, or another goal.
- The user's role, company, industry, and constraints that affect relevance.
- Desired list size. Default to 10-30 people unless the user asks for more.
- Any must-include or must-exclude people, organizations, roles, or topics.

If the user asks for a demo, use clearly synthetic people instead of researching
real people.

## How To Find Candidate People

Use public, event-relevant sources when available:

- Official event agenda, speaker page, sponsor page, exhibitor list, awards
  page, attendee directory, or networking app export supplied by the user.
- Public organization pages for speakers, sponsors, exhibitors, and partners.
- Public professional profiles or personal websites when needed to clarify a
  person's current role or relevance.
- Recent public talks, articles, projects, or company announcements that relate
  to the event topic.

Prefer primary or event-owned sources over scraped lists, stale profile pages,
or guesses. When public sources conflict, prefer the event page for event role
and the person's or organization's official page for current title.

Do not bypass logins, paywalls, private attendee systems, robots restrictions,
or privacy settings. Do not infer private attendance from social media unless
the user supplied it or the person publicly announced it.

## Who To Include

Rank candidates by practical event value for this user:

- Direct fit to the user's stated goal.
- Event role that makes the person likely to be visible or approachable:
  speaker, moderator, organizer, sponsor representative, exhibitor, workshop
  lead, award finalist, or public attendee.
- Organization relevance: customer prospect, partner, investor, employer,
  press outlet, community group, or domain expert.
- Conversation surface: a concrete talk, project, article, product, hiring
  need, investment thesis, shared community, or recent announcement.
- Uniqueness: include people who add distinct value rather than many near
  duplicates from the same organization.

For a small list, prioritize high-confidence relevance over breadth. For a large
list, group tags by reason such as `speaker`, `sponsor`, `partner`, `press`,
`hiring`, `customer`, or `investor`.

## What Information Is Relevant

WhoCue fields should help the user recognize the person and start a useful
conversation.

Good fields to preserve:

- `name`: full public name.
- `title`: current public role, if known.
- `company` or `affiliation`: organization most relevant to the event.
- `connection_topic`: one concise reason to talk, phrased as a conversation
  starter rather than a biography.
- `notes`: short public context that helps the user remember why this person
  matters for this event.
- `priority`: `high` for must-meet, `medium` for useful, `low` for optional.
- `tags`: short grouping labels based on event role or user goal.
- `links`: HTTPS links that help verify identity, usually LinkedIn, personal
  website, company bio, speaker page, or relevant project page.
- `image`: only when a public, appropriate image URL is available or the user
  supplied an image package.

Avoid fields that do not help event-day recognition or conversation, such as
long biographies, exhaustive publication lists, unrelated career history,
personal trivia, sensitive traits, home locations, private contact details, or
speculative relationship notes.

## Source And Privacy Rules

Use only public information or information supplied by the user. Do not include:

- Private attendee lists unless the user explicitly provides them for their own
  local import.
- Personal email addresses, phone numbers, home addresses, birthdays, family
  details, or sensitive personal data.
- Unverified claims, rumors, inferred demographics, or protected traits.
- Images copied from private accounts or pages that are not meant for public
  reuse.

If ordinary field information is uncertain, either omit it or write a neutral
note such as `Public role needs confirmation before the event.` If the profile
may not refer to the intended person, set `identity_uncertain: true`. Do not
fabricate titles, companies, links, or photos to make a record look complete.

## Mapping Research To WhoCue JSON

Map relevance into the existing v1 fields:

- Put the user's main reason to meet the person in `connection_topic`.
- Put short supporting context in `notes`.
- Use `priority` for event-day triage, not social status.
- Use `tags` for scan-friendly categories; keep them short and non-duplicative.
- Use `links` for identity verification and follow-up context.
- Use `identity_uncertain: true` only when the selected profile may not be the
  intended person; do not use it as a general confidence score.
- Use `image.mode: "remote_url"` only for HTTPS image URLs that are public and
  likely to be stable; otherwise omit `image` or use `{ "mode": "none" }`.

Do not add unsupported fields such as `email`, `phone`, `source`, `reason`,
`confidence`, `speaker_session`, or `citation`. The v1 schema rejects unknown
fields. Put compact relevant context into `notes` or `connection_topic`.

## Final Selection Check

Before generating the import JSON, confirm:

- The list size matches the user's request or a realistic event-day scope.
- Every person has a clear relevance reason.
- The list is not dominated by one organization unless the user asked for that.
- Names are unique after case-insensitive comparison and whitespace cleanup.
- No private or sensitive personal data is included.
- Uncertain facts were omitted or clearly marked as needing confirmation.
- The selected details fit the v1 schema in
  `schema/whocue-import-v1.schema.json`.
