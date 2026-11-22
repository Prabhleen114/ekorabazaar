# Vercel Function Storage Limit Audit & Footprint Optimization

**Incident:** Vercel Function Storage at 100% (10 GB Limit Reached)  
**Project:** `ekorabazaar`  
**Team / Org:** `ekoratech` (`team_viFz5ME80BZJP7B29YxyF7Xd`)  
**Project ID:** `prj_UT2gnyH7GDWlf2tPVCorOG9af19Z`  
**Plan:** Free (Hobby)  
**Warning:** Older deployments may be automatically pruned; builds risk failing due to cumulative deployment storage consumption.

---

## 1. What Consumes "Function Storage" on Vercel?

Unlike Postgres storage or Blob storage, **Vercel Function Storage** represents the aggregate size of all compiled serverless and edge function bundles, including:
1. **Cumulative Deployment Storage:** On the Hobby plan, every active deployment retains its built function artifacts until deleted. A project with 50-100 historical deployments accumulates function bundles until the 10 GB quota is exhausted.
2. **Heavy Native & Unused Dependencies:** Native C++ Node.js modules (such as `canvas`) download large OS binaries (30-60 MB on Linux) into `node_modules` and get bundled or traced into serverless function packages.
3. **Unignored Non-Production Assets in Repository:** Large static asset directories, such as `EKORA BAZAAR CATALOGUES/` (88+ MB of raw supplier PDFs), CSV exports, test suites, and documentation, were uploaded on every deployment commit because no `.vercelignore` existed.
4. **Output File Tracing:** Without `outputFileTracingExcludes`, Next.js serverless bundles include traced filesystem artifacts.

---

## 2. Optimizations Implemented in Repository

### A. Created `.vercelignore`
Excluded heavy catalogs, PDFs, CSVs, documentation, tests, and temporary directories from deployment uploads:
```gitignore
EKORA BAZAAR CATALOGUES/
*.pdf
*.csv
docs/
tests/
scripts/
.agents/
.gemini/
mcp/
*.tsbuildinfo
*.log
```
**Impact:** Immediately eliminates 100+ MB of unneeded binary assets per deployment upload.

### B. Pruned Unused Heavy Dependencies from `package.json`
- **`canvas` (`^3.2.3`):** Removed from dependencies. (Saves ~40-60 MB per deployment container).
- **`jimp` (`^1.6.1`):** Removed from dependencies. Eliminates 30+ sub-packages (`@jimp/*`).
- Neither library was imported anywhere in `src/`.

### C. Added `outputFileTracingExcludes` to `next.config.ts`
Configured Next.js output file tracing to explicitly prevent serverless functions from tracing non-production directories:
```typescript
  outputFileTracingExcludes: {
    '*': [
      './EKORA BAZAAR CATALOGUES/**/*',
      './docs/**/*',
      './scripts/**/*',
      './tests/**/*',
      './**/*.pdf',
      './**/*.csv',
    ],
  },
```

---

## 3. Recommended Vercel Dashboard Actions

To immediately free the accumulated 10 GB storage on the Vercel cloud side:

1. **Prune Obsolete Deployments:**
   - Go to [Vercel Dashboard](https://vercel.com/ekoratech/ekorabazaar/deployments).
   - Filter by `Preview` or old non-production deployments.
   - Delete obsolete past preview deployments (older than 7-14 days).
2. **Review Deployment Retention Policy:**
   - Navigate to **Project Settings > General > Deployment Retention**.
   - Set retention to automatically delete preview deployments after 7 or 14 days.
3. **Verify Production Deployment:**
   - Deploy the optimized `main` branch.
   - Confirm that the function bundle size for the production deployment is lean and well below the Hobby plan thresholds.
