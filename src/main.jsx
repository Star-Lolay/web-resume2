import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

import './styles/tokens.css';
import './styles/base.css';
import './styles/editor.css';
import './styles/export.css';

import { splitTextStyles } from './components/effects/SplitTextLite.jsx';
import { projectChartStyles } from './components/sections/ProjectChart.jsx';

/** 局部组件的样式以字符串形式注入一次，避免每组件重复插入 <style> */
function injectStyles(id, css) {
  if (!css || document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

injectStyles('split-text-styles', splitTextStyles);
injectStyles('project-chart-styles', projectChartStyles);

/**
 * 说明：这里不使用 React.StrictMode。
 *
 * 原因：StrictMode 在开发模式下会「挂载 → 卸载 → 再挂载」每个组件一次，
 * 用于暴露副作用问题。但 WebGL 组件（GridScan / MicroSlats / Galaxy 等）
 * 在 cleanup 里会调用 gl.getExtension('WEBGL_lose_context').loseContext() 释放上下文，
 * 而第二次挂载复用的是同一个 <canvas> 元素 —— 它的上下文已被丢弃，导致动效永久黑屏。
 *
 * 这是库自身与 StrictMode 的兼容问题，不是本站代码的缺陷。
 * 去掉 StrictMode 后开发与生产行为一致，动效可正常显示。
 */
createRoot(document.getElementById('root')).render(<App />);
