# contentsgarten

## 1.5.0

### Minor Changes

- cac978d: Added an _experimental_ `getpage` Liquid filter to query the existence of another page or access its front-matter.

### Patch Changes

- 4fbf8a7: Fixed a bug where special pages do not return HTML content despite `render` flag set to true.
  - @contentsgarten/markdown@1.1.1

## 1.4.0

### Minor Changes

- 08d7777: Added a `render` option to the `view` procedure. When `true`, contentsgarten will render Markdown into HTML and include the rendered content in `rendered` output. In addition, it will also include a list of `headings`.

  Consumers no longer have to parse Markdown into HTML themselves, as it is now done by contentsgarten.

### Patch Changes

- Updated dependencies [08d7777]
- Updated dependencies [08d7777]
- Updated dependencies [08d7777]
  - @contentsgarten/markdown@1.1.0

## 1.3.0

### Minor Changes

- c7a92f4: expose lastModified and lastModifiedBy from view API

## 1.2.0

### Minor Changes

- f245bdf: expose frontMatter

## 1.1.0

### Minor Changes

- 5422e86: add frontmatter data to local cache, so that they can be queried easily in the db
- 574962d: add frontmatter support
- 6a26671: removed legacyCache option
