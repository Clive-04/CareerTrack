# CareerTrack visual directions (pass 2)

Inputs: the current interface (captured at 390, 834, 1366, and 1920 px against seeded data), the logo (deep indigo "C" whose tail becomes a rising cyan arrow with a node), and the real workflows: save a role, compare a resume, apply, move through stages, prepare for interviews.

Problems observed in the current UI that both directions must solve:

- Jobs renders every full description inline. On a laptop the page is ~4,750 px tall for seven jobs; comparing roles means scrolling past paragraphs.
- Overview reports counts but never answers "what should I do now?" An application with no reply for 19 days, an offer awaiting a decision, and an interview tomorrow look the same as everything else.
- Page titles use a serif for flavor rather than meaning.
- Success feedback is an inline banner that pushes content down; loading is a lone spinner.
- Form errors appear once at the bottom of the form, away from the field.

---

## Direction A: Career dossier

**Concept.** Each job, application, and resume is a record in a personal dossier. Pages are an index of records on the left and the open record on the right, like flipping through an organized file. Overview reads as a briefing: what needs attention, what is coming up, where things stand.

**Palette**

| Token | Hex | Purpose |
|---|---|---|
| Ink | `#18162E` | Body text, navigation rail |
| Brand indigo | `#2D1B8F` | The one primary action per screen, selected navigation, links. Taken directly from the logo; it is the product's identity, not a generic SaaS blue. |
| Track teal | `#0A7C8F` | Progress, the career track, informational states, focus ring |
| Canvas | `#F2F3F5` | Page background (cool grey, not cream) |
| Record | `#FFFFFF` | Only on records and panels, so white means "this is a thing you can open" |
| Rule | `#D9DAE3` | Separators and borders |

Semantic: success `#1E7046`, warning `#93560A`, danger `#B42318`, each with a pale tint and always paired with text or an icon.

**Typography.** IBM Plex Sans only, 400/500/600/700. Plex was drawn for IBM's engineering heritage: credible and precise without being cold. The serif is dropped; hierarchy comes from size, weight, and spacing. Scale (1.2 ratio, 16 px base): 12, 13, 14, 16, 19, 23, 28. Line height 1.5 body, 1.25 headings. Tabular numerals for dates, counts, salaries, and scores only.

**Surfaces.** Canvas with white records; 1 px rules instead of shadows; one raised shadow for menus, sheets, and toasts. Radius 6 px on controls, 10 px on panels; status chips are the only pills. Spacing on a 4 px grid; sections separated by 32 px.

**Navigation and layout.** Ink rail with two labeled groups (Job search, Materials). Content max width 1200 px, left aligned to the rail. Jobs uses a split view on wide screens; on phones the list and the record are separate views with a back control.

```
Overview (laptop)                         Jobs (laptop)
+------+---------------------------------+ +------+--------------+------------------+
| rail | Overview              [Add job] | | rail | Jobs  [search] |  Frontend Dev    |
|      | Next steps          | This week | |      | > Frontend Dev |  Northwind · Rem |
|      | - Interview tmrw    | Thu 28    | |      |   Northwind  ● |  [Analyze] [Track]|
|      | - Decide on offer   |  Panel    | |      |   Assoc. SWE   |  Match 84/100    |
|      | - Follow up (19d)   | Tue 3     | |      |   Harbor       |  ---------------- |
|      | - Re-run match      |  On-site  | |      |   UI Engineer  |  About the role  |
|      |------------------------------------| |      |   Lumen        |  Responsibilities|
|      | Pipeline o-o-●-o-o-o  counts      | |      |   ...          |  Requirements    |
|      | Recent activity (list)            | |      |                |                  |
+------+---------------------------------+ +------+--------------+------------------+
```

**Signature element.** The career track: a thin line with a stop per stage, from the logo's arrow and node. It appears only where progress is the point: application rows, the pipeline, and the record header. Changing status animates the fill along the line.

**Why it fits CareerTrack.** The product is a set of records the user curates (jobs, applications, resumes). An index plus open record lets users compare roles at a glance and read one in full. It keeps the logo's identity and gives Overview a clear job: a briefing.

**Generic conventions avoided.** Metric-card rows; card per list item; gradient hero; glow/glass; eyebrow labels; serif-for-premium; AI sparkle styling; Kanban for its own sake.

---

## Direction B: Progress ledger

**Concept.** The job search as a dated ledger. Every page is organized by time: Overview is a week agenda followed by a running ledger of events (applied, moved to interview, offer). Jobs and applications are dense dated tables.

**Palette**

| Token | Hex | Purpose |
|---|---|---|
| Graphite | `#1F2328` | Text, navigation |
| Ledger green | `#1E7A5A` | Primary actions, progress |
| Attention amber | `#B45309` | Due and overdue items |
| Paper grey | `#F5F5F2` | Canvas |
| Surface | `#FFFFFF` | Tables |
| Hairline | `#E2E2DC` | Table rules |

**Typography.** Schibsted Grotesk only (an editorial newsroom grotesque), 400/500/700. Scale 12, 14, 16, 18, 22, 28. Dates set in a fixed left gutter with tabular figures.

**Surfaces.** Flat; hairline table rules; zero shadow; 4 px radius.

**Navigation and layout.** Top workspace header with tabs; full-width tables; a fixed 96 px date gutter on every list.

```
Overview                                  Applications
+---------------------------------------+ +---------------------------------------+
| CareerTrack  Overview Jobs Apps ...    | | CareerTrack  Overview Jobs Apps ...    |
| This week                              | | Date   | Role / company   | Stage     |
| Thu 28 | Panel · Northwind             | | Nov 18 | Assoc SWE Harbor | Assessment|
| Tue 3  | On-site · Pinecrest           | | Nov 15 | Frontend Pinecr. | Interview |
| Ledger                                 | | Nov 08 | Data Viz Calder  | Applied   |
| Nov 25 | Moved to Final interview      | | ...                                    |
| Nov 18 | Applied · Harbor & Co.        | |                                        |
+---------------------------------------+ +---------------------------------------+
```

**Signature element.** The ledger margin: a date gutter running down every page.

**Why it might fit.** Job searching is time-bound; interviews and follow-ups are dated.

**Generic conventions avoided.** Cards, shadows, gradients, metric tiles.

---

## Comparison and choice

| Criterion | A: Career dossier | B: Progress ledger |
|---|---|---|
| Comparing roles (Jobs) | Split view: scan an index, read one record in full | Dense table, but descriptions still need a separate view |
| Resumes and skills | Records fit naturally | Not time-based; the date gutter becomes noise |
| "What should I do now?" | Explicit Next steps briefing | Agenda covers interviews only; follow-ups and offers need extra columns |
| Identity | Keeps the logo's indigo and the track motif | Replaces the brand color with green; disconnects from the logo |
| Distinctiveness | Track motif + record/index structure | Date gutter and hairline tables drift toward the generic broadsheet look |
| Mobile | Index and record as separate views; clear | Wide tables need horizontal scrolling or heavy reflow |

**Chosen: Direction A, Career dossier.** It fixes the most measurable problem (Jobs is unscannable), serves every workflow rather than only the dated ones, and keeps CareerTrack recognisably CareerTrack. From B it borrows one idea: a dated "This week" agenda on Overview, where time genuinely is the organizing principle.

## Motion system (chosen direction)

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 100 ms | Pressed, hover, checkbox |
| `--dur-fast` | 160 ms | Menus, chips, nav selection, track fill |
| `--dur-panel` | 260 ms | Dialogs, side sheets, toasts |
| `--dur-page` | 420 ms total | One entrance per route: page header, then the first region 60 ms later |
| `--stagger` | 60 ms | Only between the header and the first region |
| `--shift` | 8 px | Entrance/exit travel |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Entrances |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits |

Rules: the route entrance plays once per route per browser session; newly created list items settle in once; skeletons mirror the list rows they replace; `prefers-reduced-motion` removes movement but keeps color and state changes.
