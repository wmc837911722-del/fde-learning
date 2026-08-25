---
title: 第 6 周：建立可靠、可重放的数据入口
description: 为确定性薄片增加数据合同、质量状态、来源血缘、批次幂等、隔离和定向重放，让坏数据不会静默变成业务事实。
sidebar:
  label: 第 6 周：可靠数据入口
  order: 6
lastUpdated: 2026-08-25
---

> **直接答案：** 可靠摄取不是“把 CSV 全部导入成功”，而是让每条输入进入可解释状态：有效记录带来源和版本进入主表，重复记录不产生第二个业务结果，缺字段或非法记录进入可修复的隔离区；同一批次重跑不改变已提交结果，修复后可以只重放目标记录，并用数据库状态和结构化日志对账。

:::note[本周学习合同]
- **起点：** 已完成[第 5 周确定性薄片](../week-05-deterministic-vertical-slice/)，拥有接口、关系模型、首个迁移、固定合成政策和成功/异常测试。
- **工程前置：** 你能够在自己的技术栈中读取结构化输入、使用事务和数据库约束、编写集成测试。
- **预计投入：** 8–10 小时，建议分成 5 次完成。
- **本周表现：** 为一批合成政策建立数据合同，独立处理一条有效、一条重复和一条隔离记录；重跑同一批次，再修复并定向重放隔离记录。
- **完成证据：** `data-contract-v1.md`、摄取作业、质量与隔离状态、批次幂等和重放测试、来源血缘、安全日志、`ingestion-runbook-v0.md`。
- **本周不做：** 不接真实未授权数据，不建立 RAG 或向量索引，不扩大第 5 周任务，不做完整流式平台，不把导入行数写成数据质量或业务价值。
:::

:::caution[仍然没有配套代码 starter]
本页不声称仓库已有摄取程序、CSV 文件或启动命令。下面给出完整合成输入、状态规则和预期结果；你需要在第 5 周自己的应用中实现，并把实际运行方式写入自己的项目说明。
:::

## 本周只增加一个难度：数据不再默认干净

```text
第 5 周固定关系夹具
  → 第 6 周数据合同与批次入口
  → accepted / duplicate / quarantined
  → 同批次重跑
  → 修复与定向重放
  → 数据库、隔离区和安全日志对账
```

本周不改变一线任务。它只保证第 7 周消费的数据具有来源、版本、有效期、所有者和访问级别，不会因为重复、缺失或冲突而制造假确定答案。

## 最小心智模型：三个相近概念不要混用

| 概念 | 要回答的问题 | 北辰例子 |
| --- | --- | --- |
| 重复检测 | 这条输入与已有业务事实是否相同？ | 同一 `policy_id + source_version` 出现两次 |
| 幂等 | 同一个意图重试后，提交结果是否仍相同？ | 同一 `batch_id` 重跑不新增政策版本 |
| 重放 | 修复失败原因后，能否只重新处理目标记录？ | 给缺 owner 的隔离记录补 owner 后重放 |

把三者都叫“去重”会隐藏恢复行为。另一个关键区别是：

> **成功解析不等于业务有效。** 一行 JSON 或 CSV 能被读取，仍可能缺少所有者、日期矛盾、权限未知或版本重复。

## 先看完成品：六条合成政策怎样流动

以下输入、批次、状态、日志和结果全部是**固定合成教学材料**。

### 输入批次

批次 ID：`batch-w06-20260825-a`；来源：`northstar-policy-export-v1`；输入 `n=6`。

```csv
row_id,policy_id,source_version,task_type,region,effective_from,effective_to,owner_id,access_level,source_id
R1,POL-PLAN-01,3,plan_change,east,2026-08-01,2026-12-31,knowledge-billing,support,KB-BILLING-2026-08
R2,POL-PLAN-01,3,plan_change,east,2026-08-01,2026-12-31,knowledge-billing,support,KB-BILLING-2026-08
R3,POL-REFUND-02,1,refund,east,2026-08-01,2026-12-31,,support,KB-REFUND-2026-08
R4,POL-CREDIT-03,4,credit,east,2026-10-01,2026-09-01,knowledge-credit,support,KB-CREDIT-2026-09
R5,POL-PLAN-01,2,plan_change,east,2026-01-01,2026-07-31,knowledge-billing,support,KB-BILLING-2026-01
R6,POL-SPECIAL-09,4,special_refund,east,2026-07-01,2026-12-31,knowledge-risk,supervisor,KB-REFUND-2026-07
```

### 完成的数据合同

`data-contract-v1.md` 至少说明：

| 字段 | 业务含义 | 必需 | 质量与状态规则 | 安全边界 |
| --- | --- | --- | --- | --- |
| `policy_id` | 跨版本稳定的政策标识 | 是 | 空值隔离 | 可进入普通日志 |
| `source_version` | 来源系统中的版本 | 是 | 与 policy_id 组成稳定业务键 | 可进入普通日志 |
| `effective_from/to` | 适用时间边界 | 是 | from 晚于 to 时隔离 | 可记录日期，不记录正文 |
| `owner_id` | 负责确认和下线的人或角色 | 是 | 缺失隔离 | 普通日志只记安全 ID |
| `access_level` | 最小访问级别 | 是 | 未知值默认隔离，不默认 public | 不能因摄取扩大可见性 |
| `source_id` | 可追溯来源 | 是 | 缺失隔离 | 不等于保存完整来源正文 |
| `batch_id` | 本次摄取意图 | 系统生成 | 同一批次重跑幂等 | 可审计 |

关系数据库只是本课程默认示例。无论你使用什么存储，业务键、来源、状态和恢复语义都必须可观察。

### 第一次摄取的预期状态

| row_id | 预期状态 | 原因码 | 主表变化 | 隔离区变化 |
| --- | --- | --- | --- | --- |
| R1 | `accepted` | `VALID` | 新增 POL-PLAN-01 v3 | 无 |
| R2 | `duplicate` | `DUPLICATE_BUSINESS_KEY` | 不新增第二条 | 无 |
| R3 | `quarantined` | `MISSING_OWNER` | 无 | 新增可修复记录 |
| R4 | `quarantined` | `INVALID_EFFECTIVE_RANGE` | 无 | 新增可修复记录 |
| R5 | `accepted` | `EXPIRED_VERSION` | 保存来源版本，生命周期为 expired | 无 |
| R6 | `accepted` | `VALID_RESTRICTED` | 保存 supervisor 访问级别 | 无 |

汇总结果必须带分母：

```json
{
  "batch_id": "batch-w06-20260825-a",
  "input_rows": 6,
  "accepted_rows": 3,
  "duplicate_rows": 1,
  "quarantined_rows": 2,
  "committed_business_versions": 3,
  "status": "completed_with_quarantine"
}
```

`accepted_rows=3` 不表示三条都能给普通客服使用。R5 已过期，R6 受限；普通客服当前候选视图中只有 R1。

### 数据库、隔离区和日志怎样对账

主表预期：

| policy_id | source_version | lifecycle_status | access_level | source_id | ingest_batch_id |
| --- | ---: | --- | --- | --- | --- |
| POL-PLAN-01 | 3 | current | support | KB-BILLING-2026-08 | batch-w06-20260825-a |
| POL-PLAN-01 | 2 | expired | support | KB-BILLING-2026-01 | batch-w06-20260825-a |
| POL-SPECIAL-09 | 4 | current | supervisor | KB-REFUND-2026-07 | batch-w06-20260825-a |

隔离区预期：

| quarantine_id | row_id | reason_code | replay_status | safe_source_ref |
| --- | --- | --- | --- | --- |
| Q-001 | R3 | MISSING_OWNER | pending_fix | northstar-policy-export-v1#R3 |
| Q-002 | R4 | INVALID_EFFECTIVE_RANGE | pending_fix | northstar-policy-export-v1#R4 |

普通结构化日志示例：

```json
{
  "event": "ingestion_batch_completed",
  "correlation_id": "ing-w06-a-001",
  "batch_id": "batch-w06-20260825-a",
  "source_id": "northstar-policy-export-v1",
  "input_rows": 6,
  "accepted_rows": 3,
  "duplicate_rows": 1,
  "quarantined_rows": 2
}
```

日志不包含政策正文、客户信息、密钥或完整原始行。需要调试原始输入时，应进入有独立权限和保留规则的证据存储，而不是打印到普通日志。

### 同一批次重跑的预期结果

第二次使用完全相同的 `batch_id` 和输入：

- 主表仍有 3 个业务版本；
- 隔离区仍是同两项，不新增重复隔离记录；
- 系统可以返回 `already_processed`，或重算后得到相同提交结果；
- 不能产生第二个当前政策，也不能覆盖最初审计记录。

你选择哪种实现都可以，但行为合同必须明确并有测试。

### 修复与定向重放

为 R3 补充 `owner_id=knowledge-refund`。定向重放使用新的 `replay_id=replay-w06-001`，同时引用原隔离记录 Q-001：

```json
{
  "replay_id": "replay-w06-001",
  "quarantine_id": "Q-001",
  "changed_fields": ["owner_id"],
  "result": "accepted",
  "business_key": "POL-REFUND-02:1"
}
```

预期：主表增加一个业务版本；Q-001 状态改为 `resolved` 并链接重放事件；Q-002 保持不变。修复历史不能被删除。

## 第 1 天：从 Brief 和样本写数据合同

不要先看列名猜语义。回到 `Discovery Brief v1` 和当前流程，逐字段回答：

1. 哪个任务判断需要它？
2. 谁拥有和更新它？
3. 缺失、非法、过期或冲突时，业务状态是什么？
4. 它携带什么访问级别？
5. 普通日志允许记录什么？

如果字段无法回链任务或风险，它不应自动进入本周主路径。

## 第 2 天：实现最小摄取和血缘

技术栈中立的处理顺序：

```text
建立 ingestion_run(batch_id, source_id, source_version)
  → 逐行解析并生成稳定业务键
  → 校验必需字段、日期、所有者和访问级别
  → 检查同一业务版本是否已存在
  → accepted：事务写入主表与事件
  → duplicate：记录重复，不新增业务版本
  → quarantined：保存安全来源引用、原因码和可重放状态
  → 提交批次汇总
```

不要把 `row_number` 当稳定业务键。文件重新排序后它会变化。

## 第 3 天：加入质量状态和隔离区

原因码要让运营者知道下一步，而不是只有 `INVALID_DATA`：

- `MISSING_OWNER`：找知识所有者补齐；
- `INVALID_EFFECTIVE_RANGE`：确认日期或拒绝来源；
- `UNKNOWN_ACCESS_LEVEL`：默认隔离，找权限所有者；
- `DUPLICATE_BUSINESS_KEY`：核对是否完全相同或源系统重复；
- `CONFLICTING_CURRENT_VERSION`：不能静默覆盖，进入冲突复核。

原因码是本教程的示例，不是通用标准。你的系统可以改名，但必须稳定、可测试、可操作。

## 第 4 天：测试幂等、重放和三处一致

自动化测试至少核对：

1. 第一次摄取的主表业务版本；
2. 隔离记录及原因；
3. 结构化日志汇总；
4. 同批次重跑后业务状态不变；
5. 定向重放只改变目标记录；
6. 受限记录的访问级别没有被降级。

出现“日志说成功 6 行，主表只有 3 行”时，不要选择相信其中一个；先修正状态定义和汇总口径。

## 第 5 天：完成恢复说明并改变一种条件

在 `ingestion-runbook-v0.md` 中写清：

```md
- 怎样找到失败批次和 correlation_id；
- 哪些错误可修复并重放，哪些必须拒绝来源；
- 谁有权修改 owner、日期和访问级别；
- 重放前怎样检查是否已经提交；
- 重放后怎样对账主表、隔离区和日志；
- 怎样停止摄取而不影响已提交正确数据；
- 哪些原始材料不能进入普通日志。
```

然后从“日期冲突、迟到、乱序”中选一种相邻变化。不要在一周内同时实现完整流式、回填和多源对账平台。

## 五天安排与可见产物

| 学习日 | 建议时间 | 当天动作 | 离开前必须有的结果 |
| --- | ---: | --- | --- |
| 第 1 天 | 1.5 小时 | 写字段语义、所有者、权限和失败状态 | `data-contract-v1.md` |
| 第 2 天 | 2–3 小时 | 实现批次、稳定键、来源和首次摄取 | 可重复的摄取路径 |
| 第 3 天 | 1.5 小时 | 加入质量规则和隔离原因码 | accepted/duplicate/quarantined 结果 |
| 第 4 天 | 2 小时 | 测试重跑、修复重放和三处一致 | 数据库、隔离区与日志证据 |
| 第 5 天 | 1–2 小时 | 完成 runbook，独立处理一种变化 | 恢复说明与迁移结果 |

建议目录：

```text
fde-course/
└─ week-06/
   ├─ data-contract-v1.md
   ├─ ingestion/
   ├─ tests/
   ├─ evidence/
   └─ ingestion-runbook-v0.md
```

## 验收与失败恢复

本周通过需要同时满足：

- [ ] 相同批次重跑不会改变已经提交的业务结果；
- [ ] 无效行不会静默进入主表，也不会被悄悄丢弃；
- [ ] 每个业务版本能追溯到来源、源版本和摄取批次；
- [ ] 缺少或未知访问级别默认隔离，受限数据不会扩大可见范围；
- [ ] 修复后可以定向重放，原隔离和修复历史仍可见；
- [ ] 自动化测试核对主表、隔离区和结构化日志；
- [ ] 日志不保存敏感正文、密钥或可识别个人信息；
- [ ] 没有把摄取成功率写成任务正确、采用或业务价值。

| 常见失败 | 诊断信号 | 恢复动作 |
| --- | --- | --- |
| 用覆盖代替版本 | 更新后旧来源和决定消失 | 保留稳定 ID、源版本和有效关系 |
| 导入成功等于质量好 | 只统计解析行数 | 加字段、业务、时效、所有者和权限检查 |
| 重试产生重复记录 | 同一批次增加第二条业务版本 | 使用稳定业务键和批次幂等 |
| 坏数据直接丢弃 | 数量对不上但没有原因 | 进入带原因码和重放状态的隔离区 |
| 默认缺权限为公开 | 缺 ACL 的记录出现在普通候选 | 默认拒绝并找权限所有者 |
| 日志打印完整输入 | 普通日志可读政策或个人信息 | 改为安全 ID、摘要、计数和原因码 |

## 独立迁移：承运商订单的迟到与乱序

供应链夹具包含同一订单的三个事件：

```text
E1 source_time=10:00 received_at=10:02 status=departed
E2 source_time=09:40 received_at=10:05 status=loaded
E3 source_time=10:10 received_at=10:11 status=delayed
```

独立完成：

1. 定义稳定事件键和订单键；
2. 区分重复、迟到和业务时间乱序；
3. 选择“保留全部事件并按 source_time 形成当前状态”或其他规则，并写证据；
4. 设计重放后不重复通知的边界，但本周不实现通知；
5. 写出错误地按 `received_at` 覆盖会造成什么任务风险。

迁移通过的关键不是状态名，而是来源时间、接收时间、当前业务状态和恢复行为彼此可解释。

## 用同一数据证据向三类人解释

- **老板版：** 哪些数据风险会让扩大投入变得不可信，隔离和重放为什么比“导入 100%”更有价值。
- **一线版：** 过期、冲突或受限数据为何不会给出假确定结果，谁负责修复。
- **工程版：** 合同、稳定键、事务、幂等、隔离、血缘、日志和重放怎样互相验证。

## 上一周与下一周

- 上一周：[第 5 周：从问题合同做出确定性垂直薄片](../week-05-deterministic-vertical-slice/)
- 下一周：[第 7 周：让一线角色在权限内完成任务](../week-07-frontline-task-permissions/)

第 7 周只能消费通过质量门、携带来源、版本、所有者、有效期和权限元数据的数据。

## 来源与事实边界

- [PostgreSQL — Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)：关系数据库约束、唯一性和数据完整性参考；本课程不要求使用 PostgreSQL。
- [OpenTelemetry — Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)：结构化日志、时间、严重程度、Trace/Span 关联等通用遥测参考；本页的日志字段不是其强制模式。
- [Palantir Learn — Speedrun: Your First End-to-End Workflow](https://learn.palantir.com/speedrun-your-first-e2e-workflow)：数据到应用和动作的端到端路径参考；其产品实现不是本课要求。

**核验日期：2026-08-25。** 北辰 CSV、字段、批次、状态、原因码、计数、日志和重放结果均为固定合成材料或原创教学设计，不代表真实数据质量、生产吞吐、行业状态机或客户结果。
