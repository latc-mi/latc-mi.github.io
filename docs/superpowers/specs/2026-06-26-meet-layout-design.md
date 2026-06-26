# Meet Layout — Design

**Date:** 2026-06-26
**Status:** Approved (pending spec review)

## Problem

All four pages under `meets/` use `layout: default` and repeat large amounts of
near-identical HTML:

- A page hero with breadcrumb (only title/date/blurb differ).
- A **Meet Details** card whose Location and Address are identical everywhere.
- A **Registration** card that is byte-identical on the two ribbon/track meets
  and differs only for the championship meet.
- A **"4 & Under Age Group"** card that is byte-identical on all four pages.
- A **Back to Season** button that is identical.

The pages are also inconsistently ordered: `ribbon-meet-june-24-2026` puts the
event line-up first, while the others put meet details first.

We want a dedicated `meet` layout that owns the repeated chrome, normalizes the
ordering, and centralizes shared age-group guidance so it is defined once and
appears on every meet page.

## Approach

**Boilerplate-in-layout, schedule-in-page.** A new `_layouts/meet.html` owns the
hero, Meet Details, Registration, Age Group Considerations, and Back button,
driven by page front matter. Each meet page keeps only its unique **Event
Line-Up** section in its body. Venue, contact, and fee constants are hardcoded
directly in the layout (they rarely change — no new data file needed).

Rejected alternatives: a fully data-driven layout (schedules in YAML) was
heavier than warranted because schedules are irregular (start times, per-event
notes, championship asterisks); a minimal "shared chrome only" layout left most
of the repetition in place.

## Normalized section order (all four pages)

```
Hero (breadcrumb + title + blurb)
→ Event Line-Up               (unique per page — lives in page body)
→ Meet Details                (layout, from front matter)
→ Registration                (layout, variant-driven)
→ Age Group Considerations    (layout, shared/expanded)
→ Back to Season button       (layout)
```

All pages adopt the "line-up first" ordering, since the line-up is the primary
thing visitors come for.

## Page front matter contract

Each `meets/*.html` page declares:

```yaml
---
layout: meet
title: "Ribbon Meet — June 24, 2026"        # browser/SEO title (unchanged)
description: "..."                            # SEO description (unchanged)
permalink: /meets/ribbon-meet-june-24-2026/  # (unchanged)
breadcrumb: "Ribbon Meet — June 24"          # breadcrumb trailing label
hero_title: "Wednesday Meet"                 # h1 main text
hero_accent: "Line-Up"                       # h1 colored accent span
hero_blurb: "June 24, 2026 — Ribbon Meet. All individual events award ribbons…"
meet_date: "Wednesday, June 24, 2026"        # Meet Details "Date" row
format_icon: "🎗️"                            # Meet Details "Format" row icon
format_text: "Ribbon Meet — all individual events award ribbons for 1st – 5th place"
registration: standard                       # "standard" | "championship"
extra_details: []                            # optional extra Meet Details rows
---
```

`extra_details` is an optional list of `{ icon, label, text }` rows inserted into
the Meet Details card after the Format row. The championship page uses it for its
**Entries** ("Maximum of 4 events per athlete, including relays") and **Age
groups** ("Age as of meet day. Male and female events are run separately, except
the 3200m.") rows.

The page **body** contains only the `Event Line-Up` `<section>` exactly as it
exists today.

## Hardcoded constants (in the layout)

Single source of truth, hardcoded in `_layouts/meet.html`:

- **Venue:** Grand Ledge Track Complex
- **Address:** 1211 Lohne Dr., Grand Ledge, MI 48837
  (`https://maps.google.com/?q=1211+Lohne+Dr,+Grand+Ledge,+MI+48837`)
- **Contact:** Rich White — `tel:+15172142958` (517-214-2958)
- **Season registration:** $80 for the season at
  `https://www.grandledgecomets.org` (includes the 51st Annual Championship Meet)
- **Per-meet fee:** $10 · **Championship drop-in:** $15

This reconciles the prior discrepancy: meet pages used "Grand Ledge Track
Complex / 1211 Lohne Dr." while `_data/season.yml` said "Grand Ledge High School
Track Stadium." The meet-page values win. `season.yml` is left unchanged (out of
scope), but its `meet_location` may later be reconciled separately.

## Registration variants

A single conditional in the layout:

- `registration: standard` → Option 1 (pay per meet: $10 · $15 championship),
  Option 2 (season pre-register: $80), Questions.
- `registration: championship` → Drop-in fee ($15 at the gate), Already
  pre-registered? (season $80 includes it), Pre-register online, Questions.

No registration HTML lives in any page.

## Age Group Considerations (shared, expanded)

Replaces the current "4 & Under Age Group" card on every page. Content (grounded
in existing repo facts plus the placing age groups supplied by the user):

- **Placing age groups:** 4 & under, 5 & 6, 7 & 8, 9 & 10, 11 & 12, 13 & 14,
  15 & 16, 17 & 18, 19–29, 30–39, 40–49, 50–59, and 60 & over.
- **Age is determined as of meet day.**
- **4 & under** may compete in Long Jump, Softball Throw, and running distances
  of 400m or less, at every meet.
- **20m Mini Dash** — 2 & under, then 3 & 4 only.
- **5000m run** — ages 7 & up (Track Meet championship event).

## Files

- **New:** `_layouts/meet.html` — renders hero, Meet Details, Registration, Age
  Group Considerations, Back button; wraps `{{ content }}` (the Event Line-Up).
- **Modified:** all four `meets/*.html` pages — replace `layout: default` with
  `layout: meet`, add the new front-matter keys, and strip everything from the
  body except the Event Line-Up section.

## Out of scope

- Moving event schedules into YAML data.
- Changing `_data/season.yml`.
- Restyling cards / new CSS (reuse existing `card`, `info-list`, `page-hero`,
  `section` classes).

## Verification

- `bundle exec jekyll build` succeeds.
- Each rendered meet page shows: hero → line-up → details → registration → age
  groups → back button, in that order.
- Championship page shows the championship registration variant plus its Entries
  and Age groups rows; the other three show the standard registration variant.
- Venue/contact/fee text matches across all pages.
