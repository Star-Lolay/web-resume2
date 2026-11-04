/**
 * ============================================================================
 *  CapabilitiesSection —— 个人优势（能力卡 + 熟练度条）
 * ============================================================================
 *  用熟练度条（0–5）替代"精通 / 熟练"这类无法验证的措辞，
 *  条的长度本身就是信息，且能诚实表达"进阶中"的状态。
 * ============================================================================
 */
import React from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { useRevealGroup } from '../../hooks/index.js';
import SpotlightCard from '../reactbits/SpotlightCard.jsx';
import SectionHead from '../layout/SectionHead.jsx';
import Icon from '../ui/Icon.jsx';
import './CapabilitiesSection.css';

export default function CapabilitiesSection() {
  const { data, config } = useResume();
  const { capabilities } = data;
  const items = (capabilities.items || []).slice(0, config.limits.capabilities);
  const ref = useRevealGroup([items]);

  return (
    <section
      className="section capabilities"
      id="capabilities"
      ref={ref}
      data-screen-label="05 个人优势"
    >
      <div className="container">
        <SectionHead
          eyebrow={capabilities.eyebrow}
          title={capabilities.title}
          kicker={capabilities.kicker}
        />

        <div className="caps__grid">
          {items.map((c, i) => {
            const pct = Math.min(100, (Number(c.level) / 5) * 100);
            return (
              <SpotlightCard
                key={`${c.title}-${i}`}
                className="cap reveal"
                spotlightColor="rgba(184,196,168,0.14)"
                intensity={0.09}
                spotlightSize={300}
                borderGlow={0.4}
                theme="dark"
                style={{ transitionDelay: `${i * 65}ms` }}
              >
                <span className="cap__icon">
                  <Icon name={c.icon} size={17} />
                </span>

                <h3 className="cap__title">{c.title}</h3>
                <p className="cap__body">{c.body}</p>

                <div className="cap__meter">
                  <span className="cap__meter-track" aria-hidden="true">
                    <span className="cap__meter-fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="cap__meter-label num">
                    {c.level}
                    <i>/5</i>
                  </span>
                </div>
                {c.levelLabel ? <span className="cap__level num">{c.levelLabel}</span> : null}
              </SpotlightCard>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="empty">尚未添加能力项。进入编辑模式即可补充。</div>
        )}
      </div>
    </section>
  );
}
