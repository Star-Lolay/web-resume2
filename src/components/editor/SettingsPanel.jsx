/**
 * ============================================================================
 *  SettingsPanel —— 外观设置（主题 / 动效强度）
 * ============================================================================
 *  与"内容编辑"分开：这里调的是站点的表现层，不影响文案。
 * ============================================================================
 */
import React from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import Icon from '../ui/Icon.jsx';

export default function SettingsPanel({ open, onClose }) {
  const { theme, setTheme, intensity, setIntensity, themes, config } = useResume();

  return (
    <>
      <div className={`sheet-mask ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sheet ${open ? 'is-open' : ''}`} aria-hidden={!open} aria-label="外观设置">
        <header className="sheet__head">
          <h3>外观</h3>
          <button onClick={onClose} aria-label="关闭">
            <Icon name="close" size={15} />
          </button>
        </header>

        <div className="sheet__body">
          <section className="sheet__group">
            <h4>配色</h4>
            <p className="sheet__hint">明暗与强调色。简历站建议保持中性，让内容成为主角。</p>
            <div className="swatches">
              {Object.entries(themes).map(([key, t]) => (
                <button
                  key={key}
                  className={`swatch ${theme === key ? 'is-on' : ''}`}
                  onClick={() => setTheme(key)}
                  title={t.label}
                >
                  <span className="swatch__chip" style={{ background: t.bg, borderColor: t.elev }}>
                    <i style={{ background: t.accent }} />
                    <i style={{ background: t.accent2 }} />
                  </span>
                  <span className="swatch__label">{t.label}</span>
                  {theme === key && (
                    <span className="swatch__check">
                      <Icon name="check" size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="sheet__group">
            <h4>动效强度</h4>
            <p className="sheet__hint">
              降低强度会关闭 3D 倾斜与光标跟随，只保留入场淡入。用于低配设备或投屏场合。
            </p>
            <div className="range">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(intensity * 100)}
                onChange={(e) => setIntensity(Number(e.target.value) / 100)}
              />
              <span className="range__val num">{Math.round(intensity * 100)}%</span>
            </div>
            <div className="range__marks num">
              <span>全静态</span>
              <span>克制</span>
              <span>完整</span>
            </div>
          </section>

          <section className="sheet__group">
            <h4>性能说明</h4>
            <ul className="sheet__list">
              <li>首屏背景为 WebGL 着色器，页面切换至后台时自动暂停。</li>
              <li>移动端自动关闭倾斜、聚光与视差，避免掉帧与耗电。</li>
              <li>系统开启「减弱动态效果」时，所有动画降级为静态。</li>
            </ul>
          </section>

          {config.features.editor && (
            <section className="sheet__group">
              <h4>分享</h4>
              <button
                className="btn btn--ghost btn--sm btn--full"
                onClick={() => {
                  const el = document.querySelector('.editor');
                  if (!el) {
                    document.querySelector('.nav__edit')?.click();
                  }
                }}
              >
                打开编辑面板
              </button>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
