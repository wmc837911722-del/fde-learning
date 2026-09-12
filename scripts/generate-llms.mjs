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
  [
    "第 3 周：核对证据，建立受限基线",
    "course/week-03-evidence-baseline/",
    "src/content/docs/course/week-03-evidence-baseline.md",
  ],
  [
    "第 4 周：形成可决策的 Discovery Brief",
    "course/week-04-discovery-brief/",
    "src/content/docs/course/week-04-discovery-brief.md",
  ],
  [
    "第 5 周：实现确定性垂直薄片",
    "course/week-05-deterministic-vertical-slice/",
    "src/content/docs/course/week-05-deterministic-vertical-slice.md",
  ],
  [
    "第 6 周：建立可靠、幂等、可重放的数据入口",
    "course/week-06-reliable-data-ingestion/",
    "src/content/docs/course/week-06-reliable-data-ingestion.md",
  ],
  [
    "第 7 周：完成一线角色、服务端权限与任务闭环",
    "course/week-07-frontline-task-permissions/",
    "src/content/docs/course/week-07-frontline-task-permissions.md",
  ],
  [
    "第 8 周：让发布可重复、可回退",
    "course/week-08-repeatable-deployment/",
    "src/content/docs/course/week-08-repeatable-deployment.md",
  ],
  [
    "第 9 周：先治理 RAG 语料",
    "course/week-09-governed-rag-corpus/",
    "src/content/docs/course/week-09-governed-rag-corpus.md",
  ],
  [
    "第 10 周：冻结评测合同",
    "course/week-10-evaluation-contract/",
    "src/content/docs/course/week-10-evaluation-contract.md",
  ],
  [
    "第 11 周：建立并诊断检索基线",
    "course/week-11-retrieval-baseline/",
    "src/content/docs/course/week-11-retrieval-baseline.md",
  ],
  [
    "第 12 周：完成有引用的 RAG 评测",
    "course/week-12-cited-rag-evaluation/",
    "src/content/docs/course/week-12-cited-rag-evaluation.md",
  ],
  [
    "第 13 周：建立只读 MCP 边界",
    "course/week-13-read-only-mcp/",
    "src/content/docs/course/week-13-read-only-mcp.md",
  ],
  [
    "第 14 周：实现逐次批准的单一写操作",
    "course/week-14-approved-write-action/",
    "src/content/docs/course/week-14-approved-write-action.md",
  ],
  [
    "第 15 周：对抗并恢复受控工具",
    "course/week-15-adversarial-tool-safety/",
    "src/content/docs/course/week-15-adversarial-tool-safety.md",
  ],
  [
    "第 16 周：区分离线质量与任务运行信号",
    "course/week-16-task-observability/",
    "src/content/docs/course/week-16-task-observability.md",
  ],
  [
    "第 17 周：让依赖故障进入安全降级路径",
    "course/week-17-safe-degradation/",
    "src/content/docs/course/week-17-safe-degradation.md",
  ],
  [
    "第 18 周：把服务交给别人运行",
    "course/week-18-operations-handoff/",
    "src/content/docs/course/week-18-operations-handoff.md",
  ],
  [
    "第 19 周：冻结 Capstone 的问题与风险合同",
    "course/week-19-capstone-problem-contract/",
    "src/content/docs/course/week-19-capstone-problem-contract.md",
  ],
  [
    "第 20 周：接通 Capstone 数据与访问边界",
    "course/week-20-capstone-data-access/",
    "src/content/docs/course/week-20-capstone-data-access.md",
  ],
  [
    "第 21 周：完成 Capstone 有引用问答与拒答基线",
    "course/week-21-capstone-cited-rag/",
    "src/content/docs/course/week-21-capstone-cited-rag.md",
  ],
  [
    "第 22 周：接入 Capstone 逐次审批的单一 MCP 写效果",
    "course/week-22-capstone-approved-mcp/",
    "src/content/docs/course/week-22-capstone-approved-mcp.md",
  ],
  [
    "第 23 周：用证据作出 Capstone 发布决定",
    "course/week-23-capstone-release-evidence/",
    "src/content/docs/course/week-23-capstone-release-evidence.md",
  ],
  [
    "第 24 周：完成受控试点、交接与毕业答辩",
    "course/week-24-capstone-pilot-handoff/",
    "src/content/docs/course/week-24-capstone-pilot-handoff.md",
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
  "> 课程以 24 周为标准路线；第 1–24 周正式教程均已发布，20 周和 28 周是有前置条件的弹性节奏。",
  "> 作者：风雨。核验基线：2026-09-12。完整页面与更新记录以 canonical URL 为准。",
  "",
].join("\n");

writeFileSync(
  resolve(root, "public/llms-full.txt"),
  `${preamble}\n${sections.join("\n\n---\n\n")}\n`,
  "utf8",
);

console.log(`Generated llms-full.txt from ${pages.length} source pages.`);
