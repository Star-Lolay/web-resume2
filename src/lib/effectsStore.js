/**
 * ============================================================================
 *  effectsStore.js —— 动效配置的读 / 改 / 存 / 导出
 * ============================================================================
 *
 *  ── 为什么要有这一层 ──────────────────────────────────────────────────────
 *  effects.config.js 是「出厂默认值」。用户改颜色、改开关、改参数，
 *  不能去改源码，所以这里在默认值之上加一层「覆盖层」，存 localStorage。
 *  导出时把「默认值 + 覆盖」合并成一份完整配置写进成品，
 *  这样别人打开成品看到的就是创作者调好的效果，且不依赖 localStorage。
 *
 *  ── 数据形状 ─────────────────────────────────────────────────────────────
 *  覆盖层只存「用户真正改过的字段」，结构可以是不完整的，例如：
 *    { gridScan: { scanColor: '#8ab4ff' }, microSlats: { enabled: false } }
 *  读取时与默认值深合并 → 永远是完整可用的配置。
 * ============================================================================
 */

import effectsConfig from '../content/effects.config.js';
import { mergeDeep, getBoot } from './storage.js';

const KEY = 'web-resume2:effects';

/** 深合并的数组替换语义在这里也适用：colors / images 改了就是整体替换 */
function loadOverride() {
  /* 导出成品：动效配置整份都在 boot 里（已是默认值+覆盖合并后的结果），
     直接返回它，不再读 localStorage。 */
  const boot = getBoot();
  if (boot && boot.effects && typeof boot.effects === 'object') return boot.effects;

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveEffectsOverride(override) {
  if (getBoot()) return { ok: true }; // 成品只读
  try {
    localStorage.setItem(KEY, JSON.stringify(override || {}));
    return { ok: true };
  } catch {
    return { ok: false, error: '无法保存动效设置（可能是隐私模式）' };
  }
}

export function clearEffectsOverride() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 忽略 */
  }
}

/**
 * 合并出「当前生效的完整动效配置」。
 * @param {object|null} override 覆盖层，为 null 时读 localStorage
 */
export function resolveEffects(override) {
  const ov = override === undefined ? loadOverride() : override;
  if (!ov) return effectsConfig;
  return mergeDeep(effectsConfig, ov);
}

/* ------------------------------------------------------------------ 可编辑项
 * 只暴露「色彩 + 开关 + 少量强度」，不暴露技术参数（dpr / 内部常量）。
 * 给用户调的东西必须满足：改错也不会把页面搞崩。
 */
export const EFFECT_COLOR_FIELDS = [
  {
    path: 'gridScan.scanColor',
    label: '首屏 · 扫描光',
    hint: 'GridScan 扫过网格的光带颜色',
    default: effectsConfig.gridScan.scanColor,
    type: 'color',
  },
  {
    path: 'gridScan.linesColor',
    label: '首屏 · 网格线',
    hint: '3D 网格线颜色，太亮会抢标题',
    default: effectsConfig.gridScan.linesColor,
    type: 'color',
  },
  {
    path: 'microSlats.color',
    label: '简历区 · 板条基色',
    hint: 'MicroSlats 板条本身的颜色',
    default: effectsConfig.microSlats.color,
    type: 'color',
  },
  {
    path: 'microSlats.glintColor',
    label: '简历区 · 高光',
    hint: '板条边缘的高光色，直接影响显眼程度',
    default: effectsConfig.microSlats.glintColor,
    type: 'color',
  },
  {
    path: 'galaxy.starColors',
    label: '收尾 · 星点色',
    hint: '最后一屏星野的星点颜色，最多 4 个',
    default: effectsConfig.galaxy.starColors,
    type: 'colorList',
  },
  {
    path: 'edgeGlow.colors',
    label: '收尾 · 底边流光',
    hint: '最后一屏底部那条白色流动边缘',
    default: effectsConfig.edgeGlow.colors,
    type: 'colorList',
  },
  {
    path: 'iridescence.color',
    label: '亮色主题 · 虹彩底',
    hint: '浅灰配色下的全站背景基色',
    default: effectsConfig.iridescence.color,
    type: 'color',
  },
];

/** 各效果的开关（关掉某个不会影响其它） */
export const EFFECT_TOGGLES = [
  { path: 'gridScan.enabled', label: '首屏 3D 网格扫描', hint: 'GridScan，仅第一页' },
  { path: 'orbitImages.enabled', label: '首屏环形图片', hint: 'OrbitImages，延迟 0.5s 出现' },
  { path: 'microSlats.enabled', label: '简历区方块流动', hint: 'MicroSlats，覆盖中段所有模块' },
  { path: 'galaxy.enabled', label: '最后一屏星野', hint: 'Galaxy' },
  { path: 'edgeGlow.enabled', label: '最后一屏底边流光', hint: '白色流动边缘' },
  { path: 'iridescence.enabled', label: '亮色主题虹彩背景', hint: 'Iridescence，仅浅灰配色生效' },
];

/** 按 'a.b.c' 取值 */
export function getByPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

/** 按 'a.b.c' 写值，返回新的克隆对象 */
export function setByPath(obj, path, value) {
  const keys = path.split('.');
  const clone = JSON.parse(JSON.stringify(obj));
  let node = clone;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i];
    if (node[k] === undefined || node[k] === null || typeof node[k] !== 'object') node[k] = {};
    node = node[k];
  }
  node[keys[keys.length - 1]] = value;
  return clone;
}
