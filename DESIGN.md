# Design

The visual world of centamont.com. Product facts live in PRODUCT.md; the brand palette and fonts are fixed by Dylan ("Keep brand", 2026-10-07).

## World

An architect's elevation sheet on ivory vellum. Ink linework, bronze for what has sold, dimension lines, ground hatching and level marks as the only ornament. The footer is the drawing's title block.

## Tokens

- Ink #14161A, ivory #F4F0E8 (page), paper #FAF7F1, bronze #B8976A (fills, marks on ink), bronze text #7A5F3A (text on ivory), muted #4A463F, faint #6E675D, rule #D6CDBB.
- Dark scheme: page #1B1E23, paper #21252A, ink bands #0D0E11 framed in bronze hairlines, text #EDE7DC, muted #C2BBAF, faint #9A9388, rule #2F3236, accent #C9A877, linework turns ivory.
- Cormorant Garamond 300 for display, 400 for h3 and large reading text; Jost 400 at 18px for body (muted #4A463F), 500 for buttons and small uppercase labels. Nothing below 15px, except small-caps labels and drawing annotations at 13px.
- Type ladder (tokens in `:root`, one size per role; a heading is never smaller than one below it in rank, and nothing but the close outranks the h1). Values at 1440x900, then 390:
  - `--t-display` 136 / 48: the close, "Write to the partners."
  - `--t-hero` 112 / 48: the one h1 (smaller on short windows, so the buttons stay above the fold; there the spreads can stand larger than it).
  - `--t-spread` 104 / 42: the full-measure spreads, the markets h2 and the name.
  - `--t-chapter` 81 / 39: the chapter openers (services, developers) and every subpage's h1 except the report's.
  - `--t-section` 56 / 39: the back-matter heads (journal, people, questions) and the private door. On phones every section head shares the chapter size, except the markets spread and the close.
  - `--t-head` 40 / 29: every h3, and a note's h2.
  - `--t-lede` 32 / 24: the lead lines that answer a heading across a spread (the two ink bands, the advisors).
  - `--t-big` 26 / 21: other lead lines, the questions, standfirsts.
  - `--t-num` 156 / 96: the developer story's step numerals, the chapter's drawing-sheet signature.
  Tablets (521 to 820px) lift chapter and spread to keep their rank over the back matter. Past 1440px the heads and lead lines keep opening up a little (the close 155, the chapters 94 and an h3 46 at 1920), as the column does from 1600px; the h1 holds at 116, so the hero tower keeps its frame, and the spreads stay under it; the reading pages' titles (the notes, privacy, the 404) hold at 81, since their 880px column does not widen.

## Composition

- One scroll page with anchored sections (old hash URLs land on their section). One h1 in the hero; every section opens with an h2 and its intro directly beneath it. Order: hero, three practices, developer story and how an engagement begins, private clients, markets, notes, people, the name, contact.
- Three ink grounds: the hero, private clients (the private door) and the name. The footer opens with a full-width CENTAMONT signature. Everything else sits on ivory between 1px rules.
- Section heads share the width: the h2 on the left seven of twelve columns, its intro on the right five, opened by a short bronze rule, the two on one last baseline. The two chapter openers (services, developers) set a full-measure h2 on two lines and step the intro down into the right five; markets runs its h2 full-measure at spread scale; the advisors keep their intro under the h2 and open the right five with the lead line, under the bronze rule, on the heading's first baseline; the questions set their head and intro on five columns, held while the list passes on seven. In the name band the lead line stands on the left under the ruler's first half, the paragraph on the right under its second.
- A padding score: chapter openers (services, developers, markets) open loud, clamp(96px,12vw,176px) above; the back matter (journal, people, questions) reads quiet, clamp(64px,6.6vw,96px) above and below; the ink bands and the close keep their own.
- Every section carries one drawing that holds real information: the practice marks, the tower and its live level gauge, the doorway framing the private-client terms, a surveyed markets map (simplified coastline, true coordinates, labels with halos) with a South Florida detail and a world key, the deposit schedule, the advisors' table of ten seats (twenty at most), the hundred-blow ruler, and an empty lot on the 404.
- The page closes at display scale: "Write to the partners.", its intro with the @centamont handle across from it, then the letter, with the handle again as one quiet line beside its button.
- Lists are ruled rows, never card grids. No eyebrows above headings; meta lines go below the title.
- A faint vellum grain (grain.png) sits over every ground.

## Motion

The signature is a line-drawn 3D massing model (`model.js`, canvas 2D, no libraries) of a generic tower, always captioned as an illustration. It appears twice: in the ink hero, rising floor by floor after the intro and orbiting slowly, with a slight tilt that follows the pointer; and in the developer story, where it frames and fills bronze per step while the camera moves between views.
Supporting moments: a one-time intro per visitor, remembered on the device (a counter from 001 to 100; on the hundredth a bronze hairline splits the stone and the halves part; any click, key or scroll skips it); the hero headline rising line by line as the curtain parts; the doorway drawing itself around the private-client terms; market routes drawing out from South Florida on a latitude and longitude chart; the name cut in line by line.
Reduced motion: no intro, no orbit, final states shown at once. Day and night toggle in the header, remembered per visitor.

## Browser surfaces

Links draw their underline (it slips away to the right and returns from the left); buttons fill from the left. Lining, tabular numerals wherever a number counts.

Bronze selection, bronze caret, 1px bronze focus ring at 5px offset, rule-colored scrollbar, tabular numerals in the title block.
