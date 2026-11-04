/**
 * ============================================================================
 *  asset.js —— 资源路径解析
 * ============================================================================
 *
 *  为什么需要它：
 *  站点可能部署在根域（https://x.pages.dev/），也可能部署在子路径
 *  （https://x.pages.dev/web-resume2/）。写死 "/avatar.svg" 在子路径下会 404。
 *
 *  规则（按优先级）：
 *   1. data: / blob: / http(s): 开头 —— 原样返回，不处理
 *   2. 以 "/" 开头 —— 视为「站点内的 public 资源」，拼上部署基址
 *   3. 其他（相对路径）—— 原样返回，交给浏览器按当前文档解析
 *
 *  BASE_URL 由 Vite 注入：根域为 "/"，子路径构建时为 "/web-resume2/"。
 * ============================================================================
 */

/** Vite 注入的部署基址，末尾一定带 "/"（如 "/" 或 "/web-resume2/"） */
const BASE = import.meta.env.BASE_URL || '/';

/**
 * 把内容里的图片路径解析成浏览器可用的 URL。
 * @param {string} src 原始路径，可能为空
 * @returns {string} 可直接用于 <img src>
 */
export function resolveAsset(src) {
  if (!src || typeof src !== 'string') return '';
  const s = src.trim();
  if (!s) return '';

  // 外部地址 / 内联数据，保持原样
  if (/^(data:|blob:|https?:|mailto:|tel:|#)/i.test(s)) return s;

  // 站内绝对路径 -> 拼部署基址
  if (s.startsWith('/')) return BASE.replace(/\/$/, '') + s;

  // 相对路径，保持原样
  return s;
}

/** 默认证件照（public/avatar.svg），用于空白模板与兜底 */
export const DEFAULT_AVATAR = resolveAsset('/avatar.svg');
