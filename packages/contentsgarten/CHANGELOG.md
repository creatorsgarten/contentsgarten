# contentsgarten

## 2.1.0

### Minor Changes

- beeacd2: Added `getContributors` API

## 2.0.1

### Patch Changes

- Updated dependencies [85edb28]
- Updated dependencies [85edb28]
- Updated dependencies [85edb28]
  - @contentsgarten/markdown@2.0.0

## 2.0.0

### Major Changes

- 4d47bab: Removed the ACL system, in favor of simple code-based configuration.

  In previous versions, granting edit access to the wiki is done by creating a `contentsgarten.config.yml` with configuration like this:

  ```yaml
  policies:
    - name: Allow anyone in "creators" team to edit the page contents
      permission: edit
      team: creatorsgarten/creators
  ```

  Now, the authorization logic is configured directly in the code. When calling `createContentsgarten`, you can pass in a `authorizer` function that determines whether the user can edit the wiki or not.

  ```js
      authorizer: async ({ gitHub, user }) => {
        if (await gitHub.isUserInTeam(user, 'creatorsgarten', 'creators')) {
          return { granted: true }
        }
        return {
          granted: false,
          reason: 'You should be in the "creators" team to edit the wiki.',
        }
      },
  ```

  This eliminated ~400 lines of code and the error messages are now more user-friendly.

### Minor Changes

- 2226727: Allow starting pageRef with a number

### Patch Changes

- 2226727: Fixed an issue where the page cache data is not purged from the memory cache after saving a page via an API.

## 1.8.1

### Patch Changes

- @contentsgarten/markdown@1.1.3

## 1.8.0

### Minor Changes

- 4e5fa18: Search API: Added ability to search by `pageRef`.

  - `{"pageRef":"MainPage"}` — Looks up a single page.
  - `{"pageRef":["MainPage","Syntax"]}` — Looks up multiple pages.

- 4e5fa18: Search API: Added ability to match pages that contains a property (of any value).

  - `{"match":{"event":true}}` — Looks up pages that have an `event` property with any value.

## 1.7.0

### Minor Changes

- 060294f: **Syntax change:** `query` method to be changed to `search` instead due to method conflicts with `@trpc/client`

## 1.6.0

### Minor Changes

- f47e19a: **Syntax change:** The `getpage` filter has been renamed to `get_page`.
- aebab74: The `view` method now returns a `perf` array which contains the performance logs
- cfd983a: Added redirection support. By setting `redirect: target` in the frontmatter, will cause `status` to be 301 and `targetPageRef` to be the page to redirect to. Consumers should handle this new status and redirect the user accordingly. Consumers can choose to handle `?redirect=no` to prevent redirection (thus allowing the page to be easily edited) like in MediaWiki.
- aebab74: Add a `query` API to query pages from the page database.
- f47e19a: Added `get_subpages` and `query_pages` Liquid filters.
- cfd983a: **Syntax change:** The [`jekyllInclude`](https://liquidjs.com/tutorials/options.html#Jekyll-include) option in Liquid.js has been turned off.

### Patch Changes

- cfd983a: Fixed a bug where authorship information is temporarily lost when saving a page.
  - @contentsgarten/markdown@1.1.2

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
