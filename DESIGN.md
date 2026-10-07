# Design

The visual world of centamont.com. Product facts live in PRODUCT.md; the brand palette and fonts are fixed by Dylan ("Keep brand", 2026-10-07).

## World

An architect's elevation sheet on ivory vellum. Ink linework, bronze for what has sold, dimension lines, ground hatching and level marks as the only ornament. The footer is the drawing's title block.

## Tokens

- Ink #14161A, ivory #F4F0E8 (page), paper #FAF7F1, bronze #B8976A (fills, marks on ink), bronze text #7A5F3A (text on ivory), muted #55504A, faint #6E675D, rule #D6CDBB.
- Dark scheme: page #121417, text #EDE7DC, accent #C9A877, linework turns ivory.
- Cormorant Garamond 300 for display, 400 for h3 and large reading text; Jost 400 at 18px for body (muted #4A463F), 500 for buttons and small uppercase labels. Nothing below 15px.

## Composition

- One scroll page with anchored sections (old hash URLs land on their section). One h1 in the hero; every section opens with an h2 and its intro directly beneath it. Order: hero, three practices, developer story and how an engagement begins, private clients, markets, notes, people, the name, contact.
- Three ink grounds: the hero, private clients (the private door) and the name. The footer opens with a full-width CENTAMONT signature. Everything else sits on ivory between 1px rules.
- Lists are ruled rows, never card grids. No eyebrows above headings.

## Motion

The signature is a line-drawn 3D massing model (`model.js`, canvas 2D, no libraries) of a generic tower, always captioned as an illustration. It appears twice: in the ink hero, rising floor by floor after the intro and orbiting slowly, with a slight tilt that follows the pointer; and in the developer story, where it frames and fills bronze per step while the camera moves between views.
Supporting moments: a one-time intro per session (a counter from 001 to 100, "the hundredth blow", then the curtain lifts); the private client band opening like a door as it arrives; market routes drawing out from Miami on a latitude and longitude chart; the name cut in line by line.
Reduced motion: no intro, no orbit, final states shown at once. Day and night toggle in the header, remembered per visitor.

## Browser surfaces

Bronze selection, bronze caret, 1px bronze focus ring at 5px offset, rule-colored scrollbar, tabular numerals in the title block.
