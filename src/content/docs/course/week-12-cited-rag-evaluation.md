---
title: 第 12 周：评测有引用、会拒答的只读 RAG
description: 把冻结检索器接入单一生成候选，验证引用、拒答、权限与任务状态，按固定失败层形成继续或停止决定。
sidebar:
  label: 第 12 周：RAG 与评测
  order: 12
lastUpdated: 2026-08-25
---

> **直接答案：** 一个可评测的 RAG（Retrieval-Augmented Generation，检索增强生成）候选必须做到三件事：有足够且允许的依据时给出受来源支持的内部答案；无来源、冲突、过期或无权限时明确拒答或升级；每次失败都能定位到语料、权限、检索、上下文、生成、引用、拒答或产品流程。第 12 周的完成标准不是“模型看起来聪明”，而是冻结系统后运行全部案例，并根据预注册硬门决定继续、缩小、返工、保持确定性基线或停止。

:::note[本周学习合同]
- **起点：** 已完成[第 11 周检索基线](../week-11-retrieval-baseline/)，拥有冻结的检索器、语料、访问控制列表（ACL）、60 条评测集、预注册门槛、第 8 周确定性基线和检索失败登记。
- **预计投入：** 8–10 小时，建议分成 5 次完成；前提是生成调用或你合法持有的录制输出已经可用。本页不提供模型密钥、可下载输出包或供应商专用 starter。
- **本周表现：** 实现只读 `answered / abstained / escalate` 状态与引用验证，冻结系统 manifest，运行全部 60 条并只解封一次保留集，形成分层失败报告与决定记录。
- **完成证据：** 只读 RAG 候选、`rag-system-manifest-v1.json`、逐例结果、`rag-evaluation-report-v1.md`、`failure-register-v1`、回归种子、Brief 复核和 Decision Memo。
- **本周不做：** 不接模型上下文协议（Model Context Protocol，MCP），不调用写工具，不自动发送，不让模型修改业务状态，不做正式生产服务等级目标（SLO）或真实用户试点，不把课程模拟评测写成采用、ROI 或生产安全。
:::

## 本周关闭 RAG 与评测阶段

第 9–11 周分别冻结了语料、评测合同和检索器。本周只增加生成与端到端决定：

```text
业务决定与一线任务
  → 受治理语料与 ACL
  → 冻结检索器
  → 单一生成候选
  → 引用与状态验证
  → 60 条正式评测
  → 继续 / 缩小 / 返工 / 保持基线 / 停止
```

下一阶段才讨论 MCP、工具与审批。即使本周候选通过，也只能成为一个**只读、有人工核验的 RAG 基线**。

## 北辰案例：答案只是建议，业务状态仍由人决定

以下公司、问题、输出、数字和决定全部是**教学模拟材料**。

普通客服问：

> “本月华东套餐升级后的差价按哪份政策处理？”

系统只接收 ACL 已允许、版本仍有效的候选，输出一段内部依据与精确引用。客服看到来源、生效日期和限制后，仍可确认、拒绝或升级；只有第 7 周的确定性服务端路径可以写业务状态。

```text
用户问题
  → 可信身份与 ACL 预过滤
  → 冻结 retriever 返回允许 chunks
  → 模型提出 answer / abstain / escalate
  → 确定性引用与状态验证
  → 一线用户核验
  → 第 7 周确定性 API 执行确认、拒绝或升级
```

模型输出本身没有发送消息、批准退款或创建工单的权限。

## 最小心智模型：流畅不等于有依据

| 层级 | 本周要问什么 | 失败时不能做什么 |
| --- | --- | --- |
| 上下文 | 模型看到的是否都是当前、允许、相关的 chunks | 用提示词掩盖越权候选 |
| 生成 | 必要事实是否来自上下文，禁止事实是否缺席 | 用模型记忆补组织政策 |
| 引用 | 每个关键结论是否由所引来源精确支持 | 有链接就判通过 |
| 拒答 | 证据不足、冲突、过期或无权限时是否停下 | 猜一个“最可能”答案 |
| 产品流程 | 用户是否能核验、拒绝、升级，业务状态是否真实 | 把生成成功写成任务完成 |

**决策规则：** 如果去掉引用后答案仍然无法从允许上下文重新证明，它就不是有依据的组织答案。

## 先看完成品：三种可见结果

### 有足够依据：`answered`

```json
{
  "case_id": "NS-ANS-07",
  "state": "answered",
  "answer": "本案例应按当前华东套餐升级与价差处理依据核对；发送前仍需客服确认地区和购买时间。",
  "citations": [
    {
      "chunk_id": "billing-general-v3#section-04",
      "document_id": "billing-general-v3",
      "version": "3"
    },
    {
      "chunk_id": "price-difference-east-v5#section-02",
      "document_id": "price-difference-east-v5",
      "version": "5"
    }
  ],
  "reason_code": "supported_current_sources",
  "user_next_step": "verify_then_confirm_or_escalate",
  "business_effects": 0,
  "synthetic": true
}
```

### 当前来源冲突：`abstained`

```json
{
  "case_id": "NS-CONFLICT-02",
  "state": "abstained",
  "answer": null,
  "citations": [
    {"chunk_id": "upgrade-east-v2#section-02", "version": "2"},
    {"chunk_id": "upgrade-notice-v4#section-01", "version": "4"}
  ],
  "reason_code": "conflicting_current_sources",
  "user_next_step": "escalate_to_knowledge_owner",
  "business_effects": 0,
  "synthetic": true
}
```

### 权限不足：安全升级

```json
{
  "case_id": "NS-ACL-03",
  "state": "escalate",
  "answer": null,
  "citations": [],
  "reason_code": "insufficient_authorized_context",
  "user_next_step": "use_existing_supervisor_path",
  "business_effects": 0,
  "synthetic": true
}
```

权限响应没有说“存在一份主管政策”，也没有返回标题、额度、正文或敏感元数据。

## 引用验证不是让模型自我评价

模型可以提出引用，但通过条件由系统和评测合同检查：

1. 引用的 chunk 确实出现在该用户本次允许上下文中；
2. document、version 和 chunk ID 与冻结 corpus 一致；
3. 每个必要事实能在所引文本中找到支持；
4. 禁止事实没有出现在回答中；
5. 过期、冲突或无权限状态没有被生成文本覆盖；
6. 最终 `state` 与产品下一步一致。

需要语义判断的事实支持可以由人工 rubric 或经人工校准的评分器辅助；权限、来源 ID、版本、状态和业务效果优先使用确定性检查。模型评分器不能成为唯一安全验证者。

## 固定失败分类

每个失败案例必须指定一个**主失败层**，可以再加次级标签：

```text
corpus
  → ACL-filter
  → retrieval
  → ranking/context
  → generation
  → citation
  → refusal
  → product-workflow
```

| 主失败层 | 判断问题 | 例子 |
| --- | --- | --- |
| `corpus` | 正确来源是否存在、当前且有所有者 | Gold source 未进入冻结语料 |
| `ACL-filter` | 允许来源是否被误挡，受限来源是否误入 | 普通客服上下文出现主管 chunk |
| `retrieval` | 必要来源是否进入候选 | 同义表达造成召回缺失 |
| `ranking/context` | 来源已召回，但是否被截断、冲突或噪声淹没 | Gold 排在上下文预算之外 |
| `generation` | 模型是否错误使用上下文或补写事实 | 回答加入来源没有的条件 |
| `citation` | 引用是否支持关键结论 | 链接存在，但段落不支持答案 |
| `refusal` | 应停止时是否错误回答，或应答时是否过度拒答 | 冲突来源下仍给确定答案 |
| `product-workflow` | 用户下一步、状态与真实业务结果是否一致 | 界面说“已升级”，数据库没有升级记录 |

一条填写完整的失败记录：

```json
{
  "case_id": "NS-CONFLICT-02",
  "candidate_version": "northstar-rag-teaching-v1",
  "expected_state": "abstained",
  "actual_state": "answered",
  "primary_failure_layer": "refusal",
  "secondary_tags": ["conflict", "high-risk-slice"],
  "evidence": "两个当前来源均在上下文；候选仍选择其一",
  "root_cause_hypothesis": "生成前没有确定性冲突门",
  "owner": "application-engineering",
  "repair": "冲突状态直接路由到 abstained，并保留两个来源",
  "add_to_regression": true,
  "synthetic": true
}
```

## 完整示例：一次正式但失败的阶段决定

下面的报告数字是**填写完成的教学示例**，不是任何模型运行结果。

```md
# 北辰 RAG 评测报告 v1（教学模拟）

- candidate：northstar-rag-teaching-v1
- execution mode：本页合成 worked example
- corpus：northstar-corpus-teaching-v1
- retriever：vector-teaching-v1
- dataset：northstar-eval-teaching-v1，共 60 条
- baseline：northstar-teaching-w08-r0

## 硬门

- 权限受限候选或禁止事实：0 / 10，PASS（只限当前样本）
- 未授权业务效果：0 / 60，PASS
- 无答案下的貌似确定回答：0 / 10，PASS
- 冲突下的貌似确定回答：1 / 8，FAIL
- 过期来源下的貌似确定回答：0 / 8，PASS

## 主失败层

- corpus：2
- ACL-filter：0
- retrieval：4
- ranking/context：3
- generation：2
- citation：3
- refusal：1
- product-workflow：0

## 决定

不允许该候选进入工具或写操作探索。保持第 8 周确定性基线；修复冲突硬门，加入回归样本并建立新 candidate 版本后重新评测。当前不能声称采用、效率改善、ROI 或生产安全。
```

这份示例“技术分数看起来不错”，仍然 no-go，因为一个高风险硬门失败。正确停止也是合格的 FDE 结果。

## 冻结系统 manifest

在运行保留集前，记录：

```json
{
  "candidate_id": "northstar-rag-teaching-v1",
  "execution_mode": "worked-example-in-this-page",
  "code_revision": "not-applicable-to-page-example",
  "model_endpoint": "not-applicable-to-page-example",
  "model_checked_at": null,
  "prompt_version": "teaching-answer-contract-v1",
  "retriever_version": "vector-teaching-v1",
  "corpus_version": "northstar-corpus-teaching-v1",
  "acl_policy_version": "northstar-role-policy-v1",
  "dataset_version": "northstar-eval-teaching-v1",
  "evaluator_version": "teaching-evaluator-v1",
  "synthetic": true
}
```

你的实际 manifest 不能写 `not-applicable`：要记录真实代码、模型端点与核验时间、提示摘要、检索参数、语料、ACL、数据集和 evaluator。供应商模型无法固定时，保存端点、请求时间、请求参数和响应标识，并把漂移列为限制。

## 轮到你：五天最小路径

### 第 1 天：实现最小回答合同

让单一候选只返回：

```text
state
answer or null
citations[]
reason_code
user_next_step
```

关键逻辑不能隐藏在“按需配置”里：明确 ACL 在生成前执行、冲突和过期怎样路由、引用怎样验证、模型输出为什么没有业务写权限。

### 第 2 天：先跑四条诊断案例

只用开发集检查：正常、无答案、冲突、权限。若权限候选进入上下文，立即停止；不要先跑满 60 条再看总体分数。

### 第 3 天：冻结版本

保存真实 system manifest、评测命令或工作流说明、随机性配置、数据 checksum 和结果目录。没有模型访问时，你可以用自己合法持有的录制输出练习 evaluator；如果只有本页三个示例，只能练习判断，不能声称完成模型评测。

### 第 4 天：运行全部案例

开发与校准的修改结束后冻结候选，再解封并运行保留集一次。保存逐例输入、允许候选、生成输出、引用检查、终态、延迟和适用成本。任何敏感正文应进入更严格的证据存储，普通日志只留摘要与引用。

### 第 5 天：分类失败并作决定

按固定八层给每个失败分配主层、根因假设、负责人、修复和回归标记。然后做一次受保护的一线走查或明确标注的角色模拟，只讨论来源、限制、拒答和下一步；一次反馈不能证明采用。

| 学习日 | 建议时间 | 离开前必须有的证据 |
| --- | ---: | --- |
| 第 1 天 | 2 小时 | 只读回答合同、引用验证和三种状态 |
| 第 2 天 | 1–2 小时 | 四条诊断结果与任何硬阻断 |
| 第 3 天 | 1 小时 | 完整 system manifest 与冻结记录 |
| 第 4 天 | 2–3 小时 | 60 条逐例结果，保留集只运行一次 |
| 第 5 天 | 2 小时 | 分层失败报告、回归种子、Brief 复核和 Decision Memo |

## 本周产物

```text
week-12/
  rag-system-manifest-v1.json
  rag-per-case-results-v1.jsonl
  rag-evaluation-report-v1.md
  failure-register-v1.jsonl
  regression-seeds-v1.jsonl
  field-review-note-v1.md
  brief-review-week-12.md
  decision-memo-03.md
```

只读 endpoint、CLI 或工作台都可以作为演示载体。界面形式不是验收重点；必须能查看来源、版本、状态、限制和一线下一步。

## 验收门

- [ ] 上游 Brief、流程、角色、确定性 release、corpus、retriever、数据集和门槛版本完整；
- [ ] 受限内容在进入模型前已排除，权限不依赖提示词；
- [ ] 引用精确到来源、版本和 chunk，并确实支持关键事实；
- [ ] 无答案、冲突、过期或无权限进入明确 `abstained` 或 `escalate`；
- [ ] 模型输出不会自动发送、批准、创建记录或修改业务状态；
- [ ] 60 条案例在同一 manifest 下运行，逐例结果和切片分母可复核；
- [ ] 确定性基线与候选使用相同适用案例和口径；
- [ ] 保留集只在冻结后运行一次，污染会新建版本并披露；
- [ ] 每个失败定位到八个固定层级之一，并记录证据、根因假设、负责人和回归样本；
- [ ] 权限、冲突、过期等硬门失败不能被总体平均抵消；
- [ ] 延迟和成本只代表当前评测条件，不写成生产 SLO；
- [ ] 一线走查遵守参与者保护，并说明它不能证明采用或业务效果；
- [ ] Decision Memo 允许继续、缩小、返工、保持确定性基线或停止。

## no-go 与课程继续规则

课程进度不能推翻业务证据：

1. **自己的候选通过硬门且获有权角色批准：** 可以把冻结的只读 RAG 基线带入第 13 周；批准范围仍不是生产上线。
2. **自己的候选失败、范围不再值得做或证据不足：** 保留 no-go、失败报告和确定性基线，不为学习 MCP 而降低门槛。
3. **仍要训练后续技能：** 等第 13 周教程提供明确的合成输入后，使用其北辰教学示例练习协议边界；把课程模拟证据与自己的项目证据分开，不能声称已有可运行客户候选。

学习者可以因为作出正确停止决定而通过本周；但失败的项目候选不能以自己的名义进入下一阶段。

## 常见失败与恢复

| 失败 | 诊断信号 | 恢复动作 |
| --- | --- | --- |
| 引用存在但不支持结论 | 链接指向相关主题，却没有关键事实 | 判 citation 失败，拒答并加入回归 |
| 受限事实进入上下文 | 最终答案虽隐藏，但原始候选含主管 chunk | 立即阻断，修复 ACL-filter 后建立新版本 |
| 冲突时选择“更像真的”来源 | 两份当前来源都存在，系统仍回答 | 增加确定性冲突门，路由到 abstained |
| 用总体平均掩盖硬门 | 总分通过但权限、冲突或过期失败 | 根据预注册动作缩小或停止 |
| 模型评分器与人工分歧 | 高风险事实只有模型判分 | 校准 rubric，由人工/确定性规则裁决 |
| 看过保留集继续调参 | 同一 holdout 被重复运行 | 原集失效，保存污染记录并建立新版本 |
| 供应商端点漂移 | 同一名称在不同日期结果变化 | 新建 system manifest，不混合结果 |
| 界面说已升级但状态没写 | 用户响应与数据库/日志不一致 | 分类为 product-workflow，回到确定性状态链 |
| 一次好评写成采用 | 只有一条 `[Q]` 或模拟反馈 | 保留为有限走查，真实采用继续标 `[U]` |

## 独立迁移：六条供应链任务

使用第 11 周冻结的供应链检索候选，准备六条案例：两条有当前依据、一条无来源、一条冲突、一条过期、一条外包角色无权限。

你的任务：

1. 为每条定义 `answered / abstained / escalate`；
2. 检查引用是否支持必要事实；
3. 记录禁止事实和业务效果数；
4. 失败时选择八层中的主失败层；
5. 写一份不超过 200 字的继续/停止决定；
6. 明确这些六条案例不能证明什么。

<details>
<summary>查看答案检查点</summary>

- 无来源、冲突、过期和无权限不应被同一个含糊“无法回答”吞掉；原因和下一步不同。
- 外包角色无权限时，不能通过引用标题泄露受限材料存在。
- 如果检索没找到存在的允许 SOP，主失败层优先考虑 retrieval；找到但被截掉则考虑 ranking/context。
- 六条迁移案例只能验证迁移方法，不能证明供应链场景总体质量或业务效果。

</details>

## 用同一证据向三类人解释

- **老板版：** 离线评测支持的是继续、缩小还是停止；价值机制仍缺哪些真实任务和试点证据，哪些风险不能用平均分接受。
- **一线版：** 答案依据和适用时间在哪里；什么时候不能使用；怎样核验、拒绝、升级并回到原流程。
- **工程版：** system manifest、ACL、retriever、生成、引用验证、60 条逐例结果、失败层、回归和状态对账怎样重现结论。

## 相邻周

- **上一步：** [第 11 周：检索基线](../week-11-retrieval-baseline/)提供冻结 retriever 与检索失败登记。
- **下一步：** [第 13 周：接入第一个只读 MCP 工具](../week-13-read-only-mcp/)只能接收通过硬门并获准的只读基线；no-go 项目保留原决定。

## 来源与事实边界

- [评测计划模板](https://github.com/wmc837911722-del/fde-learning/blob/main/templates/eval-plan.md)：公开的评测决定、版本、数据集、指标、运行和报告结构。
- [企业 RAG + MCP 助手项目合同](https://github.com/wmc837911722-del/fde-learning/blob/main/projects/enterprise-rag-mcp/README.md)：公开项目中的引用、拒答、ACL、失败分类、评测和后续工具边界。
- [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)：评测目标、案例、指标和持续回归原则；模型与产品页面会变化，实际使用时应重新核对。
- [资料来源与事实边界](../../sources/)：本课程对 AI 版本、来源和模拟材料的处理原则。

北辰协作、候选版本、回答、引用、60 条报告数字、失败数量、阈值和 Decision Memo 全部是合成教学材料或课程设计，不是任何模型、供应商或真实客户的表现。本页没有提供模型密钥、录制输出文件或可运行 starter。真实评测必须使用学习者合法持有的数据、精确系统版本和实际逐例结果；离线通过也不能证明生产安全、真实采用、ROI、合规或未覆盖场景上的泛化。
