/**
 * ============================================================================
 *  CustomSection —— 自定义模块渲染（三种类型）
 * ============================================================================
 *  类型：richText（自由文本）/ gallery（图文卡片）/ linkGrid（链接集合）
 *
 *  ★ 想改某类模块的外观？改对应 CSS 块即可，不影响内置模块。
 * ============================================================================
 */
import React from 'react';
import SectionHead from '../layout/SectionHead.jsx';
import Icon from '../ui/Icon.jsx';
import { resolveAsset } from '../../lib/asset.js';
import './CustomSection.css';

export default function CustomSection({ module }) {
  const { type, title, subtitle, items = [], id } = module;

  return (
    <section className="section custom-section" id={id} data-screen-label={`自定义 · ${title}`}>
      <div className="container">
        <SectionHead eyebrow={subtitle || 'Custom'} title={title} />

        {type === 'richText' && <RichText items={items} />}
        {type === 'gallery' && <Gallery items={items} />}
        {type === 'linkGrid' && <LinkGrid items={items} />}

        {items.length === 0 && (
          <div className="empty">这个模块还没有内容。进入编辑模式添加。</div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 自由文本 */
function RichText({ items }) {
  return (
    <dl className="custom-text">
      {items.map((it, i) => (
        <div className="custom-text__row" key={i}>
          <dt>{it.heading}</dt>
          <dd>
            {String(it.body || '')
              .split('\n')
              .filter(Boolean)
              .map((line, j) => (
                <span key={j} className="custom-text__line">
                  {line}
                </span>
              ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ 图文卡片 */
function Gallery({ items }) {
  return (
    <div className="custom-gallery">
      {items.map((it, i) => (
        <figure className="custom-gallery__item" key={i}>
          <div className="custom-gallery__media media">
            {it.image ? (
              <img src={resolveAsset(it.image)} alt={it.heading || `图片 ${i + 1}`} loading="lazy" decoding="async" />
            ) : (
              <span className="custom-gallery__ph num">
                [image]
                <i>4:3</i>
              </span>
            )}
          </div>
          {(it.heading || it.body) && (
            <figcaption>
              {it.heading ? <h4>{it.heading}</h4> : null}
              {it.body ? <p>{it.body}</p> : null}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ 链接集合 */
function LinkGrid({ items }) {
  return (
    <ul className="custom-links">
      {items.map((it, i) => (
        <li key={i}>
          <a href={it.href || '#'} target="_blank" rel="noopener noreferrer">
            <span className="custom-links__name">{it.heading}</span>
            {it.body ? <span className="custom-links__desc">{it.body}</span> : null}
            <Icon name="external" size={13} />
          </a>
        </li>
      ))}
    </ul>
  );
}
