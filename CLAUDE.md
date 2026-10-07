# Centamont website

Static site for centamont.com: one hand-written `index.html` (a single scroll page with anchored sections; see DESIGN.md and PRODUCT.md), served by GitHub Pages from `main`. `CNAME`, `robots.txt` and `sitemap.xml` sit beside it.

- Pages builds with Jekyll's defaults, which skip dot-folders, so `.claude/` is never published. Don't add a `.nojekyll` file.
- Brand: Cormorant Garamond + Jost; ink #14161A, ivory #F4F0E8, bronze #B8976A. Quiet, editorial luxury. These win over any generic suggestion from the `ui-ux-pro-max`, `design-taste-frontend` or `impeccable` skills (for example, it may propose glassmorphism or bright palettes; don't use them).
- Public-content rules: no project names or renderings without the developer's written approval; never present AI imagery as a real building or listing; keep fees, partner terms and competitor comparisons off the site.
- `.claude/skills/design-taste-frontend/` is a vendored copy of the main skill from github.com/Leonxlnx/taste-skill (MIT, commit e3c9203). The site stays plain HTML/CSS/JS; ignore its React, Tailwind and npm defaults.
- `.claude/skills/impeccable/` is a vendored copy of github.com/pbakaus/impeccable's Claude skill (Apache-2.0, commit 12cddef), copied because the cloud sandbox can't download its signed release bundle. Its design guidance and commands work; its detector engine binary isn't bundled.
- `.claude/skills/{emil-design-eng,animate,improve-animations,review-animations,find-animation-opportunities,animation-vocabulary,break-ui}/` are vendored from github.com/emilkowalski/skill (MIT, commit e8a175d). The Swift, Expo, mobile-native, Apple-design, Sonner, prototype and UI-library skills from that repo were left out as off-stack.
- `.claude/skills/ui-ux-pro-max/` is a vendored copy of github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT, commit 477bcb2). Run its scripts from the repo root.
