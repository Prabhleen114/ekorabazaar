const fs = require('fs');

const r = require('./scratch/audit-results.json');

let md = `# Image Recovery & Classification Audit (DRY RUN)

## User Review Required
Please review the classification logic and image recovery proposal below. **No database updates have been made yet.**

## Image Audit Summary
- **Total Products Audited**: ${r.total}
- **VALID**: ${r.images.VALID} (Assumed valid external URLs)
- **LOCAL_VALID**: ${r.images.LOCAL_VALID} (Verified existing local files)
- **MISSING**: ${r.images.MISSING} (Null, empty, or fallback og-image)
- **BROKEN**: ${r.images.BROKEN} (Local file missing)
- **SUSPICIOUS**: ${r.images.SUSPICIOUS} (Unsplash mock data)

**Products Proposed for Image Generation:**
(Here are the first 15 from the Missing/Suspicious/Broken pool)
`;

let count = 0;
for (const k of ['MISSING', 'SUSPICIOUS', 'BROKEN']) {
  for (const item of r.imageSamples[k]) {
    if (count >= 15) break;
    md += `- **[${k}]** ${item.title} (Proposed Category: ${item.proposedCategory})\n`;
    count++;
  }
}

md += `\n## Proposed Classification Changes
- **Total Products to Reclassify**: ${r.changedCount}
- **LOW Confidence Classifications**: ${r.lowConfidence.length} (These fell back to General Silicone Moulds due to lack of strong keywords)

### Category Counts
`;

for (const [cat, data] of Object.entries(r.categories)) {
  md += `- **${cat}**: ${data.count}\n`;
}

md += `\n### Category Samples (First 5 shown here for brevity)
`;

for (const [cat, data] of Object.entries(r.categories)) {
  md += `\n#### ${cat}\n`;
  for (const s of data.samples.slice(0, 5)) {
    md += `- ${s.title} *(was: ${s.oldCategory})*\n`;
  }
}

md += `\n### LOW Confidence Samples
`;

for (const s of r.lowConfidence.slice(0, 10)) {
  md += `- ${s.title} -> ${s.proposed} (Reason: ${s.reason})\n`;
}

fs.writeFileSync('implementation_plan.md', md);
