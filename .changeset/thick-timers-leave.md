---
'@contentsgarten/markdown': major
---

Removed `<Markdown />` React component. The `@contentsgarten/markdown` package now only turns Markdown into HTML strings. To render Markdown in React, use the `@contentsgarten/html` package to render the HTML string returned by `@contentsgarten/markdown` into a React component.
