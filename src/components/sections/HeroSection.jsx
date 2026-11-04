/**
 * ============================================================================
 *  HeroSection —— 首屏（锁定首位，不可移除）
 * ============================================================================
 *  结构：Aurora 背景 → 大标题 → 定位一句话 → 行动按钮 → 底部状态条
 *  动效：Aurora（WebGL，可降级）+ 逐字入场 + 指标条形入场
 * ============================================================================
 */
import React, { useEffect, useRef, useState } from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { useRichMotion, usePageVisible } from '../../hooks/index.js';
import SplitTextLite from '../effects/SplitTextLite.jsx';
import Aurora from '../reactbits/Aurora.jsx';
import './HeroSection.css';

export default function HeroSection() {
  const { data, config, intensity } = useResume();
  const { person, hero } = data;
  const richMotion = useRichMotion(intensity);
  const pageVisible = usePageVisible();
  const sectionRef = useRef(null);
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

  const showAurora = config.motion.heroAurora && intensity > 0.25;

  return (
    <section className="hero" id="top" ref={sectionRef} data-screen-label="01 Hero">
      {/* ---------------------------------------------------------- 背景层 */}
      <div className="hero__bg" aria-hidden="true">
        {/* 兜底底色：任何情况下首屏都必须是深色，文字才可读 */}
        <div className="hero__base" />
        {showAurora ? (
          <div className="hero__aurora" style={{ transform: `translate3d(0,${parallax * 0.5}px,0)` }}>
            <Aurora
              colorStops={['#1E2530', '#7E8C74', '#0E1216']}
              amplitude={0.55}
              blend={0.7}
              speed={0.34}
              height={0.5}
              scale={1}
              glow={0.16}
              brightness={0.42}
              layers={1}
              direction="top"
              mouseInteraction={richMotion}
              intro
              opacity={0.44}
              paused={!pageVisible}
              dpr={1.25}
            />
          </div>
        ) : (
          <div className="hero__fallback" />
        )}
        <div className="hero__veil" />
        <div className="hero__grid" />
      </div>

      {/* ---------------------------------------------------------- 内容层 */}
      <div className="hero__inner container" style={{ opacity: fade }}>
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
