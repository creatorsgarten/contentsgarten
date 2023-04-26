---
'contentsgarten': minor
---

Added a `render` option to the `view` procedure. When `true`, contentsgarten will render Markdown into HTML and include the rendered content in `rendered` output. In addition, it will also include a list of `headings`.

Consumers no longer have to parse Markdown into HTML themselves, as it is now done by contentsgarten.
