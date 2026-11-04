/**
 * ============================================================================
 *  SplitTextLite —— 逐字入场（ReactBits SplitText 的轻量等价实现）
 * ============================================================================
 *  为什么不用官方版：官方版依赖 gsap + @gsap/react（约 90KB），
 *  本页只需要"一次性入场"，用 CSS transition + 逐字 delay 即可，体积为 0。
 *
 *  降级：prefers-reduced-motion 或动效强度=0 时直接静态显示。
 * ============================================================================
 */
import React, { useEffect, useRef, useState } from 'react';

/**
 * @param {string} text      要拆分的文本
 * @param {'chars'|'words'} by  拆分粒度（中文按字更自然）
 * @param {number} delay     起始延迟 ms
 * @param {number} stagger   每个单元的间隔 ms
 * @param {string} className 外层类名
 * @param {string} as        标签名
 */
export default function SplitTextLite({
  text = '',
  by = 'chars',
  delay = 0,
  stagger = 34,
  className = '',
  as: Tag = 'span',
  style,
}) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'off';
    if (reduced) {
      setActive(true);
      return;
    }

    // 进入视口才播放，且只播一次
    let done = false;
    if (typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !done) {
            done = true;
            setActive(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);

    // 兜底：观察器未产生回调时，2s 后强制显示，避免标题永久不可见
    const fallback = setTimeout(() => {
      if (!done) {
        done = true;
        setActive(true);
      }
    }, 2000);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const units = by === 'words' ? splitWords(text) : Array.from(text);

  return (
    <Tag ref={ref} className={`split-text ${className}`} style={style} aria-label={text}>
      {units.map((u, i) => (
        <span className="split-text__u" key={`${u}-${i}`} aria-hidden="true">
          <span
            className={`split-text__i ${active ? 'is-in' : ''}`}
            style={{ transitionDelay: `${delay + i * stagger}ms` }}
          >
            {u === ' ' ? '\u00A0' : u}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** 按空格拆词，保留空格 */
function splitWords(text) {
  return text.split(/(\s+)/).filter((s) => s !== '');
}

export const splitTextStyles = `
.split-text {
  display: inline;
}
.split-text__u {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  /* 下缘留出降部空间，避免 g/y 被裁 */
  padding-bottom: 0.12em;
  margin-bottom: -0.12em;
}
.split-text__i {
  display: inline-block;
  transform: translateY(108%);
  opacity: 0.001;
  transition: transform 720ms cubic-bezier(0.16, 1, 0.3, 1), opacity 520ms ease-out;
  will-change: transform, opacity;
}
.split-text__i.is-in {
  transform: none;
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .split-text__i {
    transform: none;
    opacity: 1;
    transition: none;
  }
}
`;
