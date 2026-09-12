const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const build = require("../scripts/build");

const fixture = path.join(__dirname, "../fixtures/minimal");
// html2pptx 是外部转换器，不随本仓库分发（见 README「html2pptx 路径」）。
// 用 HTML2PPTX_PATH 指到本机转换器即可跑真机 smoke test；未设置则跳过，不算失败。
const converter = process.env.HTML2PPTX_PATH || "";

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

test("builds a real PPTX without modifying the converter", { timeout: 120000 }, async (t) => {
  if (!fs.existsSync(converter)) {
    t.skip(`converter not found: ${converter}`);
    return;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "present-met-build-"));
  fs.cpSync(fixture, dir, { recursive: true });
  const before = sha256(converter);

  await build(dir, { html2pptx: converter });

  assert.equal(sha256(converter), before);
  const output = path.join(dir, "minimal-fixture.pptx");
  assert.ok(fs.statSync(output).size > 0);
});
