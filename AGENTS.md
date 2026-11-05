<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:customer-intelligence-rules -->
# Customer Intelligence Isolation Rule

@[customer-intelligence](.agents/rules/customer-intelligence.md)

For shop, catalog, and e-commerce tasks:
- Do not read, search, edit, or report on `src/customer-intelligence/`, its API route re-exports (`src/app/api/admin/intelligence/*`, `src/app/api/cron/intelligence/*`, `src/app/api/intelligence/track-hesitation/*`), admin intelligence pages (`src/app/admin/intelligence/*`), `HesitationTracker`, or `tests/customer-intelligence-exclusion.test.ts` unless a task explicitly names them.
- Exclude `src/customer-intelligence` from grep, find, and git commands (e.g. `--glob '!src/customer-intelligence/**'`).
- Do not include customer-intelligence in impact analysis or summaries.
<!-- END:customer-intelligence-rules -->
