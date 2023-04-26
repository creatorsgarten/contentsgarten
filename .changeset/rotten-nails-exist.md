---
'@contentsgarten/markdown': minor
---

The logic for turning HTML into React component has been extracted into a new package, `@contentsgarten/html`. Combined with the feature in `contentsgarten` API that renders Markdown from the server-side, users are encouraged to let the API render the Markdown into HTML and then use the `@contentsgarten/html` package to turn the HTML into React component.

The `<Markdown />` component that turns Markdown into React component is now deprecated. It will be removed in the next major release.
