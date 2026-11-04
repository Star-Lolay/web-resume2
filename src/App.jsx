/**
 * ============================================================================
 *  App.jsx —— 站点装配入口
 * ============================================================================
 *  职责只有三件：
 *   1. 按 moduleSequence 顺序渲染模块
 *   2. 挂载编辑器（编辑模式时）
 *   3. 挂载设置面板 / Toast
 *
 *  ★ 想调整模块顺序或增删模块？不要改这里，改 module.registry.js
 *    或在页面上用编辑器操作。
 * ============================================================================
 */
import React, { useState } from 'react';
import { ResumeProvider, useResume } from './lib/resumeStore.jsx';
import Navbar from './components/layout/Navbar.jsx';
import HeroSection from './components/sections/HeroSection.jsx';
import ProfileSection from './components/sections/ProfileSection.jsx';
import ExperienceSection from './components/sections/ExperienceSection.jsx';
import ProjectsSection from './components/sections/ProjectsSection.jsx';
import CapabilitiesSection from './components/sections/CapabilitiesSection.jsx';
import ContactSection from './components/sections/ContactSection.jsx';
import CustomSection from './components/sections/CustomSection.jsx';
import EditorPanel from './components/editor/EditorPanel.jsx';
import SettingsPanel from './components/editor/SettingsPanel.jsx';
import Toast from './components/ui/Toast.jsx';

/** key → 组件映射（新增内置模块时在此登记） */
const SECTION_MAP = {
  hero: HeroSection,
  profile: ProfileSection,
  experience: ExperienceSection,
  projects: ProjectsSection,
  capabilities: CapabilitiesSection,
  contact: ContactSection,
};

function Site() {
  const { moduleSequence, editing, toast, persistError } = useResume();
  const [panelOpen, setPanelOpen] = useState(false);

  /* 截图 / 深链定位：?scroll=1200 或 ?scroll=projects
     仅用于验收与分享定位，不影响正常浏览。 */
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('scroll');
    if (!q) return;
    const id = requestAnimationFrame(() => {
      if (/^\d+$/.test(q)) {
        window.scrollTo({ top: Number(q), behavior: 'auto' });
      } else {
        const el = document.getElementById(q);
        if (el) window.scrollTo({ top: el.offsetTop - 56, behavior: 'auto' });
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <div className="page-bg" aria-hidden="true">
        <div className="page-bg__veil" />
        <div className="page-bg__grain" />
      </div>

      <Navbar onOpenPanel={() => setPanelOpen(true)} />

      <main>
        {moduleSequence.map((key) => {
          const Builtin = SECTION_MAP[key];
          if (Builtin) return <Builtin key={key} />;
          return <CustomModuleSlot key={key} id={key} />;
        })}
      </main>

      {editing && <EditorPanel />}
      <SettingsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />

      {toast && <Toast {...toast} />}
      {persistError && (
        <div className="persist-alert" role="alert">
          {persistError}
        </div>
      )}
    </>
  );
}

/** 自定义模块槽位：从 data.custom 中按 id 取 */
function CustomModuleSlot({ id }) {
  const { data } = useResume();
  const mod = (data.custom || []).find((c) => c.id === id);
  if (!mod) return null;
  return <CustomSection module={mod} />;
}

export default function App() {
  return (
    <ResumeProvider>
      <Site />
    </ResumeProvider>
  );
}
