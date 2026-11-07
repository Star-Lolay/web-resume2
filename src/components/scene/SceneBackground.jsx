/**
 * ============================================================================
 *  SceneBackground.jsx —— 全站动效编排层
 * ============================================================================
 *
 *  按「页面位置」分三段，而不是简单按滚动百分比 —— 因为模块数量可增删，
 *  百分比会把动效切在错误的位置。这里的划分依据是真实 DOM 测量：
 *
 *    ┌─ ① GridScan      仅首屏（滚动 < 视口高度时可见），严格不向下延伸
 *    ├─ ② MicroSlats    首屏之后 → 最后一屏之前（方块流动，简历主体）
 *    ├─ ③ Galaxy        最后一屏（最后一个模块可见时淡入）
 *    ├─ ④ 白色流动边缘   最后一屏底部的一小条（纯 CSS）
 *    └─ ⑤ Iridescence   亮色主题的全站固定背景（深色主题不渲染）
 *
 *  ── 为什么这么设计 ──────────────────────────────────────────────────────
 *  1. 多段同时跑 WebGL 会掉帧。同一时刻只允许 1 个「主体」canvas 活着，
 *     其余直接卸载 —— 保证配额够用、帧率稳定。
 *  2. 所有层都压在正文之下，并且都有不透明度上限，
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
import Galaxy from '../reactbits/Galaxy.jsx';
import Iridescence from '../reactbits/Iridescence.jsx';
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
 * 页面几何：滚动位置 + 最后一屏的起始偏移。
 *
 * 「最后一屏」的判定不靠模块 key（用户可增删、可排序），而是量最后一个
 * section 的 DOM 位置：最后一屏起点 = 文档总高 − 视口高 × 1.0，取两者较大值。
 * 这样无论有几屏，收尾动效都只发生在真正的最后一屏。
 */
function usePageGeom(moduleCount) {
  const [geom, setGeom] = useState({ y: 0, max: 0, lastTop: 0, vh: 0 });

  useEffect(() => {
    let raf = 0;
    const calc = () => {
      const doc = document.documentElement;
      const vh = window.innerHeight;
      const max = Math.max(0, doc.scrollHeight - vh);
      // 最后一个文档流里的 section 的绝对顶端（不含任何偏移）
      const sections = document.querySelectorAll('main > section');
      const lastEl = sections.length ? sections[sections.length - 1] : null;
      let lastTop = max;
      if (lastEl) {
        const rect = lastEl.getBoundingClientRect();
        lastTop = Math.min(max, Math.max(0, rect.top + window.scrollY));
      }
      setGeom({
        y: window.scrollY,
        max,
        vh,
        lastTop,
      });
    };
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on, { passive: true });
    // 模块增删 / 字体加载都会改变文档高度
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(on)
      : null;
    if (ro) ro.observe(document.body);
    calc();
    const t = setTimeout(calc, 400); // 等入场动画与字体稳定后再量一次
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (ro) ro.disconnect();
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [moduleCount]);

  return geom;
}

export default function SceneBackground({ intensity = 0.8, theme = 'graphite' }) {
  /** 动效配置来自 store（默认值 + 用户在设置面板里的改动），不是静态 import */
  const { effects: cfg, moduleSequence } = useResume();
  const { y, max, vh, lastTop } = usePageGeom(moduleSequence.length);
  const pageVisible = usePageVisible();
  const isMobile = useMediaQuery('(max-width: 899px)');
  /** WebGL 是否可用：不可用（低端机 / 软件渲染 / 上下文配额耗尽）时直接不挂重动效 */
  const webglOk = useWebGLSupport();

  /** 亮色主题走单独一条路：全站固定 Iridescence，不再分段切换 */
  const isLightTheme = theme === 'paleAsh';

  /** 是否允许跑重动效：本机 WebGL 可用 + 非移动端 + 强度够 + 页面可见 */
  const desktopOk = isMobile ? cfg.perf.enableOnMobile : true;
  const allowHeavy =
    webglOk &&
    desktopOk &&
    intensity >= cfg.perf.minIntensity &&
    pageVisible;

  /* ------------------------------------------------------------ 分段判定
   * 关键位置：
   *   heroEnd    = 一屏高（首屏结束）
   *   lastEnter  = 最后一屏的顶端刚进入视口底部（滚动到此值它开始露头）
   *   max        = 到底
   * lastEnter 用「最后一个 section 的绝对顶端 − 一屏高」得出，与模块数量无关。
   */
  const heroEnd = vh;
  const lastEnter = Math.max(heroEnd * 1.1, lastTop - vh);

  /* ① GridScan：仅首屏。滚过半屏开始淡出，到一屏高完全消失 */
  const gridFade = 1 - smoothstep(heroEnd * 0.42, heroEnd * 0.98, y);
  const gridMounted =
    allowHeavy && !isLightTheme && cfg.gridScan.enabled && y < heroEnd * 1.02;

  /* ② MicroSlats：首屏之后淡入，最后一屏进来时淡出 */
  const microIn = smoothstep(heroEnd * 0.55, heroEnd * 1.15, y);
  const microOut = smoothstep(lastEnter - vh * 0.08, lastEnter + vh * 0.38, y);
  const microFade = microIn * (1 - microOut);
  /** 与 GridScan 错开：GridScan 在 y≈1.02vh 卸载，MicroSlats 从 0.88vh 起淡入，
   *  重叠区间只有 0.14vh 且两者不透明度都很低，视觉上是连续过渡。 */
  const microMounted =
    allowHeavy && !isLightTheme && cfg.microSlats.enabled &&
    y > heroEnd * 0.88 && microFade > 0.02;

  /* ③ Galaxy：最后一屏露头时开始淡入，滚到底完全显现 */
  const galaxyFade = smoothstep(lastEnter - vh * 0.04, lastEnter + vh * 0.6, y);
  const galaxyMounted =
    allowHeavy && !isLightTheme && cfg.galaxy.enabled && y > lastEnter - vh * 0.12;

  /* ④ 白色流动边缘：最后一屏占满视口时才出现 */
  const edgeFade = smoothstep(lastEnter + vh * 0.15, lastEnter + vh * 0.65, y);

  /* ⑤ Iridescence：亮色主题全站固定 */
  const iridMounted = allowHeavy && isLightTheme && cfg.iridescence.enabled;

  /* ---------------------------------------------------------------- 兜底层
   * 动效关闭 / 不可用时，仍然要给每一段一个有层次的底，
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
      data-theme-scene={isLightTheme ? 'light' : 'dark'}
      data-diag={`webgl:${webglOk}|heavy:${allowHeavy}|grid:${gridMounted}|y:${Math.round(y)}|last:${Math.round(lastEnter)}|mob:${isMobile}|int:${intensity}|theme:${theme}`}
    >
      {/* 静态兜底：永远在最底下 */}
      {staticBase}

      {/* ⑤ 亮色主题：全站固定虹彩背景（唯一一层，不再分段） */}
      {iridMounted && (
        <WebGLGuard
          className="scene__layer scene__layer--irid"
          style={{ opacity: cfg.iridescence.opacity }}
        >
          <Iridescence
            color={cfg.iridescence.color}
            speed={cfg.iridescence.speed}
            brightness={cfg.iridescence.brightness}
            scale={cfg.iridescence.scale}
            contrast={cfg.iridescence.contrast}
            detail={cfg.iridescence.detail}
            amplitude={cfg.iridescence.amplitude}
            warp={cfg.iridescence.warp}
            mouseReact={cfg.iridescence.mouseReact}
            rotation={cfg.iridescence.rotation}
            hueShift={cfg.iridescence.hueShift}
            saturation={cfg.iridescence.saturation}
            stir={cfg.iridescence.stir}
            sheen={cfg.iridescence.sheen}
            clickSwirl={cfg.iridescence.clickSwirl}
            grain={cfg.iridescence.grain}
            fade={cfg.iridescence.fade}
            resolution={cfg.iridescence.resolution}
            paused={!pageVisible}
            className="scene__canvas"
          />
        </WebGLGuard>
      )}

      {/* ① 首屏 GridScan —— 严格 100vh，底部渐隐衔接下一段 */}
      {gridMounted && (
        <WebGLGuard
          className="scene__layer scene__layer--grid"
          style={{
            opacity: cfg.gridScan.opacity * gridFade,
            '--grid-fade': `${cfg.gridScan.bottomFadePx}px`,
          }}
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

      {/* ② 简历主体 MicroSlats —— 方块流动，覆盖到最后一屏之前 */}
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

      {/* ③ 最后一屏 Galaxy —— 星野收尾 */}
      {galaxyMounted && (
        <WebGLGuard
          className="scene__layer scene__layer--galaxy"
          style={{ opacity: cfg.galaxy.opacity * galaxyFade }}
        >
          <Galaxy
            twinkleIntensity={cfg.galaxy.twinkleIntensity}
            saturation={cfg.galaxy.saturation}
            starSize={cfg.galaxy.starSize}
            starSpeed={cfg.galaxy.starSpeed}
            starColors={cfg.galaxy.starColors}
            density={cfg.galaxy.density}
            flareIntensity={cfg.galaxy.flareIntensity}
            repulsionStrength={cfg.galaxy.repulsionStrength}
            focal={cfg.galaxy.focal}
            rotation={cfg.galaxy.rotation}
            hueShift={cfg.galaxy.hueShift}
            speed={cfg.galaxy.speed}
            mouseInteraction={cfg.galaxy.mouseInteraction}
            glowIntensity={cfg.galaxy.glowIntensity}
            mouseRepulsion={cfg.galaxy.mouseRepulsion}
            rotationSpeed={cfg.galaxy.rotationSpeed}
            autoCenterRepulsion={cfg.galaxy.autoCenterRepulsion}
            transparent={cfg.galaxy.transparent}
            lightMode={cfg.galaxy.lightMode}
            layers={cfg.galaxy.layers}
            direction={cfg.galaxy.direction}
            clickWarp={cfg.galaxy.clickWarp}
            intro={cfg.galaxy.intro}
            dpr={cfg.galaxy.dpr}
            className="scene__canvas"
          />
        </WebGLGuard>
      )}

      {/* ④ 最后一屏底部的白色流动边缘 —— 纯 CSS，不占 WebGL 配额 */}
      {cfg.edgeGlow.enabled && !isLightTheme && (
        <div
          className="scene__edge"
          style={{
            '--edge-h': `${cfg.edgeGlow.heightVh}vh`,
            '--edge-op': cfg.edgeGlow.opacity,
            '--edge-dur': `${cfg.edgeGlow.duration}s`,
            '--edge-c1': cfg.edgeGlow.colors[0],
            '--edge-c2': cfg.edgeGlow.colors[1] || cfg.edgeGlow.colors[0],
            '--edge-c3': cfg.edgeGlow.colors[2] || cfg.edgeGlow.colors[0],
            opacity: edgeFade,
          }}
        />
      )}

      {/* 首屏的环形图片层 —— 延迟 500ms 出现 */}
      <OrbitLayer intensity={intensity} theme={theme} cfg={cfg} visible={y < heroEnd * 0.62} />
    </div>
  );
}

/**
 * 环形图片层：绝对定位在首屏区域，随首屏滚出而淡出。
 * 单独拆出来是因为它的显示时机（延迟 500ms）与滚动淡出逻辑和其它层不同。
 */
function OrbitLayer({ intensity, theme, cfg, visible }) {
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

  const images = useMemo(
    () => (orbitCfg.images || []).map((src) => resolveAsset(src)).filter(Boolean),
    [orbitCfg.images]
  );

  if (!ready || !images.length || !visible || !pageVisible) return null;

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
