import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

import './styles/tokens.css';
import './styles/base.css';
import './styles/editor.css';

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

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
