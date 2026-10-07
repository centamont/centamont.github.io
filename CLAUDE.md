# Centamont website

Static site for centamont.com: one hand-written `index.html` (hash-routed pages), served by GitHub Pages from `main`. `CNAME`, `robots.txt` and `sitemap.xml` sit beside it.

- Pages builds with Jekyll's defaults, which skip dot-folders, so `.claude/` is never published. Don't add a `.nojekyll` file.
- Brand: Cormorant Garamond + Jost; ink #14161A, ivory #F4F0E8, bronze #B8976A. Quiet, editorial luxury. These win over any generic suggestion from the `ui-ux-pro-max` skill (for example, it may propose glassmorphism or bright palettes; don't use them).
- Public-content rules: no project names or renderings without the developer's written approval; never present AI imagery as a real building or listing; keep fees, partner terms and competitor comparisons off the site.
- `.claude/skills/ui-ux-pro-max/` is a vendored copy of github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT, commit 477bcb2). Run its scripts from the repo root.
