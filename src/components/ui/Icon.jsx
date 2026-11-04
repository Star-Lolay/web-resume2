/**
 * ============================================================================
 *  Icon —— 内联 SVG 图标（不用图标库 CDN，避免额外请求与体积）
 * ============================================================================
 *  只用线性图标，1.5px 描边，与整体克制风格一致。
 *  未匹配的名字返回一个方框占位，明确提示"这里需要一个图标"，而不是乱画。
 */
import React from 'react';

const PATHS = {
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  cap: (
    <>
      <path d="M3 9.2 12 5l9 4.2-9 4.2z" />
      <path d="M7 11v4.4c0 1.2 2.2 2.6 5 2.6s5-1.4 5-2.6V11" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.6 7 8.4 6 8.4-6" />
    </>
  ),
  phone: (
    <path d="M7.2 3.8h2.4l1.5 4-2 1.4a11 11 0 0 0 5.7 5.7l1.4-2 4 1.5v2.4c0 1.2-1 2.2-2.2 2.2C11.8 19 5 12.2 5 6c0-1.2 1-2.2 2.2-2.2z" />
  ),
  bolt: <path d="M13 3 6.5 13H11l-1 8 6.5-10H12z" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4z" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V9M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16z" />
      <path d="m14.5 5.5 4 4" />
    </>
  ),
  text: (
    <>
      <path d="M5 6h14M5 12h14M5 18h9" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 4.5-4.2 3.2 2.8L16 12.5l3.3 4.5" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.8 6.5" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0L5 13.3a4 4 0 1 0 5.7 5.7l1.4-1.4" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" />
    </>
  ),
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M18 13l-6 6-6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9L17.5 7" />
    </>
  ),
  drag: (
    <>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </>
  ),
};

export default function Icon({ name, size = 16, className = '', strokeWidth = 1.5 }) {
  const path = PATHS[name];
  if (!path) {
    // 占位：明确表示"缺图标"，而不是画一个假的
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className={className}
        aria-hidden="true"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
