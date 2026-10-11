import fs from "fs";
import path from "path";

export interface BlogFrontmatter {
  title: string;
  description: string;
  publishedAt: string; // ISO date string
  updatedAt?: string;
  author: string;
  tags: string[]; // category labels from ALL_CATEGORIES used for RelatedProducts
  readingTimeMinutes: number;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string; // Raw markdown
}

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/**
 * Parse a simple frontmatter block from a markdown file.
 * Format: lines between --- markers at top of file.
 */
function parseFrontmatter(raw: string): { frontmatter: BlogFrontmatter; content: string } {
  const lines = raw.split("\n");
  if (lines[0].trim() !== "---") {
    throw new Error("No frontmatter found");
  }

  const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (endIdx === -1) throw new Error("Unclosed frontmatter");

  const fmLines = lines.slice(1, endIdx);
  const content = lines.slice(endIdx + 1).join("\n").trim();

  const fm: Record<string, any> = {};
  for (const line of fmLines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val: any = line.slice(colonIdx + 1).trim();

    // Handle arrays: "- item" style or inline [a, b]
    if (val.startsWith("[")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s: string) => s.trim().replace(/^["']|["']$/g, ""));
    } else if (val === "" || val === undefined) {
      // Multi-line array — collect following lines starting with "  -"
      const arrLines: string[] = [];
      // We'll do single-line only; multi-line handled below
    } else {
      val = val.replace(/^["']|["']$/g, "");
    }

    fm[key] = val;
  }

  // Handle YAML list values (lines starting with "  - ")
  let currentKey: string | null = null;
  const arrayAccumulator: Record<string, string[]> = {};
  for (const line of fmLines) {
    if (/^\S/.test(line) && line.includes(":")) {
      currentKey = line.slice(0, line.indexOf(":")).trim();
    } else if (currentKey && /^\s+-\s+/.test(line)) {
      if (!arrayAccumulator[currentKey]) arrayAccumulator[currentKey] = [];
      arrayAccumulator[currentKey].push(line.replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""));
    }
  }
  for (const [k, v] of Object.entries(arrayAccumulator)) {
    fm[k] = v;
  }

  return {
    frontmatter: {
      title: fm.title || "",
      description: fm.description || "",
      publishedAt: fm.publishedAt || fm.published_at || new Date().toISOString(),
      updatedAt: fm.updatedAt || fm.updated_at,
      author: fm.author || "Ekora Bazaar Editorial Team",
      tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []),
      readingTimeMinutes: parseInt(fm.readingTimeMinutes || fm.reading_time || "5", 10),
    },
    content,
  };
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files
    .map((file): BlogPost | null => {
      const slug = file.replace(/\.md$/, "");
      try {
        const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
        const { frontmatter, content } = parseFrontmatter(raw);
        return { slug, frontmatter, content };
      } catch {
        console.warn(`Failed to parse blog post: ${file}`);
        return null;
      }
    })
    .filter((p): p is BlogPost => p !== null)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.publishedAt).getTime() -
        new Date(a.frontmatter.publishedAt).getTime()
    );

  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, content } = parseFrontmatter(raw);
    return { slug, frontmatter, content };
  } catch {
    return null;
  }
}

/**
 * Convert markdown to HTML — minimal implementation with no extra deps.
 * Handles: headings (with anchor IDs for TOC), bold, italic, code, links, paragraphs, lists.
 * Strips HTML comments so verification markers are never rendered.
 */
export function markdownToHtml(md: string): string {
  const headingId = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  let html = md
    // Strip HTML comments (e.g. <!-- VERIFY: ... -->)
    .replace(/<!--[\s\S]*?-->/g, "")
    // Headings with IDs matching extractToc
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, (_, t) => `<h3 id="${headingId(t)}">${t}</h3>`)
    .replace(/^## (.+)$/gm, (_, t) => `<h2 id="${headingId(t)}">${t}</h2>`)
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold / Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Unordered lists — wrap in ul
    .replace(/(^[-*] .+$(?:\n[-*] .+$)*)/gm, (match) => {
      const items = match
        .split("\n")
        .map((l) => l.replace(/^[-*] /, ""))
        .map((t) => `<li>${t}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    })
    // Paragraphs — double newline separated blocks
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<(h[1-6]|ul|ol|li|blockquote)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");

  return html;
}

/**
 * Extract h2/h3 headings from markdown for table of contents.
 */
export function extractToc(md: string): Array<{ level: 2 | 3; text: string; id: string }> {
  const lines = md.split("\n");
  return lines
    .filter((l) => /^#{2,3} /.test(l))
    .map((l) => {
      const level = l.startsWith("### ") ? 3 : 2;
      const text = l.replace(/^#{2,3} /, "");
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return { level, text, id };
    });
}

/**
 * Find blog posts related to a category label or tag.
 */
export function getPostsByCategory(categoryOrTag: string): BlogPost[] {
  const all = getAllPosts();
  if (!categoryOrTag) return all.slice(0, 3);
  const target = categoryOrTag.toLowerCase().trim();
  const matched = all.filter((p) =>
    p.frontmatter.tags.some(
      (t) =>
        t.toLowerCase().includes(target) ||
        target.includes(t.toLowerCase())
    )
  );
  return matched.length > 0 ? matched : all.slice(0, 3);
}

