const fs = require("fs");
const path = require("path");

function resolveHtml2Pptx(explicitPath) {
  const candidate = explicitPath ?? process.env.HTML2PPTX_PATH;
  if (!candidate) {
    throw new Error(
      "未指定 html2pptx.js。请使用 --html2pptx <path> 或设置 HTML2PPTX_PATH；为避免隐式修改用户目录，不再使用默认路径。"
    );
  }
  const resolved = path.resolve(candidate);
  if (!fs.existsSync(resolved)) {
    throw new Error(`找不到 html2pptx.js: ${resolved}`);
  }
  if (!fs.statSync(resolved).isFile()) {
    throw new Error(`html2pptx 路径不是文件: ${resolved}`);
  }
  return resolved;
}

module.exports = { resolveHtml2Pptx };
