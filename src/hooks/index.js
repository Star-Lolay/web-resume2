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
  const [match, setMatch] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = (e) => setMatch(e.matches);
    setMatch(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
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
