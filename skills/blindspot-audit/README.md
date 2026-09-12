# blindspot-audit

重构 / 优化立项前的多维盲区审计：用四象限扩维补全你没想到的审计维度，再经 runtime-first 双证与对抗证伪，产出一套可拍板、任何新会话都能接手的审计文档集。

## 触发场景

触发词（原样）:

- `我要重构/优化 XX，帮我全面分析`
- `MVP 之后系统性迭代 XX`
- `盲区审计`
- `blind spot pass`
- `多维审计`
- `全景审计`
- `帮我找 unknown unknowns`

典型使用场景:

- 准备重构或优化某个页面集 / 子系统 / 链路，立项前想要一份不漏维度的现状清单
- MVP 上线后要做第一轮系统性迭代，需要把「哪里危险、先动什么」固化成文档
- 手上已有一份旧的问题清单（如 MKT-1~24），需要逐项复核今日状态并重新定性
- 明确想找 Unknown Unknowns —— 自己说不出、但确实该审的维度
- 需要把审计结论交接给下游 `requirements-matrix-generator` 继续做需求矩阵

## 解决什么问题

重构 / 优化立项前，用户通常只说得出自己想到的两三个维度，审计因此系统性漏掉没想到的维度（Unknown Unknowns），还会把「用户觉得显而易见从没说」的事实误判成 P0（Unknown Knowns）。本 skill 用四象限盲区扩维（维度库比对 / codebase 侦察反推 / 六视角轮换 / 固定追加盲区维）补全维度，再经 runtime-first 双证 + 用户独有知识确认门 + P0/P1 全量对抗证伪，产出一套可拍板、任何新会话都能接手的审计文档集，供下游 `requirements-matrix-generator` 承接。

## 工作流程

1. **Step 1 意图接收与语境侦察（intake）**：从用户输入 + 快速侦察提取六件事 —— ① 目标与边界（审计什么、明确排除什么）② 用户已知维度（直接进维度表）③ 真相源双证配置（源码侧 repo 路径 + 当前 HEAD sha；运行侧灰度/生产 URL、DB 访问方式、公开 API 端点；两侧版本必须一致或标注差异）④ 上游基线（有前一轮审计 / 问题清单则任务必须含「逐项复核今日状态：仍在 / 已修 / 部分修 / 需重新定性」）⑤ 项目纪律来源（`.claude/rules/*`、PROJECT.md、记忆文件；记忆断言必须先对抗 confirm/refute 再引用）⑥ 交付模式（模式 A 会话内执行 fan-out / 模式 B 生成提示词包）。
2. **Step 2 盲区扩维**：依次跑四个机制产出候选维度 —— 机制 1 维度库比对（查 `references/dimension-library.md` 按目标类型拉基础维度集，与用户给的求差集）；机制 2 codebase 侦察反推（Explore 目标文件面 / 子系统，判据：目标触碰了某子系统的数据或状态但用户没提 → 补维）；机制 3 六视角轮换（终端用户 / 运营 / 客服 / 攻击者 / 财务审计师 / 三个月后接手的工程师，各问「这次改动我最怕什么」，怕的东西没维度承接就补）；机制 4 固定追加维（无条件两个：盲点与横切扫描维 `0N` 最后一维 + 度量与可验证性检查）。产出「维度提案表」给用户确认（# / 维度 / 前缀 / 来源 / 审计焦点），这是本 skill 与用户唯一必需的确认门；维度数经验值 6-9 个。
3. **Step 3 访谈（用户独有知识确认门）**：维度确认后、开审前用 AskUserQuestion 一次性问清两类，架构性问题优先 —— A 类用户独有知识（资产归属如域名 / 邮箱 / 账号是否真实持有；内容真实性如证言 / 数据是否真实有授权还是占位；历史决策如哪些「看起来是 bug」其实是拍过板的有意为之；环境语境如生产是否真实开量 Stripe test/live）；B 类审计执行参数（严重度语境：什么算这个项目的 P0；产出目录）。问不到答案不阻塞开审，但相关发现必须标注「待用户确认（涉及用户独有知识）」，禁止直接定 P0。
4. **Step 4 审计执行设计**：给每个维度 agent 注入统一纪律九条（runtime > canon 锚定 file:line + 实测日期且数量断言必须实际 grep；双证；暴露度标注 live-traffic / dormant / ops-only 且 dormant 高危建议 Frozen(tripwire)；误报防御含实测证据有效性；用户独有知识标待确认；老文档 / 记忆断言先 confirm/refute；健康面必须写；严重度语境；视觉资产逐张 Read 读图机扫）。模式 A 下维度 agent 并行 fan-out 各自落盘 `{NN}-{维度名}.md`，findings 摘要随文档落盘（先写 findings-summary 块再写正文）；大批量分块执行而非单次全并行，agent 撞限额先盘磁盘再重跑，嵌入大上下文用 ASCII 编码。
5. **Step 5 对抗证伪波（P0/P1 全量，不可跳过）**：全部 P0/P1 发现交独立证伪 agent 双向验证 —— 证伪者不信任原审计者任何引用并独立重推 file:line；双向找支持与反驳证据；四个高频翻车点必查（设计 vs 实现混淆、锚点漂移含幻觉锚点、语境缺失即用户独有知识、无效实测证据）；裁定四值 CONFIRMED / DOWNGRADED / UPGRADED / REFUTED 并产出裁定表进 `00` 总览；分批每批 ≤5 条；限额受阻按降级序执行（交叉实锤 = 内建证伪 / 单源 P0 主线程亲验含读图 / 单源 P1 标 PENDING + 实施前逐条前提复核）并诚实登记方式。
6. **Step 6 汇总落盘**：产出固定文档集（`000-README-目录索引与接手说明.md` + `00-现状总览与迭代指南.md` + `01-{维度1}.md` ... `0N-盲点与横切扫描.md`，可选专题指南）。`00` 总览固定九节结构（§0–§8，编号自 0 起算）：§0 一句话总判断 / §1 P0 全景 / §2 P1 精选 / §3 健康面 / §4 对抗证伪裁定表 / §5 迭代批次建议 A-H（按依赖关系 + 主题成批，不按发现顺序）/ §6 待拍板决策清单 D1-Dx（每项 = 问题 + 选项集 a/b/c + 推荐 + 涉及发现编号）/ §7 与既有专项资产衔接 / §8 讨论记录（留空章节，拍板后逐条回填，文档是活的决策台账）。收尾向用户报告「维度×发现数、P0/P1 清单、证伪裁定、待拍板 D-x 菜单」并提示下一步拍板 D-x → 调用 `requirements-matrix-generator`。

## 输入 / 产出

### 输入

| 输入 | 说明 |
| --- | --- |
| 用户意图 | 想做的事 + 已知的维度（用户点名的关注点） |
| 目标与边界 | 审计什么（页面集 / 子系统 / 链路）、明确排除什么 |
| 源码侧真相源 | repo 路径 + 当前 HEAD sha（审计锚点固定在此 sha） |
| 运行侧真相源 | 灰度 / 生产 URL（curl 实测）、DB 访问方式、公开 API 端点 |
| 上游基线 | 前一轮审计 / 问题清单（如 MKT-1~24），有则逐项复核今日状态 |
| 项目纪律来源 | `.claude/rules/*`、PROJECT.md、记忆文件（记忆断言需先 confirm/refute） |
| 交付模式 | 模式 A（会话内 fan-out 执行）或模式 B（只生成 paste-ready 提示词包） |
| 访谈 A 类答案 | 资产归属 / 内容真实性 / 历史决策 / 环境语境（Stripe 是 test 还是 live） |
| 访谈 B 类答案 | 严重度语境（什么算本项目的 P0）+ 产出目录 |
| 被审计代码库本身 | Step 2 机制 2 的 codebase 侦察对象，含截图 / 图片等视觉资产 |

### 产出

| 产出 | 说明 |
| --- | --- |
| `{专项目录}/000-README-目录索引与接手说明.md` | 阅读顺序表 + 当前状态 checkbox + 关键结论速记 + 接手指引（模板：`templates/readme.template.md`） |
| `{专项目录}/00-现状总览与迭代指南.md` | 拍板与接手主入口，含 P0 全景、对抗证伪裁定表、迭代批次建议、待拍板 D1-Dx 清单、讨论记录（模板：`templates/overview.template.md`） |
| `{专项目录}/01-{维度1}.md` … `0N-盲点与横切扫描.md` | 每维一份六章审计文档（① 结论摘要 ② 现状地图 ③ 发现明细 ④ 健康面正向核销 ⑤ 待拍板决策候选 ⑥ 与其他维度的交叉引用），模板：`templates/dimension-audit.template.md` |
| findings-summary 注释块 | 每个维度文档头部，`{PREFIX}-N\|P0-P3\|live-traffic/dormant/ops-only\|标题`，作为 agent 撞限额时的救援提取点 |
| `{专项目录}/(可选) 专题指南` | 审计发现「代码就绪只差配置 / 操作」类问题时写成的可操作点亮指南（例：`09-度量点亮指南`） |
| 模式 B 产物 | `{专项目录}/audit-prompts/{NN}-{维度名}-提示词.md`（一维一文件）+ 一份编排总纲（模板：`templates/dimension-agent-prompt.template.md`） |
| 维度提案表 | `# / 维度 / 前缀 / 来源 / 审计焦点`，Step 2 产出给用户确认 |
| 对抗证伪裁定表 | `ID / 维度 / 裁定 CONFIRMED·DOWNGRADED·UPGRADED·REFUTED / 关键依据锚点`，落进 `00` 总览 |
| 收尾报告 | 向用户报告：维度×发现数、P0/P1 清单、证伪裁定、待拍板 D-x 菜单 |

## 目录结构

```text
skills/blindspot-audit/
├── SKILL.md                                    # 主指令文件：frontmatter 触发描述 + 定位流水线 + 四象限理论映射 + Quick Reference 检查表 + Step 1-6 Standard Workflow + 13 条铁律 + 文件指针 + 版本记录（v1.0/v1.1/v1.2）
├── SOURCE-NOTE.md                              # 溯源与授权定性：来源 ~/.ai-config/skills/blindspot-audit、快照日 2026-07-16、License 定性 self-authored（自研无第三方内容）→ 🟢 green、真值方向「仓库为权威」（用户级目录将换为指向本目录的 symlink）、2026-07-16 敏感值扫描通过
├── references/
│   ├── dimension-library.md                    # 维度库：Step 2 机制 1 的比对源，含命名约定（2-4 字母大写前缀、{NN}-{维度中文名}.md、最后一维固定盲区维）+ 类型 A 前端/营销、B 支付/资金、C API/协议、D 数据/存储、E 运维/部署、F 安全专项、G 文档/知识库 的基础维度集 + 通用横切维（度量与可验证性、CI/回归守护、文档与口径漂移、触达链路、视觉资产敏感值）
│   └── falsification-protocol.md               # Step 5 对抗证伪协议：证伪者提示词模板、编排规则（每批 ≤5、不同 agent 实例、交叉实锤加权、裁定表落盘、REFUTED 不删除）、限额/资源受限降级协议（交叉实锤/单源 P0 主线程亲验/单源 P1 标 PENDING）、9 类误报防御清单（环境污染、用户独有知识、设计当实现、文档当实态、锚点漂移、已修误报、名义值反推、假阴性证据、幻觉锚点）
└── templates/
    ├── dimension-agent-prompt.template.md      # 维度审计 agent 提示词模板：模式 A 作 fan-out prompt，模式 B 逐维实例化后落盘为 paste-ready 文件；含背景语境、审计焦点、九条纪律、findings-summary 先写块再写正文的输出要求
    ├── dimension-audit.template.md             # 维度审计文档结构模板（{NN}-{维度中文名}.md）：六章骨架 + findings-summary 注释块 + 严重度 P0-P3 / 暴露度 / 证据 / Frozen(tripwire) 的字段写法
    ├── overview.template.md                    # 00-现状总览与迭代指南模板：§0 一句话总判断 到 §8 讨论记录（拍板后逐条回填的活文档）共九节
    └── readme.template.md                      # 000-README-目录索引与接手说明模板：阅读顺序表、当前状态 checkbox、关键结论速记、接手指引（含锚点基于 HEAD=sha 的重验提醒）
```

## 注意事项

- 铁律开宗明义：13 条铁律「违反任意一条 = 审计质量不可信」（SKILL.md「铁律」节，蒸馏自 007 / 009 两轮实战）。
- 环境探测类结论禁止只凭本机测量定 P0：DNS 解析 / 网络可达 / 第三方服务状态必须附「本机环境可能被代理 / DNS 污染」免责标注，只能定「待复核」。007 实战：本机 dig 被 Clash fake-ip 污染 → 误判客服邮箱无 MX 是黑洞（连公共 DNS 查询都被劫持）。
- 「本机测不到」≠「不存在」—— 明确列为误报防御要点。
- 实测证据须有效：用「必然失败的输入」测出的失败证明不了机制。008 实锤：用假 key 测得 401 被当作「session-only 的双证」，但假 key 对任何端点都 401，证据无效须剔除（结论可能仍真，但必须换有效证据重新支撑）。
- 幻觉锚点：008 中 COV agent 引用的 `auth.ts:177 enableSessionForAPIKeys` 全仓 grep 0 命中，锚点不存在 —— 但锚点不存在 ≠ 结论错误，须换有效证据重新裁定。
- 禁止从标识符字符串反推业务数值：`activation_hot_199` 名义 199 实价 4.0 CNY；`PROMO_FIRST_TOPUP_20` 名义 20 实为 10% —— 一律查运行时规则源。
- 设计 vs 实现双向混淆都要防：既防「文档 + mock 齐全但 runtime 从未实现」被当成「已实现有 bug」（flow5h / 7d 翻车），也防「文档说未接线」就当真（`channel_group_pricing` 实际 billing 热路径已接）。
- 用户独有知识确认门必须过，但问不到答案不阻塞开审 —— 相关发现只能标「待用户确认」，禁止直接定 P0。007 教训：审计判 `token101.ai` 是废域要全站替换（真相是用户持有的生产域，方向整个反了）、判 support 邮箱是黑洞（真相是用户自持可收信）；007 六个 P0 里两个是这类误报。
- 维度数经验值 6-9 个（007 / 009 都是 8）：少于 4 说明目标太小可能不需要本 skill；多于 10 建议合并或拆两轮专项。
- 最后一维固定为「盲点与横切扫描」维，前缀 `BS-` 或 `BLD-`；每个维度分配独立发现前缀，专项内唯一、互不撞号。
- 证伪者与原审计者必须是不同的 agent 实例（不共享上下文）；分批执行每批 ≤5 条（批内并行、批间顺序）。
- 限额受阻不弃守：禁止把 PENDING 项静默当 CONFIRMED 写进批次计划，禁止用「审计 agent 说了」替代独立验证；裁定表须诚实登记裁定方式。
- REFUTED 的发现不删除 —— 在维度文档原地标注裁定与理由，防止下一轮审计重新发现它。
- findings 摘要必须在正文之前先落盘（先写 findings-summary 块、再写正文，每完成一条发现回填一行别攒到最后）。008 实锤：4/8 agent 丢返回值，报告全在磁盘救回。
- agent 撞限额「失败」时报告常已落盘（只丢返回值）—— 先 `ls` + `wc -l` + `tail` 盘磁盘再决定重跑（009 / 008 两轮 100% 救回）；嵌入大上下文时用 ASCII 编码防 Unicode 解析炸。
- 视觉资产必须逐张 Read 读图机扫：文本 grep 对图片盲。008 实锤 LEK-1 全场最重的 P0（截图泄真实 API key）只有读图能抓到；已扫张数写进健康面核销。
- 暴露度先于优先级：dormant 高危项建议 Frozen(tripwire)（登记解冻触发器）而非立即修。
- 上游基线必须逐项复核「仍在 / 已修 / 部分修 / 需重新定性」，否则会把已修项重复立项（007 基线 MKT-13 已修，不复核会重复立项）。
- 决策必须写成选项集（a/b/c + 推荐）交用户拍板，不写模糊建议；拍板结果回填 00 文档（文档即台账）。
- 产出边界：只到审计文档集为止，不生成 requirements —— requirements 是下游 `requirements-matrix-generator` 的职责。
- 关键结论不留在对话里 —— 全部落盘，`000-README` 保证任何新会话可接手；语言约定：正文中文，状态 / 裁定词保留英文（P0-P3、CONFIRMED / DOWNGRADED / REFUTED、live-traffic / dormant、Frozen(tripwire)）。
- 锚点漂移：接手时间距审计 >1 周或该文件已被改动 → 先按当前 HEAD 重验 file:line 再引用。
- 模式 A 的 Workflow 编排有条件：维度 ≥5 且用户已授权 workflow 时可用，否则用 Agent 工具分批并行。
- 本 skill 正文提到顶层串联指南 `_skills/SSD-全链路方法论.md`，属指向仓库外的相对路径引用，在新 clone 上不存在。

## 安装

纯提示词型 Markdown skill，无 npm / pip 安装步骤、无 `scripts/` 目录（目录内只有 `SKILL.md`、`SOURCE-NOTE.md`、`references/`、`templates/`）。

方式一，直接复制：

```bash
cp -r skills/blindspot-audit ~/.ai-config/skills/
```

方式二，推荐 symlink（改仓库即生效）：

```bash
ln -s "$(pwd)/skills/blindspot-audit" ~/.ai-config/skills/blindspot-audit
```

补充说明:

- 真值方向：仓库为权威（D-1a），用户级 `~/.ai-config/skills/blindspot-audit` 将换为指向本目录的 symlink，修改一律先改仓库。
- License: 仓库级 MIT © 2026 amerlin；本 skill 定性 self-authored（自研，无第三方内容，无随包 LICENSE 需要）→ 🟢 green，2026-07-16 敏感值扫描通过。
- 依赖宿主 Agent 运行时能力（Agent / Workflow fan-out、AskUserQuestion、Read 读图、Explore、curl / DB 实测），无外部包依赖（runtimeDeps 为空）。
- 完整流水线需另装下游 skill：`requirements-matrix-generator` → `ameureka-spec-dev` → `loop-prompt-generator`，本 skill 只负责第一段。

License: MIT
