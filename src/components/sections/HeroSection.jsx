/**
 * ============================================================================
 *  HeroSection —— 首屏（锁定首位，不可移除）
 * ============================================================================
 *  结构：压暗层 → 大标题 → 定位一句话 → 行动按钮 → 底部状态条
 *  动效：
 *    - 背景 GridScan 由 SceneBackground 提供（固定层，随滚动淡出）
 *    - 环形图片 OrbitImages 由 SceneBackground 提供（延迟 500ms）
 *    - 本组件只负责「压暗护栏 + 逐字入场 + 滚动视差」
 * ============================================================================
 */
import React, { useEffect, useState } from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { useRichMotion } from '../../hooks/index.js';
import SplitTextLite from '../effects/SplitTextLite.jsx';
import './HeroSection.css';

export default function HeroSection() {
  const { data, config, intensity } = useResume();
  const { person, hero } = data;
  const richMotion = useRichMotion(intensity);
  const [scrolled, setScrolled] = useState(0);

  // 滚动视差（只做 transform，不触发重排）
  useEffect(() => {
    if (!richMotion) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(Math.min(window.scrollY, window.innerHeight));
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, [richMotion]);

  const parallax = richMotion ? scrolled * 0.16 : 0;
  const fade = richMotion ? Math.max(0, 1 - scrolled / (window.innerHeight * 0.78)) : 1;

  return (
    <section className="hero" id="top" data-screen-label="01 Hero">
      {/* ---------------------------------------------------------- 压暗护栏
          不画背景（由 SceneBackground 的 GridScan 提供），只保证文字可读 */}
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__base" />
        <div className="hero__veil" />
        <div className="hero__grid" />
      </div>

      {/* ---------------------------------------------------------- 内容层 */}
      <div
        className="hero__inner container"
        style={{
          opacity: fade,
          transform: parallax ? `translate3d(0,${parallax * 0.24}px,0)` : undefined,
        }}
      >
        {/* 状态标签 */}
        <div className="hero__topline">
          <span className="hero__status">
            <span className="status-dot" />
            {person.status}
          </span>
          <span className="hero__loc mono">{person.city}</span>
          <span className="hero__role mono">{person.roleNote}</span>
        </div>

        {/* 大标题：衬线 + 紧凑字距，两行错落 */}
        <h1 className="hero__title">
          <span className="hero__title-line1">
            <SplitTextLite text={hero.titleLine1} by="chars" stagger={46} delay={80} />
          </span>
          <span className="hero__title-line2">
            <SplitTextLite text={hero.titleLine2} by="chars" stagger={34} delay={300} />
            <em className="hero__title-en">{person.nameEn}</em>
          </span>
        </h1>

        {/* 定位一句话 */}
        <p className="hero__tagline">{hero.tagline}</p>

        {/* 副行 */}
        <p className="hero__subline mono">{hero.subline}</p>

        {/* 行动按钮 */}
        <div className="hero__actions">
          {hero.actions.slice(0, config.limits.heroActions).map((a, i) => (
            <a
              key={`${a.label}-${i}`}
              href={a.href || '#'}
              className={`btn ${a.variant === 'primary' ? 'btn--primary' : 'btn--ghost'} hero__cta`}
              onClick={(e) => {
                if (a.href?.startsWith('#')) {
                  e.preventDefault();
                  const el = document.getElementById(a.href.slice(1));
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 56;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }
              }}
            >
              {a.label}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* 右下角滚动提示 */}
      <div className="hero__scroll" style={{ opacity: fade }} aria-hidden="true">
        <span className="mono">SCROLL</span>
        <i />
      </div>

      {/* 底部渐变衔接下一屏 */}
      <div className="hero__fadeout" aria-hidden="true" />
    </section>
  );
}
