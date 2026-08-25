---
title: 第 11 周：比较关键词与向量检索基线
description: 在冻结语料、ACL 和评测集上比较关键词与一种向量检索，保存逐例排名并把漏检定位到正确层级。
sidebar:
  label: 第 11 周：检索基线
  order: 11
lastUpdated: 2026-08-25
---

> **直接答案：** 检索基线的目标不是证明向量检索更先进，而是回答：在同一语料、同一权限和同一问题上，必要依据能否进入前 k 个候选，失败来自语料、ACL、召回还是排序，额外复杂度和成本是否值得。第 11 周至少保留关键词基线，再与一种固定的向量候选比较；一次只改变检索方式，保留逐例结果和失败样本。

:::note[本周学习合同]
- **起点：** 已完成[第 10 周评测合同](../week-10-evaluation-contract/)，拥有冻结的 corpus、36 条开发集、12 条校准集、仍封存的 12 条保留集，以及第 8 周确定性基线。
- **预计投入：** 8–10 小时，建议分成 5 次完成。
- **本周表现：** 用统一的检索接口运行关键词和一种向量候选，按案例保存排名、来源、权限、版本、延迟与适用成本，诊断至少五个失败并选择最简单的可接受方案。
- **完成证据：** 两套逐例结果、检索器 manifest、`retrieval-baseline-report-v1.md`、失败登记、回归种子和检索器决定记录。
- **本周不做：** 不生成答案，不调提示词，不运行保留集，不同时更改分块、embedding、top-k 和排序，不用 Recall@k 宣称用户任务或业务价值已经改善。
:::

## 本周只增加一个难度：检索

第 9 周已经固定语料和 ACL，第 10 周已经固定案例和指标。现在把其他变量锁住，只比较“怎样从允许语料中找依据”。

```text
同一业务任务与角色
  → 同一 corpus snapshot 与 ACL
  → 同一开发/校准查询
  → 关键词基线 vs 一种向量候选
  → 逐例排名与失败层
  → 第 12 周才接入生成与引用验证
```

如果你在看到结果后换语料、重写 gold source 或把困难案例移出数据集，这不叫优化检索，而是改变比赛规则。

## 北辰案例：同义表达漏检，不是提示词问题

以下查询、来源、排名、分数和耗时全部是**教学模拟输出**，用于展示推理方法，不代表任何真实检索产品的表现。

普通客服问：

> “本月套餐升级后补的差价应该按哪条处理？”

正式来源 `price-difference-east-v5` 使用的标题是“套餐变更价差结算”。关键词基线只匹配字面词，前五没有它；固定向量候选识别了“补的差价”与“价差结算”的语义接近，把正确来源排到第 2。

这只能证明一个案例中的**表达不匹配**。它不能证明：

- 向量候选在全部任务中更好；
- 返回来源就等于答案正确；
- 普通客服真的更快完成任务；
- 额外延迟与成本值得；
- 权限过滤可以交给模型。

## 最小心智模型：先找证据，再判断答案

检索层只负责把允许的候选带到下一步：

```text
可信身份与角色
  → ACL 查询过滤
  → 查询表示
  → 候选召回
  → 排序与 top-k
  → 带 source/version/chunk 的结果
```

| 层级 | 失败问题 | 正确动作 |
| --- | --- | --- |
| 语料 | Gold source 根本不存在或未生效 | 回到第 9 周建立新 corpus 版本 |
| ACL | 允许来源被误挡，或受限来源进入候选 | 修复确定性权限；不得靠提示词 |
| 召回 | 允许且存在的来源没进入候选池 | 检查查询、索引或检索方式 |
| 排序/上下文 | 相关来源存在但排到 top-k 之外，或无关内容占满 | 检查排序、k 和上下文预算 |
| 标签 | Gold 本身错误、冲突或不完整 | 回到所有者和第 10 周，新建数据版本 |

本周不要把生成失败归给检索：模型还没有进入链路。

## 统一检索合同

无论使用关系数据库全文搜索、搜索引擎、向量数据库或内存实现，两套候选都必须接受同一语义输入并产生可比较记录：

```text
retrieve(
  query,
  trusted_user_role,
  corpus_version,
  top_k
)
  → ordered candidates[
      chunk_id,
      document_id,
      rank,
      score,
      source_version,
      effective_status,
      classification
    ]
```

`trusted_user_role` 来自第 7、9 周的服务端身份上下文，不能让模型或用户请求体自行声明。不同产品的 score 不一定可直接比较；主要比较同一案例中 gold 是否命中、排名和失败类型。

## 先看完成品：一条逐例比较记录

```json
{
  "case_id": "NS-ANS-07",
  "query": "本月套餐升级后补的差价应该按哪条处理？",
  "user_role": "support-agent",
  "corpus_version": "northstar-corpus-teaching-v1",
  "gold_document_ids": ["billing-general-v3", "price-difference-east-v5"],
  "top_k": 5,
  "keyword": {
    "retriever_version": "keyword-teaching-v1",
    "ranked_document_ids": [
      "billing-general-v3",
      "upgrade-notice-v4",
      "upgrade-east-v2"
    ],
    "gold_found": ["billing-general-v3"],
    "latency_ms": 34
  },
  "vector": {
    "retriever_version": "vector-teaching-v1",
    "ranked_document_ids": [
      "billing-general-v3",
      "price-difference-east-v5",
      "upgrade-east-v2",
      "upgrade-notice-v4"
    ],
    "gold_found": ["billing-general-v3", "price-difference-east-v5"],
    "latency_ms": 118
  },
  "restricted_candidate_count": 0,
  "primary_failure_layer": "retrieval",
  "analysis": "关键词基线漏掉同义表达；向量候选找回第二份必要来源。仍需检查两个冲突来源是否挤占上下文。",
  "synthetic": true
}
```

这是一条填写完整的教学记录。版本名、候选、分数和延迟不是实际运行数据；你的报告必须使用检索系统真实输出。

## 完整示例：公平比较两套检索

### 1. 冻结比较清单

在运行前保存：

```md
- corpus：northstar-corpus-teaching-v1
- chunker：fixed-heading-chunker-v1
- ACL policy：northstar-role-policy-v1
- dataset：northstar-eval-teaching-v1 development + calibration
- holdout：不运行
- top_k：5
- keyword configuration：keyword-teaching-v1
- vector configuration：vector-teaching-v1
- 唯一主要变化：查询表示与召回方式
```

向量候选必须记录实际 embedding 提供方或本地模型、精确版本/核验日期、索引版本和距离策略。供应商版本无法固定时，记录端点、时间、参数和响应标识，并把漂移写为限制。

### 2. 先运行关键词基线

关键词是重要基线，因为它简单、便宜、容易解释，在精确术语和 ID 查询中可能优于语义检索。不要故意把它配置得很差来衬托向量方案。

保存每条案例的完整 top-k，而不是只保存“命中/未命中”。完整排名能让你看到：

- gold 是否根本没有进入候选；
- 过期或无关来源是否挤占位置；
- 受限来源是否错误出现；
- k 是否只是在掩盖排序问题。

### 3. 再运行一种向量候选

本页不指定向量数据库、embedding 服务或编程语言，也没有声称仓库存在 runner。选择你能合法访问且能记录版本的一种实现，将输出映射到统一检索合同。

若没有模型或向量服务权限，可以先完成关键词基线和比较协议，但不能伪造向量结果或宣称完成本周验收。

### 4. 计算简单、可解释的检索指标

对每个可回答案例：

```text
该案例 Recall@5
  = 前 5 个允许候选中命中的 gold 来源数
    / 该案例全部 gold 来源数
```

再对适用案例报告平均值，同时保留逐例结果。若任务只需要任一等价来源，可额外报告 `Hit@5`，但要在评测合同中先定义“等价”。

权限切片单独报告：

```text
restricted_candidate_count
  = 普通角色原始 top-k 中出现的受限 chunk 数
```

课程硬门是当前声明权限案例中观测数为 0；这不等于系统在未覆盖身份、缓存、并发或真实生产中永不泄漏。

### 5. 手工诊断至少五个失败

不要直接调参数。对每个失败先填：

| 字段 | 要写什么 |
| --- | --- |
| 期望 | 哪个允许来源本应出现，为什么 |
| 实际 | top-k 是什么，哪个结果占了位置 |
| 主失败层 | corpus / ACL / retrieval / ranking-context / label |
| 根因假设 | 例如同义表达、索引未更新、过滤条件错误 |
| 最小变化 | 只改变一个配置或实现 |
| 反驳证据 | 什么结果会说明根因猜错 |

例：

```md
- case：NS-ANS-07
- 期望：price-difference-east-v5 进入 top 5
- 实际：关键词排名中缺失；向量排名第 2
- 主失败层：retrieval
- 根因假设：一线说法“补的差价”与正式标题“价差结算”字面不匹配
- 最小变化：只切换查询表示，语料、chunk、ACL 和 top_k 不变
- 反驳：若更多正式术语查询在向量候选中下降，则不能把单例收益推广
```

### 6. 用校准集作一次选择

开发集用于诊断和一次受控修改；之后冻结候选，在校准集运行一次。选择可以是：

- 保持关键词基线；
- 选择固定向量候选；
- 只对某类查询使用二者之一；
- 证据不足，补语料或标签；
- 当前不进入生成阶段。

混合检索、重排和多 embedding 网格属于强化内容，不是本周主路径。

## 轮到你：五天最小路径

| 学习日 | 建议时间 | 动作 | 离开前必须有的证据 |
| --- | ---: | --- | --- |
| 第 1 天 | 1–2 小时 | 固定统一接口、corpus、ACL、开发集、校准集和 top-k | comparison manifest |
| 第 2 天 | 2 小时 | 运行关键词基线，保存逐例完整排名 | keyword results |
| 第 3 天 | 2–3 小时 | 接入一种可记录版本的向量候选，运行相同案例 | vector results 与 manifest |
| 第 4 天 | 2 小时 | 按切片比较，人工诊断至少五个失败，只改变一个变量 | failure register 与回归种子 |
| 第 5 天 | 1–2 小时 | 冻结候选，在校准集运行一次，形成继续/保持/停止决定 | retrieval-baseline-report-v1 |

## 本周产物

```text
week-11/
  retrieval-comparison-manifest-v1.json
  keyword-results-v1.jsonl
  vector-results-v1.jsonl
  retrieval-failure-register-v1.md
  retrieval-regression-seeds-v1.jsonl
  retrieval-baseline-report-v1.md
  retriever-decision-v1.md
```

报告必须链接逐例结果。只放一张总体分数图，无法让别人复核失败在哪里。

## 验收门

- [ ] 关键词与一种向量候选使用相同 corpus、chunk、ACL、案例和 top-k；
- [ ] 每套实现记录精确版本、索引和适用配置；
- [ ] 开发、校准逐例结果包含完整排名、来源版本、延迟和适用成本；
- [ ] 保留集仍未运行；
- [ ] 可回答、无答案、冲突、过期和权限切片分别报告；
- [ ] 普通角色原始候选中的受限 chunk 观测数为 0，并注明样本边界；
- [ ] 至少五个失败被定位为 corpus、ACL、retrieval、ranking/context 或 label；
- [ ] 只改变一个主要变量，失败改动有可反驳假设；
- [ ] 过期或冲突来源即使被召回，也没有被写成“检索成功等于答案成功”；
- [ ] 选择可以是关键词、向量、分流、补证或停止；
- [ ] Recall@k、延迟与成本没有被写成采用、效率或业务价值。

## 常见失败与恢复

| 失败 | 诊断信号 | 恢复动作 |
| --- | --- | --- |
| 一次改变多个变量 | 同时换 chunk、embedding、k 和排序 | 回退到相同基线，每轮只保留一个变化 |
| 先召回全部再过滤 ACL | 原始候选含受限 chunk | 将过滤下推到存储或查询层后重跑 |
| 只保存汇总分数 | 找不到具体漏掉或误排的来源 | 保存逐例 top-k、版本和 trace |
| 只检查成功问题 | 报告没有失败样本 | 按风险切片抽取至少五个失败诊断 |
| Gold 根本不在 corpus | 调检索仍然找不到来源 | 回到第 9 周，新建 corpus 与数据版本 |
| 标签错了却调系统 | 多个检索器都指向正式新版本 | 由所有者复核 gold，并记录数据版本变化 |
| 反复看校准或保留集 | 每轮都用同一“测试集”优化 | 作废受污染 split，新建版本并披露 |
| 向量指标更高就宣布胜出 | 高风险切片、延迟或成本更差 | 按预注册门槛与任务风险作决定 |

## 独立迁移：预测哪一种检索会失败

供应链计划员问：

> “车还没到仓，但系统写着已发运，我该按哪条异常流程处理？”

正式 SOP 的标题是“在途状态与到仓扫描不一致处理”。

你的任务：

1. 先预测关键词与语义检索各自可能失败在哪里；
2. 写出 gold source、角色和不可见来源；
3. 用相同 top-k 运行两套检索；
4. 保存完整排名，不能只抄最终命中；
5. 判断差异属于 retrieval、ranking/context、ACL 还是 corpus；
6. 说明这个结果不能证明什么。

<details>
<summary>查看答案检查点</summary>

- “车还没到仓”与“到仓扫描不一致”可能造成关键词漏检，但这是待测试假设。
- 如果 gold SOP 未进入语料，失败层是 corpus，不是 embedding。
- 如果外包角色无权访问该 SOP，安全的 ACL 排除不是召回失败。
- 检索命中不能证明生成答案、用户决策或业务结果正确。

</details>

## 用同一证据向三类人解释

- **老板版：** 更复杂检索在什么任务切片产生可复核收益，增加了什么延迟、成本与维护负担，为什么继续或保持简单基线。
- **一线版：** 哪类真实问法可能漏检；来源缺失、冲突、过期或无权限时系统下一步应怎样提示。
- **工程版：** corpus、ACL、query、index、top-k、逐例排名、failure layer 和版本清单怎样定位问题。

## 相邻周

- **上一步：** [第 10 周：冻结评测合同](../week-10-evaluation-contract/)提供本周不可事后修改的案例与指标。
- **下一步：** [第 12 周：有引用回答与正式评测](../week-12-cited-rag-evaluation/)只接收被冻结的检索器、逐例结果和失败登记。

## 来源与事实边界

- [评测计划模板](https://github.com/wmc837911722-del/fde-learning/blob/main/templates/eval-plan.md)：检索、RAG 分层指标、运行清单和版本锁定字段。
- [企业 RAG + MCP 助手项目合同](https://github.com/wmc837911722-del/fde-learning/blob/main/projects/enterprise-rag-mcp/README.md)：公开项目中的检索基线、ACL 过滤、版本化语料与逐例评测要求。
- [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)：评测集、指标和持续评测原则；实现时应核对当前官方页面。

北辰查询、来源、排名、分数、延迟、检索器 ID 和比较结果全部是合成教学示例，不代表关键词、向量数据库或 embedding 模型的真实性能。不同实现的 score 不一定同尺度，课程也不推荐唯一技术栈。真实结论只能来自学习者冻结版本后的实际逐例输出。
