import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const baseUrl = "https://wmc837911722-del.github.io/fde-learning";
const siteOrigin = new URL(baseUrl).origin;
const sitePath = "/fde-learning/";
const pages = [
  ["index.html", `${baseUrl}/`],
  ["what-is-fde/index.html", `${baseUrl}/what-is-fde/`],
  ["skills/index.html", `${baseUrl}/skills/`],
  ["roadmap/index.html", `${baseUrl}/roadmap/`],
  [
    "course/week-01-role-baseline/index.html",
    `${baseUrl}/course/week-01-role-baseline/`,
  ],
  [
    "course/week-02-stakeholder-discovery/index.html",
    `${baseUrl}/course/week-02-stakeholder-discovery/`,
  ],
  [
    "course/week-03-evidence-baseline/index.html",
    `${baseUrl}/course/week-03-evidence-baseline/`,
  ],
  [
    "course/week-04-discovery-brief/index.html",
    `${baseUrl}/course/week-04-discovery-brief/`,
  ],
  [
    "course/week-05-deterministic-vertical-slice/index.html",
    `${baseUrl}/course/week-05-deterministic-vertical-slice/`,
  ],
  [
    "course/week-06-reliable-data-ingestion/index.html",
    `${baseUrl}/course/week-06-reliable-data-ingestion/`,
  ],
  [
    "course/week-07-frontline-task-permissions/index.html",
    `${baseUrl}/course/week-07-frontline-task-permissions/`,
  ],
  [
    "course/week-08-repeatable-deployment/index.html",
    `${baseUrl}/course/week-08-repeatable-deployment/`,
  ],
  [
    "course/week-09-governed-rag-corpus/index.html",
    `${baseUrl}/course/week-09-governed-rag-corpus/`,
  ],
  [
    "course/week-10-evaluation-contract/index.html",
    `${baseUrl}/course/week-10-evaluation-contract/`,
  ],
  [
    "course/week-11-retrieval-baseline/index.html",
    `${baseUrl}/course/week-11-retrieval-baseline/`,
  ],
  [
    "course/week-12-cited-rag-evaluation/index.html",
    `${baseUrl}/course/week-12-cited-rag-evaluation/`,
  ],
  [
    "course/week-13-read-only-mcp/index.html",
    `${baseUrl}/course/week-13-read-only-mcp/`,
  ],
  [
    "course/week-14-approved-write-action/index.html",
    `${baseUrl}/course/week-14-approved-write-action/`,
  ],
  [
    "course/week-15-adversarial-tool-safety/index.html",
    `${baseUrl}/course/week-15-adversarial-tool-safety/`,
  ],
  [
    "course/week-16-task-observability/index.html",
    `${baseUrl}/course/week-16-task-observability/`,
  ],
  [
    "course/week-17-safe-degradation/index.html",
    `${baseUrl}/course/week-17-safe-degradation/`,
  ],
  [
    "course/week-18-operations-handoff/index.html",
    `${baseUrl}/course/week-18-operations-handoff/`,
  ],
  [
    "course/week-19-capstone-problem-contract/index.html",
    `${baseUrl}/course/week-19-capstone-problem-contract/`,
  ],
  [
    "course/week-20-capstone-data-access/index.html",
    `${baseUrl}/course/week-20-capstone-data-access/`,
  ],
  ["projects/index.html", `${baseUrl}/projects/`],
  ["portfolio/index.html", `${baseUrl}/portfolio/`],
  ["interview/index.html", `${baseUrl}/interview/`],
  ["sources/index.html", `${baseUrl}/sources/`],
];

const failures = [];
const renderedPages = [];

function localFileForUrl(candidate, pageUrl) {
  let url;
  try {
    url = new URL(candidate, pageUrl);
  } catch {
    return null;
  }

  if (url.origin !== siteOrigin) return null;
  if (url.pathname === sitePath.slice(0, -1)) return join(dist, "index.html");
  if (!url.pathname.startsWith(sitePath)) return null;

  const relativeUrl = decodeURIComponent(url.pathname.slice(sitePath.length));
  if (!relativeUrl) return join(dist, "index.html");
  const segments = relativeUrl.split("/").filter(Boolean);
  return url.pathname.endsWith("/")
    ? join(dist, ...segments, "index.html")
    : join(dist, ...segments);
}

for (const [relativePath, canonical] of pages) {
  const file = join(dist, relativePath);
  if (!existsSync(file)) {
    failures.push(`Missing page: ${relativePath}`);
    continue;
  }

  const html = readFileSync(file, "utf8");
  renderedPages.push([relativePath, canonical, html]);
  if (!html.includes(`<link rel="canonical" href="${canonical}"`)) {
    failures.push(`Wrong or missing canonical: ${relativePath}`);
  }
  if (!/<html\s[^>]*lang="zh-CN"/.test(html)) {
    failures.push(`Wrong or missing zh-CN document language: ${relativePath}`);
  }
  if (!/<meta property="og:locale" content="zh(?:[_-]CN)?"/.test(html)) {
    failures.push(`Wrong or missing Chinese Open Graph locale: ${relativePath}`);
  }
  if (!/<meta name="description" content="[^"]{30,}"/.test(html)) {
    failures.push(`Missing useful description: ${relativePath}`);
  }
  if (!/<main[\s>]/.test(html) || html.length < 6000) {
    failures.push(`Page does not contain substantial rendered HTML: ${relativePath}`);
  }
  const invalidRootAsset = html.match(/(?:href|src)="\/(?!fde-learning(?:\/|"))[^"#]+"/);
  if (invalidRootAsset) {
    failures.push(`Root-relative URL escapes the Pages base in ${relativePath}: ${invalidRootAsset[0]}`);
  }

  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const candidate = match[1];
    if (!candidate || candidate.startsWith("#") || candidate.startsWith("data:")) continue;
    const localFile = localFileForUrl(candidate, canonical);
    if (localFile && !existsSync(localFile)) {
      failures.push(`Broken internal URL in ${relativePath}: ${candidate}`);
    }
  }
}

for (const file of [
  "llms.txt",
  "llms-full.txt",
  "site.webmanifest",
  "favicon.svg",
  "og-fde-brand.png",
  "pagefind/pagefind.js",
]) {
  if (!existsSync(join(dist, file))) failures.push(`Missing public artifact: ${file}`);
}

const homeHtml = renderedPages.find(([path]) => path === "index.html")?.[2] ?? "";
const roadmapHtml = renderedPages.find(([path]) => path === "roadmap/index.html")?.[2] ?? "";
if (!homeHtml.includes("课程方向已经固定")) {
  failures.push("Home page is missing the fixed course direction statement");
}
if (!roadmapHtml.includes("课程北极星：战略、一线与工程必须贯通")) {
  failures.push("Roadmap is missing the course north-star statement");
}
const structuredDataBlocks = [...homeHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (structuredDataBlocks.length === 0) failures.push("Missing JSON-LD on the home page");
for (const [, json] of structuredDataBlocks) {
  try {
    JSON.parse(json);
  } catch {
    failures.push("Invalid JSON-LD on the home page");
  }
}
for (const schemaType of ["Person", "WebSite", "Course", "DefinedTerm"]) {
  if (!homeHtml.includes(`"@type":"${schemaType}"`)) {
    failures.push(`Missing ${schemaType} JSON-LD on the home page`);
  }
}
if (!homeHtml.includes(`${baseUrl}/og-fde-brand.png`)) {
  failures.push("Missing or incorrect Open Graph image URL");
}
if (!homeHtml.includes('href="/fde-learning/favicon.svg"')) {
  failures.push("Missing or incorrectly based favicon URL");
}

function findFiles(directory, predicate) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? findFiles(path, predicate) : predicate(name) ? [path] : [];
  });
}

const sitemapFiles = findFiles(dist, (name) => /^sitemap.*\.xml$/.test(name));
if (sitemapFiles.length === 0) failures.push("Missing sitemap XML");
const sitemapXml = sitemapFiles.map((file) => readFileSync(file, "utf8")).join("\n");
for (const [, canonical] of pages) {
  if (!sitemapXml.includes(`<loc>${canonical}</loc>`)) {
    failures.push(`Canonical URL missing from sitemap: ${canonical}`);
  }
}
const sitemapUrlCount = (sitemapXml.match(/<url>/g) ?? []).length;
if (sitemapUrlCount !== pages.length) {
  failures.push(`Sitemap contains ${sitemapUrlCount} page URLs; expected ${pages.length}`);
}

try {
  const manifest = JSON.parse(readFileSync(join(dist, "site.webmanifest"), "utf8"));
  if (manifest.start_url !== sitePath || manifest.scope !== sitePath || manifest.lang !== "zh-CN") {
    failures.push("Web manifest has an incorrect base path or language");
  }
} catch {
  failures.push("Web manifest is missing or invalid JSON");
}

const llmsFull = existsSync(join(dist, "llms-full.txt"))
  ? readFileSync(join(dist, "llms-full.txt"), "utf8")
  : "";
if (!llmsFull.includes("Forward Deployed Engineer") || !llmsFull.includes("核验基线：2026-08-25")) {
  failures.push("llms-full.txt is missing entity disambiguation or its verification baseline");
}
for (const match of llmsFull.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
  const candidate = match[1];
  if (!/^(?:https?:|mailto:|tel:|#)/i.test(candidate)) {
    failures.push(`Relative link remains in llms-full.txt: ${candidate}`);
    continue;
  }
  const localFile = localFileForUrl(candidate, `${baseUrl}/llms-full.txt`);
  if (localFile && !existsSync(localFile)) {
    failures.push(`Broken internal URL in llms-full.txt: ${candidate}`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Verified ${pages.length} rendered pages and ${sitemapFiles.length} sitemap file(s).`);
