---
"contentsgarten": patch
---

Fixed the REST API's `GET /pages` (search) endpoint always rejecting any non-empty `q` query parameter with a 422. Elysia parses query values that look like JSON into objects before schema validation runs, but the route declared `q` as a plain string — so any real query (only the empty/default case worked) failed validation.
