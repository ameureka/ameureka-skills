# gpt-imageflow

走 **OpenAI 兼容中转** 的 `gpt-image-2` 出图组件，从 ameureka-media-agent 的
imageflow 产线抽离，做成一个可放进任意 Python 项目的独立包。

> **⚠️ 凭据安全**
> 本包需要一个**第三方 OpenAI 兼容中转**的 API key，**请自行准备并妥善保管**：
> - 仓库里只有 `.env.example`（占位符），**不要**把填好真实 key 的 `.env` 放进仓库工作树；
>   `.gitignore` 已忽略 `*.env`，但 zip / rsync / docker COPY 等不走 git 的通道**不受它保护**。
> - 建议把配置放到仓库外（如 `~/.config/gpt-imageflow/.env`，权限 `600`），用 `--env-file` 指定。
> - 一旦 key 曾明文落盘或疑似泄露，**立即到中转后台轮换/吊销**。本包不代为保管任何凭据。

```bash
pip install -e .
cp .env.example .env   # 填 GPT_RELAY_BASE_URL / GPT_RELAY_API_KEY
gpt-imageflow --help
```

## 为什么抽出来

原产线里 `gpt_image.py` 承载的实测标定值得复用：**中转只保证比例不保证精确像素、
`output_format` 只是建议、返回可能是 b64 也可能是 url、错误必须分类**——这些全是
真跑出来的坑，换一个项目重踩一遍没意义。本包把「唯一的 HTTP 调用点」收成一个
`call_relay`，下游（批量、封面、探测）都委托它。

## 能力

| 子命令 | 说明 |
|--------|------|
| `single` | 单张出图（`--prompt --preset/--size --out`） |
| `generate` | 批量候选图生成（输入 `image-generation-requests.v1` 批） |
| `cover` | 3:4 封面生成，带人脸参考图（走 edits 路径） |
| `probe` | 接入新中转前的能力探测（models / generations / chat / 中文直出） |
| `selftest` | 只验连通与配置，不出图不花钱 |

三个可复用入口：

```bash
# 单张
python3 -m gpt_imageflow single --prompt "..." --preset 16:9 --out a.webp

# 批量（requests.json 是 image-generation-requests.v1 结构）
python3 -m gpt_imageflow generate \
  --requests reqs.json --out-dir out --aspect-ratio 16:9 --timeout 120

# 封面（publish-kit.json 带 cover.prompt + cover.faceRef）
python3 -m gpt_imageflow cover --kit publish-kit.json --variants 2

# 接入新中转前先探能力
python3 -m gpt_imageflow probe --out-dir _probe-out

# 只验连通与配置（不花钱）
python3 -m gpt_imageflow selftest
```

各子命令也可直接调模块：`python3 -m gpt_imageflow.candidates ...`。

## 配置

优先级：**环境变量 > `--env-file` 指定的文件 > 当前目录 `.env`**。两行配置：

```
GPT_RELAY_BASE_URL=https://your-relay.com/v1
GPT_RELAY_API_KEY=sk-xxxx
```

配置放在仓库外时（推荐）：

```bash
gpt-imageflow selftest --env-file ~/.config/gpt-imageflow/.env
```

> 自报 UA 是硬要求——不传 UA 时中转前的 Cloudflare 会回 `403 error code: 1010`
> （按浏览器签名封禁）。默认 UA 是 `gpt-imageflow/1.0`，可设 `GPT_IMAGE_USER_AGENT`
> 覆盖成你的项目标识。

## 实测标定（照搬原产线）

- **只保证比例，不保证精确像素**：请求 1536x864 实回 1672x941。下游只能断言比例。
- **`output_format` 只是建议**：同一 `webp` 请求实测 92% 回 PNG。文件名一律按
  字节头定（`sniff_format` / `ext_for_bytes`），绝不信声明。
- **返回两种形式都要吃**：`data[0].b64_json` 或 `data[0].url`。
- **中文直出可行**：封面可直接让模型写中文（粗黑体+下划线 production-ready）。
- **计价** ¥0.03/张（≈$0.004），限流 50 RPM / 900 RPD。每次计费请求都写
  `usage.jsonl` 记账（默认路径，可用 `--usage-file` 改）。

## 错误分类（`call_relay` 返回 err 前缀）

| 前缀 | 含义 | 排障 |
|------|------|------|
| `auth:` | key 无效 | 换 key |
| `quota:` | 余额不足 | **充值，不要换 key** |
| `blocked:` | 中转前置 WAF 拦截 | 看 User-Agent / 频率，与 key 无关 |
| `moderation:` | 内容审核拒绝 | **按次随机**，重试 |
| `http-N:` | 其它 HTTP 错 | 按码 |
| `transport:` | 连接层失败（间歇零字节挂起） | 重试 |

## 参考图（image-to-image / edits 路径）

传 `reference_images` 走 `POST /images/edits`（multipart，字段名 `image[]`），
不传走 `/images/generations`。两条路共用错误分类/解析/记账。实测带参考图能保住
同脸/同姿势/同服装——封面做固定人设的关键。

```python
from gpt_imageflow import relay

raw, resp, err = relay.call_relay(base, key, prompt, "1024x1365", "png", 300.0,
                                  purpose="cover", reference_images=[ref_bytes])
```

## 开发

```bash
pip install -e ".[dev]"
python3 -m pytest              # 单测（不打网络）
python3 -m gpt_imageflow selftest  # 真验连通（需要配置好的中转 key）
```

依赖只有 Pillow（cover 的人脸参考图预处理用），纯出图连它都不需要。

## 目录

```
gpt_imageflow/
  __init__.py    # 包入口，导出 relay 核心
  relay.py       # 唯一 HTTP 调用点 + 格式嗅探 + 错误分类 + 记账
  candidates.py  # 批量候选图生成
  cover.py       # 3:4 封面生成（带人脸参考图）
  probe.py       # 接入新中转前的能力探测
  cli.py         # 统一命令行入口
pyproject.toml   # 打包（console_script: gpt-imageflow）
.env.example     # 配置模板
tests/           # 抽离的不变量单测
```