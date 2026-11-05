/**
 * ============================================================================
 *  SettingsPanel —— 外观设置（主题 / 动效强度 / 动效配色 / 导出）
 * ============================================================================
 *  与"内容编辑"分开：这里调的是站点的表现层，不影响文案。
 * ============================================================================
 */
import React, { useState } from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { EFFECT_COLOR_FIELDS, EFFECT_TOGGLES, getByPath } from '../../lib/effectsStore.js';
import ExportDialog from './ExportDialog.jsx';
import Icon from '../ui/Icon.jsx';

export default function SettingsPanel({ open, onClose }) {
  const {
    theme,
    setTheme,
    intensity,
    setIntensity,
    themes,
    config,
    effects,
    setEffect,
    resetEffects,
  } = useResume();
  const [exportOpen, setExportOpen] = useState(false);

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
            <h4>动效配色</h4>
            <p className="sheet__hint">
              版式与动效参数保持不变，只换颜色。改动实时生效并自动保存。
            </p>

            {EFFECT_COLOR_FIELDS.map((f) => {
              const value = getByPath(effects, f.path);
              return (
                <div className="fxrow" key={f.path}>
                  <div className="fxrow__meta">
                    <span className="fxrow__label">{f.label}</span>
                    <span className="fxrow__hint">{f.hint}</span>
                  </div>

                  {f.type === 'color' ? (
                    <label className="fxrow__color" title="点击选色">
                      <input
                        type="color"
                        value={value || f.default}
                        onChange={(e) => setEffect(f.path, e.target.value)}
                      />
                      <span className="fxrow__hex num">{value || f.default}</span>
                    </label>
                  ) : (
                    /* colorList：渐变色数组，逐项一个取色器 */
                    <div className="fxrow__list">
                      {(value || f.default).map((c, i) => (
                        <label className="fxrow__dot" key={`${f.path}-${i}`} title={`第 ${i + 1} 个渐变色`}>
                          <input
                            type="color"
                            value={c}
                            onChange={(e) => {
                              const next = [...(value || f.default)];
                              next[i] = e.target.value;
                              setEffect(f.path, next);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <button className="btn btn--ghost btn--sm btn--full fxreset" onClick={resetEffects}>
              恢复动效默认配色
            </button>
          </section>

          <section className="sheet__group">
            <h4>动效开关</h4>
            <p className="sheet__hint">关掉某一段动效，页面会自动退回到静态渐变背景。</p>
            <div className="fxtoggles">
              {EFFECT_TOGGLES.map((t) => {
                const on = getByPath(effects, t.path);
                return (
                  <label className="fxtoggle" key={t.path}>
                    <input
                      type="checkbox"
                      checked={!!on}
                      onChange={(e) => setEffect(t.path, e.target.checked)}
                    />
                    <span className="fxtoggle__track" aria-hidden="true">
                      <span className="fxtoggle__knob" />
                    </span>
                    <span className="fxtoggle__text">
                      <span className="fxtoggle__label">{t.label}</span>
                      <span className="fxtoggle__hint">{t.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="sheet__group">
            <h4>导出</h4>
            <p className="sheet__hint">
              把「当前内容 + 当前配色 + 当前动效」打包成一个独立的 HTML 文件。
              双击即可打开，不需要服务器，也可以直接发给别人或自己留档。
            </p>
            <button className="btn btn--primary btn--sm btn--full" onClick={() => setExportOpen(true)}>
              导出为单文件网页
            </button>
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

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}
