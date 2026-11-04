/**
 * ============================================================================
 *  Toast —— 轻提示（保存成功 / 配额不足 / 复制成功）
 * ============================================================================
 */
import React from 'react';

export default function Toast({ msg, kind = 'ok' }) {
  return (
    <div className={`toast toast--${kind}`} role="status" aria-live="polite">
      <span className="toast__dot" aria-hidden="true" />
      <span>{msg}</span>
    </div>
  );
}
