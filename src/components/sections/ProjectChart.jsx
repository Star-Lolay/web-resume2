/**
 * ============================================================================
 *  ProjectChart —— 项目卡内的数据缩略图（纯 SVG 生成，非图片）
 * ============================================================================
 *  为什么用 SVG 而不是截图：
 *  - 体积：几 KB vs 几百 KB
 *  - 清晰度：任意缩放不失真
 *  - 可主题化：跟随 --accent 变化
 *  这些图是"示意性可视化"，用来说明分析思路，不代表真实数据分布。
 * ============================================================================
 */
import React from 'react';

const W = 420;
const H = 240;

/** RFM 分层：横向条形，8 个分层 */
function RfmChart() {
  const rows = [
    { label: '重要价值', v: 0.92 },
    { label: '重要保持', v: 0.74 },
    { label: '重要发展', v: 0.61 },
    { label: '重要挽留', v: 0.83 },
    { label: '一般价值', v: 0.38 },
    { label: '一般保持', v: 0.29 },
    { label: '新客', v: 0.22 },
    { label: '流失预警', v: 0.11 },
  ];
  const x0 = 86;
  const maxW = W - x0 - 34;
  const rowH = 24;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pchart" role="img" aria-label="RFM 人群分层示意图">
      <g className="pchart__labels">
        {rows.map((r, i) => (
          <text key={r.label} x={0} y={22 + i * rowH} className="pchart__label">
            {r.label}
          </text>
        ))}
      </g>
      <g>
        {rows.map((r, i) => (
          <g key={r.label}>
            <rect
              x={x0}
              y={12 + i * rowH}
              width={maxW}
              height={10}
              rx={5}
              className="pchart__track"
            />
            <rect
              x={x0}
              y={12 + i * rowH}
              width={maxW * r.v}
              height={10}
              rx={5}
              className={`pchart__bar ${i === 3 ? 'is-hot' : ''}`}
            />
          </g>
        ))}
      </g>
      <text x={x0} y={H - 8} className="pchart__note">
        占比示意 · 高价值流失预警 11.3%
      </text>
    </svg>
  );
}

/** ABC 分类：柱状 + 累计曲线 */
function AbcChart() {
  const bars = [0.86, 0.62, 0.48, 0.33, 0.26, 0.18, 0.12, 0.07];
  const x0 = 14;
  const baseY = 168;
  const maxH = 116;
  const bw = 30;
  const gap = 14;

  // 累计占比折线
  const total = bars.reduce((a, b) => a + b, 0);
  let acc = 0;
  const cum = bars.map((b) => {
    acc += b;
    return acc / total;
  });
  const pts = cum
    .map((c, i) => {
      const cx = x0 + i * (bw + gap) + bw / 2;
      const cy = baseY - c * maxH;
      return `${cx},${cy}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pchart" role="img" aria-label="ABC 分类与累计占比示意图">
      {bars.map((b, i) => (
        <rect
          key={i}
          x={x0 + i * (bw + gap)}
          y={baseY - b * maxH}
          width={bw}
          height={b * maxH}
          rx={3}
          className={`pchart__bar ${i < 2 ? 'is-hot' : ''}`}
        />
      ))}
      <polyline points={pts} className="pchart__line" />
      {cum.map((c, i) => (
        <circle
          key={i}
          cx={x0 + i * (bw + gap) + bw / 2}
          cy={baseY - c * maxH}
          r={2.4}
          className="pchart__dot"
        />
      ))}
      <line x1={0} y1={baseY} x2={W} y2={baseY} className="pchart__axis" />
      <text x={0} y={H - 10} className="pchart__note">
        A 类 2 个品类贡献约 58% 销售额
      </text>
      <text x={W - 4} y={H - 10} textAnchor="end" className="pchart__note">
        滞销占比 21% → 12%
      </text>
    </svg>
  );
}

/** ROI 归因：三渠道折线 */
function RoiChart() {
  const series = [
    { color: 'var(--accent)', pts: [0.3, 0.42, 0.38, 0.55, 0.62, 0.71, 0.78] },
    { color: 'var(--accent-2)', pts: [0.22, 0.3, 0.44, 0.4, 0.5, 0.52, 0.6] },
    { color: 'var(--text-mute)', pts: [0.16, 0.2, 0.18, 0.26, 0.24, 0.3, 0.34] },
  ];
  const x0 = 12;
  const y0 = 176;
  const w = W - 24;
  const h = 128;
  const n = 7;

  const toPath = (pts) =>
    pts
      .map((p, i) => {
        const x = x0 + (i / (n - 1)) * w;
        const y = y0 - p * h;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pchart" role="img" aria-label="投放 ROI 三渠道趋势示意图">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={x0}
          y1={y0 - g * h}
          x2={x0 + w}
          y2={y0 - g * h}
          className="pchart__grid"
        />
      ))}
      {series.map((s, i) => (
        <path key={i} d={toPath(s.pts)} className="pchart__line" style={{ stroke: s.color }} />
      ))}
      {series.map((s, i) =>
        s.pts.map((p, j) => (
          <circle
            key={`${i}-${j}`}
            cx={x0 + (j / (n - 1)) * w}
            cy={y0 - p * h}
            r={1.8}
            style={{ fill: s.color }}
            opacity={0.9}
          />
        ))
      )}
      <text x={0} y={H - 10} className="pchart__note">
        3 渠道 × 5 层级 · 周粒度
      </text>
      <text x={W - 4} y={H - 10} textAnchor="end" className="pchart__note">
        预算调整周期 月 → 周
      </text>
    </svg>
  );
}

const MAP = { rfm: RfmChart, abc: AbcChart, roi: RoiChart };

export default function ProjectChart({ kind }) {
  const C = MAP[kind];
  if (!C) {
    return (
      <div className="pchart-placeholder">
        <span className="num">[chart]</span>
        <span>数据图表占位</span>
      </div>
    );
  }
  return <C />;
}

export const projectChartStyles = `
.pchart { width: 100%; height: auto; display: block; }
.pchart__label { fill: var(--text-mute); font-size: 10px; font-family: var(--font-sans); }
.pchart__track { fill: color-mix(in oklab, var(--text) 7%, transparent); }
.pchart__bar { fill: color-mix(in oklab, var(--text) 26%, transparent); transition: fill 300ms ease; }
.pchart__bar.is-hot { fill: var(--accent); opacity: 0.86; }
.pchart__line { fill: none; stroke: var(--accent); stroke-width: 1.4; }
.pchart__dot { fill: var(--accent); }
.pchart__axis { stroke: var(--line-strong); stroke-width: 1; }
.pchart__grid { stroke: var(--line); stroke-width: 1; stroke-dasharray: 2 4; }
.pchart__note { fill: var(--text-mute); font-size: 9px; font-family: var(--font-mono); letter-spacing: 0.04em; }
.pchart-placeholder {
  aspect-ratio: 420 / 240; display: grid; place-items: center; gap: 6px;
  border: 1px dashed var(--line-strong); border-radius: var(--r-sm);
  color: var(--text-mute); font-size: var(--fs-micro);
}
`;
