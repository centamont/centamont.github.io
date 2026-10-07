# Design

The visual world of centamont.com. Product facts live in PRODUCT.md; the brand palette and fonts are fixed by Dylan ("Keep brand", 2026-10-07).

## World

An architect's elevation sheet on ivory vellum. Ink linework, bronze for what has sold, dimension lines, ground hatching and level marks as the only ornament. The footer is the drawing's title block.

## Tokens

- Ink #14161A, ivory #F4F0E8 (page), paper #FAF7F1, bronze #B8976A (fills, marks on ink), bronze text #7A5F3A (text on ivory), muted #55504A, faint #6E675D, rule #D6CDBB.
- Dark scheme: page #121417, text #EDE7DC, accent #C9A877, linework turns ivory.
- Cormorant Garamond 300 for display and large reading text; Jost 300/400 for body and small uppercase labels (tracking .2em+, labels only).

## Composition

- One scroll page with anchored sections (old hash URLs land on their section). One h1 in the hero; every section opens with an h2 and a short intro set beside it.
- Two ink bands only: private clients (the private door) and the name. Everything else sits on ivory between 1px rules.
- Lists are ruled rows, never card grids. No eyebrows above headings.

## Motion

One authored moment: the tower in the developer story frames floor by floor and fills bronze as steps scroll past (cubic-bezier(.16,1,.3,1), floors staggered 28ms). It is captioned "Illustration, not a real project". Reduced motion turns transitions off; states still change.

## Browser surfaces

Bronze selection, bronze caret, 1px bronze focus ring at 5px offset, rule-colored scrollbar, tabular numerals in the title block.
