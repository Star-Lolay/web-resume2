/**
 * ============================================================================
 *  Fields —— 编辑器通用表单控件
 * ============================================================================
 *  所有控件受控，改动即时回写 store（防抖由 store 统一处理）。
 *  ★ 想新增一种字段类型？在这里加一个分支即可。
 * ============================================================================
 */
import React, { useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { cropToRatio, formatBytes } from '../../lib/image.js';
import { resolveAsset } from '../../lib/asset.js';

export function TextField({ label, value, onChange, placeholder, multiline = false, maxLength }) {
  const Comp = multiline ? 'textarea' : 'input';
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <Comp
        className={`field__input ${multiline ? 'is-area' : ''}`}
        value={value ?? ''}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={multiline ? 3 : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {maxLength ? (
        <span className="field__count num">
          {String(value ?? '').length}/{maxLength}
        </span>
      ) : null}
    </label>
  );
}

export function NumberField({ label, value, onChange, min = 0, max = 99, step = 0.1, suffix }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__num-row">
        <input
          className="field__input"
          type="number"
          value={value ?? 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = e.target.value === '' ? 0 : Number(e.target.value);
            onChange(Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : 0);
          }}
        />
        {suffix ? <span className="field__suffix num">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select className="field__input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * ImageField —— 上传即裁剪（固定宽高比）+ 压缩
 * 展示裁剪后的实际尺寸与体积，让使用者心里有数。
 */
export function ImageField({ label, value, onChange, ratio = 4 / 3, maxBytes, maxUploadBytes }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(null);

  const handle = async (file) => {
    setError('');
    if (!file) return;
    if (maxUploadBytes && file.size > maxUploadBytes) {
      setError(`原图超过 ${formatBytes(maxUploadBytes)}，请先压缩后再上传`);
      return;
    }
    setBusy(true);
    try {
      const res = await cropToRatio(file, {
        aspect: ratio,
        targetWidth: 960,
        maxBytes: maxBytes || 400 * 1024,
        format: 'jpeg',
        quality: 0.92,
      });
      onChange(res.dataUrl);
      setInfo({
        w: res.width,
        h: res.height,
        bytes: res.bytes,
        cropped: res.wasCropped,
      });
    } catch (e) {
      setError(e.message || '处理失败');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="field">
      <span className="field__label">{label}</span>

      <div className="imgfield">
        <div className="imgfield__preview" style={{ aspectRatio: String(ratio) }}>
          {value ? (
            <img src={resolveAsset(value)} alt="预览" />
          ) : (
            <span className="imgfield__empty num">
              [image]
              <i>
                {ratio === 4 / 3 ? '4:3' : `${ratio.toFixed(2)}:1`}
              </i>
            </span>
          )}
          {busy && (
            <span className="imgfield__busy">
              <span className="spinner" />
              处理中
            </span>
          )}
        </div>

        <div className="imgfield__side">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => inputRef.current?.click()}>
            {value ? '重新上传' : '上传图片'}
          </button>
          {value ? (
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => { onChange(''); setInfo(null); }}>
              移除
            </button>
          ) : null}
          <p className="imgfield__hint">
            固定 {ratio === 4 / 3 ? '4:3' : '指定'} 比例，居中自动裁剪；
            压缩后约 ≤{formatBytes(maxBytes || 400 * 1024)}。
          </p>
          {info ? (
            <p className="imgfield__info num">
              {info.w}×{info.h} · {formatBytes(info.bytes)}
              {info.cropped ? ' · 已裁剪' : ''}
            </p>
          ) : null}
          {error ? <p className="imgfield__error">{error}</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}

/** 一个字段组的小标题 */
export function FieldGroup({ title, hint, children, action }) {
  return (
    <section className="fgroup">
      <header className="fgroup__head">
        <h4>{title}</h4>
        {action}
      </header>
      {hint ? <p className="fgroup__hint">{hint}</p> : null}
      <div className="fgroup__body">{children}</div>
    </section>
  );
}

/** 列表项操作条：上移 / 下移 / 删除 */
export function ItemActions({ onUp, onDown, onRemove, canUp = true, canDown = true, disableRemove }) {
  return (
    <div className="item-actions">
      <button type="button" onClick={onUp} disabled={!canUp} title="上移" aria-label="上移">
        <Icon name="arrowUp" size={12} />
      </button>
      <button type="button" onClick={onDown} disabled={!canDown} title="下移" aria-label="下移">
        <Icon name="arrowDown" size={12} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={disableRemove}
        className="is-danger"
        title="删除"
        aria-label="删除"
      >
        <Icon name="trash" size={12} />
      </button>
    </div>
  );
}
