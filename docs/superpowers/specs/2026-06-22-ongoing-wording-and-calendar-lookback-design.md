# Ongoing wording + training-calendar look-back — Design

**Date:** 2026-06-22
**Status:** Approved

## Goal

The site currently reads as a one-time "2025 Spring Season" event. It is meant to be
ongoing. Two changes:

1. **Wording** — remove single-year/single-season framing so the site reads as ongoing,
   while keeping the seasonal concept the club actually uses.
2. **Training calendar** — hide past training dates by default in both the list and
   calendar views, with a way to look back at older ones.

## 1. Wording

Season is renamed **"Summer Track Season"** (no year). The hardcoded year is removed
everywhere, and displayed date fields drop the year so they read as recurring annual
dates.

| File | Change |
|---|---|
| `_data/season.yml` | `name: "Summer Track Season"`; remove `year:`; strip years from `registration_open`, `registration_close`, `season_start`, `season_end`, and each `upcoming_milestones` date. |
| `_config.yml` | `current_season: "Summer Track Season"`; remove `season_year`. |
| `season.html` | Front-matter `title` / `hero_title` / `description` / `breadcrumb` drop "2025"; body `{{ ...year }} season` phrasings become "this season" / "the LATC track & field season". |
| `meets.html` | SEO `description` and the `{{ site.data.season.year }} season` usages become year-free ("Season Meet Schedule", "this season"). |
| `registration.html` | SEO `description` and `{{ site.data.season.year }} season` usages become year-free. |
| `_includes/footer.html` | Uses data fields only — picks up changes automatically. |

**Out of scope (intentionally left):** the concrete scheduled dates in `_data/meets.yml`
and the "Summer 2026" labels in `training.html` / `training-plan.md`. Those are current,
real event content the club updates as the calendar moves, not the single-season framing
being removed.

## 2. Training calendar look-back

`site.data.season.name` already drives the heading, so it updates automatically.

All past/future logic runs **at runtime in JS** (`assets/js/main.js`) — a static Jekyll
build cannot know the visitor's current date.

### List view (`training.html` + `main.js`)
- Each `.training-week` gets `data-end-date="{{ week.end_date }}"`.
- On load, weeks whose end date is before today are hidden.
- A toggle button (`▸ Show N previous weeks` / `▾ Hide previous weeks`) is inserted at the
  top of the list view to reveal/collapse the hidden weeks.
- If there are no past weeks, no button is shown.
- Edge case: if *every* week is past, all weeks stay hidden behind the toggle and the
  toggle still works (nothing is silently lost).

### Calendar view (`main.js`)
- Default the month grid to the **current month** (today) instead of the first training
  month.
- The existing `←` previous-month arrow is the "look back" — already implemented, no
  change needed.
- Individual past days within the current month are NOT blanked out (that would read as
  broken mid-month).

## Non-goals
- No new files, no build tooling. Template/data/JS edits only.
- No commit/push — `main` publishes the live site; changes are left in the working tree
  for review.
