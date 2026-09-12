"""gpt-imageflow — 从 ameureka-media-agent imageflow 产线抽离的独立出图组件。

提供走 OpenAI 兼容中转的 gpt-image-2 出图能力，可复用在任意 Python 项目：

  · relay.call_relay   —— 唯一的中转 HTTP 调用点（生成 / 参考图 edits 两条路）
  · relay.generate     —— 单张出图到文件
  · candidates.main    —— 批量候选图生成（读 image-generation-requests.v1）
  · cover.main         —— 3:4 封面生成（带人脸参考图，edits 路径）
  · probe.main         —— 接入新中转前的能力探测
"""

from . import relay
from .relay import (
    PRESETS,
    call_relay,
    ext_for_bytes,
    generate,
    is_permanent,
    load_env,
    read_dimensions,
    sniff_format,
)

__all__ = [
    "relay",
    "PRESETS",
    "call_relay",
    "ext_for_bytes",
    "generate",
    "is_permanent",
    "load_env",
    "read_dimensions",
    "sniff_format",
]

__version__ = "1.0.0"