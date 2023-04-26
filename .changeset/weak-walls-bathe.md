---
'@contentsgarten/markdown': minor
---

Added id and self-anchor to headings. Many thanks to @rayriffy and @gusb3ll for the initial implementation.

This feature makes the library significantly bigger (from ~200 KB to ~700 KB) due to the inclusion of `rehype` in the package. This makes it unsuitable for use in the browser. However, `contentsgarten` now gains an ability to render Markdown into HTML in the server-side, so consumers should use the API to render Markdown into HTML and then use `@contentsgarten/html` to turn the HTML into React component on the client-side.
