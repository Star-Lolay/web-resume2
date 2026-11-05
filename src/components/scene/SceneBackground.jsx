/**
 * ============================================================================
 *  SceneBackground.jsx —— 全站动效编排层
 * ============================================================================
 *
 *  四层动效，按滚动位置渐变衔接：
 *
 *    ┌─ z:1  GridScan      首屏。进场即显示，随首屏滚出而淡出
 *    ├─ z:2  MicroSlats    简历模块背景。首屏快滚完时淡入，底部前淡出
 *    ├─ z:3  GradientASCII 个人信息模块背景（局部）+ 页面底部固定层
 *    └─ z:0  静态兜底      任何动效不可用时的 CSS 渐变，保证文字永远可读
 *
 *  ── 为什么这么设计 ──────────────────────────────────────────────────────
 *  1. 四层同时跑 WebGL 会掉帧。这里用「滚动位置决定谁活着」的策略：
 *     同一时刻只有 1–2 个 canvas 在渲染，其余直接卸载。
 *  2. 所有层都压在正文之下（z-index 负或低），并且都有不透明度上限，
 *     保证「无论着色器输出什么，正文都可读」。
 *  3. 移动端默认关闭重动效（effects.config.perf.enableOnMobile=false），
 *     只留 CSS 渐变 —— 手机上 WebGL 收益低、耗电高。
 *
 *  ★ 想改动效参数 → src/content/effects.config.js
 *  ★ 想改哪一段用哪个动效 → 下面的 STAGE 定义
 * ============================================================================
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import GridScan from '../reactbits/GridScan.jsx';
import OrbitImages from '../reactbits/OrbitImages.jsx';
import MicroSlats from '../reactbits/MicroSlats.jsx';
import GradientASCII from '../reactbits/GradientASCII.jsx';
import WebGLGuard from './WebGLGuard.jsx';
import { useResume } from '../../lib/resumeStore.jsx';
import { usePageVisible, useMediaQuery, useWebGLSupport } from '../../hooks/index.js';
import { resolveAsset } from '../../lib/asset.js';
import './SceneBackground.css';

/** 平滑插值：让层的透明度随滚动连续变化，而不是硬切 */
function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

/**
 * 滚动进度（0=顶部，1=底部），节流到 rAF。
 * 不用 useScrollProgress 是因为这里只需要归一化进度，不需要像素值。
 */
function useScrollProgress01() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on, { passive: true });
    calc();
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return p;
}

export default function SceneBackground({ intensity = 0.8, theme = 'graphite' }) {
  /** 动效配置来自 store（默认值 + 用户在设置面板里的改动），不是静态 import */
  const { effects: cfg } = useResume();
  const progress = useScrollProgress01();
  const pageVisible = usePageVisible();
  const isMobile = useMediaQuery('(max-width: 899px)');
  /** WebGL 是否可用：不可用（低端机 / 软件渲染 / 上下文配额耗尽）时直接不挂重动效 */
  const webglOk = useWebGLSupport();

  /** 亮色主题下，为深色设计的着色器会发脏 —— 直接不渲染 WebGL，用 CSS 兜底 */
  const isLightTheme = theme === 'paleAsh';

  /** 是否允许跑重动效：本机 WebGL 可用 + 非移动端 + 强度够 + 非亮色主题 + 页面可见 */
  const desktopOk = isMobile ? cfg.perf.enableOnMobile : true;
  const allowHeavy =
    webglOk &&
    desktopOk &&
    intensity >= cfg.perf.minIntensity &&
    !isLightTheme &&
    pageVisible;

  /* ---------------------------------------------------------------- 各层可见性
   * 用滚动进度分段，带一段重叠区间做交叉淡入淡出（"渐变衔接"的核心）。
   */

  // GridScan：0 → 0.22 全程在，0.10–0.26 淡出
  const gridScanFade = 1 - smoothstep(0.1, 0.26, progress);
  // 进度靠前时挂载；滚过就卸载，把唯一的 WebGL 配额让给下一层
  const gridScanMounted = allowHeavy && cfg.gridScan.enabled && progress < 0.22;

  // MicroSlats：0.06 起淡入，0.16 全亮，0.78 起淡出
  const microFade = smoothstep(0.05, 0.17, progress) * (1 - smoothstep(0.74, 0.9, progress));
  // 挂载区间与 GridScan 严格错开：GridScan 卸载后才挂（0.22 起），
  // 且底部层挂载前就卸（0.8 止）—— 保证任意时刻最多一个 WebGL canvas。
  const microMounted =
    allowHeavy && cfg.microSlats.enabled && progress > 0.22 && progress < 0.8;

  // GradientASCII（底部固定层）：0.72 起淡入，到底部最亮
  // 只在前面两层都已卸载后才挂载 —— 严格保证同一时刻只有一个 WebGL canvas
  const bottomFade = smoothstep(0.7, 0.95, progress);
  const bottomMounted =
    allowHeavy && cfg.gradientASCII.enabled && progress > 0.82 && !microMounted;

  /* ---------------------------------------------------------------- 兜底层
   * 动效关闭 / 不可用时，仍然要给每一段一个有层次的深色底，
   * 否则首屏和正文会变成一块死平的纯色。
   */
  const staticBase = (
    <div className="scene__static" aria-hidden="true">
      <div className="scene__static-hero" />
      <div className="scene__static-mid" />
      <div className="scene__static-bottom" />
    </div>
  );

  return (
    <div
      className="scene"
      aria-hidden="true"
      data-diag={`webgl:${webglOk}|heavy:${allowHeavy}|grid:${gridScanMounted}|prog:${progress.toFixed(2)}|vis:${pageVisible}|mob:${isMobile}|int:${intensity}|theme:${theme}`}
    >
      {/* 静态兜底：永远在最底下 */}
      {staticBase}

      {/* ① 首屏 GridScan */}
      {gridScanMounted && (
        <WebGLGuard
          className="scene__layer scene__layer--grid"
          style={{ opacity: cfg.gridScan.opacity * gridScanFade }}
        >
          <GridScan
            scanColor={cfg.gridScan.scanColor}
            linesColor={cfg.gridScan.linesColor}
            lightMode={cfg.gridScan.lightMode}
            cells={cfg.gridScan.cells}
            lineThickness={cfg.gridScan.lineThickness}
            scanDuration={cfg.gridScan.scanDuration}
            scanDelay={cfg.gridScan.scanDelay}
            scanDirection={cfg.gridScan.scanDirection}
            trail={cfg.gridScan.trail}
            shading={cfg.gridScan.shading}
            glow={cfg.gridScan.glow}
            reflection={cfg.gridScan.reflection}
            scanWidth={cfg.gridScan.scanWidth}
            depth={cfg.gridScan.depth}
            depthFade={cfg.gridScan.depthFade}
            points={cfg.gridScan.points}
            autoScan={cfg.gridScan.autoScan}
            interactive={cfg.gridScan.interactive}
            clickEffect={cfg.gridScan.clickEffect}
            intro={cfg.gridScan.intro}
            dpr={cfg.gridScan.dpr}
            className="scene__canvas"
          />
        </WebGLGuard>
      )}

      {/* ② 简历模块衔接 MicroSlats */}
      {microMounted && (
        <WebGLGuard
          className="scene__layer scene__layer--slats"
          style={{ opacity: cfg.microSlats.opacity * microFade }}
        >
          <MicroSlats
            preset={cfg.microSlats.preset}
            color={cfg.microSlats.color}
            glintColor={cfg.microSlats.glintColor}
            backgroundColor={cfg.microSlats.backgroundColor}
            slatWidth={cfg.microSlats.slatWidth}
            slatHeight={cfg.microSlats.slatHeight}
            gap={cfg.microSlats.gap}
            roundness={cfg.microSlats.roundness}
            scale={cfg.microSlats.scale}
            speed={cfg.microSlats.speed}
            direction={cfg.microSlats.direction}
            chop={cfg.microSlats.chop}
            glint={cfg.microSlats.glint}
            contrast={cfg.microSlats.contrast}
            perspective={cfg.microSlats.perspective}
            fog={cfg.microSlats.fog}
            stretch={cfg.microSlats.stretch}
            interactive={cfg.microSlats.interactive}
            cursorStrength={cfg.microSlats.cursorStrength}
            cursorSize={cfg.microSlats.cursorSize}
            swirl={cfg.microSlats.swirl}
            trail={cfg.microSlats.trail}
            lean={cfg.microSlats.lean}
            intro={cfg.microSlats.intro}
            introDuration={cfg.microSlats.introDuration}
            paused={!pageVisible}
            className="scene__canvas"
          />
        </WebGLGuard>
      )}

      {/* ③ 底部固定 GradientASCII */}
      {bottomMounted && (
        <WebGLGuard
          className="scene__layer scene__layer--bottom"
          style={{ opacity: cfg.gradientASCII.fixedOpacity * bottomFade }}
        >
          <GradientASCII
            shape={cfg.gradientASCII.shape}
            colors={cfg.gradientASCII.colors}
            grain={cfg.gradientASCII.grain}
            glow={cfg.gradientASCII.glow}
            speed={cfg.gradientASCII.speed}
            flicker={cfg.gradientASCII.flicker}
            cellSize={cfg.gradientASCII.cellSize}
            density={cfg.gradientASCII.density}
            glyphOpacity={cfg.gradientASCII.glyphOpacity}
            softness={cfg.gradientASCII.softness}
            gradientOpacity={cfg.gradientASCII.gradientOpacity}
            flow={cfg.gradientASCII.flow}
            scale={cfg.gradientASCII.scale}
            variation={cfg.gradientASCII.variation}
            mouseInteraction={cfg.gradientASCII.mouseInteraction}
            scrambleRadius={cfg.gradientASCII.scrambleRadius}
            clickEffect={cfg.gradientASCII.clickEffect}
            intro={cfg.gradientASCII.intro}
            lightMode={isLightTheme}
            dpr={cfg.gradientASCII.dpr}
            className="scene__canvas"
          />
        </WebGLGuard>
      )}

      {/* 首屏的环形图片层 —— 延迟 500ms 出现 */}
      <OrbitLayer intensity={intensity} theme={theme} cfg={cfg} />
    </div>
  );
}

/**
 * 环形图片层：绝对定位在首屏区域，随首屏滚出而淡出。
 * 单独拆出来是因为它的显示时机（延迟 500ms）与滚动淡出逻辑和其它层不同。
 */
function OrbitLayer({ intensity, theme, cfg }) {
  const orbitCfg = cfg.orbitImages;
  const [ready, setReady] = useState(false);
  const isMobile = useMediaQuery('(max-width: 899px)');
  const isLightTheme = theme === 'paleAsh';
  const pageVisible = usePageVisible();

  // 需求：延迟半秒出现
  useEffect(() => {
    if (!orbitCfg.enabled) return undefined;
    if (intensity < cfg.perf.minIntensity) return undefined;
    if (isMobile && !cfg.perf.enableOnMobile) return undefined;
    const t = setTimeout(() => setReady(true), orbitCfg.delay);
    return () => clearTimeout(t);
  }, [orbitCfg.enabled, orbitCfg.delay, intensity, isMobile, cfg.perf]);

  /** 首屏滚出后隐藏，避免它漂在正文上 */
  const [scrolledOut, setScrolledOut] = useState(false);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolledOut(window.scrollY > window.innerHeight * 0.62);
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    on();
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  const images = useMemo(
    () => (orbitCfg.images || []).map((src) => resolveAsset(src)).filter(Boolean),
    [orbitCfg.images]
  );

  if (!ready || !images.length || scrolledOut || !pageVisible) return null;

  return (
    <div className="scene__orbit" style={{ opacity: isLightTheme ? 0.55 : 0.9 }}>
      <OrbitImages
        images={images}
        easing={orbitCfg.easing}
        radiusY={orbitCfg.radiusY}
        radiusX={orbitCfg.radiusX}
        itemSize={orbitCfg.itemSize}
        duration={orbitCfg.duration}
        rotation={orbitCfg.rotation}
        showPath={orbitCfg.showPath}
        pathColor={orbitCfg.pathColor}
        pathWidth={orbitCfg.pathWidth}
        depth={orbitCfg.depth}
        itemRadius={orbitCfg.itemRadius}
        shadow={orbitCfg.shadow}
        hoverScale={orbitCfg.hoverScale}
        draggable={orbitCfg.draggable}
        intro={orbitCfg.intro}
        paused={!pageVisible}
        className="scene__orbit-canvas"
      />
    </div>
  );
}
