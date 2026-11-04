/**
 * ============================================================================
 *  module.registry.js  —— 模块注册表（决定"页面由哪些块组成、怎么动"）
 * ============================================================================
 *
 *  ★ 想加一种全新的模块类型？在 CUSTOM_TYPES 里加一项，并在
 *    components/sections/custom/ 下补一个渲染组件即可。
 *  ★ 想改内置模块的标题或锚点？改下面的 BUILTIN 定义。
 *
 *  每个模块的角色（role）决定它在编辑器里的行为：
 *    'fixed-first'  锁定首位，不可移除
 *    'fixed-last'   锁定末位，不可移除
 *    'free'         可移除、可上下移动
 * ============================================================================
 */

/** 内置模块（顺序即默认渲染顺序） */
export const BUILTIN_MODULES = [
  {
    key: 'hero',
    role: 'fixed-first',
    label: '首屏 Hero',
    hint: '站点第一印象，包含大标题、定位一句话与行动按钮',
    anchor: 'top',
  },
  {
    key: 'profile',
    role: 'free',
    label: '个人档案',
    hint: '证件照、简介、必须展示的联系信息与量化指标',
    anchor: 'profile',
  },
  {
    key: 'experience',
    role: 'free',
    label: '工作经历',
    hint: '工作与教育时间线',
    anchor: 'experience',
  },
  {
    key: 'projects',
    role: 'free',
    label: '精选项目',
    hint: '项目大卡，含背景 / 做法 / 结果三段',
    anchor: 'projects',
  },
  {
    key: 'capabilities',
    role: 'free',
    label: '个人优势',
    hint: '能力卡片与熟练度',
    anchor: 'capabilities',
  },
  {
    key: 'contact',
    role: 'fixed-last',
    label: '联系方式',
    hint: '整屏收尾，邮箱、电话与外部链接',
    anchor: 'contact',
  },
];

/** 自定义模块类型（使用者可自由添加） */
export const CUSTOM_TYPES = [
  {
    type: 'richText',
    label: '自由文本',
    hint: '标题 + 段落，适合补充说明、证书、教育背景、自我评价',
    icon: 'text',
    /** 每个子块的字段定义，编辑器据此生成表单 */
    itemFields: [
      { key: 'heading', label: '小标题', type: 'text', placeholder: '如：CET-6' },
      { key: 'body', label: '正文', type: 'textarea', placeholder: '一行一句，换行会保留' },
    ],
    /** 新建时的默认空子块 */
    blankItem: { heading: '', body: '' },
  },
  {
    type: 'gallery',
    label: '图文卡片',
    hint: '图片 + 标题 + 说明，4:3 统一裁切，适合作品图、图表截图、证书照片',
    icon: 'image',
    itemFields: [
      { key: 'heading', label: '标题', type: 'text', placeholder: '如：活动复盘模板' },
      { key: 'body', label: '说明', type: 'textarea', placeholder: '这张图说明了什么' },
      { key: 'image', label: '图片', type: 'image', ratio: 4 / 3 },
    ],
    blankItem: { heading: '', body: '', image: '' },
  },
  {
    type: 'linkGrid',
    label: '链接集合',
    hint: '名称 + 链接 + 一句说明，适合 GitHub、博客、知乎、公众号',
    icon: 'link',
    itemFields: [
      { key: 'heading', label: '名称', type: 'text', placeholder: '如：GitHub' },
      { key: 'href', label: '链接', type: 'url', placeholder: 'https://' },
      { key: 'body', label: '说明', type: 'text', placeholder: '一句话说明这个链接' },
    ],
    blankItem: { heading: '', href: '', body: '' },
  },
];

/** 导航栏展示的模块（只列主要几项，避免拥挤） */
export const NAV_ITEMS = [
  { label: '档案', anchor: 'profile' },
  { label: '经历', anchor: 'experience' },
  { label: '项目', anchor: 'projects' },
  { label: '优势', anchor: 'capabilities' },
  { label: '联系', anchor: 'contact' },
];

export const getModuleDef = (key) =>
  BUILTIN_MODULES.find((m) => m.key === key) ||
  CUSTOM_TYPES.find((m) => m.type === key) ||
  null;

export const getCustomType = (type) => CUSTOM_TYPES.find((m) => m.type === type) || null;

export const isLocked = (key) =>
  BUILTIN_MODULES.some((m) => m.key === key && m.role !== 'free');
