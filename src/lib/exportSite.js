/**
 * ============================================================================
 *  exportSite.js —— 导出「单文件网页」
 * ============================================================================
 *
 *  ── 成品是什么 ────────────────────────────────────────────────────────────
 *  一个 .html 文件，里面：
 *    · 内联的 CSS（原样搬构建产物）
 *    · 内联的 JS（原样搬构建产物，纯 IIFE，无 import.meta / 动态 import）
 *    · 内联的图片（avatar、环形素材等，全部转成 data URL）
 *    · 注入的 window.__RESUME_BOOT__（内容 + 配色 + 动效配置 + 模块顺序）
 *
 *  双击就能在 file:// 下打开，不需要服务器、不需要联网（字体除外，
 *  字体缺失会回落到系统字体，不影响可用性）。
 *
 *  ── 为什么不用 <script type="module"> ─────────────────────────────────────
 *  构建产物是单个 IIFE bundle，不含 import.meta / export / import()。
 *  内联成普通 <script> 就不会触发 file:// 的模块 CORS 限制 —— 这是能
 *  「双击打开」的关键。（已核实产物中三者均不存在）
 *
 *  ── 两个必须防的坑 ────────────────────────────────────────────────────────
 *  1. 开发服务器把未命中路径回退成 index.html：直接 fetch 会拿到一整页
 *     HTML 当成 JS 内联，生成只有 20KB 的假成品。→ fetchAsset 校验首字符。
 *  2. 内容里若含 </script>，会提前截断注入脚本。→ escapeForScript 转义。
 * ============================================================================
 */

/**
 * 取构建产物，并校验它「真的是那个文件」。
 * 开发服务器（及不少 SPA 托管）对未命中路径返回 200 + index.html，
 * 只看 res.ok 会把整页 HTML 当成 JS。
 */
async function fetchAsset(url, kind) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return '';
  const text = await res.text();
  // 真正的 bundle / 样式表不会以 "<" 开头（那是 HTML）
  if (/^\s*</i.test(text)) return '';
  if (kind === 'js' && text.length < 1024) return '';
  return text;
}

/** 读取站点内的静态资源并转 data URL */
async function toDataUrl(url) {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`资源读取失败：${url}（${res.status}）`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`资源转码失败：${url}`));
    reader.readAsDataURL(blob);
  });
}

/** 走一遍数据结构，收集所有图片字段 */
function collectImagePaths(data, effects) {
  const paths = new Set();

  if (data?.person?.avatar) paths.add(data.person.avatar);
  (data?.custom || []).forEach((m) => {
    (m.items || []).forEach((it) => {
      if (it.image) paths.add(it.image);
    });
  });
  // 首屏环形素材
  (effects?.orbitImages?.images || []).forEach((p) => paths.add(p));

  // 只内联「站内相对路径」，外链原样保留
  return [...paths].filter(
    (p) => p && typeof p === 'string' && !/^(https?:|data:|blob:)/i.test(p)
  );
}

/** 把数据里所有站内图片路径替换为 data URL */
function rewriteImages(data, effects, map) {
  const swap = (p) => (p && map[p] ? map[p] : p);

  const nextData = JSON.parse(JSON.stringify(data));
  if (nextData.person?.avatar) nextData.person.avatar = swap(nextData.person.avatar);
  (nextData.custom || []).forEach((m) => {
    (m.items || []).forEach((it) => {
      if (it.image) it.image = swap(it.image);
    });
  });

  const nextEffects = JSON.parse(JSON.stringify(effects));
  if (nextEffects.orbitImages?.images) {
    nextEffects.orbitImages.images = nextEffects.orbitImages.images.map(swap);
  }

  return { data: nextData, effects: nextEffects };
}

/** 转义进 <script> 的 JSON：防 </script> 截断，并处理行分隔符 */
function escapeForScript(json) {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** 文件名里去掉非法字符 */
function safeFilename(name) {
  const cleaned = String(name || 'resume')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return cleaned || 'resume';
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 由 boot / js / css 生成最终 HTML 文本 */
function assemble({ boot, jsText, cssText, docTitle, desc, favicon }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
${favicon ? `<link rel="icon" type="image/svg+xml" href="${favicon}" />` : ''}
<title>${escapeHtml(docTitle)}</title>
${desc ? `<meta name="description" content="${escapeHtml(desc)}" />` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
${cssText}
</style>
</head>
<body>
<div id="root"></div>
<script>window.__RESUME_BOOT__ = ${escapeForScript(JSON.stringify(boot))};</script>
<script>
${jsText}
</script>
</body>
</html>
`;
}

/**
 * 主流程。
 * @param {object} opts
 * @param {object} opts.data        当前简历内容
 * @param {object} opts.effects     当前生效的完整动效配置
 * @param {string} opts.theme       当前主题 key
 * @param {number} opts.intensity   动效强度 0–1
 * @param {string[]} opts.order     模块顺序（内置 key）
 * @param {string[]} opts.hidden    被隐藏的模块 key
 * @param {string} opts.title       成品网页标题
 * @param {(p:{phase:string,detail?:string})=>void} opts.onProgress 进度回调
 * @returns {Promise<{blob:Blob, filename:string}>}
 */
export async function buildStandaloneHtml(opts) {
  const { data, effects, theme, intensity, order, hidden, title, onProgress } = opts;
  const report = onProgress || (() => {});
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  /* ------------------------------------------------ 1. 取 bundle 与样式 */
  report({ phase: '正在读取站点资源…' });
  const [jsText, cssText] = await Promise.all([
    fetchAsset(`${base}/standalone/app.js`, 'js'),
    fetchAsset(`${base}/standalone/app.css`, 'css'),
  ]);

  if (!jsText) {
    throw new Error(
      '找不到站点脚本（standalone/app.js）。导出需要「构建后的版本」，' +
        '开发服务器下不可用 —— 请先 npm run build，再通过 npm run preview 或线上站点导出。'
    );
  }

  /* ------------------------------------------------ 2. 内联图片 */
  const imgPaths = collectImagePaths(data, effects);
  const imgMap = {};
  let done = 0;
  for (const p of imgPaths) {
    report({ phase: '正在内联图片…', detail: `${done}/${imgPaths.length}` });
    try {
      // 站内路径要拼上部署基址才能取到
      const url = p.startsWith('/') ? `${base}${p}` : p;
      imgMap[p] = await toDataUrl(url);
    } catch (e) {
      // 单张失败不阻断导出，保留原路径（成品里可能显示不出这张图）
      console.warn('[export] 跳过一张图片：', p, e.message);
    }
    done += 1;
  }

  const { data: outData, effects: outEffects } = rewriteImages(data, effects, imgMap);

  /* ------------------------------------------------ 3. 组装 boot 数据 */
  const boot = {
    v: 1,
    exportedAt: new Date().toISOString(),
    data: outData,
    effects: outEffects,
    theme: theme || 'graphite',
    intensity: typeof intensity === 'number' ? intensity : 0.8,
    order: order || [],
    hidden: hidden || [],
    /** 标记这是导出成品：不显示编辑器、不写 localStorage */
    standalone: true,
  };

  const favicon = imgMap['/favicon.svg'] || '';
  const docTitle = title || outData?.meta?.title || '个人简历';
  const desc = outData?.meta?.description || '';

  /* ------------------------------------------------ 4. 拼 HTML */
  report({ phase: '正在生成 HTML…' });

  return {
    filename: safeFilename(outData?.person?.name || 'resume') + '.html',
    blob: new Blob([assemble({ boot, jsText, cssText, docTitle, desc, favicon })], {
      type: 'text/html;charset=utf-8',
    }),
  };
}

/** 触发下载 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 立刻 revoke 会让部分浏览器的下载中断，延后释放
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
