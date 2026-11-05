/**
 * ============================================================================
 *  make-standalone.mjs —— 把构建产物复制成「固定文件名」供导出功能使用
 * ============================================================================
 *
 *  为什么需要这一步：
 *  导出功能要在浏览器里 fetch 站点自己的 JS / CSS，再内联进单文件 HTML。
 *  但 Vite 的产物带内容哈希（index-BcOQVLBe.js），源码一改名字就变，
 *  导出代码没法硬编码文件名。
 *
 *  所以构建后额外复制一份到 dist/standalone/app.js 与 app.css，
 *  名字固定，导出时直接取这两个。哈希版仍然照常留给站点自身用（可长期缓存）。
 * ============================================================================
 */
import { readdirSync, copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const assets = join(dist, 'assets');
const out = join(dist, 'standalone');

if (!existsSync(assets)) {
  console.error('[standalone] 未找到 dist/assets，请先执行 vite build');
  process.exit(1);
}

mkdirSync(out, { recursive: true });

const files = readdirSync(assets);

/* Vite 产物：入口 JS 是 index-<hash>.js，样式是 index-<hash>.css。
   注意别把懒加载 chunk 误当入口 —— 本项目无动态 import，assets 下只有这两个。 */
const js = files.filter((f) => f.endsWith('.js'));
const css = files.filter((f) => f.endsWith('.css'));

if (js.length !== 1) {
  console.error(`[standalone] 预期 1 个 js 产物，实际 ${js.length} 个：${js.join(', ')}`);
  process.exit(1);
}

copyFileSync(join(assets, js[0]), join(out, 'app.js'));

if (css.length === 1) {
  copyFileSync(join(assets, css[0]), join(out, 'app.css'));
} else {
  console.warn(`[standalone] 样式产物数量异常（${css.length}），导出时可能缺样式`);
  if (css.length) copyFileSync(join(assets, css[0]), join(out, 'app.css'));
}

const kb = (p) => (statSync(p).size / 1024).toFixed(1);
console.log(`[standalone] app.js  ${kb(join(out, 'app.js'))} KB`);
if (css.length) console.log(`[standalone] app.css ${kb(join(out, 'app.css'))} KB`);
