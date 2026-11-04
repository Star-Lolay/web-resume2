/**
 * ============================================================================
 *  CountUpLite —— 数字滚动（ReactBits CountUp 的零依赖实现）
 * ============================================================================
 *  官方版依赖 motion（约 60KB）。这里用 requestAnimationFrame + 缓动，
 *  只在进入视口时播放一次，并对小数位做了处理（4.7pp 这类值不能丢精度）。
 * ============================================================================
 */
import React, { useEffect, useRef, useState } from 'react';

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function CountUpLite({
  to = 0,
  from = 0,
  duration = 1200,
  decimals = 'auto',
  prefix = '',
  suffix = '',
  className = '',
}) {
  const ref = useRef(null);
  const [val, setVal] = useState(from);
  const played = useRef(false);

  // 小数位：未指定时按目标值推断（最多 2 位）
  const dp =
    decimals === 'auto'
      ? (() => {
          const s = String(to);
          const i = s.indexOf('.');
          return i < 0 ? 0 : Math.min(2, s.length - i - 1);
        })()
      : decimals;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'off';
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setVal(to);
      return;
    }

    let raf = 0;
    let start = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || played.current) continue;
          played.current = true;
          start = performance.now();
          const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            setVal(from + (to - from) * easeOutExpo(p));
            if (p < 1) raf = requestAnimationFrame(tick);
            else setVal(to);
          };
          raf = requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, from, duration]);

  const text = typeof val === 'number' ? val.toFixed(dp) : String(val);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${to}${suffix}`}>
      <span aria-hidden="true">
        {prefix}
        {text}
        {suffix}
      </span>
    </span>
  );
}
