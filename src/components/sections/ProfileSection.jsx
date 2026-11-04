/**
 * ============================================================================
 *  ProfileSection —— 个人档案
 * ============================================================================
 *  左侧：4:3 证件照 + 姓名 + 岗位
 *  右侧：简介 + 必须展示的信息字段
 *  下方：4 个量化指标
 * ============================================================================
 */
import React from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { useRevealGroup, useRichMotion } from '../../hooks/index.js';
import SpotlightCard from '../reactbits/SpotlightCard.jsx';
import CountUpLite from '../effects/CountUpLite.jsx';
import SectionHead from '../layout/SectionHead.jsx';
import Icon from '../ui/Icon.jsx';
import { resolveAsset } from '../../lib/asset.js';
import './ProfileSection.css';

export default function ProfileSection() {
  const { data, config, intensity } = useResume();
  const { profile, person, metrics } = data;
  const ref = useRevealGroup([profile, person, metrics]);
  const richMotion = useRichMotion(intensity);

  const fields = (profile.fields || []).slice(0, config.limits.profileFields);
  const metricList = (metrics || []).slice(0, config.limits.metrics);

  return (
    <section className="section profile" id="profile" ref={ref} data-screen-label="02 个人档案">
      <div className="container">
        <SectionHead
          eyebrow="Profile"
          title="个人档案"
          kicker="先看结论：统计学背景、业务出身、在品牌方负责会员与商品两条线。"
        />

        <div className="profile__grid">
          {/* -------------------------------------------------- 证件照 */}
          <figure className="profile__portrait reveal">
            <div className="profile__portrait-frame">
              <img
                src={resolveAsset(person.avatar)}
                alt={person.avatarAlt || `${person.name}的证件照`}
                width="960"
                height="720"
                loading="lazy"
                decoding="async"
              />
              <div className="profile__portrait-veil" aria-hidden="true" />
            </div>
            <figcaption className="profile__portrait-cap">
              <span className="profile__name">{person.name}</span>
              <span className="profile__role mono">
                {person.role} · {person.roleNote}
              </span>
            </figcaption>
          </figure>

          {/* -------------------------------------------------- 简介 + 信息 */}
          <div className="profile__body reveal" style={{ transitionDelay: '90ms' }}>
            <p className="profile__intro">{profile.intro}</p>
            {profile.introSecondary ? (
              <p className="profile__intro2">{profile.introSecondary}</p>
            ) : null}

            <ul className="profile__fields">
              {fields.map((f, i) => (
                <li className="profile__field" key={`${f.label}-${i}`}>
                  <span className="profile__field-icon" aria-hidden="true">
                    <Icon name={f.icon} size={14} />
                  </span>
                  <span className="profile__field-label">{f.label}</span>
                  {f.href ? (
                    <a className="profile__field-value is-link" href={f.href}>
                      {f.value}
                    </a>
                  ) : (
                    <span className="profile__field-value">{f.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* -------------------------------------------------- 量化指标 */}
        {metricList.length > 0 && (
          <div className="profile__metrics">
            {metricList.map((m, i) => (
              <SpotlightCard
                key={`${m.label}-${i}`}
                className="metric-card reveal"
                spotlightColor="rgba(184,196,168,0.16)"
                intensity={0.1}
                spotlightSize={260}
                borderGlow={0.4}
                theme="dark"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="metric-card__value num">
                  <CountUpLite to={Number(m.value)} suffix={m.suffix} duration={1400} />
                </div>
                <div className="metric-card__label">{m.label}</div>
                {m.note ? <div className="metric-card__note mono">{m.note}</div> : null}
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
