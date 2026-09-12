const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { resolveHtml2Pptx } = require("../scripts/resolve-html2pptx");

test("requires an explicit converter path", () => {
  assert.throws(() => resolveHtml2Pptx(), /未指定 html2pptx/);
});

test("resolves an existing converter path", () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "converter-")), "html2pptx.js");
  fs.writeFileSync(file, "module.exports = async () => {};\n");
  assert.equal(resolveHtml2Pptx(file), file);
});
