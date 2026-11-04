/**
 * ============================================================================
 *  ProjectsSection —— 精选项目（大卡 + 可展开详情）
 * ============================================================================
 *  交互：点击卡片展开"背景 / 做法 / 结果"三段，避免一次性堆满文字。
 *  动效：SpotlightCard 聚光 + 展开用 height 过渡（max-height 会跳，这里用 grid-rows trick）。
 * ============================================================================
 */
import React, { useState } from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { useRevealGroup } from '../../hooks/index.js';
import SpotlightCard from '../reactbits/SpotlightCard.jsx';
import SectionHead from '../layout/SectionHead.jsx';
import ProjectChart from './ProjectChart.jsx';
import Icon from '../ui/Icon.jsx';
import './ProjectsSection.css';

export default function ProjectsSection() {
  const { data, config } = useResume();
  const { projects } = data;
  const items = (projects.items || []).slice(0, config.limits.projects);
  const ref = useRevealGroup([items]);
  const [openId, setOpenId] = useState(null);

  return (
    <section className="section projects" id="projects" ref={ref} data-screen-label="04 精选项目">
      <div className="container">
        <SectionHead
          eyebrow={projects.eyebrow}
          title={projects.title}
          kicker={projects.kicker}
          meta={`${String(items.length).padStart(2, '0')} 个专题`}
        />

        <div className="projects__list">
          {items.map((p, i) => {
            const isOpen = openId === p.id;
            return (
              <SpotlightCard
                key={p.id || i}
                className={`project reveal ${isOpen ? 'is-open' : ''}`}
                spotlightColor="rgba(184,196,168,0.12)"
                intensity={0.08}
                spotlightSize={420}
                borderGlow={0.35}
                theme="dark"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="project__grid">
                  {/* ---------------------------------------- 左：图表 */}
                  <div className="project__visual">
                    <div className="project__chart">
                      <ProjectChart kind={p.chart} />
                    </div>
                    <span className="project__index num">{p.index || String(i + 1).padStart(2, '0')}</span>
                  </div>

                  {/* ---------------------------------------- 右：信息 */}
                  <div className="project__content">
                    <div className="project__top">
                      <span className="project__year num">{p.year}</span>
                      <span className="project__subtitle mono">{p.subtitle}</span>
                    </div>

                    <h3 className="project__title display">{p.title}</h3>
                    <p className="project__summary">{p.summary}</p>

                    <div className="project__tools">
                      {(p.tools || []).map((t) => (
                        <span className="chip" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* 展开区 */}
                    <div className={`project__detail ${isOpen ? 'is-open' : ''}`}>
                      <div className="project__detail-inner">
                        <dl>
                          <div>
                            <dt>背景</dt>
                            <dd>{p.detail?.background}</dd>
                          </div>
                          <div>
                            <dt>做法</dt>
                            <dd>{p.detail?.approach}</dd>
                          </div>
                          <div>
                            <dt>结果</dt>
                            <dd className="is-result">{p.detail?.result}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <button
                      className="project__toggle"
                      onClick={() => setOpenId(isOpen ? null : p.id)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? '收起详情' : '展开背景 / 做法 / 结果'}
                      <Icon name={isOpen ? 'arrowUp' : 'arrowDown'} size={13} />
                    </button>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="empty">尚未添加项目。进入编辑模式即可补充。</div>
        )}
      </div>
    </section>
  );
}
