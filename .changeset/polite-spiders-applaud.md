---
'contentsgarten': minor
---

Added redirection support. By setting `redirect: target` in the frontmatter, will cause `status` to be 301 and `targetPageRef` to be the page to redirect to. Consumers should handle this new status and redirect the user accordingly. Consumers can choose to handle `?redirect=no` to prevent redirection (thus allowing the page to be easily edited) like in MediaWiki.
