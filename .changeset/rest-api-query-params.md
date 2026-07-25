---
"contentsgarten": major
---

Added an Elysia-based REST + OpenAPI API alongside the existing tRPC router (`about`, `user`, `page`, `page-contributors`, `page-permission`, `page` (save), `pages` (search)). `pageRef` is passed as a query parameter rather than a URL path segment, since OpenAPI/HTTP path-parameter tooling (e.g. `openapi-fetch`) can't correctly round-trip multi-segment values like page refs through a path segment.
