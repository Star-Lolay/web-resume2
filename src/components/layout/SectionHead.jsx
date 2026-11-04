/**
 * ============================================================================
 *  SectionHead —— 模块统一标题（保证六个模块的标题系统一致）
 * ============================================================================
 *  这是"改一处、全站生效"的关键点之一：
 *  统一 eyebrow（英文小标）→ 中文大标 → kicker（一句说明）的三层结构。
 */
import React from 'react';
import './SectionHead.css';

export default function SectionHead({ eyebrow, title, kicker, align = 'left', meta }) {
  return (
    <header className={`section-head section-head--${align} reveal`}>
      <div className="section-head__top">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        {meta ? <span className="section-head__meta num">{meta}</span> : null}
      </div>
      <h2 className="section-head__title display">{title}</h2>
      {kicker ? <p className="section-head__kicker">{kicker}</p> : null}
    </header>
  );
}
