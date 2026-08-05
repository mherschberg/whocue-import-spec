# WhoCue People Selection Guide For LLMs

Use this guide before generating a WhoCue v1 import file when the user wants an
LLM to identify people worth meeting at an event.

For the full external workflow, including shortlist confirmation, final
JSON-only output, validation, and phone transfer, start with
`generation-workflow.md`.

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

If you cannot find a candidate list from public event-relevant sources, stop and
ask the user to provide one of the following before selecting real people:

- A pasted list of names.
- A saved HTML page that contains the event people, speakers, attendees,
  sponsors, exhibitors, or nominees.
- A screenshot that shows a list of names.

Prefer primary or event-owned sources over scraped lists, stale profile pages,
or guesses. When public sources conflict, prefer the event page for event role
and the person's or organization's official page for current title.

Do not bypass logins, paywalls, private attendee systems, robots restrictions,
or privacy settings. Do not infer private attendance from social media unless
the user supplied it or the person publicly announced it.

Some of the most useful sources are login-gated. LinkedIn is one example, but the
event's own website, other sites, or the user's own systems such as a CRM may
also be worth signing into. When access to any of these would materially improve
research, ask the user whether they can provide it, and suggest options such as
logging in within the browser the assistant controls or giving the assistant
access to a browser on the user's device where they are already signed in. Use
only access the user provides; never bypass logins or violate site terms.

If the user supplies a long list or the event has many candidate people,
consider splitting the review into groups of about 10 people. If your
environment supports subagents or parallel research workers, assign one group to
each worker and have each return only the strongest event-relevant candidates,
with uncertainty flags and concise rationale. Combine the group results, remove
duplicates, then rank the combined shortlist against the user's goal. Keep the
final WhoCue list within the user's requested size and the v1 schema limit of
250 people.

If the available list contains names but no companies, titles, affiliations, or
event roles, do a limited public identity check before deciding:

- Search LinkedIn, the person's public website, the event site, and ordinary
  web search results for a person with that name.
- Prefer matches connected to companies, topics, communities, sponsors,
  speakers, exhibitors, or partners that are likely to be present at the event.
- Treat the match as uncertain unless the event context clearly disambiguates
  the person.
- If you include the person, set `identity_uncertain: true` when the selected
  profile may not refer to the intended person, and add a neutral caveat in
  `notes` such as `Likely profile based on public search; confirm before the
  event.`
- Do not invent a title, company, affiliation, or link when the public match is
  weak or ambiguous.

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
`hiring`, `customer`, or `investor`. Keep the tag set small and shared across the
event; see the tag budget under "Mapping Research To WhoCue JSON".

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
- `image`: use a public, appropriate photo. If the user's sources do not already
  include photos, tell the user you will search public sources for headshots and
  proceed unless they decline; never use images from private or login-gated pages.

Research each selected person by default before generating JSON — do not rely on
only the roster's name, title, and company. The user may opt out, for example
"just names, fast"; honor that but note that notes and topics will be thin. A
deeper pass over recent public online activity can further tailor notes and
topics; confirm scope with the user when the list is large or costly. For each
selected person:

- Try to find public social media profiles, a personal website, and a blog.
- Review the website and the last few publicly visible social media posts or
  blog entries that are relevant to the event, the user's goal, or a practical
  conversation starter.
- Update `connection_topic` and `notes` with concise, public, event-useful
  context. Phrase suggestions naturally; avoid quoting long passages.
- Add supported HTTPS profile links under `links` when they help verify identity
  or follow up.
- Treat online activity as stale or uncertain when dates, authorship, or identity
  are unclear, and mark identity uncertainty when applicable.
- Skip private, login-gated, sensitive, personal, inflammatory, or unrelated
  material.

Keep each person's research separate. Research each person as an independent unit
and never carry a fact, link, quote, or photo from one person to another. Tie
every detail to the specific person and the source it came from. People with
common names or the same employer are easy to conflate — verify the name and
company match before attributing anything, and set `identity_uncertain: true`
when unsure rather than borrowing details. When subagents or parallel workers are
available, isolating each person (or a small group) in its own context is the
cleanest way to prevent cross-attribution; if you research several people in one
context, re-check attribution before writing each record.

Avoid fields that do not help event-day recognition or conversation, such as
long biographies, exhaustive publication lists, unrelated career history,
personal trivia, sensitive traits, home locations, private contact details, or
speculative relationship notes.

## Source And Privacy Rules

Use only public information or information supplied by the user. Do not include:

- Private attendee lists unless the user explicitly provides them for their own
  local import.
- Guessed personal email addresses, phone numbers, home addresses, birthdays,
  family details, or sensitive personal data.
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
- Use `tags` for scan-friendly categories; keep them short, non-duplicative, and
  drawn from a small shared vocabulary (see "Tag Budget" below).
- Use `links` for identity verification and follow-up context.
- Ask before trying to find email addresses. If the user opts in, include only
  email addresses actually found from sources the user wants represented; never
  fabricate, pattern-match, or guess an email.
- Never look up phone numbers ahead of the event. Use `phone` only when the user
  supplied the number.
- Use `identity_uncertain: true` only when the selected profile may not be the
  intended person; do not use it as a general confidence score.
- Use `image.mode: "remote_url"` only for HTTPS image URLs that are public and
  likely to be stable; otherwise omit `image` or use `{ "mode": "none" }`.
- When recent online activity was reviewed, fold useful public findings into
  `notes`, `connection_topic`, `tags`, and supported `links`; do not add
  unsupported fields for activity summaries, citations, or research metadata.

Do not guess or infer `email` or `phone`. Do not add unsupported fields such as
`source`, `reason`, `confidence`, `speaker_session`, or `citation`. The v1
schema rejects unknown fields. Put compact relevant context into `notes` or
`connection_topic`.

### Tag Budget

Tags are for fast visual scanning, so use a small shared vocabulary per event
rather than many one-off labels. Too many tags is poor event-day UX. The counts
below are approximate guidance, not hard limits. Beyond the `priority` field,
which is separate and does not count toward this budget, aim roughly for:

- Fewer than 30 people: around 3-4 distinct tags.
- 30-100 people: around 6-8 distinct tags.
- More than 100 people: confirm the tagging scheme with the user.

Propose the event's tag list to the user for approval or feedback before applying
it. Prefer tags tied to the user's goal or event role (for example, `speaker`,
`sponsor`, `target`, `gatekeeper`) and avoid near-duplicates. The v1 schema
permits up to 12 tags per person, but that is a hard cap, not a target.

## Final Selection Check

Before generating the import JSON, confirm:

- The list size matches the user's request or a realistic event-day scope.
- Every person has a clear relevance reason.
- Every person has researched, event-specific context, not just their roster
  title, unless the user opted out of research.
- No fact, link, or photo is attributed to the wrong person (watch common names
  and shared employers).
- Tags come from a small shared vocabulary the user approved and roughly follow
  the tag budget for the list size (approximate guidance, not a hard limit).
- The list is not dominated by one organization unless the user asked for that.
- Names are unique after case-insensitive comparison and whitespace cleanup.
- No private or sensitive personal data is included.
- Uncertain facts were omitted or clearly marked as needing confirmation.
- Name-only matches found through LinkedIn or web search are flagged with
  `identity_uncertain: true` when the identity may not be the intended person.
- If recent online activity was used, it came only from public, relevant sources
  and was compressed into schema-supported fields.
- The selected details fit the v1 schema in
  `schema/whocue-import-v1.schema.json`.
