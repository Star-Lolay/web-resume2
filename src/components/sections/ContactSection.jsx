/**
 * ============================================================================
 *  ContactSection —— 联系方式（锁定末位，整屏收尾）
 * ============================================================================
 *  收尾不堆信息，只留"怎么联系我"。大字号标题 + 邮箱为主行动。
 * ============================================================================
 */
import React from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { useRevealGroup } from '../../hooks/index.js';
import Icon from '../ui/Icon.jsx';
import './ContactSection.css';

export default function ContactSection() {
  const { data, config } = useResume();
  const { contact, person } = data;
  const links = (contact.links || []).slice(0, config.limits.contactLinks);
  const ref = useRevealGroup([contact, person]);
  const year = new Date().getFullYear();
  const titleLines = String(contact.title || '').split('\n').filter(Boolean);

  return (
    <section className="section contact" id="contact" ref={ref} data-screen-label="06 联系方式">
      <div className="container">
        <div className="contact__head">
          <span className="eyebrow">{contact.eyebrow}</span>
          <span className="contact__head-meta num">{person.status}</span>
        </div>

        <h2 className="contact__title display reveal">
          {titleLines.map((line, i) => (
            <span key={i} className={i === titleLines.length - 1 ? 'is-dim' : ''}>
              {line}
            </span>
          ))}
        </h2>

        {contact.body ? <p className="contact__body reveal">{contact.body}</p> : null}

        <div className="contact__actions reveal">
          <a className="contact__mail" href={`mailto:${contact.email}`}>
            <span className="contact__mail-icon">
              <Icon name="mail" size={16} />
            </span>
            <span className="contact__mail-text">{contact.email}</span>
            <span className="contact__mail-arrow">
              <Icon name="external" size={14} />
            </span>
          </a>

          {contact.phone ? (
            <a
              className="contact__phone num"
              href={`tel:${String(contact.phone).replace(/[^\d+]/g, '')}`}
            >
              {contact.phone}
            </a>
          ) : null}
        </div>

        {links.length > 0 && (
          <ul className="contact__links reveal">
            {links.map((l) => (
              <li key={`${l.label}-${l.href}`}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  <span className="contact__link-label">{l.label}</span>
                  <span className="contact__link-value">{l.value}</span>
                  <Icon name="external" size={12} />
                </a>
              </li>
            ))}
          </ul>
        )}

        {contact.footnote ? <p className="contact__note num">{contact.footnote}</p> : null}

        <footer className="contact__footer">
          <span className="num">
            © {year} {person.name}
          </span>
          <span className="contact__footer-mid num">
            {person.nameEn} · {person.role}
          </span>
          <button
            className="contact__totop"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            回到顶部
            <Icon name="arrowUp" size={12} />
          </button>
        </footer>
      </div>
    </section>
  );
}
