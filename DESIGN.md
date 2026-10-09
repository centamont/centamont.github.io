# Design

The visual world of centamont.com. Product facts live in PRODUCT.md; the brand palette and fonts are fixed by Dylan ("Keep brand", 2026-10-07).

## World

An architect's elevation sheet on ivory vellum. Ink linework, bronze for what has sold, dimension lines, ground hatching and level marks as the only ornament. The footer is the drawing's title block.

## Tokens

- Ink #14161A, ivory #F4F0E8 (page), paper #FAF7F1, bronze #B8976A (fills, marks on ink), bronze text #7A5F3A (text on ivory), muted #55504A, faint #6E675D, rule #D6CDBB.
- Dark scheme: page #121417, text #EDE7DC, accent #C9A877, linework turns ivory.
- Cormorant Garamond 300 for display, 400 for h3 and large reading text; Jost 400 at 18px for body (muted #4A463F), 500 for buttons and small uppercase labels. Nothing below 15px, except small-caps labels and drawing annotations at 13px.

## Composition

- One scroll page with anchored sections (old hash URLs land on their section). One h1 in the hero; every section opens with an h2 and its intro directly beneath it. Order: hero, three practices, developer story and how an engagement begins, private clients, markets, notes, people, the name, contact.
- Three ink grounds: the hero, private clients (the private door) and the name. The footer opens with a full-width CENTAMONT signature. Everything else sits on ivory between 1px rules.
- Section heads share the width: the h2 on the left seven columns, its intro on the right five, opened by a short bronze rule. Markets runs its h2 full-measure at display scale.
- Every section carries one drawing that holds real information: the practice marks, the tower and its live level gauge, the doorway framing the private-client terms, a surveyed markets map (simplified coastline, true coordinates, labels with halos), the deposit schedule, the advisors' table of ten seats (twenty at most), the hundred-blow ruler, and an empty lot on the 404.
- The page closes at display scale: "Write to the partners." and the @centamont handle.
- Lists are ruled rows, never card grids. No eyebrows above headings; meta lines go below the title.
- A faint vellum grain (grain.png) sits over every ground.

## Motion

The signature is a line-drawn 3D massing model (`model.js`, canvas 2D, no libraries) of a generic tower, always captioned as an illustration. It appears twice: in the ink hero, rising floor by floor after the intro and orbiting slowly, with a slight tilt that follows the pointer; and in the developer story, where it frames and fills bronze per step while the camera moves between views.
Supporting moments: a one-time intro per visitor, remembered on the device (a counter from 001 to 100; on the hundredth a bronze hairline splits the stone and the halves part; any click, key or scroll skips it); the hero headline rising line by line as the curtain parts; the doorway drawing itself around the private-client terms; market routes drawing out from Miami on a latitude and longitude chart; the name cut in line by line.
Reduced motion: no intro, no orbit, final states shown at once. Day and night toggle in the header, remembered per visitor.

## Browser surfaces

Links draw their underline (it slips away to the right and returns from the left); buttons fill from the left. Lining, tabular numerals wherever a number counts.

Bronze selection, bronze caret, 1px bronze focus ring at 5px offset, rule-colored scrollbar, tabular numerals in the title block.
