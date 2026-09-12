#!/usr/bin/env node
// 图片自动定尺寸:量每页 [data-autofit] 图框,侵入页脚区则按宽高比缩、富余则放,
// 增量修正写 fit.json(生成器下次渲染时注入)。
// 工作流: generate → fit → generate →(必要时再 fit)→ screenshot
// 用法: NODE_PATH=$(npm root -g) node fit.js --dir <pptDir>
//
// fit.json 结构: { "<file>": <宽度pt>, "__ov": { "<file>": <上一轮越界pt> } }
// __ov 用于跨轮停滞检测:宽度在缩、越界却两轮不变 → 行高被对侧内容撑死,报人工
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");
const { measureAll } = require("./measure");
const { waitForReady } = require("./browser");
const { loadManifest, orderedSlides } = require("./manifest");

const PT = 0.75; // 960px 视口 = 720pt → 1px = 0.75pt
const MIN_W = 120;   // 图框宽度下限(pt)
const MAX_W = 640;   // 内容区最大宽度(pt)
const GROW_THRESHOLD = 30; // 富余超过 30pt 才放大
const SAFETY = 3;    // 收缩安全边距(pt)

async function main(pptDir) {
  const htmlDir = path.join(pptDir, "html");
  const fitPath = path.join(pptDir, "fit.json");
  const manifest = loadManifest(pptDir);
  const slides = orderedSlides(manifest, htmlDir, { requireAll: true, rejectOrphans: true });

  const launchOptions = {};
  if (process.platform === "darwin") launchOptions.channel = "chrome"; // 本机无 playwright 缓存,走系统 Chrome
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

  const saved = fs.existsSync(fitPath) ? JSON.parse(fs.readFileSync(fitPath, "utf-8")) : {};
  const fit = Object.fromEntries(Object.entries(saved).filter(([k]) => !k.startsWith("__")));
  const prevOv = saved.__ov || {};
  const manual = []; // 收缩也救不了的页(如侧列比图高的行布局),报给人处理

  for (const slide of slides) {
    const f = slide.file;
    const ready = await waitForReady(page, slide.path);
    if (ready.errors.length) {
      manual.push(`${f}: 页面资源错误: ${ready.errors.join("; ")}`);
    }
    const m = await page.evaluate(measureAll);
    if (m.error) {
      manual.push(`${f}: ${m.error === "missing-slide" ? "缺少 .slide 根节点" : "缺少 .footer 页脚"}`);
      continue;
    }
    if (!m.hasAutofit) continue;

    // fit.json 是确定输入(已提交/版本化),因此在生成后的页面上测量 + 增量修正
    // 才收敛;猜配置宽度算全量反而每轮翻盘
    const overflowPt = m.overflowPx * PT;
    const slackPt = m.slackPx * PT;
    let newW = null;
    if (overflowPt > 1) {
      newW = Math.max(MIN_W, m.wPt - (overflowPt + SAFETY) * m.frameAspect);
      if (newW >= m.wPt - 1) manual.push(`${f}: 越界 ${overflowPt.toFixed(1)}pt 但图框已无法再缩(查侧列/文字高度)`);
    } else if (slackPt > GROW_THRESHOLD && m.wPt < MAX_W) {
      newW = Math.min(MAX_W, m.wPt + (slackPt - 10) * m.frameAspect);
    }
    // 停滞检测:宽度在缩、越界却两轮不变 → 行高被对侧内容撑死,缩图无用,报人工
    const prev = prevOv[f] || 0;
    if (newW !== null && prev > 1 && Math.abs(overflowPt - prev) < 0.5 && fit[f] !== undefined) {
      manual.push(`${f}: 缩图后越界不变(${overflowPt.toFixed(1)}pt),行高被对侧内容撑死,需人工调整布局`);
      continue; // 别再写更小的宽度,避免无效收缩链
    }
    prevOv[f] = overflowPt;
    if (newW !== null) {
      const current = fit[f];
      // 滞回:目标与当前 fit 值相差不足 0.5pt 就保持现值(亚像素噪声);
      // 阈值不得更大 —— 差 0.5~2pt 往往是"上一轮写入的值还没生效"或真实残差,
      // 跳过会把待修正值永久冻住(004期 P21 实测踩过)
      if (current !== undefined && Math.abs(newW - current) < 0.5) {
        continue;
      }
      fit[f] = Math.round(newW * 2) / 2;
      console.log(`✔ ${f}: ${m.wPt.toFixed(1)}pt → ${fit[f]}pt (${overflowPt > 1 ? "越界收缩" : "富余放大"})`);
    }
  }
  await browser.close();

  fs.writeFileSync(fitPath, JSON.stringify({ ...fit, __ov: prevOv }, null, 2) + "\n", "utf-8");
  console.log(`✅ fit.json 已更新(${Object.keys(fit).length} 项)-> ${fitPath}`);
  console.log(`   下一步:重新运行 generate 应用宽度,再 screenshot 验证`);
  if (manual.length) {
    console.log("⚠️  需人工处理:");
    manual.forEach((s) => console.log("   - " + s));
    process.exitCode = 2; // 有人工项时给调用方一个可判断的退出码
  }
}

if (require.main === module) {
  const i = process.argv.indexOf("--dir");
  const dir = path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
  main(dir).catch((e) => { console.error("❌", e.message); process.exit(1); });
}
module.exports = main;
