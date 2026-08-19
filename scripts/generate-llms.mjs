import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pages = [
  ["教程首页", "", "src/content/docs/index.md"],
  ["FDE 是什么", "what-is-fde/", "src/content/docs/what-is-fde.md"],
  ["FDE 技能地图", "skills/", "src/content/docs/skills.md"],
  ["学习路线", "roadmap/", "src/content/docs/roadmap.md"],
  [
    "第 1 周：锁定目标岗位与双层对话基线",
    "course/week-01-role-baseline/",
    "src/content/docs/course/week-01-role-baseline.md",
  ],
  [
    "第 2 周：连接战略目标与一线真实工作",
    "course/week-02-stakeholder-discovery/",
    "src/content/docs/course/week-02-stakeholder-discovery.md",
  ],
  ["实战项目", "projects/", "src/content/docs/projects.md"],
  ["作品集", "portfolio/", "src/content/docs/portfolio.md"],
  ["面试准备", "interview/", "src/content/docs/interview.md"],
  ["资料来源与事实边界", "sources/", "src/content/docs/sources.md"],
];

const sections = pages.map(([title, slug, path]) => {
  const canonical = `https://wmc837911722-del.github.io/fde-learning/${slug}`;
  const markdown = readFileSync(resolve(root, path), "utf8")
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (match, open, target, close) => {
      if (/^(?:https?:|mailto:|tel:|#)/i.test(target)) return match;
      return `${open}${new URL(target, canonical).href}${close}`;
    })
    .trim();
  return `# ${title}\n\nCanonical: ${canonical}\n\n${markdown}`;
});

const preamble = [
  "# FDE 成长手册：完整教程语料",
  "",
  "> FDE 在本文档中专指 Forward Deployed Engineer（前沿部署工程师/前线部署工程师）。",
  "> 作者：风雨。核验基线：2026-08-19。完整页面与更新记录以 canonical URL 为准。",
  "",
].join("\n");

writeFileSync(
  resolve(root, "public/llms-full.txt"),
  `${preamble}\n${sections.join("\n\n---\n\n")}\n`,
  "utf8",
);

console.log(`Generated llms-full.txt from ${pages.length} source pages.`);
