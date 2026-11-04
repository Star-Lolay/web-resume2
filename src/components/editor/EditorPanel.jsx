/**
 * ============================================================================
 *  EditorPanel —— 右侧编辑抽屉
 * ============================================================================
 *  三个标签页：
 *    内容   —— 逐模块逐字段编辑（含上限与移除）
 *    模块   —— 增删模块、调顺序
 *    数据   —— 导出 / 导入 / 重置 / 空白模板
 *
 *  ★ 想增加可编辑字段？在对应 Fields 组件里加一行 <TextField>；
 *    想增加一种新模块类型？改 content/module.registry.js。
 * ============================================================================
 */
import React, { useRef, useState } from 'react';
import { useResume } from '../../lib/resumeStore.jsx';
import { BUILTIN_MODULES, CUSTOM_TYPES } from '../../content/module.registry.js';
import { TextField, NumberField, ImageField, FieldGroup, ItemActions } from './Fields.jsx';
import { exportJson, importJson } from '../../lib/storage.js';
import { DEFAULT_AVATAR } from '../../lib/asset.js';
import Icon from '../ui/Icon.jsx';

const TABS = [
  { key: 'content', label: '内容' },
  { key: 'modules', label: '模块' },
  { key: 'data', label: '数据' },
];

export default function EditorPanel() {
  const [tab, setTab] = useState('content');
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button className="editor-fab" onClick={() => setCollapsed(false)} aria-label="展开编辑器">
        <Icon name="pen" size={16} />
      </button>
    );
  }

  return (
    <aside className="editor" aria-label="编辑面板">
      <header className="editor__head">
        <div className="editor__title">
          <span className="editor__dot" />
          编辑模式
        </div>
        <button className="editor__collapse" onClick={() => setCollapsed(true)} title="收起面板">
          <Icon name="close" size={14} />
        </button>
      </header>

      <nav className="editor__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`editor__tab ${tab === t.key ? 'is-on' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="editor__body">
        {tab === 'content' && <ContentTab />}
        {tab === 'modules' && <ModulesTab />}
        {tab === 'data' && <DataTab />}
      </div>
    </aside>
  );
}

/* ==========================================================================
   内容标签
   ========================================================================== */
function ContentTab() {
  const { data } = useResume();
  const [open, setOpen] = useState('person');

  const groups = [
    { key: 'person', label: '基本信息', node: <PersonFields /> },
    { key: 'hero', label: '首屏文案', node: <HeroFields /> },
    { key: 'profile', label: '个人档案', node: <ProfileFields /> },
    { key: 'metrics', label: '量化指标', node: <MetricsFields /> },
    { key: 'experience', label: '工作经历', node: <ExperienceFields /> },
    { key: 'projects', label: '精选项目', node: <ProjectsFields /> },
    { key: 'capabilities', label: '个人优势', node: <CapabilitiesFields /> },
    { key: 'contact', label: '联系方式', node: <ContactFields /> },
    ...(data.custom || []).map((c) => ({
      key: c.id,
      label: `自定义 · ${c.title || c.type}`,
      node: <CustomFields mod={c} />,
    })),
  ];

  return (
    <div className="accordion">
      {groups.map((g) => {
        const isOpen = open === g.key;
        return (
          <div className={`accordion__item ${isOpen ? 'is-open' : ''}`} key={g.key}>
            <button className="accordion__head" onClick={() => setOpen(isOpen ? null : g.key)}>
              <span>{g.label}</span>
              <Icon name={isOpen ? 'arrowUp' : 'arrowDown'} size={12} />
            </button>
            {isOpen && <div className="accordion__body">{g.node}</div>}
          </div>
        );
      })}
      <p className="editor__tip">
        改动会自动保存到本浏览器。换设备或备份，请用「数据」标签导出 JSON。
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ 基本信息 */
function PersonFields() {
  const { data, updateAt, config } = useResume();
  const p = data.person;
  return (
    <>
      <ImageField
        label="证件照（固定 4:3）"
        value={p.avatar}
        onChange={(v) => updateAt('person.avatar', v)}
        ratio={config.image.avatarRatio}
        maxBytes={config.image.maxBytes}
        maxUploadBytes={config.image.maxUploadBytes}
      />
      <TextField label="姓名" value={p.name} onChange={(v) => updateAt('person.name', v)} />
      <TextField label="英文名 / 拼音" value={p.nameEn} onChange={(v) => updateAt('person.nameEn', v)} />
      <TextField label="岗位" value={p.role} onChange={(v) => updateAt('person.role', v)} />
      <TextField label="方向备注" value={p.roleNote} onChange={(v) => updateAt('person.roleNote', v)} />
      <TextField label="城市" value={p.city} onChange={(v) => updateAt('person.city', v)} />
      <TextField
        label="求职状态"
        value={p.status}
        placeholder="如：在职 · 考虑机会"
        onChange={(v) => updateAt('person.status', v)}
      />
      <TextField
        label="网站标题"
        value={data.meta.title}
        onChange={(v) => updateAt('meta.title', v)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ 首屏 */
function HeroFields() {
  const { data, updateAt, updateItem, addItem, removeItem, moveItem, config } = useResume();
  const h = data.hero;
  const actions = h.actions || [];

  return (
    <>
      <TextField
        label="标题第一行"
        value={h.titleLine1}
        maxLength={14}
        onChange={(v) => updateAt('hero.titleLine1', v)}
      />
      <TextField
        label="标题第二行"
        value={h.titleLine2}
        maxLength={20}
        onChange={(v) => updateAt('hero.titleLine2', v)}
      />
      <TextField
        label="定位一句话"
        value={h.tagline}
        multiline
        maxLength={60}
        onChange={(v) => updateAt('hero.tagline', v)}
      />
      <TextField label="副行说明" value={h.subline} onChange={(v) => updateAt('hero.subline', v)} />

      <FieldGroup
        title={`行动按钮（${actions.length}/${config.limits.heroActions}）`}
        hint="最多 3 个。href 可填锚点（#projects）或外部链接。"
        action={
          <button
            className="mini-btn"
            disabled={actions.length >= config.limits.heroActions}
            onClick={() =>
              addItem('hero.actions', { label: '新按钮', href: '#profile', variant: 'ghost' })
            }
          >
            <Icon name="plus" size={11} /> 添加
          </button>
        }
      >
        {actions.map((a, i) => (
          <div className="item-card" key={i}>
            <div className="item-card__head">
              <span className="item-card__idx num">{String(i + 1).padStart(2, '0')}</span>
              <ItemActions
                onUp={() => moveItem('hero.actions', i, -1)}
                onDown={() => moveItem('hero.actions', i, 1)}
                onRemove={() => removeItem('hero.actions', i)}
                canUp={i > 0}
                canDown={i < actions.length - 1}
                disableRemove={actions.length <= 1}
              />
            </div>
            <TextField
              label="文字"
              value={a.label}
              onChange={(v) => updateItem('hero.actions', i, { label: v })}
            />
            <TextField
              label="链接"
              value={a.href}
              onChange={(v) => updateItem('hero.actions', i, { href: v })}
            />
            <label className="field">
              <span className="field__label">样式</span>
              <select
                className="field__input"
                value={a.variant || 'ghost'}
                onChange={(e) => updateItem('hero.actions', i, { variant: e.target.value })}
              >
                <option value="primary">主按钮（实心）</option>
                <option value="ghost">次按钮（描边）</option>
              </select>
            </label>
          </div>
        ))}
      </FieldGroup>
    </>
  );
}

/* ------------------------------------------------------------------ 个人档案 */
function ProfileFields() {
  const { data, updateAt, updateItem, addItem, removeItem, moveItem, config } = useResume();
  const pr = data.profile;
  const fields = pr.fields || [];

  return (
    <>
      <TextField
        label="简介主段"
        value={pr.intro}
        multiline
        maxLength={220}
        onChange={(v) => updateAt('profile.intro', v)}
      />
      <TextField
        label="简介补充句"
        value={pr.introSecondary}
        multiline
        maxLength={120}
        onChange={(v) => updateAt('profile.introSecondary', v)}
      />

      <FieldGroup
        title={`联系信息（${fields.length}/${config.limits.profileFields}）`}
        hint="只放招聘方真正需要的信息，不放兴趣爱好等不可验证内容。"
        action={
          <button
            className="mini-btn"
            disabled={fields.length >= config.limits.profileFields}
            onClick={() => addItem('profile.fields', { label: '新字段', value: '', icon: 'pin' })}
          >
            <Icon name="plus" size={11} /> 添加
          </button>
        }
      >
        {fields.map((f, i) => (
          <div className="item-card" key={i}>
            <div className="item-card__head">
              <span className="item-card__idx num">{String(i + 1).padStart(2, '0')}</span>
              <ItemActions
                onUp={() => moveItem('profile.fields', i, -1)}
                onDown={() => moveItem('profile.fields', i, 1)}
                onRemove={() => removeItem('profile.fields', i)}
                canUp={i > 0}
                canDown={i < fields.length - 1}
                disableRemove={fields.length <= 1}
              />
            </div>
            <TextField
              label="标签"
              value={f.label}
              onChange={(v) => updateItem('profile.fields', i, { label: v })}
            />
            <TextField
              label="内容"
              value={f.value}
              onChange={(v) => updateItem('profile.fields', i, { value: v })}
            />
            <TextField
              label="链接（选填）"
              value={f.href}
              placeholder="mailto: / tel: / https://"
              onChange={(v) => updateItem('profile.fields', i, { href: v })}
            />
            <label className="field">
              <span className="field__label">图标</span>
              <select
                className="field__input"
                value={f.icon || 'pin'}
                onChange={(e) => updateItem('profile.fields', i, { icon: e.target.value })}
              >
                {['pin', 'clock', 'cap', 'mail', 'phone', 'bolt', 'compass', 'link'].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </FieldGroup>
    </>
  );
}

/* ------------------------------------------------------------------ 指标 */
function MetricsFields() {
  const { data, updateItem, addItem, removeItem, moveItem, config } = useResume();
  const items = data.metrics || [];

  return (
    <FieldGroup
      title={`量化指标（${items.length}/${config.limits.metrics}）`}
      hint="建议 4 个：经验年限、规模、提升幅度、效率。数字要能对上基线。"
      action={
        <button
          className="mini-btn"
          disabled={items.length >= config.limits.metrics}
          onClick={() => addItem('metrics', { value: 0, suffix: '', label: '新指标', note: '' })}
        >
          <Icon name="plus" size={11} /> 添加
        </button>
      }
    >
      {items.map((m, i) => (
        <div className="item-card" key={i}>
          <div className="item-card__head">
            <span className="item-card__idx num">{String(i + 1).padStart(2, '0')}</span>
            <ItemActions
              onUp={() => moveItem('metrics', i, -1)}
              onDown={() => moveItem('metrics', i, 1)}
              onRemove={() => removeItem('metrics', i)}
              canUp={i > 0}
              canDown={i < items.length - 1}
              disableRemove={items.length <= 1}
            />
          </div>
          <NumberField
            label="数值"
            value={m.value}
            max={99999}
            step={0.1}
            onChange={(v) => updateItem('metrics', i, { value: v })}
          />
          <TextField
            label="单位 / 后缀"
            value={m.suffix}
            onChange={(v) => updateItem('metrics', i, { suffix: v })}
          />
          <TextField
            label="指标名"
            value={m.label}
            onChange={(v) => updateItem('metrics', i, { label: v })}
          />
          <TextField
            label="备注（基线）"
            value={m.note}
            onChange={(v) => updateItem('metrics', i, { note: v })}
          />
        </div>
      ))}
    </FieldGroup>
  );
}

/* ------------------------------------------------------------------ 经历 */
function ExperienceFields() {
  const { data, updateItem, addItem, removeItem, moveItem, config } = useResume();
  const items = data.experience.items || [];

  return (
    <>
      <TextField
        label="模块标题"
        value={data.experience.title}
        onChange={(v) => updateItem('experience', 0, {})}
        disabled
      />
      <FieldGroup
        title={`经历条目（${items.length}/${config.limits.experience}）`}
        hint="每条要点按「动作 + 口径 + 结果」写，避免形容词。"
        action={
          <button
            className="mini-btn"
            disabled={items.length >= config.limits.experience}
            onClick={() =>
              addItem('experience.items', {
                type: 'work',
                period: '2024 — 至今',
                company: '公司名称',
                role: '岗位',
                location: '城市',
                points: ['做了什么，口径是什么，结果如何'],
                tags: [],
              })
            }
          >
            <Icon name="plus" size={11} /> 添加
          </button>
        }
      >
        {items.map((it, i) => (
          <div className="item-card" key={i}>
            <div className="item-card__head">
              <span className="item-card__idx num">{String(i + 1).padStart(2, '0')}</span>
              <ItemActions
                onUp={() => moveItem('experience.items', i, -1)}
                onDown={() => moveItem('experience.items', i, 1)}
                onRemove={() => removeItem('experience.items', i)}
                canUp={i > 0}
                canDown={i < items.length - 1}
              />
            </div>
            <label className="field">
              <span className="field__label">类型</span>
              <select
                className="field__input"
                value={it.type}
                onChange={(e) => updateItem('experience.items', i, { type: e.target.value })}
              >
                <option value="work">工作</option>
                <option value="edu">教育</option>
              </select>
            </label>
            <TextField
              label="期间"
              value={it.period}
              onChange={(v) => updateItem('experience.items', i, { period: v })}
            />
            <TextField
              label="公司 / 学校"
              value={it.company}
              onChange={(v) => updateItem('experience.items', i, { company: v })}
            />
            <TextField
              label="岗位 / 专业"
              value={it.role}
              onChange={(v) => updateItem('experience.items', i, { role: v })}
            />
            <TextField
              label="地点"
              value={it.location}
              onChange={(v) => updateItem('experience.items', i, { location: v })}
            />

            <FieldGroup
              title={`要点（${(it.points || []).length}/6）`}
              action={
                <button
                  className="mini-btn"
                  disabled={(it.points || []).length >= 6}
                  onClick={() =>
                    updateItem('experience.items', i, { points: [...(it.points || []), ''] })
                  }
                >
                  <Icon name="plus" size={11} /> 添加
                </button>
              }
            >
              {(it.points || []).map((p, j) => (
                <div className="inline-row" key={j}>
                  <textarea
                    className="field__input is-area"
                    rows={2}
                    value={p}
                    onChange={(e) => {
                      const next = [...it.points];
                      next[j] = e.target.value;
                      updateItem('experience.items', i, { points: next });
                    }}
                  />
                  <button
                    className="inline-row__del"
                    aria-label="删除这条要点"
                    onClick={() =>
                      updateItem('experience.items', i, {
                        points: it.points.filter((_, k) => k !== j),
                      })
                    }
                  >
                    <Icon name="trash" size={11} />
                  </button>
                </div>
              ))}
            </FieldGroup>

            <TextField
              label="标签（逗号分隔）"
              value={(it.tags || []).join(', ')}
              onChange={(v) =>
                updateItem('experience.items', i, {
                  tags: v.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        ))}
      </FieldGroup>
    </>
  );
}

/* ------------------------------------------------------------------ 项目 */
function ProjectsFields() {
  const { data, updateItem, addItem, removeItem, moveItem, config } = useResume();
  const items = data.projects.items || [];

  return (
    <FieldGroup
      title={`项目条目（${items.length}/${config.limits.projects}）`}
      hint="每个项目必须有背景、做法、结果三部分，否则不如不放。"
      action={
        <button
          className="mini-btn"
          disabled={items.length >= config.limits.projects}
          onClick={() =>
            addItem('projects.items', {
              id: `p${Date.now().toString(36)}`,
              index: String(items.length + 1).padStart(2, '0'),
              title: '项目名称',
              subtitle: '方法 / 方向',
              year: String(new Date().getFullYear()),
              summary: '一句话说清做了什么、结果如何。',
              detail: { background: '', approach: '', result: '' },
              tools: [],
              chart: 'roi',
            })
          }
        >
          <Icon name="plus" size={11} /> 添加
        </button>
      }
    >
      {items.map((p, i) => (
        <div className="item-card" key={p.id || i}>
          <div className="item-card__head">
            <span className="item-card__idx num">{String(i + 1).padStart(2, '0')}</span>
            <ItemActions
              onUp={() => moveItem('projects.items', i, -1)}
              onDown={() => moveItem('projects.items', i, 1)}
              onRemove={() => removeItem('projects.items', i)}
              canUp={i > 0}
              canDown={i < items.length - 1}
            />
          </div>
          <TextField
            label="标题"
            value={p.title}
            onChange={(v) => updateItem('projects.items', i, { title: v })}
          />
          <TextField
            label="副标（方法）"
            value={p.subtitle}
            onChange={(v) => updateItem('projects.items', i, { subtitle: v })}
          />
          <TextField
            label="年份"
            value={p.year}
            onChange={(v) => updateItem('projects.items', i, { year: v })}
          />
          <TextField
            label="摘要"
            value={p.summary}
            multiline
            maxLength={140}
            onChange={(v) => updateItem('projects.items', i, { summary: v })}
          />
          <TextField
            label="背景"
            value={p.detail?.background}
            multiline
            onChange={(v) => updateItem('projects.items', i, { detail: { ...p.detail, background: v } })}
          />
          <TextField
            label="做法"
            value={p.detail?.approach}
            multiline
            onChange={(v) => updateItem('projects.items', i, { detail: { ...p.detail, approach: v } })}
          />
          <TextField
            label="结果"
            value={p.detail?.result}
            multiline
            onChange={(v) => updateItem('projects.items', i, { detail: { ...p.detail, result: v } })}
          />
          <TextField
            label="工具（逗号分隔）"
            value={(p.tools || []).join(', ')}
            onChange={(v) =>
              updateItem('projects.items', i, {
                tools: v.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
          />
          <label className="field">
            <span className="field__label">图表类型</span>
            <select
              className="field__input"
              value={p.chart || 'roi'}
              onChange={(e) => updateItem('projects.items', i, { chart: e.target.value })}
            >
              <option value="rfm">RFM 分层（横向条）</option>
              <option value="abc">ABC 分类（柱 + 曲线）</option>
              <option value="roi">渠道趋势（折线）</option>
            </select>
          </label>
        </div>
      ))}
    </FieldGroup>
  );
}

/* ------------------------------------------------------------------ 优势 */
function CapabilitiesFields() {
  const { data, updateItem, addItem, removeItem, moveItem, config } = useResume();
  const items = data.capabilities.items || [];

  return (
    <FieldGroup
      title={`能力卡（${items.length}/${config.limits.capabilities}）`}
      hint="熟练度用 0–5 的数字，比「精通 / 熟练」更可信。"
      action={
        <button
          className="mini-btn"
          disabled={items.length >= config.limits.capabilities}
          onClick={() =>
            addItem('capabilities.items', {
              icon: 'compass',
              title: '能力名',
              body: '一句话说清这项能力解决什么问题。',
              level: 3,
              levelLabel: '进阶中',
            })
          }
        >
          <Icon name="plus" size={11} /> 添加
        </button>
      }
    >
      {items.map((c, i) => (
        <div className="item-card" key={i}>
          <div className="item-card__head">
            <span className="item-card__idx num">{String(i + 1).padStart(2, '0')}</span>
            <ItemActions
              onUp={() => moveItem('capabilities.items', i, -1)}
              onDown={() => moveItem('capabilities.items', i, 1)}
              onRemove={() => removeItem('capabilities.items', i)}
              canUp={i > 0}
              canDown={i < items.length - 1}
            />
          </div>
          <TextField
            label="标题"
            value={c.title}
            onChange={(v) => updateItem('capabilities.items', i, { title: v })}
          />
          <TextField
            label="说明"
            value={c.body}
            multiline
            onChange={(v) => updateItem('capabilities.items', i, { body: v })}
          />
          <NumberField
            label="熟练度"
            value={c.level}
            min={0}
            max={5}
            step={0.5}
            suffix="/5"
            onChange={(v) => updateItem('capabilities.items', i, { level: v })}
          />
          <TextField
            label="状态标签"
            value={c.levelLabel}
            onChange={(v) => updateItem('capabilities.items', i, { levelLabel: v })}
          />
          <label className="field">
            <span className="field__label">图标</span>
            <select
              className="field__input"
              value={c.icon || 'compass'}
              onChange={(e) => updateItem('capabilities.items', i, { icon: e.target.value })}
            >
              {['compass', 'grid', 'chart', 'pen', 'bolt', 'cap', 'link'].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}
    </FieldGroup>
  );
}

/* ------------------------------------------------------------------ 联系 */
function ContactFields() {
  const { data, updateAt, updateItem, addItem, removeItem, moveItem, config } = useResume();
  const c = data.contact;
  const links = c.links || [];

  return (
    <>
      <TextField
        label="标题（换行分两段）"
        value={c.title}
        multiline
        onChange={(v) => updateAt('contact.title', v)}
      />
      <TextField label="说明" value={c.body} multiline onChange={(v) => updateAt('contact.body', v)} />
      <TextField label="邮箱" value={c.email} onChange={(v) => updateAt('contact.email', v)} />
      <TextField label="电话" value={c.phone} onChange={(v) => updateAt('contact.phone', v)} />
      <TextField
        label="页脚说明"
        value={c.footnote}
        multiline
        onChange={(v) => updateAt('contact.footnote', v)}
      />

      <FieldGroup
        title={`外链（${links.length}/${config.limits.contactLinks}）`}
        action={
          <button
            className="mini-btn"
            disabled={links.length >= config.limits.contactLinks}
            onClick={() => addItem('contact.links', { label: '新链接', value: '', href: 'https://' })}
          >
            <Icon name="plus" size={11} /> 添加
          </button>
        }
      >
        {links.map((l, i) => (
          <div className="item-card" key={i}>
            <div className="item-card__head">
              <span className="item-card__idx num">{String(i + 1).padStart(2, '0')}</span>
              <ItemActions
                onUp={() => moveItem('contact.links', i, -1)}
                onDown={() => moveItem('contact.links', i, 1)}
                onRemove={() => removeItem('contact.links', i)}
                canUp={i > 0}
                canDown={i < links.length - 1}
              />
            </div>
            <TextField
              label="名称"
              value={l.label}
              onChange={(v) => updateItem('contact.links', i, { label: v })}
            />
            <TextField
              label="显示值"
              value={l.value}
              onChange={(v) => updateItem('contact.links', i, { value: v })}
            />
            <TextField
              label="链接"
              value={l.href}
              onChange={(v) => updateItem('contact.links', i, { href: v })}
            />
          </div>
        ))}
      </FieldGroup>
    </>
  );
}

/* ------------------------------------------------------------------ 自定义模块 */
function CustomFields({ mod }) {
  const { updateCustomModule, removeCustomModule, config } = useResume();
  const typeDef = CUSTOM_TYPES.find((t) => t.type === mod.type);
  const fields = typeDef?.itemFields || [];

  const setItem = (idx, key, val) => {
    const next = [...mod.items];
    next[idx] = { ...next[idx], [key]: val };
    updateCustomModule(mod.id, { items: next });
  };

  const swap = (i, j) => {
    if (j < 0 || j >= mod.items.length) return;
    const next = [...mod.items];
    [next[i], next[j]] = [next[j], next[i]];
    updateCustomModule(mod.id, { items: next });
  };

  return (
    <>
      <TextField
        label="模块标题"
        value={mod.title}
        onChange={(v) => updateCustomModule(mod.id, { title: v })}
      />
      <TextField
        label="英文小标（选填）"
        value={mod.subtitle}
        onChange={(v) => updateCustomModule(mod.id, { subtitle: v })}
      />

      <FieldGroup
        title={`内容块（${mod.items.length}/${config.limits.customItems}）`}
        action={
          <button
            className="mini-btn"
            disabled={mod.items.length >= config.limits.customItems}
            onClick={() =>
              updateCustomModule(mod.id, { items: [...mod.items, { ...typeDef.blankItem }] })
            }
          >
            <Icon name="plus" size={11} /> 添加
          </button>
        }
      >
        {mod.items.map((it, i) => (
          <div className="item-card" key={i}>
            <div className="item-card__head">
              <span className="item-card__idx num">{String(i + 1).padStart(2, '0')}</span>
              <ItemActions
                onUp={() => swap(i, i - 1)}
                onDown={() => swap(i, i + 1)}
                onRemove={() =>
                  updateCustomModule(mod.id, { items: mod.items.filter((_, k) => k !== i) })
                }
                canUp={i > 0}
                canDown={i < mod.items.length - 1}
              />
            </div>
            {fields.map((f) => {
              if (f.type === 'image') {
                return (
                  <ImageField
                    key={f.key}
                    label={f.label}
                    value={it[f.key]}
                    onChange={(v) => setItem(i, f.key, v)}
                    ratio={f.ratio || 4 / 3}
                    maxBytes={config.image.maxBytes}
                    maxUploadBytes={config.image.maxUploadBytes}
                  />
                );
              }
              return (
                <TextField
                  key={f.key}
                  label={f.label}
                  value={it[f.key]}
                  placeholder={f.placeholder}
                  multiline={f.type === 'textarea'}
                  onChange={(v) => setItem(i, f.key, v)}
                />
              );
            })}
          </div>
        ))}
      </FieldGroup>

      <button
        className="btn btn--ghost btn--sm btn--full is-danger"
        onClick={() => {
          if (confirm(`删除整个「${mod.title}」模块？`)) removeCustomModule(mod.id);
        }}
      >
        删除整个模块
      </button>
    </>
  );
}

/* ==========================================================================
   模块标签
   ========================================================================== */
function ModulesTab() {
  const {
    order,
    hidden,
    moveModule,
    toggleModule,
    addCustomModule,
    removeCustomModule,
    moveCustomModule,
    data,
    showToast,
    config,
  } = useResume();

  const customs = data.custom || [];

  return (
    <div className="modules-tab">
      <FieldGroup
        title="页面模块顺序"
        hint="首屏固定第一，联系方式固定最后。中部模块可上下移动或隐藏。"
      >
        <ol className="modlist">
          {order.map((key) => {
            const def = BUILTIN_MODULES.find((m) => m.key === key);
            if (!def) return null;
            const locked = def.role !== 'free';
            const off = hidden.includes(key);
            return (
              <li className={`modlist__row ${off ? 'is-off' : ''}`} key={key}>
                <span className="modlist__name">
                  {def.label}
                  {locked ? <em className="modlist__lock">锁定</em> : null}
                </span>
                {!locked && (
                  <div className="modlist__acts">
                    <button onClick={() => moveModule(key, -1)} aria-label="上移">
                      <Icon name="arrowUp" size={11} />
                    </button>
                    <button onClick={() => moveModule(key, 1)} aria-label="下移">
                      <Icon name="arrowDown" size={11} />
                    </button>
                    <button onClick={() => toggleModule(key)} aria-label={off ? '显示' : '隐藏'}>
                      <Icon name={off ? 'plus' : 'close'} size={11} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </FieldGroup>

      <FieldGroup
        title="添加自定义模块"
        hint={`每种类型最多 ${config.limits.customPerType} 个，内容块最多 ${config.limits.customItems} 个。`}
      >
        <div className="addmod">
          {CUSTOM_TYPES.map((t) => {
            const count = customs.filter((c) => c.type === t.type).length;
            const full = count >= config.limits.customPerType;
            return (
              <button
                key={t.type}
                className="addmod__btn"
                disabled={full}
                onClick={() => {
                  const r = addCustomModule(t.type);
                  if (!r.ok) showToast(r.error, 'warn');
                  else showToast(`已添加「${t.label}」`);
                }}
              >
                <span className="addmod__icon">
                  <Icon name={t.icon} size={15} />
                </span>
                <span className="addmod__text">
                  <b>{t.label}</b>
                  <i>{t.hint}</i>
                </span>
                <span className="addmod__count num">
                  {count}/{config.limits.customPerType}
                </span>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      {customs.length > 0 && (
        <FieldGroup title="已添加的自定义模块">
          <ol className="modlist">
            {customs.map((c) => (
              <li className="modlist__row" key={c.id}>
                <span className="modlist__name">{c.title || c.type}</span>
                <div className="modlist__acts">
                  <button onClick={() => moveCustomModule(c.id, -1)} aria-label="上移">
                    <Icon name="arrowUp" size={11} />
                  </button>
                  <button onClick={() => moveCustomModule(c.id, 1)} aria-label="下移">
                    <Icon name="arrowDown" size={11} />
                  </button>
                  <button
                    className="is-danger"
                    aria-label="删除"
                    onClick={() => {
                      if (confirm(`删除「${c.title}」模块？`)) removeCustomModule(c.id);
                    }}
                  >
                    <Icon name="trash" size={11} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </FieldGroup>
      )}
    </div>
  );
}

/* ==========================================================================
   数据标签
   ========================================================================== */
function DataTab() {
  const { data, resetToDefault, applyImported, showToast, config } = useResume();
  const fileRef = useRef(null);

  const handleExport = () => {
    exportJson(data, `${data.person?.nameEn || 'resume'}-data.json`);
    showToast('已导出 JSON，请妥善保存');
  };

  const handleImport = async (file) => {
    try {
      const imported = await importJson(file);
      applyImported(imported);
    } catch (e) {
      showToast(e.message || '导入失败', 'warn');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="datatab">
      <FieldGroup title="备份与迁移" hint="数据只存在本浏览器。换设备、清缓存前请先导出。">
        <div className="datatab__btns">
          <button className="btn btn--ghost btn--sm" onClick={handleExport}>
            导出 JSON
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
            导入 JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => handleImport(e.target.files?.[0])}
          />
        </div>
      </FieldGroup>

      <FieldGroup title="清空为空白模板" hint="清空文案但保留页面结构，适合分享给别人填自己的内容。">
        <button
          className="btn btn--ghost btn--sm btn--full"
          onClick={() => {
            if (!confirm('清空所有文案与图片？此操作不可撤销（建议先导出备份）。')) return;
            const blank = JSON.parse(JSON.stringify(data));
            blank.person.name = '你的名字';
            blank.person.nameEn = 'YOUR NAME';
            blank.person.avatar = DEFAULT_AVATAR;
            blank.person.status = '开放机会';
            blank.hero.titleLine1 = '你的名字';
            blank.hero.titleLine2 = '你的岗位';
            blank.hero.tagline = '一句话说清你能解决什么问题。';
            blank.hero.subline = '年限 · 背景 · 方向';
            blank.profile.intro = '两到三句自我介绍。先说清你是谁、能做什么。';
            blank.profile.introSecondary = '';
            blank.metrics = [];
            blank.experience.items = [];
            blank.projects.items = [];
            blank.capabilities.items = [];
            blank.contact.title = '期待与你聊聊';
            blank.contact.body = '补充一句说明你的求职意向。';
            blank.contact.email = 'your@email.com';
            blank.contact.phone = '';
            blank.contact.links = [];
            applyImported(blank);
          }}
        >
          清空为空白模板
        </button>
      </FieldGroup>

      <FieldGroup title="恢复示例内容" hint="清除浏览器里的改动，回到 resume.data.js 的默认值。">
        <button
          className="btn btn--ghost btn--sm btn--full is-danger"
          onClick={() => {
            if (!confirm('恢复到示例内容？当前改动将丢失。')) return;
            resetToDefault();
          }}
        >
          恢复示例内容
        </button>
      </FieldGroup>

      {config.features.shareLink && (
        <FieldGroup
          title="分享给他人填写"
          hint="方式：把本页链接发给对方 → 对方点「清空为空白模板」→ 填写 → 导出 JSON 保存。数据不离开浏览器。"
        >
          <button
            className="btn btn--ghost btn--sm btn--full"
            onClick={() => {
              navigator.clipboard
                ?.writeText(window.location.href)
                .then(() => showToast('页面链接已复制'))
                .catch(() => showToast('复制失败，请手动复制地址栏', 'warn'));
            }}
          >
            复制页面链接
          </button>
        </FieldGroup>
      )}
    </div>
  );
}
