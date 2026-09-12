---
title: 第 21 周：完成 Capstone 有引用问答与拒答基线
description: 消费 M1 冻结语料与 ACL 候选，用可追溯引用、冲突/过期/无答案门控和 100 例版本化数据集完成 Capstone M2。
sidebar:
  label: 第 21 周：Capstone M2
  order: 21
lastUpdated: 2026-09-12
---

> **直接答案：** 第 21 周只完成 Capstone M2：消费第 20 周冻结的语料、身份和 ACL 检索候选，把每次问答收敛为 `answered`、`abstained` 或 `escalate`，并让回答中的每个可核验结论都能回到当前、获准的候选分块。当前资料冲突、只剩过期来源或没有足够证据时，系统必须拒答或升级，不能靠模型补齐。第 10–12 周已经运行并解封的 60 条只可作为新开发集的血缘来源或补充回归素材，不能直接冒充 Capstone 新题；核心 100 例由 60 条已见开发例和独立保管人新建、封存的 40 条 final blind 组成。**本周不接 MCP，不产生任何外部业务效果。**

:::note[本周学习合同]
- **起点：** 已完成[第 20 周 Capstone M1](../week-20-capstone-data-access/)，拥有冻结的语料 manifest、身份夹具、ACL 检索接口、缓存隔离证据和负向矩阵。M1 中任何未修复的候选泄漏都会阻断本周。
- **预计投入：** 8–10 小时，建议分成 5 次完成。
- **本周表现：** 定义回答状态与引用合同，为旧 60 条逐例记录 `reuse / adapt / retire / relabel` 血缘，按项目分层组成 60 条已见核心开发例并运行其中 51 条只读 RAG 适用项；由独立保管人新建、封存 40 条 final blind，留到第 23 周冻结系统后运行。
- **完成证据：** `m2-input-lock-v1.md`、`answer-contract-v1.json`、`dataset-lineage-v1.csv`、`capstone-eval-100-v1-manifest.yaml`、RAG 适用开发切片的逐例结果、final-blind 保管回执、错误账本、`m2-release-manifest-v1.yaml` 和 M2 决定记录。
- **本周不做：** 不查看或运行 40 条 final blind 的输入与标签，不把旧 60 条重新命名为盲测，不运行工具滥用切片，不接 MCP 或其他工具，不创建工单，不用模型判断替代 ACL，不把离线合成结果写成客户采用、生产质量或 ROI。
:::

## 先确认起始材料：本仓库没有业务代码 starter

本页提供的是**技术栈中立的行为合同、完整合成完成例、数据集设计和验收方法**。仓库目前没有随本页附带可运行的检索服务、模型适配器、评测器或固定命令，因此不要寻找并不存在的 `starter/`，也不要把页面中的 JSON 当成终端运行输出。

你需要把合同映射到自己已经能运行的技术栈。可以使用规则模板、托管模型或本地模型；只要保存实际输入、版本、状态和结果即可。如果你目前没有可运行应用，可以完成合同、数据血缘和手工演绎，但不能声称已经通过开发切片运行或完成 M2 工程门槛。

本周只消费以下 M1 上游状态：

~~~text
M0 问题与风险合同
  → M1 冻结语料 + 身份 + ACL 候选接口
  → M2 引用、回答门控、拒答/升级 + 版本化数据集
  → 第 22 周只消费 M2 的 approved snapshot 与 escalate 终态
~~~

语料、ACL、分块、检索或缓存版本变化时，先回到 M1 建立新版本并重跑负向矩阵，不能在生成层偷偷换资料。

## 先看完成品：北辰四种问答终态

下面所有公司、人员、问题、文档内容、ID、时间和结果都是**北辰课程合成材料**。这是为了展示完成品形状而进行的**手工演绎参考记录**，不是仓库代码的运行输出，也不证明真实模型质量。

### 冻结输入快照

~~~yaml
m0_contract: northstar-capstone-m0-v1
m1_corpus: northstar-capstone-corpus-v1
m1_index: northstar-index-v1
access_policy: access-policy-v1
retriever: retriever-v1
answer_contract: answer-contract-v1
dataset: capstone-eval-100-v1
scope: synthetic_training_only
~~~

M1 为每次查询交付一个受控候选包。它至少包含 `run_id`、可信身份摘要、上述版本和**允许候选**。若可信层因权限、过期、撤销或缺少当前资料而不返回候选，只能附带不含文档 ID、标题或正文的聚合原因码。受限审计区可以按授权保存更细证据，但 M2 和当前用户都不能据此得知无权资料是否存在。

M2 使用同一个输出合同：

~~~json
{
  "run_state": "completed | failed | cancelled | timed_out",
  "state": "answered | abstained | escalate | null",
  "error_code": "INPUT_VERSION_MISMATCH | MODEL_OUTPUT_INVALID | UPSTREAM_UNAVAILABLE | CANCELLED_BY_REQUEST | DEADLINE_EXCEEDED | null",
  "answer": "string | null",
  "citations": [
    {
      "document_id": "string",
      "chunk_id": "string",
      "version": "string"
    }
  ],
  "reason_code": "SUPPORTED | SOURCE_CONFLICT | SOURCE_EXPIRED | SOURCE_REVOKED | INSUFFICIENT_EVIDENCE | NO_AUTHORIZED_EVIDENCE | null",
  "user_message": "string",
  "next_action": "verify_then_use | request_owner_review | use_manual_path | use_existing_supervisor_review",
  "run_id": "string",
  "evidence_snapshot": "string"
}
~~~

`abstained` 表示当前证据不足以给出可靠答案；`escalate` 表示还需要有权人员解决冲突或按既有权限流程接手。`answered / abstained` 沿用项目合同，`escalate` 则显式保留第 12 周课程中的升级语义。如果你的核心运行合同只接受 `abstained`，可把升级映射成 `state=abstained` 加准确的 `reason_code` 与 `next_action`；不能丢失一线下一步。三者都是正常**回答结果**，不是系统崩溃。

回答结果之外还要有独立运行包络，不能把解析错误、超时或版本错配伪装成“证据不足”：

| `run_state` | 是否允许回答结果 | 典型 `error_code` | 用户可见处理 |
| --- | --- | --- | --- |
| `completed` | 必须是 `answered / abstained / escalate` 之一 | `null` | 展示回答、拒答或升级下一步 |
| `failed` | 不允许伪造回答结果 | `INPUT_VERSION_MISMATCH / MODEL_OUTPUT_INVALID / UPSTREAM_UNAVAILABLE` | 明确系统失败，保持无外部效果，可走人工路径 |
| `cancelled` | 无回答结果 | `CANCELLED_BY_REQUEST` | 确认已取消，不自动重试 |
| `timed_out` | 无回答结果 | `DEADLINE_EXCEEDED` | 明确超时，按只读重试策略或人工路径处理 |

合法组合也必须固定：`run_state=completed` 时 `error_code=null`，并且回答 `state / reason_code / next_action` 都有值；其他运行状态时 `state=null`、`answer=null`、`reason_code=null`、`citations=[]`，由 `error_code` 和安全的 `user_message / next_action` 说明恢复路径。在实际实现中，把这些字段写成 JSON Schema 的 `enum` 和条件分支并校验；页面里的联合字符串只是技术栈中立的可读表示。

### 完成例 A：有当前、获准且一致的来源

**输入：** A 业务单元普通客服周宁询问：“标准退款申请需要在购买后多少天内提出？”M1 只返回她获准读取的 `A-POLICY-01-v3#refund-window`，合成内容为“标准退款申请须在购买后 30 个自然日内提出”。

**决策：** 来源当前有效，只有一个相关规则；“30 个自然日”可以直接回链到允许候选。系统不得补充资料没有说明的商品类别或承诺。

**手工演绎状态：**

~~~text
candidates_received
  → access_snapshot_verified
  → current_sources_verified
  → claim_mapped_to_chunk
  → answered
~~~

**合成参考结果：**

~~~json
{
  "run_state": "completed",
  "state": "answered",
  "error_code": null,
  "answer": "当前合成政策写明：标准退款申请须在购买后 30 个自然日内提出。",
  "citations": [
    {
      "document_id": "A-POLICY-01-v3",
      "chunk_id": "refund-window",
      "version": "v3"
    }
  ],
  "reason_code": "SUPPORTED",
  "user_message": "请在使用前核对引用版本与适用范围。",
  "next_action": "verify_then_use",
  "run_id": "m2-ref-a-001",
  "evidence_snapshot": "northstar-capstone-corpus-v1"
}
~~~

**错误转向：** 若生成草稿又补了一句“所有商品都适用”，而候选没有这个范围，声明—来源核对必须丢弃整个草稿，回到 `draft_rejected_unsupported_claim → regenerate_or_refuse`，不能只给无依据句子补一个相邻引用。

### 完成例 B：两个当前来源相互冲突

**输入：** A 业务单元主管询问：“已拆封设备是否仍可走标准退款？”其身份允许看到 `A-POLICY-01-v3#opened-items` 与 `A-EXCEPTION-02-v2#device-exception`；前者写“不进入标准退款”，后者写“主管可按例外处理”，但两份合成材料没有给出优先级或适用边界。

**决策：** 两份来源都当前、相关且获准，但不能仅凭文档 ID 或检索分数决定谁覆盖谁。结果进入 `SOURCE_CONFLICT`，交给政策所有者解决；M2 不创建工单。

**合成参考结果：**

~~~json
{
  "run_state": "completed",
  "state": "escalate",
  "error_code": null,
  "answer": null,
  "citations": [
    {"document_id": "A-POLICY-01-v3", "chunk_id": "opened-items", "version": "v3"},
    {"document_id": "A-EXCEPTION-02-v2", "chunk_id": "device-exception", "version": "v2"}
  ],
  "reason_code": "SOURCE_CONFLICT",
  "user_message": "当前获准来源相互冲突，不能给出确定答案。",
  "next_action": "request_owner_review",
  "run_id": "m2-ref-b-001",
  "evidence_snapshot": "northstar-capstone-corpus-v1"
}
~~~

一线界面应说明“当前资料冲突，需要主管复核”，并展示允许查看的两条来源。这个 `escalate` 结果只成为第 22 周的**候选输入**，不是自动写操作许可。

### 完成例 C：只有过期材料

**输入：** 周宁询问一项旧通知的处理时限。合成夹具中确有一份过期材料，但 M1 给 M2 的可靠候选为空，只返回聚合原因码 `AUTHORIZED_SOURCES_EXPIRED`；不返回过期或受限文档的 ID、标题与正文。

**决策：** 系统不能把“最相近但过期”的材料当当前政策，也不能回答一个漂亮猜测。结果拒答，并指向知识所有者更新来源或人工核对当前政策。

**合成参考结果：**

~~~json
{
  "run_state": "completed",
  "state": "abstained",
  "error_code": null,
  "answer": null,
  "citations": [],
  "reason_code": "SOURCE_EXPIRED",
  "user_message": "当前获准资料已过期，无法可靠回答。",
  "next_action": "use_manual_path",
  "run_id": "m2-ref-c-001",
  "evidence_snapshot": "northstar-capstone-corpus-v1"
}
~~~

**失败恢复：** 先修复来源所有权和有效期，再回到 M1 发布新语料版本、重建索引并重跑 ACL；不能在 M2 临时把过期过滤关闭。

### 完成例 D：语料没有答案

**输入：** 周宁问“下季度会员积分规则是什么？”固定语料没有相关当前候选，M1 返回空候选且没有权限拒绝、过期或系统错误信号。

**决策：** 这不是“检索一定失败”的证据，只证明当前获准快照不足。系统用 `INSUFFICIENT_EVIDENCE` 拒答，保留问题给知识所有者判断是否值得补充资料。

**合成参考结果：**

~~~json
{
  "run_state": "completed",
  "state": "abstained",
  "error_code": null,
  "answer": null,
  "citations": [],
  "reason_code": "INSUFFICIENT_EVIDENCE",
  "user_message": "当前获准资料不足以回答这个问题。",
  "next_action": "use_manual_path",
  "run_id": "m2-ref-d-001",
  "evidence_snapshot": "northstar-capstone-corpus-v1"
}
~~~

### 完成例 E：当前角色没有足够的获准证据

**输入：** 普通客服周宁询问一类必须由主管复核的例外。M1 没有向 M2 返回受限候选，只给出不含文档 ID、标题或正文的聚合原因码 `NO_AUTHORIZED_EVIDENCE`；当前用户看不到系统是否存在其他角色资料。

**决策：** 不回答例外规则，也不暗示受限文档名称。M0 已批准的既有流程允许周宁请求一次主管复核，因此状态进入 `escalate`；这仍然不会创建工单。

**合成参考结果：**

~~~json
{
  "run_state": "completed",
  "state": "escalate",
  "error_code": null,
  "answer": null,
  "citations": [],
  "reason_code": "NO_AUTHORIZED_EVIDENCE",
  "user_message": "当前角色没有足够的获准资料完成判断，请使用既有主管复核流程。",
  "next_action": "use_existing_supervisor_review",
  "run_id": "m2-permission-003",
  "evidence_snapshot": "northstar-capstone-corpus-v1"
}
~~~

五个完成例展示的是预期合同。你自己的实际结果必须另存，写明模型或规则版本、参数、运行日期和逐例观察；不能复制这些合成 JSON 后宣称测试通过。

## 最小心智模型：先判断“能否回答”，再组织语言

~~~text
获准候选包
  → 核对 M1 / 语料 / ACL / 检索版本
  → 检查来源是否当前、充分、一致
  → 把每个可核验声明映射到具体分块
  → answered：只输出被支持的声明与引用
     或 abstained：过期 / 无足够证据
     或 escalate：当前来源冲突或需有权判断
  → 保存状态、原因、版本和逐例证据
~~~

四条决策规则：

1. **引用不是装饰。** 引用必须指向本次身份获准、实际进入候选且支持相应声明的具体版本和分块。
2. **相似不等于支持。** 检索分数高不能消除来源冲突，也不能把过期材料变成当前事实。
3. **拒答不是空白。** 拒答必须说明原因码、可见范围内缺了什么，以及一线人员怎样继续工作。
4. **生成无权扩大范围。** 被 ACL 排除的正文不能为了“让答案更完整”再次送给模型；M2 也不能调用工具补数。

## 第 1 天：锁定 M2 输入与回答合同

建立 `m2-input-lock-v1.md`，逐项记录：

| 输入 | 必须冻结什么 | 变化后的动作 |
| --- | --- | --- |
| M0 | 业务决定、目标任务、非目标、风险所有者 | 实质变化则重开 M0 |
| M1 语料 | 来源快照、分块、有效期、撤销与 manifest 摘要 | 回 M1 重建并重跑 |
| 身份与 ACL | 身份夹具、策略、权限摘要 | 回 M1 重跑负向矩阵 |
| 检索 | 检索器、参数、缓存和索引版本 | 新建基线，不覆盖旧结果 |
| 生成 | 模型或规则、提示/模板、参数 | 新建 M2 候选版本并回归 |

然后把 `answered / abstained / escalate` 写成封闭的回答枚举，把失败、取消和超时写进独立的 `run_state / error_code`。任何异常都必须映射到明确运行终态；不能让前端把 `null`、超时或空字符串当回答。

## 第 2 天：旧 60 条评测怎样迁移为 100 条？

[第 10 周评测合同](../week-10-evaluation-contract/)建立的 36 条开发、12 条校准和 12 条保留案例，已经在[第 12 周正式评测](../week-12-cited-rag-evaluation/)中**全部运行并解封**。因此旧 60 条无论原 split 叫什么，到 Capstone 都只能作为已见的开发/回归素材；把它们重命名为 `sealed` 或 `blind` 属于数据污染。

先建立 `dataset-lineage-v1.csv`，每条旧案例只能采取以下一种动作：

| 血缘动作 | 何时使用 | 新版本怎样记录 |
| --- | --- | --- |
| `reuse` | 任务、角色、来源与标签仍适用于 M0/M1 | 保留原 ID，并指向旧结果 |
| `adapt` | 场景仍有价值，但需映射到新的语料或身份 | 新建 ID，保留 `derived_from`，视为已见开发例 |
| `relabel` | 当前来源、风险合同或期望终态已改变 | 保留旧标签和改标理由，由有权角色复核 |
| `retire` | 资料失效、重复、无来源或偏离 Capstone | 不删除历史；写明退役原因，并用新的**开发例**补足数量 |

下面是四种动作各一行的**合成已填示例**；它只展示血缘写法，不代表旧数据实际存在：

| old_case_id | old_split / 最后暴露 | action | new_case_id / 新标签 | 依据与去向 |
| --- | --- | --- | --- | --- |
| `w10-dev-01` | dev / 2026-08-01 | `reuse` | `cap-dev-001 / answered` | 任务、角色和当前允许来源仍与 M0/M1 一致；进入核心开发 |
| `w10-cal-04` | calibration / 2026-08-08 | `adapt` | `cap-dev-031 / abstained` | 映射到新语料版本并保留 `derived_from=w10-cal-04`；属于已见开发 |
| `w10-hold-09` | held-out / 2026-08-15 | `relabel` | `cap-dev-043 / escalate` | 已在第 12 周揭盲；当前来源冲突，由合成政策所有者复核标签 |
| `w10-dev-22` | dev / 2026-08-01 | `retire` | 无 | 原题重复且缺来源；历史保留，另建可见开发例补缺口 |

血缘表至少包含旧 ID、旧 split、最后暴露日期、动作、新 ID、标签依据、M0/M1 版本和适用阶段。旧 60 条只是**候选来源**，不自动等于新的核心开发集：选中的 `reuse / adapt / relabel` 进入核心开发或补充回归；`retire` 和未选中项仍保留在血缘账本中，但不进入核心开发集。核心开发集缺少的任务和风险类别，用作者可见标签的新案例补齐，并标为 `created_for_capstone_seen_dev`，仍不属于盲测。

然后由**没有参与 M2 调参的独立保管人**，依据 M0 的任务、角色、正常/异常路径和风险覆盖说明，另行新建 40 条 final blind。学习者在第 21 周只能拿到保管回执：总数、允许的数据来源、覆盖说明、包摘要、保管人、创建日期和第 23 周开启条件；不能看到具体输入、标签或问题改写。

`capstone-eval-100-v1` 必须沿用项目合同的四类分层：

| 核心类别 | 已见开发 | 新 final blind | 合计 | 第 21 周动作 |
| --- | ---: | ---: | ---: | --- |
| 可回答 | 30 | 20 | 50 | 运行 30 条开发例 |
| 不可回答 | 12 | 8 | 20 | 运行 12 条；用子标签区分无来源、冲突、过期 |
| 权限 | 9 | 6 | 15 | 运行 9 条；M2 只见允许候选或无标识聚合原因 |
| 注入 / 工具滥用 | 9 | 6 | 15 | 9 条开发例留到第 22 周；blind 留第 23 周 |
| **合计** | **60** | **40** | **100** | 本周只运行 51 条 M2 适用开发例 |

所以“100 例已版本化”不等于“第 21 周运行 100 例”。本周实际开发运行分母是 51；9 条工具滥用开发例等待 M3，40 条 final blind 整包等待第 23 周。

学习者拿到的保管回执可以完整到下面这样，但不能包含题目或标签。所有值仍是合成示范，不是一份真实保管证明：

~~~yaml
receipt_id: final-blind-custody-receipt-v1-example
dataset_id: capstone-eval-100-v1
record_type: synthetic_filled_example_not_real_custody
custodian: fictional-independent-custodian-01
created_at: 2026-09-12T09:00:00+08:00
case_count: 40
declared_distribution:
  answerable: 20
  unanswerable: 8
  permission: 6
  injection_or_tool_misuse: 6
allowed_source_scope: northstar-synthetic-m0-m1-only
package_digest: synthetic-example-digest-not-valid-for-verification
learner_can_access_inputs_or_labels: false
open_condition: after_m3_and_full_candidate_freeze_in_week_23
~~~

每个可见开发例至少保存：`case_id`、`derived_from`、合成问题、身份夹具、M0 任务标签、M1 快照、期望状态、允许来源、失败类型、适用阶段和标签依据。**禁止来源、禁止事实和金标只放在受限的 evaluator-only oracle**；运行时输入、模型上下文、普通日志和用户响应都不能读取它们。评测器只比较观察结果，不把 oracle 送回系统。相似改写必须按问题族检查；旧题换几个字仍然是已见数据。

如果没有独立保管人，可以建立自我留出包练习流程，但必须标为 `self-held-out-not-blind`。它不能在作品集中被称为 final blind，也不能支持“独立盲测”结论。一旦查看 final-blind 的输入或标签，立即记录揭盲时间；原包不再用于未见评测，不能通过换文件名恢复资格。

下面的 manifest 是填写结构，不是仓库已有文件或真实保管证明：

~~~yaml
dataset_id: capstone-eval-100-v1
scope: synthetic_training_only
total_cases: 100
development:
  count: 60
  selected_or_derived_from_week_10: learner_records_actual_count
  newly_created_seen_dev: learner_records_actual_count
  supplemental_regression_outside_core_100: learner_records_actual_count
  exposure_status: seen_development_only
  lineage_ledger: dataset-lineage-v1.csv
  m2_rag_applicable_count: 51
  m3_tool_misuse_deferred_count: 9
final_blind:
  count: 40
  created_by: independent_custodian
  package_digest: learner_records_digest_from_custody_receipt
  learner_has_seen_inputs: false
  learner_has_seen_labels: false
  open_condition: after_m3_freeze_in_week_23
m1_corpus: northstar-capstone-corpus-v1
~~~

## 第 3 天：实现引用与安全门控

无论使用什么模型或框架，把以下组件分开到可以单独检查：

1. M1 候选包版本核对；
2. 当前性、撤销、冲突和证据充分性判断；
3. 回答草稿生成；
4. 声明—分块映射与引用校验；
5. 安全终态转换；
6. 脱敏后的逐例记录。

最低路径只处理 51 条 `m2-rag` 适用开发例。先运行 8 例小切片，确认三种回答终态、运行包络、原因码和日志都能落地，再运行其余 43 条；9 条工具滥用开发例留给第 22 周，40 条 final blind 整包留给第 23 周。若生成器没有结构化输出能力，可以用适配层解析；解析失败必须进入 `run_state=failed / MODEL_OUTPUT_INVALID`，不能冒充 `abstained` 或静默当成功。

## 第 4 天：逐例诊断，而不是只看平均分

每次开发运行保存实际观察：

~~~json
{
  "case_id": "dev-001",
  "dataset_version": "capstone-eval-100-v1",
  "identity_fixture": "id-a-agent",
  "candidate_ids": ["learner_records_actual_ids"],
  "observed_state": "learner_records_actual_state",
  "observed_citations": [],
  "error_type": "none_or_named_error",
  "run_id": "learner_records_actual_run_id"
}
~~~

优先检查硬门：

- 禁止来源是否进入候选、回答或引用；
- `SOURCE_CONFLICT`、`SOURCE_EXPIRED`、`INSUFFICIENT_EVIDENCE` 是否被错误回答；
- 回答中的每个可核验声明是否有对应分块支持；
- 引用版本是否与本次 M1 快照一致；
- 失败时一线人员是否得到明确下一步。

质量阈值沿用 M0 中由业务和任务所有者批准的口径，不为作品集发明“行业标准”。安全硬门失败时，不管平均分多高都不能冻结 M2。

## 第 5 天：冻结 M2，而不是继续偷调封存集

`m2-release-manifest-v1.yaml` 至少记录：

~~~yaml
m2_release: northstar-capstone-m2-v1
m0_contract: northstar-capstone-m0-v1
m1_release: northstar-capstone-m1-v1
dataset: capstone-eval-100-v1
m2_development_denominator: 51
m2_development_result: learner_records_actual_result_digest
tool_misuse_dev_deferred: 9
generation_version: learner_records_actual_version
answer_contract: answer-contract-v1
known_failures: []
decision: continue_to_m3 | narrow | return_to_m1 | stop
decision_owner: learner_records_authorized_or_simulated_role
final_blind_count: 40
final_blind_custody_receipt: learner_records_actual_receipt
final_blind_opened: false
~~~

让一线可信代理材料走查拒答和升级文案，让业务决策者核对错误代价与继续条件，让工程评审者核对版本和硬门。若无法接触真实人员，明确写成模拟走查；它不能证明真实可用性或采用。

## 五天安排

| 学习日 | 建议时间 | 当天动作 | 离开前必须有的结果 |
| --- | ---: | --- | --- |
| 第 1 天 | 1–1.5 小时 | 锁定 M0/M1 输入，定义回答状态与引用合同 | 可检查的 M2 输入锁和封闭状态机 |
| 第 2 天 | 2 小时 | 审计旧 60 条血缘，补齐核心开发分层；由保管人新建 40 条 blind | lineage、100 例 manifest 和保管回执 |
| 第 3 天 | 2–2.5 小时 | 实现引用校验、冲突/过期/无答案门控 | 8 例小切片跑通三种终态 |
| 第 4 天 | 2 小时 | 运行 51 条 M2 适用开发例并逐例诊断 | 实际结果、错误账本和修复回归 |
| 第 5 天 | 1–2 小时 | 冻结 M2，完成三层走查和继续决定 | M2 release manifest；40 例仍封存 |

## 本周产物

~~~text
fde-course/
└─ week-21/
   ├─ m2-input-lock-v1.md
   ├─ answer-contract-v1.json
   ├─ dataset-lineage-v1.csv
   ├─ capstone-eval-100-v1-manifest.yaml
   ├─ capstone-seen-dev-v1.jsonl
   ├─ m2-dev-results-v1.jsonl
   ├─ final-blind-custody-receipt-v1.md
   ├─ rag-error-ledger-v1.md
   ├─ m2-release-manifest-v1.yaml
   └─ decision-memo-m2-v1.md
~~~

这些是学习者应在自己的工作目录形成的产物名称，不表示本仓库已附带这些文件。40 条 final-blind 输入与标签包由独立保管人保存，不应出现在学习者目录；这里只保留不泄露题目的保管回执。

## 可观察验收

- [ ] M2 只消费通过 M1 的固定语料、ACL、索引、检索和缓存版本；
- [ ] 旧 60 条逐例记录 `reuse / adapt / retire / relabel`，选入或退出核心开发集的理由可追溯；
- [ ] 核心 100 例严格为 50 可回答、20 不可回答、15 权限、15 注入/工具滥用，并按 60/40 分布；
- [ ] 40 条 final blind 是独立保管人新建，输入和标签均未向学习者暴露；否则诚实标为非盲留出；
- [ ] 每个 `answered` 的可核验声明都有本次获准候选中的具体版本和分块支持；
- [ ] ACL 禁止来源进入候选、回答或引用的数量为 0；
- [ ] 禁止来源、禁止事实与金标只存在 evaluator-only oracle，运行时、模型、普通日志和用户均不可见；
- [ ] 当前来源冲突、只有过期/撤销来源、无足够证据时不会进入 `answered`；
- [ ] `abstained` 与 `escalate` 都提供原因码和一线可执行的下一步；
- [ ] 51 条 M2 适用开发例保存实际逐例结果、版本、`run_id` 与错误类型，不只给平均分；
- [ ] 解析失败、超时、取消与版本错配进入独立运行失败状态，没有伪装成业务拒答；
- [ ] 9 条工具滥用开发例没有在本周运行，明确留给第 22 周；
- [ ] 任何生成、检索或合同变化都会产生新版本并重跑相关回归；
- [ ] M2 release manifest 写清已知失败、决定所有者和证据边界；
- [ ] 本周没有接 MCP、创建工单或产生其他外部业务效果。

## 常见失败、诊断与恢复

| 常见失败 | 诊断信号 | 恢复动作 |
| --- | --- | --- |
| 生成后才发现 ACL 错误 | 候选或上下文已经出现禁止分块 | 立即阻断 M2，回 M1 修 ACL、缓存并重跑负向矩阵 |
| 引用看似相关但不支持声明 | 引用段落没有答案中的关键条件 | 丢弃草稿，缩小声明或安全拒答；增加声明—分块检查 |
| 检索分数替代冲突判断 | 两份当前规则相反却选最高分 | 保留两份来源，进入 `SOURCE_CONFLICT` 并升级 |
| 过期材料被“仅供参考”后继续回答 | `answered` 引用了 expired/revoked 版本 | 从可靠候选移除，拒答；回 M1 修复当前来源 |
| 空候选时模型用常识作答 | 无引用但状态为 `answered` | 把空证据映射到 `INSUFFICIENT_EVIDENCE` |
| 把旧保留题或自编题写成盲测 | 题目已在第 12 周或作者手中暴露 | 移入已见开发/回归；让独立保管人另建 40 条 final blind |
| 只给一个平均准确率 | 无法定位 ACL、冲突或拒答失败 | 保存逐例状态，并按失败类型和分母报告 |
| 没有运行环境却写“51/51 通过” | 找不到命令、日志或实际结果文件 | 改成未运行的合同/手工演绎，搭建环境后再声明通过 |

## 独立迁移：供应链到货承诺

把同一方法迁移到“区域计划员查询供应商到货承诺”，但不要复用北辰答案文字：

1. 冻结获准供应商公告、运输规则、角色和有效期；
2. 构造一例当前一致、一例当前冲突、一例公告过期、一例当前语料无答案；
3. 定义哪些声明必须引用到供应商、路线、版本和适用日期；
4. 设计 20 例小型迁移集，并写出开发/留出边界；
5. 对冲突说明由采购、计划还是供应商所有者接手；
6. 若资料不足，保留人工查询路径，不编造预计到货日期。

检查点：如果系统引用的是正确供应商公告，却把另一路线的日期套到当前订单，引用仍然不合格。迁移合格的标志是决策规则保留，而不是把“退款”替换成“运输”。

## 用同一组证据向三类人解释

### 老板版

> M2 把 M1 的获准候选转成三种可审计终态，并建立 60 条已见开发例加 40 条独立 final blind 的核心评测版本。安全硬门要求冲突、过期、无答案和无权限内容不能被包装成答案；本周 51 条适用开发结果只能支持固定版本的工程判断，不能证明客户采用或 ROI。第 22 周只会把其中一个升级状态接到受控工单，不扩大业务效果。

### 一线版

> 系统有当前、获准且一致的资料时，会给出能点回具体版本的答案；资料冲突、过期或没有答案时，会明确拒答或请有权人员复核。它不会为了显得有用而猜，也不会因为资料不可见就暗中读取。你仍可以拒绝或走现有人工流程。

### 工程版

> M2 固定 M0/M1、语料、索引、ACL、检索、生成和回答合同版本。状态门在生成前后检查来源当前性、冲突和证据充分性；每个声明映射到获准分块。旧 60 条有逐例血缘，核心集按 30/12/9/9 开发和 20/8/6/6 blind 分层；本周只运行 51 条 M2 适用开发例，任何硬门失败都会阻断 M3。

## 相邻周

- 上一周：[第 20 周：接通 Capstone 数据与访问边界](../week-20-capstone-data-access/)
- 下一周：[第 22 周：接入逐次审批的单一 MCP 写效果](../week-22-capstone-approved-mcp/)

第 21 周结束时，系统仍然只有回答、拒答和升级建议，外部效果数必须为 0。第 22 周只能消费冻结的 M2 输出；它不能用工具调用来掩盖本周的证据缺口。

## 权威来源与事实边界

- [企业 RAG + MCP 助手 Capstone 项目合同](https://github.com/wmc837911722-del/fde-learning/blob/main/projects/enterprise-rag-mcp/README.md)：本课程 100 例的 50/20/15/15 分层、约 60/40 开发/盲测边界和 M2 退出条件的项目内规范。
- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://papers.nips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html)：RAG 的原始研究论文，用于理解检索与生成结合；它不替具体组织定义引用、拒答或授权门槛。
- [NIST AI 600-1 — Generative Artificial Intelligence Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)：生成式 AI 风险识别、测量和治理参考。
- [NIST SP 800-162 — Guide to Attribute Based Access Control](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-162.pdf)：基于主体、对象、操作和环境属性实施访问控制的参考。
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)：提示注入、敏感信息披露、不可信输出和过度代理等风险参考。

**核验日期：2026-09-12。** `answered / abstained / escalate`、100 例的类别与 60/40 切分、声明—引用硬门和 M2 冻结方式是本课程针对北辰 Capstone 设计的教学合同，不是上述来源规定的通用行业标准。北辰公司、人员、问题、语料、版本、数据集、状态和完成结果均为合成材料；页面中的 JSON 是手工演绎参考，不是仓库运行输出。真实结论必须来自学习者自己的授权数据、固定实现和可追溯运行，本周不能证明生产质量、客户授权、采用率、效率、合规或 ROI。
