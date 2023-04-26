---
'@contentsgarten/markdown': minor
---

Added id and self-anchor to headings.

This feature makes the library significantly bigger (from ~200 KB to ~700 KB) due to the inclusion on `rehype`. This makes it unsuitable for use in the browser. However, `contentsgarten` now gains an ability to render Markdown into HTML in the server-side, so consumers should use the API to render Markdown into HTML and then use `@contentsgarten/html` to turn the HTML into React component on the client-side.
