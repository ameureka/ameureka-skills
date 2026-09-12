// fit.js、screenshot.js 与 report.js 共用的唯一测量函数(浏览器内执行)。
// 越界口径:内容底边侵入页脚区(footer 顶边)即为越界。
function measureAll() {
  const slide = document.querySelector(".slide");
  if (!slide) return { error: "missing-slide" };
  const footer = slide.querySelector(".footer");
  if (!footer) return { error: "missing-footer" };

  const footerTop = footer.getBoundingClientRect().top;
  const autofit = [...slide.querySelectorAll("[data-autofit]")].map((el, index) => {
    const rect = el.getBoundingClientRect();
    const style = el.getAttribute("style") || "";
    const widthMatch = style.match(/(?:^|;)\s*width:\s*([\d.]+)pt/i);
    return {
      index,
      overflowPx: Math.max(0, rect.bottom - footerTop),
      slackPx: Math.max(0, footerTop - rect.bottom),
      wPt: widthMatch ? parseFloat(widthMatch[1]) : el.offsetWidth * 0.75,
      frameAspect: el.offsetHeight ? el.offsetWidth / el.offsetHeight : 1,
    };
  });

  let contentBottom = slide.getBoundingClientRect().top;
  for (const el of slide.querySelectorAll("*:not(.footer):not(.footer *)")) {
    const rect = el.getBoundingClientRect();
    if (rect.width || rect.height) contentBottom = Math.max(contentBottom, rect.bottom);
  }
  const directChildren = [...slide.children].filter((el) => !el.classList.contains("footer"));
  for (const el of directChildren) contentBottom = Math.max(contentBottom, el.getBoundingClientRect().bottom);

  return {
    hasAutofit: autofit.length > 0,
    autofit,
    overflowPx: Math.max(0, contentBottom - footerTop),
    slackPx: Math.max(0, footerTop - contentBottom),
    // 保持旧 fit 算法的单框字段，便于兼容现有 fit.json；多框诊断使用 autofit 数组。
    wPt: autofit[0]?.wPt || 0,
    frameAspect: autofit[0]?.frameAspect || 1,
  };
}

module.exports = { measureAll };
