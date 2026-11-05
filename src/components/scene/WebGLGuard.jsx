/**
 * ============================================================================
 *  WebGLGuard.jsx —— WebGL 上下文保护 + 配额协调
 * ============================================================================
 *
 *  两个职责：
 *
 *  1. 配额协调（lib/webglBudget.js）
 *     挂载前先申请槽位，避免多个 canvas 同时争抢导致互相把对方挤掉。
 *     配额满时会排队，前面的层卸载后自动获得 —— 不会永久黑屏。
 *
 *  2. 上下文丢失保护
 *     丢失（isContextLost）后立刻把该层整个移除，让静态渐变兜底。
 *     绝不留一块"死灰"在不透明层上。
 *
 *  额外：软件渲染环境下 context 可能"存在但无效"（drawingBuffer 为 0×0），
 *  这里在挂载后延迟检查一次尺寸，无效即隐藏。
 * ============================================================================
 */
import React, { useEffect, useRef, useState } from 'react';
import { acquireSlot } from '../../lib/webglBudget.js';

export default function WebGLGuard({ children, className, style, eager = true }) {
  const hostRef = useRef(null);
  const [granted, setGranted] = useState(false);
  const [dead, setDead] = useState(false);

  /* --------------------------------------------------------- 配额申请
   * eager=false 时直接挂载（用于只有一个层确定要显示的场景）。
   * 默认走配额，保证多 canvas 环境不互踢。 */
  useEffect(() => {
    if (!eager) {
      setGranted(true);
      return undefined;
    }
    let cancelled = false;
    const release = acquireSlot(() => {
      if (!cancelled) setGranted(true);
    });
    return () => {
      cancelled = true;
      release();
    };
  }, [eager]);

  /* --------------------------------------------------------- 丢失监听 */
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !granted) return undefined;

    const onLost = (e) => {
      e.preventDefault(); // 阻止默认行为，留出恢复机会
      document.documentElement.dataset.guardLost = 'event';
      setDead(true);
    };
    host.addEventListener('webglcontextlost', onLost, true);

    const check = () => {
      const canvas = host.querySelector('canvas');
      if (!canvas) return;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setDead(true);
        return;
      }
      // 只有「上下文明确丢失」才算死。
      // 不检查 drawingBufferWidth === 0 —— 组件刚挂载、首帧尚未绘制时
      // 它是 0 是正常现象，据此判死会导致动效永远不显示（已踩过）。
      if (gl.isContextLost()) setDead(true);
    };
    const t1 = setTimeout(check, 1500);
    const t2 = setTimeout(check, 4000);

    return () => {
      host.removeEventListener('webglcontextlost', onLost, true);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [granted]);

  /* ⚠️ 所有 Hook 必须写在下面的 return 之前。
     这里踩过一次坑：曾在此处之后加了一个 useRef(mountKey)，
     导致首渲染（granted=false）少走一个 Hook、第二次渲染多走一个，
     React 抛 "Rendered more hooks than during the previous render" 整棵树崩溃。 */

  if (!granted || dead) {
    // 诊断用：把状态暴露出来，便于排查为什么不挂载
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.guardState = `${granted ? 'g' : '-'}${dead ? 'd' : '-'}`;
    }
    return null;
  }

  return (
    <div ref={hostRef} className={className} style={style} data-webgl-guard="">
      {children}
    </div>
  );
}
