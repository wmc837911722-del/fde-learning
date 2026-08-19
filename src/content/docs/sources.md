---
title: 资料来源与事实边界
description: FDE 成长手册采用的一手岗位、工程实践和安全资料，以及内容核验和引用原则。
sidebar:
  order: 7
lastUpdated: 2026-08-19
---

## 先说结论

本教程把 **FDE** 固定定义为 **Forward Deployed Engineer**，中文同时覆盖“前沿部署工程师”和“前线部署工程师”。课程优先引用公司官方招聘页、官方工程博客和技术规范；媒体报道、课程宣传和社区帖子只能作为线索，不能单独支撑岗位事实。

资料核验日期：**2026-08-19**。

需要从来源回到教程时，可依次阅读[岗位定义](../what-is-fde/)、[能力矩阵](../skills/)、[学习路线](../roadmap/)和[实战项目](../projects/)。

## 岗位与角色定义

| 一手来源 | 用于核验的内容 | 类型 |
| --- | --- | --- |
| [Palantir — Forward Deployed Software Engineer](https://jobs.lever.co/palantir/dab396d4-2f14-4796-aac0-0d82883dccf0) | FDSE 职责范围、软件工程、数据、客户协作与端到端交付 | 官方招聘 |
| [Palantir — Forward Deployed AI Engineer](https://jobs.lever.co/palantir/636fc05c-d348-4a06-be51-597cb9e07488) | LLM 工作流、AI 战略、评测、数据管道与生产应用 | 官方招聘 |
| [OpenAI — Forward Deployed Engineer](https://jobs.ashbyhq.com/openai/305a4b22-7ff9-4fa5-9229-c6a22c9aa64f) | Discovery、技术范围、系统设计、构建、上线与采用 | 官方招聘 |
| [Anthropic — Forward Deployed Engineer](https://job-boards.greenhouse.io/anthropic/jobs/5302966008) | 生产 Claude 应用、MCP、Agent Skill、评测与企业 IT | 官方招聘 |
| [Scale AI — Forward Deployed Engineer, GenAI](https://job-boards.greenhouse.io/scaleai/jobs/4593571005) | 全栈交付、AI 数据基础设施、快速实验与产品反馈 | 官方招聘 |
| [Cohere — FDE, Agentic Platform](https://jobs.ashbyhq.com/cohere/b0bcef37-1d20-414f-aade-c54942d63df9) | Agent、RAG、评测、安全、延迟与可审计性 | 官方招聘 |
| [Baseten — Forward deployed engineering](https://www.baseten.co/blog/forward-deployed-engineering/) | FDE 与咨询/方案架构的区别、工程组织归属和产品反馈闭环 | 官方工程博客 |

:::note[如何阅读岗位来源]
职位链接会下线，年限、地点和出差要求也会变化。教程只提炼跨来源重复出现的能力，不把某一家公司的要求包装成行业统一标准。
:::

## AI 应用与生产交付资料

- [OpenAI Docs — Agents SDK](https://developers.openai.com/api/docs/guides/agents)：Agent、工具、状态、审批和可观测性入口。
- [OpenAI Docs — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)：评测目标、数据集、指标和持续评测原则。
- [OpenAI Docs — Production best practices](https://developers.openai.com/api/docs/guides/production-best-practices)：安全、扩展、成本、延迟和生产环境原则。
- [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)：工作流与 Agent 的边界以及常见组合模式。
- [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro)：MCP 的协议概念与实现入口。
- [OWASP GenAI Security Project](https://genai.owasp.org/llm-top-10/)：生成式 AI 应用的主要安全风险。

:::caution[版本边界]
模型、API 和评测工具会持续更新。本教程教授可迁移的评测方法、数据集和回归流程；实际实现时，请重新核对供应商的当前官方文档与版本说明。
:::

## 客户发现与业务判断资料

- [GOV.UK — Start by learning user needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs)：从用户、当前行为与问题开始，不把利益相关者提出的方案直接写成用户需要。
- [GOV.UK — How the discovery phase works](https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works)：Discovery 中的问题、范围、约束、数据和停止判断。其公共服务语境不能代替企业采购与商业判断。
- [Google PAIR — Identify user needs and AI strengths](https://pair.withgoogle.com/guidebook/chapters/user-needs-and-defining-success/identify-user-needs-and-ai-strengths)：识别用户情境、绘制现有工作流，并比较 AI、规则与人工方案。
- [Palantir — A Day in the Life of an FDSE](https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-45ef2de257b1)：客户协作、领域学习、工程与产品反馈的团队实践；同时具有招聘传播目的。
- [Ramp — Forward Deployed Engineering](https://builders.ramp.com/post/forward-deployed-engineering)：持续范围判断、直接接触用户和以客户结果衡量工作的团队实践；同时具有公司文化与招聘传播目的。

本教程中的“双层对话”“商业五问”和证据翻译板是综合上述资料形成的原创教学工具，不是任何机构发布的统一 FDE 方法。

## 搜索与生成式引用原则

为了同时服务传统搜索和生成式搜索，本教程遵循以下写法：

1. 每页先给可独立引用的结论，再展开证据和步骤。
2. 首次出现的缩写提供全称、中文别名和明确语境。
3. 事实、建议和作者判断分开表达。
4. 涉及岗位、薪资、数量和产品版本时标注来源与核验日期。
5. 页面使用稳定 URL、静态 HTML、canonical、sitemap 和结构化数据。
6. 提供 [`llms.txt`](/fde-learning/llms.txt) 与 [`llms-full.txt`](/fde-learning/llms-full.txt)，但不把这些非强制标准描述成收录保证。

OpenAI 官方文档说明，用于 ChatGPT 搜索展示的爬虫是 **OAI-SearchBot**，它与用于模型训练控制的 **GPTBot** 相互独立。站点根目录的 `robots.txt` 应允许 OAI-SearchBot，是否允许 GPTBot则应由站点所有者根据内容策略单独决定。参见 [OpenAI crawlers](https://developers.openai.com/api/docs/bots)。

## 不会采用的做法

- 不转载付费课程、泄露资料或整篇复制第三方文章。
- 不用无法复核的“需求增长几十倍”“年薪百万”制造紧迫感。
- 不虚构证书认可、学员结果、合作关系或项目指标。
- 不把搜索联想词当成搜索量或市场规模。
- 不为“前沿部署工程师”和“前线部署工程师”建立内容重复的页面。

发现来源失效或事实变化时，可以通过 GitHub Issue 提交链接和核验日期。
