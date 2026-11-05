# Customer Intelligence Isolation Rule

For shop, catalog, and e-commerce tasks:
- **Do NOT read, search, edit, or report on**:
  - `src/customer-intelligence/`
  - Its API route re-exports (`src/app/api/admin/intelligence/*`, `src/app/api/cron/intelligence/*`, `src/app/api/intelligence/track-hesitation/*`)
  - The admin intelligence dashboard pages (`src/app/admin/intelligence/*`)
  - `src/components/HesitationTracker.tsx`
  - `tests/customer-intelligence-exclusion.test.ts`
  unless a user task explicitly names them.
- **Tool Exclusions**: Exclude `src/customer-intelligence` from grep, find, search, and git commands (e.g. `--glob '!src/customer-intelligence/**'` or pathspec `':!src/customer-intelligence'`).
- **Reporting & Summaries**: Do not include `src/customer-intelligence` in impact analysis, file listings, or task summaries.
