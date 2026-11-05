/**
 * ============================================================================
 *  Navbar —— 顶部导航（随滚动收缩，移动端抽屉）
 * ============================================================================
 */
import React, { useEffect, useState } from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { isStandalone } from '../../lib/storage.js';
import { NAV_ITEMS } from '../../content/module.registry.js';
import { useScrollProgress } from '../../hooks/index.js';
import './Navbar.css';

export default function Navbar({ onOpenPanel }) {
  const { data, editing, setEditing } = useResume();
  const y = useScrollProgress();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  const condensed = y > 24;

  // 高亮当前区块（用 scroll 位置推断，避免 IntersectionObserver 频繁切换）
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const probe = window.innerHeight * 0.35;
        let current = '';
        for (const item of NAV_ITEMS) {
          const el = document.getElementById(item.anchor);
          if (el && el.getBoundingClientRect().top <= probe) current = item.anchor;
        }
        setActive(current);
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    on();
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  // 抽屉开启时锁滚动
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (anchor) => {
    setOpen(false);
    const el = document.getElementById(anchor);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <>
      <header className={`nav ${condensed ? 'is-condensed' : ''}`}>
        <div className="nav__inner">
          <button className="nav__brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="nav__mark" aria-hidden="true" />
            <span className="nav__name">{data.person.nameEn || data.person.name}</span>
            <span className="nav__role">{data.person.role}</span>
          </button>

          <nav className="nav__links" aria-label="页面导航">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.anchor}
                className={`nav__link ${active === item.anchor ? 'is-active' : ''}`}
                onClick={() => go(item.anchor)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="nav__actions">
            {/* 导出成品里不显示编辑器与设置入口：成品是只读交付物 */}
            {!isStandalone() && (
              <button
                className={`nav__edit ${editing ? 'is-on' : ''}`}
                onClick={() => setEditing(!editing)}
                aria-pressed={editing}
              >
                <span className="nav__edit-dot" aria-hidden="true" />
                {editing ? '退出编辑' : '编辑'}
              </button>
            )}
            {!isStandalone() && (
              <button className="nav__panel-btn" onClick={onOpenPanel} aria-label="打开设置面板">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
                </svg>
              </button>
            )}
            <button
              className="nav__burger"
              onClick={() => setOpen(!open)}
              aria-label={open ? '关闭菜单' : '打开菜单'}
              aria-expanded={open}
            >
              <span className={`nav__burger-icon ${open ? 'is-open' : ''}`} aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className={`nav-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <nav className="nav-drawer__list">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.anchor}
              className="nav-drawer__item"
              style={{ transitionDelay: `${open ? 60 + i * 40 : 0}ms` }}
              onClick={() => go(item.anchor)}
            >
              <span className="nav-drawer__idx num">{String(i + 1).padStart(2, '0')}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

export const navbarStyles = '';
