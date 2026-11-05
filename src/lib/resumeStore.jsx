/**
 * ============================================================================
 *  resumeStore.jsx —— 全局状态（内容 + 模块结构 + UI 偏好）
 * ============================================================================
 *  暴露：useResume() → 站点所有可读写的东西
 *
 *  三条不变式：
 *   1. defaultData 只读；data 是它的深合并结果。
 *   2. 每次修改自动落盘（防抖 400ms），失败会进 state.persistError。
 *   3. 模块顺序单独存（order 数组），与内容分离，便于"移除后恢复"。
 * ============================================================================
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import defaultData from '../content/resume.data.js';
import siteConfig, { THEMES } from '../content/site.config.js';
import { BUILTIN_MODULES, CUSTOM_TYPES } from '../content/module.registry.js';
import { loadData, saveData, clearData, loadUi, saveUi, mergeDeep, getBoot } from './storage.js';
import {
  resolveEffects,
  saveEffectsOverride,
  clearEffectsOverride,
  setByPath,
} from './effectsStore.js';

const ResumeCtx = createContext(null);

/** 默认模块顺序：内置顺序 + 已存在的自定义模块 */
function buildDefaultOrder() {
  return BUILTIN_MODULES.map((m) => m.key);
}

export function ResumeProvider({ children }) {
  /* ------------------------------------------------------------- 内容 */
  const initial = useMemo(() => loadData(defaultData), []);
  const [data, setData] = useState(initial.data);
  const [isCustom, setIsCustom] = useState(initial.isCustom);

  /* ------------------------------------------------------------- 模块顺序 */
  // order 只保存内置 key；自定义模块顺序由 data.custom 数组自身顺序决定
  const [order, setOrder] = useState(() => {
    const stored = loadUi({ order: null }).order;
    if (Array.isArray(stored) && stored.length) {
      // 过滤掉已不存在的 key，并补齐新版本新增的内置模块
      const valid = stored.filter((k) => BUILTIN_MODULES.some((m) => m.key === k));
      const missing = BUILTIN_MODULES.map((m) => m.key).filter((k) => !valid.includes(k));
      return [...valid, ...missing];
    }
    return buildDefaultOrder();
  });

  /** 被移除的内置模块（可恢复） */
  const [hidden, setHidden] = useState(() => loadUi({ hidden: [] }).hidden || []);

  /* ------------------------------------------------------------- UI 偏好 */
  const [theme, setThemeState] = useState(() => loadUi({ theme: siteConfig.theme.default }).theme);
  const [intensity, setIntensityState] = useState(
    () => loadUi({ intensity: siteConfig.motion.intensity }).intensity
  );

  /* ------------------------------------------------------------- 动效配置
   * effects：当前生效的完整配置（默认值 + 用户覆盖）
   * effectsOverride：用户改过的字段，用于持久化与「恢复默认」
   *
   * 初始化顺序很关键：
   *   1. 导出成品（有 window.__RESUME_BOOT__）→ 直接用 boot 里的完整配置。
   *      这是「成品必须和创作者调好的效果一模一样」的唯一保证。
   *   2. 普通站点 → 读 localStorage 的覆盖层。
   * 曾经这里无条件读 localStorage，导致成品拿到 {}、boot 被绕过，
   * 环形图仍去请求 /orbit/xxx.svg 而不是内联的 data URL（已踩过）。 */
  const [effectsOverride, setEffectsOverride] = useState(() => {
    const boot = getBoot();
    if (boot?.effects && typeof boot.effects === 'object') return boot.effects;
    try {
      const raw = localStorage.getItem('web-resume2:effects');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const effects = useMemo(() => resolveEffects(effectsOverride), [effectsOverride]);

  /** 改一个动效字段：setEffect('gridScan.scanColor', '#8ab4ff') */
  const setEffect = useCallback((path, value) => {
    setEffectsOverride((prev) => {
      const next = setByPath(prev && typeof prev === 'object' ? prev : {}, path, value);
      saveEffectsOverride(next);
      return next;
    });
  }, []);

  /** 恢复全部动效为出厂默认 */
  const resetEffects = useCallback(() => {
    clearEffectsOverride();
    setEffectsOverride({});
  }, []);

  /* ------------------------------------------------------------- 编辑器 */
  const [editing, setEditing] = useState(false);
  const [persistError, setPersistError] = useState(null);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /* ------------------------------------------------------------- 落盘（防抖） */
  const saveTimer = useRef(null);
  const skipFirstSave = useRef(true);

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const res = saveData(data);
      if (!res.ok) {
        setPersistError(res.error);
      } else {
        setPersistError(null);
        setIsCustom(true);
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  useEffect(() => {
    saveUi({ order, hidden, theme, intensity });
  }, [order, hidden, theme, intensity]);

  /* ------------------------------------------------------------- 主题写入 DOM */
  useEffect(() => {
    const t = THEMES[theme] || THEMES.graphite;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--bg-elev', t.elev);
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent-2', t.accent2);
    // 亮色主题需要额外调整文字对比
    if (theme === 'paleAsh') {
      root.style.setProperty('--text', '#1A1C1E');
      root.style.setProperty('--text-dim', '#55595E');
      root.style.setProperty('--text-mute', '#85898E');
    } else {
      root.style.removeProperty('--text');
      root.style.removeProperty('--text-dim');
      root.style.removeProperty('--text-mute');
    }
  }, [theme]);

  /* ------------------------------------------------------------- 动效强度写入 */
  useEffect(() => {
    document.documentElement.dataset.motion = intensity <= 0.05 ? 'off' : 'on';
  }, [intensity]);

  /* ------------------------------------------------------------- meta 同步 */
  useEffect(() => {
    if (data.meta?.title) document.title = data.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && data.meta?.description) desc.setAttribute('content', data.meta.description);
  }, [data.meta?.title, data.meta?.description]);

  /* ------------------------------------------------------------- 内容操作 */

  /** 按路径更新任意字段：updateAt('profile.intro', '...') */
  const updateAt = useCallback((path, value) => {
    setData((prev) => {
      const keys = path.split('.');
      const clone = structuredCloneSafe(prev);
      let node = clone;
      for (let i = 0; i < keys.length - 1; i += 1) {
        const k = keys[i];
        if (node[k] === undefined || node[k] === null) node[k] = {};
        node = node[k];
      }
      node[keys[keys.length - 1]] = value;
      return clone;
    });
  }, []);

  /** 数组项更新：updateItem('experience.items', 0, {role:'...'}) */
  const updateItem = useCallback((path, index, patch) => {
    setData((prev) => {
      const clone = structuredCloneSafe(prev);
      const arr = getByPath(clone, path);
      if (!Array.isArray(arr) || !arr[index]) return prev;
      arr[index] = { ...arr[index], ...patch };
      return clone;
    });
  }, []);

  /** 数组项新增 */
  const addItem = useCallback((path, item) => {
    setData((prev) => {
      const clone = structuredCloneSafe(prev);
      const arr = getByPath(clone, path);
      if (!Array.isArray(arr)) return prev;
      arr.push(item);
      return clone;
    });
  }, []);

  /** 数组项删除 */
  const removeItem = useCallback((path, index) => {
    setData((prev) => {
      const clone = structuredCloneSafe(prev);
      const arr = getByPath(clone, path);
      if (!Array.isArray(arr)) return prev;
      arr.splice(index, 1);
      return clone;
    });
  }, []);

  /** 数组项移动（上下移） */
  const moveItem = useCallback((path, index, dir) => {
    setData((prev) => {
      const clone = structuredCloneSafe(prev);
      const arr = getByPath(clone, path);
      if (!Array.isArray(arr)) return prev;
      const to = index + dir;
      if (to < 0 || to >= arr.length) return prev;
      [arr[index], arr[to]] = [arr[to], arr[index]];
      return clone;
    });
  }, []);

  /* ------------------------------------------------------------- 模块操作 */

  /** 移动内置模块（与相邻可移动模块交换位置，首末锁定） */
  const moveModule = useCallback(
    (key, dir) => {
      setOrder((prev) => {
        const i = prev.indexOf(key);
        if (i < 0) return prev;
        const def = BUILTIN_MODULES.find((m) => m.key === key);
        if (def?.role !== 'free') return prev; // 锁定模块不动
        let j = i + dir;
        // 跳过锁定模块
        while (j >= 0 && j < prev.length) {
          const other = BUILTIN_MODULES.find((m) => m.key === prev[j]);
          if (other?.role === 'free') break;
          j += dir;
        }
        if (j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
    },
    []
  );

  /** 隐藏（移除）内置模块 —— 首末锁定不可移除 */
  const removeModule = useCallback((key) => {
    const def = BUILTIN_MODULES.find((m) => m.key === key);
    if (def?.role !== 'free') return false;
    setHidden((prev) => (prev.includes(key) ? prev : [...prev, key]));
    return true;
  }, []);

  /** 恢复被隐藏的模块（插回原相对位置） */
  const restoreModule = useCallback((key) => {
    setHidden((prev) => prev.filter((k) => k !== key));
  }, []);

  const toggleModule = useCallback(
    (key) => {
      const def = BUILTIN_MODULES.find((m) => m.key === key);
      if (def?.role !== 'free') return;
      setHidden((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    },
    []
  );

  /* ------------------------------------------------------------- 自定义模块 */
  const addCustomModule = useCallback(
    (type) => {
      const typeDef = CUSTOM_TYPES.find((t) => t.type === type);
      if (!typeDef) return { ok: false, error: '未知模块类型' };
      const list = data.custom || [];
      const sameType = list.filter((c) => c.type === type).length;
      if (sameType >= siteConfig.limits.customPerType) {
        return {
          ok: false,
          error: `「${typeDef.label}」最多 ${siteConfig.limits.customPerType} 个，请先移除或用其他类型`,
        };
      }
      const item = {
        id: `${type}-${Date.now().toString(36)}`,
        type,
        title: typeDef.label,
        subtitle: '',
        enabled: true,
        items: [{ ...typeDef.blankItem }],
      };
      setData((prev) => ({ ...prev, custom: [...(prev.custom || []), item] }));
      return { ok: true, id: item.id };
    },
    [data.custom]
  );

  const updateCustomModule = useCallback((id, patch) => {
    setData((prev) => {
      const clone = structuredCloneSafe(prev);
      const list = clone.custom || [];
      const i = list.findIndex((c) => c.id === id);
      if (i < 0) return prev;
      list[i] = { ...list[i], ...patch };
      return clone;
    });
  }, []);

  const removeCustomModule = useCallback((id) => {
    setData((prev) => ({ ...prev, custom: (prev.custom || []).filter((c) => c.id !== id) }));
  }, []);

  const moveCustomModule = useCallback((id, dir) => {
    setData((prev) => {
      const clone = structuredCloneSafe(prev);
      const list = clone.custom || [];
      const i = list.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return prev;
      [list[i], list[j]] = [list[j], list[i]];
      return clone;
    });
  }, []);

  /* ------------------------------------------------------------- 全局动作 */
  const resetToDefault = useCallback(() => {
    clearData();
    setData(defaultData);
    setIsCustom(false);
    setOrder(buildDefaultOrder());
    setHidden([]);
    showToast('已恢复示例内容');
  }, [showToast]);

  const applyImported = useCallback(
    (imported) => {
      setData(mergeDeep(defaultData, imported));
      setIsCustom(true);
      showToast('已导入内容');
    },
    [showToast]
  );

  const setTheme = useCallback((k) => setThemeState(k), []);
  const setIntensity = useCallback((v) => setIntensityState(v), []);

  /* ------------------------------------------------------------- 派生：可见模块序列 */
  const moduleSequence = useMemo(() => {
    const visibleBuiltins = order.filter((k) => !hidden.includes(k));
    // 序列里只放字符串 key：内置模块是固定 key，自定义模块是其 id
    const customIds = (data.custom || [])
      .filter((c) => c.enabled !== false)
      .map((c) => c.id);
    // 自定义模块统一插在 contact 之前（顺序由 data.custom 数组决定）
    const contactIdx = visibleBuiltins.indexOf('contact');
    if (contactIdx < 0) return [...visibleBuiltins, ...customIds];
    return [
      ...visibleBuiltins.slice(0, contactIdx),
      ...customIds,
      ...visibleBuiltins.slice(contactIdx),
    ];
  }, [order, hidden, data.custom]);

  const value = useMemo(
    () => ({
      // 数据
      data,
      defaultData,
      isCustom,
      // 状态
      editing,
      setEditing,
      persistError,
      toast,
      showToast,
      // 内容操作
      updateAt,
      updateItem,
      addItem,
      removeItem,
      moveItem,
      // 模块
      order,
      hidden,
      moduleSequence,
      moveModule,
      removeModule,
      restoreModule,
      toggleModule,
      addCustomModule,
      updateCustomModule,
      removeCustomModule,
      moveCustomModule,
      // UI
      theme,
      setTheme,
      intensity,
      setIntensity,
      themes: THEMES,
      // 动效
      effects,
      effectsOverride,
      setEffect,
      resetEffects,
      // 全局
      resetToDefault,
      applyImported,
      config: siteConfig,
    }),
    [
      data,
      defaultData,
      isCustom,
      editing,
      persistError,
      toast,
      showToast,
      updateAt,
      updateItem,
      addItem,
      removeItem,
      moveItem,
      order,
      hidden,
      moduleSequence,
      moveModule,
      removeModule,
      restoreModule,
      toggleModule,
      addCustomModule,
      updateCustomModule,
      removeCustomModule,
      moveCustomModule,
      theme,
      setTheme,
      intensity,
      setIntensity,
      effects,
      effectsOverride,
      setEffect,
      resetEffects,
      resetToDefault,
      applyImported,
    ]
  );

  return <ResumeCtx.Provider value={value}>{children}</ResumeCtx.Provider>;
}

export function useResume() {
  const ctx = useContext(ResumeCtx);
  if (!ctx) throw new Error('useResume 必须在 ResumeProvider 内使用');
  return ctx;
}

/* ------------------------------------------------------------------ 工具 */

function getByPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

/** structuredClone 不可用时的回退（Safari 14 / 旧版） */
function structuredCloneSafe(v) {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}
