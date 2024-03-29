# @contentsgarten/markdown

## 2.0.0

### Major Changes

- 85edb28: Markdown processing is now async. This is to facilitate future improvements such as code syntax highlighting.
- 85edb28: Removed `<Markdown />` React component. The `@contentsgarten/markdown` package now only turns Markdown into HTML strings. To render Markdown in React, use the `@contentsgarten/html` package to render the HTML string returned by `@contentsgarten/markdown` into a React component.

### Patch Changes

- 85edb28: Fixed a bug where wiki links with a hash in them would not be rendered correctly.

## 1.1.3

### Patch Changes

- Updated dependencies [9dd3a53]
  - @contentsgarten/html@1.3.0

## 1.1.2

### Patch Changes

- Updated dependencies [1010b18]
  - @contentsgarten/html@1.2.0

## 1.1.1

### Patch Changes

- Updated dependencies [cac978d]
  - @contentsgarten/html@1.1.0

## 1.1.0

### Minor Changes

- 08d7777: Added `processMarkdown` function, which when called, would return the HTML as well as a list of headings and internal links.
- 08d7777: The logic for turning HTML into React component has been extracted into a new package, `@contentsgarten/html`. Combined with the feature in `contentsgarten` API that renders Markdown from the server-side, users are encouraged to let the API render the Markdown into HTML and then use the `@contentsgarten/html` package to turn the HTML into React component.

  The `<Markdown />` component that turns Markdown into React component is now deprecated. It will be removed in the next major release.

- 08d7777: Added id and self-anchor to headings. Many thanks to @rayriffy and @gusb3ll for the initial implementation.

  This feature makes the library significantly bigger (from ~200 KB to ~700 KB) due to the inclusion of `rehype` in the package. This makes it unsuitable for use in the browser. However, `contentsgarten` now gains an ability to render Markdown into HTML in the server-side, so consumers should use the API to render Markdown into HTML and then use `@contentsgarten/html` to turn the HTML into React component on the client-side.
