/**
 * ============================================================================
 *  useReveal / useMediaQuery / useMotionIntensity —— 动效与响应式钩子
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';

/**
 * 统一入场观测：给元素加 .reveal，进入视口后加 .is-in。
 * 用一个 IntersectionObserver 观测一批元素，比每组件一个 observer 更省。
 *
 * 健壮性兜底（重要）：
 * 如果 IntersectionObserver 不可用、或在 1.8s 内没有产生任何回调
 * （某些嵌入式 WebView / 无头环境会如此），直接把全部元素置为可见。
 * 宁可失去动画，也不能让内容永久不可见。
 */
export function useRevealGroup(deps = []) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'off';

    const targets = root.querySelectorAll('.reveal');
    if (reduced || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }

    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        fired = true;
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    targets.forEach((el) => io.observe(el));

    // 兜底：观察器失效则全部显示
    const fallback = setTimeout(() => {
      if (!fired) targets.forEach((el) => el.classList.add('is-in'));
    }, 1800);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return rootRef;
}

export function useMediaQuery(query) {
  const [match, setMatch] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    let mq;
    try {
      mq = window.matchMedia(query);
    } catch {
      return undefined;
    }
    const on = (e) => setMatch(e.matches);
    setMatch(mq.matches);
    // 老版 Safari 只有 addListener
    if (mq.addEventListener) mq.addEventListener('change', on);
    else if (mq.addListener) mq.addListener(on);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', on);
      else if (mq.removeListener) mq.removeListener(on);
    };
  }, [query]);

  return match;
}

/** 桌面端 + 允许悬停 + 未减弱动效 → 才启用倾斜 / 光标跟随 */
export function useRichMotion(intensity) {
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return isDesktop && canHover && !reduced && intensity > 0.35;
}

/** 仅在页面可见时返回 true，用于暂停 Canvas 动画 */
export function usePageVisible() {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden
  );

  useEffect(() => {
    const on = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  return visible;
}

/**
 * 元素是否在视口内（含提前量）。
 *
 * 用途：让「模块级 WebGL 背景」只在模块可见时才挂载，
 * 滚出视口立即卸载 —— 这是控制同时存活 canvas 数量的关键。
 *
 * 与 useRevealGroup 的区别：
 *   useRevealGroup 是「进入一次就常亮」的入场动画；
 *   useInView 是「进出都跟踪」的可见性状态，会跟着滚动变化。
 */
export function useInView(ref, options = {}) {
  const { rootMargin = '80px', threshold = 0.01 } = options;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref?.current;
    if (!el) return undefined;

    // 没有 IntersectionObserver 时保守处理：视为可见，
    // 由上层 intensity / 设备判断继续兜底，绝不因缺失 API 导致空白。
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { rootMargin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold]);

  return inView;
}

/**
 * WebGL 可用性探测。
 *
 * 为什么需要：低端机、软件渲染环境、或同时开太多 canvas 时，
 * WebGL 上下文会创建失败或直接丢失（isContextLost()=true）。
 * 此时组件内部会静默不绘制，留下一个空白 canvas —— 用户看到的是
 * 「说好的网格背景没了」，而不是优雅降级。
 *
 * 这里在挂载前先做一次真实探测（创建后立刻销毁，开销可忽略），
 * 不可用就直接不渲染重动效层，让静态渐变兜底。
 *
 * 结果缓存：整页只探测一次，避免每个组件重复创建上下文。
 */
let webglSupportCache = null;

export function useWebGLSupport() {
  const [supported] = useState(() => {
    if (webglSupportCache !== null) return webglSupportCache;
    if (typeof document === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const gl =
        canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext('webgl');
      const ok = !!gl && !gl.isContextLost();
      // 注意：这里不调用 loseContext()。某些环境下主动丢失会让整个页面
      // 的 WebGL 被标记不可用，导致真实组件创建失败。
      webglSupportCache = ok;
      return ok;
    } catch {
      webglSupportCache = false;
      return false;
    }
  });

  return supported;
}

/** 滚动进度（0–1），用于导航栏收缩等 */
export function useScrollProgress() {
  const [y, setY] = useState(0);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY));
    };
    window.addEventListener('scroll', on, { passive: true });
    on();
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  return y;
}
