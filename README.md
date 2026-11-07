# Web-Resume2 · 数据分析师作品集

深色、中性、克制的个人简历站点，内置**浏览器内编辑**与**模块化自定义**能力。

---

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物在 dist/
npm run preview    # 预览构建结果
```

> 若 `npm install` 卡住，可指定官方源：`npm install --registry=https://registry.npmjs.org`

---

## 我该改哪里（90% 的需求只需要三个文件）

| 我想… | 改这个文件 |
| --- | --- |
| 改姓名、简介、经历、项目、技能等**所有文案** | `src/content/resume.data.js` |
| 换配色、版心宽度、各模块数量上限、功能开关 | `src/content/site.config.js` |
| 改**动效参数与颜色**（扫描光、方块流动、星野、虹彩） | `src/content/effects.config.js` |
| 调整模块顺序规则、加一种新模块类型 | `src/content/module.registry.js` |

> 动效颜色也可以直接在页面右上角设置面板里改，不用碰代码。

详细说明：
- **改内容** → [`docs/03-内容修改指南.md`](docs/03-内容修改指南.md)
- **改结构 / 加模块类型** → [`docs/04-模块系统与自定义说明.md`](docs/04-模块系统与自定义说明.md)
- **动效系统与单文件导出** → [`docs/05-动效系统与单文件导出.md`](docs/05-动效系统与单文件导出.md)
- **人物设定与职业规划** → [`docs/01-人物规划与职业路线.md`](docs/01-人物规划与职业路线.md)
- **视频复刻流程与技术框架** → [`docs/02-复刻流程与技术框架.md`](docs/02-复刻流程与技术框架.md)

---

## 三种使用方式

### 1. 页面上直接编辑（不懂代码也能用）

右上角 **编辑** → 三个标签：

- **内容**：逐字段改文案、上传证件照（自动裁 4:3 + 压缩）、增删条目
- **模块**：调模块顺序、增删自定义模块
- **数据**：导出 / 导入 JSON、清空为空白模板、恢复示例

改动自动存浏览器，刷新不丢。

### 2. 改源文件（推荐用于定型）

直接编辑 `src/content/resume.data.js`，保存即热更新。

> 若页面仍显示旧内容，说明浏览器有 localStorage 覆盖层：编辑 → 数据 → **恢复示例内容**。

### 3. 导出成一个独立网站（给别人看）

设置面板 →「导出 → 导出为单文件网页」→ 生成并下载。

得到一个 `.html` 文件，**双击即可打开**，不需要服务器、不需要部署。
里面包含你改好的全部内容、配色、动效参数，图片已全部内联。
发给别人、上传到任意静态托管都能用。

> ⚠️ 导出需要「构建后的版本」。`npm run dev` 下导出会提示不可用——
> 请先 `npm run build`，再用 `npm run preview` 或线上站点操作。

### 4. 备份与分享（JSON）

- **备份**：编辑 → 数据 → 导出 JSON
- **迁移**：新设备 → 导入 JSON
- **给别人填**：发链接 → 对方「清空为空白模板」→ 填完导出 JSON

> 数据只存在浏览器里，**清缓存 / 换设备前务必导出**。

---

## 功能清单

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 全屏首屏 + 6 个内置模块 | ✅ | Hero / 档案 / 经历 / 项目 / 优势 / 联系 |
| 证件照 4:3 自动裁剪 | ✅ | 居中裁剪，不拉伸；压到 ~300KB（远低于 5MB 要求） |
| 内容逐字段编辑 | ✅ | 右侧面板，实时生效 |
| 模块顺序调整 | ✅ | 首屏锁第 1、联系锁最后，中部自由移动 |
| 模块移除与恢复 | ✅ | 中部模块可隐藏，可再显示 |
| 自定义模块（3 种类型） | ✅ | 自由文本 / 图文卡片 / 链接集合 |
| 小模块数量上限 | ✅ | 见 `site.config.js` 的 `limits` |
| 4 套主题 + 动效强度调节 | ✅ | 含一套亮色主题 |
| JSON 导出 / 导入 | ✅ | 无后端，纯本地 |
| 空白模板（供他人复用） | ✅ | 清空文案、保留结构 |
| ReactBits 动效（分段编排） | ✅ | 首屏 GridScan → 中段 MicroSlats → 最后一屏 Galaxy + 白色流光；延迟 0.5s 的 OrbitImages；亮色主题全程 Iridescence |
| 动效配色在线调整 | ✅ | 设置面板内改色，实时生效并持久化 |
| 单文件网页导出 | ✅ | 内容 + 配色 + 动效打包成一个 HTML，双击即开 |
| 响应式（含移动端抽屉） | ✅ | 390px 无横向溢出 |
| 无障碍与减弱动效 | ✅ | 尊重 `prefers-reduced-motion` |

---

## 性能（实测构建产物）

| 文件 | 原始 | gzip |
| --- | --- | --- |
| HTML | 0.89 KB | 0.62 KB |
| CSS | 61.1 KB | 11.5 KB |
| JS | 376.6 KB | 126.9 KB |

首屏关键资源 gzip 后约 **140 KB**。

导出成品约 **450 KB**（内联 bundle + 内联图片）。

**已内置的稳定性措施**：
- 首屏底色不依赖 WebGL，着色器只作纹理叠加 → 任何环境下文字都可读
- 动效按页面位置分段挂载，同一时刻最多 1 个主体 WebGL canvas → 帧率稳定、不争抢上下文配额
- WebGL 上下文丢失自动摘除该层，退回静态渐变，绝不留死灰块
- 入场动画有 1.8s / 2s 超时兜底 → 观察器失效也不白屏
- Canvas 在页面隐藏时暂停、`dpr` 封顶
- 移动端关闭重动效；亮色主题改用低饱和 Iridescence 虹彩层
- 图片来源本地处理，不上传服务器

---

## 目录结构

```
src/
├─ content/            ★ 内容层（日常改这里）
│   ├─ resume.data.js      全部文案与数据
│   ├─ site.config.js      配色 / 版心 / 上限 / 开关
│   ├─ effects.config.js   ★ 动效参数与颜色（唯一来源）
│   └─ module.registry.js  模块注册与自定义类型
├─ lib/
│   ├─ resumeStore.jsx     状态中枢
│   ├─ storage.js          本地持久化 / 导入导出 / boot 读取
│   ├─ effectsStore.js     动效配置读改写
│   ├─ exportSite.js       ★ 单文件导出核心
│   ├─ webglBudget.js      WebGL 配额协调
│   └─ image.js            4:3 裁剪 + 压缩
├─ components/
│   ├─ reactbits/          ReactBits 官方组件（GridScan / OrbitImages / MicroSlats / Galaxy / Iridescence）
│   ├─ scene/              动效编排层 + WebGL 保护
│   ├─ effects/            自研轻量动效
│   ├─ sections/           6 个内置模块 + 自定义模块 + SVG 图表
│   ├─ layout/             Navbar / SectionHead
│   ├─ editor/             编辑面板 / 表单 / 设置 / 导出对话框
│   └─ ui/                 Icon / Toast
├─ hooks/index.js      入场观测 / 媒体查询 / 页面可见 / 滚动 / WebGL 探测
└─ styles/             tokens / base / editor / export
scripts/
└─ make-standalone.mjs 构建后复制固定文件名的 bundle（供导出使用）
```

---

## 部署

### 已上线：GitHub Pages

**地址：https://star-lolay.github.io/web-resume2/**

push 到 `main` 即自动构建部署，无需手动操作。工作流见 `.github/workflows/pages.yml`。

GitHub Pages 项目站点部署在子路径 `/web-resume2/`，因此构建时会自动设置 `BASE=/web-resume2/`。
这一项由工作流从仓库名推导，仓库改名不需要改文件。

### 可选：Cloudflare Pages（免费套餐）

纯静态站点，免费额度不限带宽。四种方式任选其一：

| 方式 | 操作 | 适用场景 |
|---|---|---|
| Git 集成 | Dashboard → Pages → Connect to Git | 最省事，推荐长期使用 |
| GitHub Actions | 配好两个 Secret 后在 Actions 页运行 | 想保留仓库内自动部署 |
| 一键命令 | `npm run deploy`（首次会开浏览器登录） | 本地快速发布 |
| API Token | `CLOUDFLARE_API_TOKEN=xxx npm run deploy` | 无浏览器 / CI 环境 |

Cloudflare Pages 部署在**根域**，不需要设置 `BASE`。

### 本地验证部署效果

```bash
# 模拟 GitHub Pages 的子路径构建
BASE=/web-resume2/ npm run build
# 产物拷到 dist 下的子目录再起静态服务器即可验证
```

---

## 内容说明（重要）

`resume.data.js` 中的人物"林知远"及全部数字均为**示例设定**，用于展示页面结构与文案写法。上线前请替换为真实信息，并保持数字口径自洽（有基线、有终值）。

---

## 技术栈

React 18 · Vite 5 · 原生 CSS（CSS 变量）· 零运行时依赖（除 React）

动效来自 [ReactBits](https://reactbits.dev/) 的官方组件源码（已本地化，不随上游升级而变动）。
