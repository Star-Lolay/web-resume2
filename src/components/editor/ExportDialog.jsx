/**
 * ============================================================================
 *  ExportDialog —— 导出「单文件网页」
 * ============================================================================
 *  导出的是完整站点（React + 动效 + 内容 + 配色）压成一个 .html。
 *  双击打开即可；不带编辑器入口，发给别人不会看到后台。
 * ============================================================================
 */
import React, { useState } from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { buildStandaloneHtml, downloadBlob } from '../../lib/exportSite.js';
import Icon from '../ui/Icon.jsx';

export default function ExportDialog({ open, onClose }) {
  const { data, effects, theme, intensity, order, hidden, showToast } = useResume();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!open) return null;

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const { blob, filename } = await buildStandaloneHtml({
        data,
        effects,
        theme,
        intensity,
        order,
        hidden,
        title: data?.meta?.title,
        onProgress: (p) => setProgress(p),
      });
      setProgress({ phase: '正在下载…' });
      downloadBlob(blob, filename);
      setResult({ filename, size: (blob.size / 1024 / 1024).toFixed(1) });
      showToast?.('已导出单文件网页');
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <>
      <div className="sheet-mask is-open" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <div className="exportdlg" role="dialog" aria-label="导出单文件网页">
        <header className="exportdlg__head">
          <h3>导出为单文件网页</h3>
          <button onClick={onClose} disabled={busy} aria-label="关闭">
            <Icon name="close" size={15} />
          </button>
        </header>

        <div className="exportdlg__body">
          <p className="exportdlg__lead">
            把当前站点的<strong>全部内容</strong>、<strong>配色</strong>、
            <strong>动效参数</strong>打包成一个 HTML 文件。
          </p>

          <ul className="exportdlg__facts">
            <li>
              <span className="exportdlg__k">包含内容</span>
              <span className="exportdlg__v">
                {data?.person?.name || '未命名'}
                {data?.person?.role ? ` · ${data.person.role}` : ''}
              </span>
            </li>
            <li>
              <span className="exportdlg__k">模块数量</span>
              <span className="exportdlg__v num">
                {(order || []).filter((k) => !(hidden || []).includes(k)).length +
                  (data?.custom || []).filter((c) => c.enabled !== false).length}{' '}
                个
              </span>
            </li>
            <li>
              <span className="exportdlg__k">配色主题</span>
              <span className="exportdlg__v">{theme}</span>
            </li>
            <li>
              <span className="exportdlg__k">动效强度</span>
              <span className="exportdlg__v num">{Math.round(intensity * 100)}%</span>
            </li>
          </ul>

          <p className="exportdlg__note">
            成品双击即可打开，不需要服务器。图片已全部内联，断网也能正常显示；
            字体走 Google Fonts，断网时会回落到系统字体。
          </p>

          {progress && <div className="exportdlg__progress">{progress.phase} {progress.detail || ''}</div>}
          {error && <div className="exportdlg__error" role="alert">{error}</div>}
          {result && (
            <div className="exportdlg__ok" role="status">
              已生成 <code>{result.filename}</code>（{result.size} MB），请到下载目录查看。
            </div>
          )}
        </div>

        <footer className="exportdlg__foot">
          <button className="btn btn--ghost btn--sm" onClick={onClose} disabled={busy}>
            关闭
          </button>
          <button className="btn btn--primary btn--sm" onClick={run} disabled={busy}>
            {busy ? '正在生成…' : result ? '再导一次' : '生成并下载'}
          </button>
        </footer>
      </div>
    </>
  );
}
