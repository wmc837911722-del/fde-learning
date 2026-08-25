# FDE 成长手册

一套面向**已有编程基础、零 FDE 经验**学习者的中文开源教程。这里的 FDE 指 **Forward Deployed Engineer（前沿部署工程师 / 前线部署工程师）**。

教程不以背诵工具清单为目标，而是沿着真实岗位要求完成一条可验证路径：

> 岗位认知 → 能力差距 → 客户发现 → 工程交付 → AI 评测与生产化 → 作品集 → 面试

## 不可漂移的课程方向

本课程培养的 FDE 必须能向上与老板讨论商业结果、战略优先级、价值机制和风险，向下与一线员工还原真实任务、系统使用、绕路和异常，再亲手把两边的证据转成可交付、可验证、可运营的工程系统。

后续课程、模板和项目均受网站首页的课程北极星与学习路线阶段边界约束。除非仓库所有者明确要求改变方向，新增内容只能细化这条主线，不能改成纯商业课程、纯访谈课程或纯技术工具课程。

在线阅读：<https://wmc837911722-del.github.io/fde-learning/>

## 你会得到什么

- 一份基于官方招聘信息整理的 FDE 岗位定义与能力矩阵；
- 一条以 24 周为标准、可按前置条件调整为 20 或 28 周的路线；
- 三个递进式项目，其中 Capstone 是企业 RAG + MCP 助手；
- 可直接复制的 Discovery Brief、Eval Plan 和项目评分模板；
- 从项目证据到作品集叙事、面试准备的完整方法。

这不是就业保证，也不会把“会调用大模型 API”包装成 FDE 能力。所有课程门槛都是训练目标，申请时仍应以目标公司的最新职位描述为准。

## 推荐阅读顺序

1. [FDE 是什么](https://wmc837911722-del.github.io/fde-learning/what-is-fde/)
2. [FDE 能力矩阵](https://wmc837911722-del.github.io/fde-learning/skills/)
3. [24 周标准学习路线](https://wmc837911722-del.github.io/fde-learning/roadmap/)
4. 第 1–4 周：[岗位基线](https://wmc837911722-del.github.io/fde-learning/course/week-01-role-baseline/) → [双层 Discovery](https://wmc837911722-del.github.io/fde-learning/course/week-02-stakeholder-discovery/) → [证据基线](https://wmc837911722-del.github.io/fde-learning/course/week-03-evidence-baseline/) → [Discovery Brief](https://wmc837911722-del.github.io/fde-learning/course/week-04-discovery-brief/)
5. 第 5–8 周：[确定性薄片](https://wmc837911722-del.github.io/fde-learning/course/week-05-deterministic-vertical-slice/) → [可靠数据入口](https://wmc837911722-del.github.io/fde-learning/course/week-06-reliable-data-ingestion/) → [一线任务权限](https://wmc837911722-del.github.io/fde-learning/course/week-07-frontline-task-permissions/) → [可重复部署](https://wmc837911722-del.github.io/fde-learning/course/week-08-repeatable-deployment/)
6. 第 9–12 周：[受治理语料](https://wmc837911722-del.github.io/fde-learning/course/week-09-governed-rag-corpus/) → [评测合同](https://wmc837911722-del.github.io/fde-learning/course/week-10-evaluation-contract/) → [检索基线](https://wmc837911722-del.github.io/fde-learning/course/week-11-retrieval-baseline/) → [有引用 RAG 评测](https://wmc837911722-del.github.io/fde-learning/course/week-12-cited-rag-evaluation/)
7. 第 13–15 周：[只读 MCP](https://wmc837911722-del.github.io/fde-learning/course/week-13-read-only-mcp/) → [批准写操作](https://wmc837911722-del.github.io/fde-learning/course/week-14-approved-write-action/) → [工具安全](https://wmc837911722-del.github.io/fde-learning/course/week-15-adversarial-tool-safety/)
8. 第 16–18 周：[任务可观察性](https://wmc837911722-del.github.io/fde-learning/course/week-16-task-observability/) → [安全降级](https://wmc837911722-del.github.io/fde-learning/course/week-17-safe-degradation/) → [运营交接](https://wmc837911722-del.github.io/fde-learning/course/week-18-operations-handoff/)
9. 第 19–20 周：[Capstone M0](https://wmc837911722-del.github.io/fde-learning/course/week-19-capstone-problem-contract/) → [Capstone M1](https://wmc837911722-del.github.io/fde-learning/course/week-20-capstone-data-access/)；第 21–24 周继续按标准路线完成。
10. [FDE 实战项目](https://wmc837911722-del.github.io/fde-learning/projects/)、[作品集](https://wmc837911722-del.github.io/fde-learning/portfolio/)与[面试准备](https://wmc837911722-del.github.io/fde-learning/interview/)

## 项目模板

- [`templates/discovery-brief.md`](templates/discovery-brief.md)：把模糊需求收敛成可验证范围；
- [`templates/eval-plan.md`](templates/eval-plan.md)：定义数据集、指标、失败分类和发布门槛；
- [`templates/portfolio-rubric.md`](templates/portfolio-rubric.md)：用证据而不是功能截图评审项目；
- [`projects/enterprise-rag-mcp/README.md`](projects/enterprise-rag-mcp/README.md)：Capstone 的完整项目合同。

## 本地运行

要求 Node.js 22.13+ 与 pnpm 11.19.0。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

发布前执行完整验证：

```bash
pnpm test
```

站点使用 Astro + Starlight 构建为静态 HTML，并通过 GitHub Actions 部署到 GitHub Pages。

## SEO 与 GEO

仓库把传统搜索可发现性与生成式搜索可引用性一起作为内容质量要求：

- 每页都有独立标题、描述、canonical URL 和稳定层级；
- 生成 sitemap、结构化数据和可索引静态 HTML；
- 提供 [`llms.txt`](public/llms.txt)，构建时从正文生成 `llms-full.txt`；
- 先给结论，再给证据、步骤、验收标准与来源；
- 对 FDE 做实体消歧，并给岗位事实标注一手来源与核验日期。

`llms.txt` 不是搜索或 AI 引用保证。最终收录仍取决于站点可访问性、爬虫策略、内容质量和各平台机制。

## 内容原则

- 优先引用公司官方招聘页、官方技术文档和标准；
- 区分事实、课程建议与作者判断；
- 不虚构岗位数量、薪资、学员结果或商业案例；
- 不公开客户数据、个人敏感信息、密钥或无权分享的材料；
- 外部页面可能变化，重要结论应记录访问日期并定期复核。

完整来源矩阵见[资料来源与事实边界](https://wmc837911722-del.github.io/fde-learning/sources/)。

## 反馈与合作

发现事实变化、失效链接或教程缺口，欢迎提交 Issue。真实项目案例与 AI 落地合作入口位于[作者主站](https://wmc837911722-del.github.io/)。

## 许可

首版暂未声明开源许可证。在许可证明确前，仓库内容默认保留全部权利；你可以通过 GitHub 链接分享和引用少量内容，但请勿整仓转载或用于付费再分发。
