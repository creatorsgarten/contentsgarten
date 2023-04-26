---
'@contentsgarten/html': minor
---

Added `renderLink` option to the Html component to allow customize link rendering. Also added `isWikiLink` function that returns `true` if the link is an internal wiki link. This can be used, for example, to add `rel="prefetch"` to internal links to speed up navigation.
