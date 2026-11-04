/**
 * ============================================================================
 *  ExperienceSection —— 工作与教育经历（时间线）
 * ============================================================================
 *  时间线用 CSS 伪元素绘制，不用 SVG，减少 DOM 与重绘成本。
 *  每条经历：期间 / 公司 / 岗位 / 地点 / 要点 / 标签
 * ============================================================================
 */
import React from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { useRevealGroup } from '../../hooks/index.js';
import SectionHead from '../layout/SectionHead.jsx';
import './ExperienceSection.css';

export default function ExperienceSection() {
  const { data, config } = useResume();
  const { experience } = data;
  const items = (experience.items || []).slice(0, config.limits.experience);
  const ref = useRevealGroup([items]);

  return (
    <section className="section experience" id="experience" ref={ref} data-screen-label="03 工作经历">
      <div className="container">
        <SectionHead
          eyebrow={experience.eyebrow}
          title={experience.title}
          kicker={experience.kicker}
        />

        <ol className="timeline">
          {items.map((it, i) => (
            <li
              className={`timeline__item reveal ${it.type === 'edu' ? 'is-edu' : ''}`}
              key={`${it.company}-${i}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* 左侧：期间 */}
              <div className="timeline__side">
                <span className="timeline__period num">{it.period}</span>
                <span className="timeline__kind mono">{it.type === 'edu' ? 'EDU' : 'WORK'}</span>
              </div>

              {/* 中轴节点 */}
              <div className="timeline__axis" aria-hidden="true">
                <span className="timeline__node" />
              </div>

              {/* 右侧：正文 */}
              <div className="timeline__body">
                <div className="timeline__head">
                  <h3 className="timeline__company">{it.company}</h3>
                  <span className="timeline__role">{it.role}</span>
                  {it.location ? <span className="timeline__loc num">{it.location}</span> : null}
                </div>

                <ul className="timeline__points">
                  {(it.points || []).map((p, j) => (
                    <li key={j}>
                      <span className="timeline__bullet" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                {it.tags?.length ? (
                  <div className="timeline__tags">
                    {it.tags.map((t) => (
                      <span className="chip" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        {items.length === 0 && (
          <div className="empty">尚未添加经历。进入编辑模式即可补充工作或教育经历。</div>
        )}
      </div>
    </section>
  );
}
