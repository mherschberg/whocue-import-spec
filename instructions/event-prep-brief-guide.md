# Writing a WhoCue Event Prep Brief

An Event Prep **Brief** tells an external AI which people would be useful to you at a particular
kind of event. WhoCue stores Briefs locally and adds the selected Brief to its fixed Event Prep
prompt. The Brief's title is only an app label and is not sent to the AI.

## A useful starting structure

Briefs are free-form prose. These four labels make a short Brief easier to edit, but none is
required:

```text
Goal: What outcome do you want from meeting people at this event?
My context: What should the AI know about your role, organization, product, hiring need, or search?
Prioritize: What makes a person or organization a strong fit?
Deprioritize: What looks superficially relevant but is not useful?
```

Aim for a few specific lines. Explain the context that a title alone cannot carry. For example,
“Customers” is weak; the product, customer type, problem, buying role, market, and exclusions make
the selection useful.

## Examples of useful detail

- **Customers:** product or service, ideal customer, organization size, buyer/user roles, market,
  geography, buying signal, and exclusions.
- **Investors:** company, stage, market, amount or kind of help sought, thesis fit, geography, and
  conflicting investments.
- **Partners:** desired partnership type, complementary capability, audience, distribution,
  technology, referral value, and conflicts.
- **Candidates:** role, responsibilities, seniority, essential skills, location/work arrangement,
  and whether useful referrers should also be included.
- **Employers:** target roles, level, skills, industries, location/work arrangement, and people who
  may know relevant teams or hiring needs at their companies.
- **General networking:** current work, professional interests, topics worth discussing, kinds of
  complementary experience, and people unlikely to be useful.

Avoid sensitive personal criteria, inferred protected traits, private data, and instructions to
guess facts. Focus on professional relevance that can be supported by the event material or public
sources the user chooses.

## Asking an AI to help write a Brief

You can give an AI this request and then edit its result:

```text
Help me write a concise WhoCue Event Prep Brief. Ask only the questions needed to understand my
goal, relevant context, strong-fit criteria, and exclusions. Then return plain text using Goal,
My context, Prioritize, and Deprioritize. Keep it under 1,500 characters. Do not invent details.
```

## Custom full instructions

Advanced users may download or copy WhoCue's public Event Prep instructions and maintain a
personal version outside the app. A custom version is the user's responsibility and is not stored,
validated, fetched, or executed by WhoCue. See [`event-prep-v1.0.0.md`](event-prep-v1.0.0.md) for
the current published instructions.
