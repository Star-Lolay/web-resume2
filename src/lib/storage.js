/**
 * ============================================================================
 *  storage.js  —— 本地持久化（无后端）
 * ============================================================================
 *  设计原则：
 *  - resume.data.js 是"出厂默认值"，永不被覆盖。
 *  - 用户编辑写入 localStorage 作为"覆盖层"。
 *  - 读取时做深合并，缺失字段回落到默认值 → 兼容旧版数据结构。
 *  - 任何写入失败（配额满 / 隐私模式）必须回传错误，不静默失败。
 * ============================================================================
 */

const KEY_DATA = 'web-resume2:data';
const KEY_UI = 'web-resume2:ui';
const KEY_EFFECTS = 'web-resume2:effects';
const SCHEMA_VERSION = 1;

/**
 * 导出成品注入的启动数据。
 * 导出时会在 HTML 里写入 window.__RESUME_BOOT__，这里统一取出来。
 * 普通站点打开时它是 undefined，所有逻辑走 localStorage + 默认值。
 */
export function getBoot() {
  try {
    const b = typeof window !== 'undefined' ? window.__RESUME_BOOT__ : null;
    return b && typeof b === 'object' ? b : null;
  } catch {
    return null;
  }
}

/** 是否为导出成品（成品只读，不写 localStorage，也不显示编辑器） */
export function isStandalone() {
  const b = getBoot();
  return !!(b && b.standalone);
}

/** 深合并：override 覆盖 base，数组整体替换（不逐项合并，避免错位） */
export function mergeDeep(base, override) {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) || Array.isArray(override)) {
    return Array.isArray(override) ? override : base;
  }
  if (typeof base !== 'object' || typeof override !== 'object') {
    return override === undefined ? base : override;
  }
  const out = { ...base };
  for (const k of Object.keys(override)) {
    out[k] = mergeDeep(base?.[k], override[k]);
  }
  return out;
}

export function loadData(fallback) {
  /* 导出成品：内容来自注入的 boot，完全忽略 localStorage。
     否则用户在别处编辑过的旧数据会覆盖掉创作者打包的内容。 */
  const boot = getBoot();
  if (boot && boot.data && typeof boot.data === 'object') {
    return { data: mergeDeep(fallback, boot.data), isCustom: true };
  }

  try {
    const raw = localStorage.getItem(KEY_DATA);
    if (!raw) return { data: fallback, isCustom: false };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { data: fallback, isCustom: false };
    const payload = parsed.v === SCHEMA_VERSION ? parsed.data : parsed.data;
    return { data: mergeDeep(fallback, payload), isCustom: true };
  } catch {
    return { data: fallback, isCustom: false };
  }
}

/**
 * 保存数据。返回 { ok, error }
 * 配额溢出时返回明确错误，由 UI 提示用户导出 JSON 后清理。
 * 导出成品不写盘 —— 成品是只读交付物，用户在里面改动不应该污染本地。
 */
export function saveData(data) {
  if (isStandalone()) return { ok: true };
  try {
    localStorage.setItem(KEY_DATA, JSON.stringify({ v: SCHEMA_VERSION, at: Date.now(), data }));
    return { ok: true };
  } catch (err) {
    const quota =
      err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      ok: false,
      error: quota
        ? '本地存储已满（多为图片过大）。请先导出 JSON 备份，再压缩或移除部分图片。'
        : '无法写入本地存储（可能是隐私模式）。改动仅在本次会话有效。',
    };
  }
}

export function clearData() {
  try {
    localStorage.removeItem(KEY_DATA);
    return { ok: true };
  } catch {
    return { ok: false, error: '清除失败' };
  }
}

/** UI 偏好（主题 / 动效强度 / 模块顺序）单独存，避免与内容混在一起 */
export function loadUi(fallback) {
  /* 导出成品：主题、强度、模块顺序都来自 boot，保证成品与创作者调好的完全一致 */
  const boot = getBoot();
  if (boot) {
    const fromBoot = {
      theme: boot.theme,
      intensity: boot.intensity,
      order: boot.order,
      hidden: boot.hidden,
    };
    const cleaned = {};
    Object.keys(fromBoot).forEach((k) => {
      if (fromBoot[k] !== undefined && fromBoot[k] !== null) cleaned[k] = fromBoot[k];
    });
    return mergeDeep(fallback, cleaned);
  }

  try {
    const raw = localStorage.getItem(KEY_UI);
    if (!raw) return fallback;
    return mergeDeep(fallback, JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function saveUi(ui) {
  if (isStandalone()) return;
  try {
    localStorage.setItem(KEY_UI, JSON.stringify(ui));
  } catch {
    /* UI 偏好丢失可接受，不打断用户 */
  }
}

/** 导出为可下载的 JSON 文件 */
export function exportJson(data, filename = 'resume-data.json') {
  const payload = { v: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 读取用户选择的 JSON 文件 */
export function importJson(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('未选择文件'));
    if (file.size > 8 * 1024 * 1024) return reject(new Error('文件超过 8MB，可能包含过多内嵌图片'));
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const data = parsed?.data ?? parsed;
        if (!data || typeof data !== 'object') throw new Error('文件结构不正确');
        resolve(data);
      } catch (e) {
        reject(new Error('JSON 解析失败：' + e.message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
