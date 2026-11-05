/**
 * ============================================================================
 *  effects.config.js —— 全站动效配置（唯一来源）
 * ============================================================================
 *
 *  ★ 想改动效参数？只改这个文件。
 *  ★ 想改动效颜色？每个效果都有 color 系列字段，改值即可。
 *  ★ 使用者也可以在页面上「外观 → 动效」里实时调，改动存 localStorage。
 *
 *  ── 参数来源说明 ─────────────────────────────────────────────────────────
 *  ReactBits 官网的 URL 里有 preset=xxx 这种参数，但组件本身没有 preset 入参
 *  （官网预设只是它帮忙拼好的一组参数值）。因此这里把 preset 展开成真实参数。
 *
 *  已核实不存在的参数，不在此处出现：
 *   - GridScan 不支持 paused（只有 OrbitImages / MicroSlats 支持）
 *   - GradientASCII 不支持 paused
 *   这两个改为「滚动不可见时卸载 + 页面隐藏时不挂载」来控制开销。
 * ============================================================================
 */

const effectsConfig = {
  /* ==========================================================================
   *  1. 首屏背景 —— GridScan（入场即显示）
   * ==========================================================================
   *  官网 URL: /backgrounds/grid-scan?preset=pulse&scanColor=f7b5c5
   *            &trail=0.25&shading=0.5&scanDelay=1&glow=0.3
   *            &scanDirection=pingpong&lineThickness=2&scanDuration=1.5
   *            &linesColor=4e4e4e&cells=7&reflection=0.2&scanWidth=1.5
   *            &lightMode=true
   *
   *  ★ 颜色可改：scanColor / linesColor
   *  ★ lightMode 必须保持 true（与你给的 URL 一致）：
   *    GridScan 的 lightMode 控制的是「着色器用阴影还是高光来表现体块」——
   *    true  = 绘制阴影 + 保留扫描色原色 → 叠在深色底上干净、通透（本站用这个）
   *    false = 绘制大面积白色高光       → 叠在深色底上会洗成一片灰白雾
   *    这与"页面是深色还是亮色"无关，是着色器内部的两种打光模型。
   */
  gridScan: {
    enabled: true,
    scanColor: '#f7b5c5', // 扫描光带主色（粉）
    linesColor: '#4e4e4e', // 网格线色
    lightMode: true,
    cells: 7,
    lineThickness: 2,
    scanDuration: 1.5,
    scanDelay: 1,
    scanDirection: 'pingpong',
    trail: 0.25,
    shading: 0.5,
    glow: 0.3,
    reflection: 0.2,
    scanWidth: 1.5,
    // 以下为官网预设隐含的稳健参数
    depth: 3,
    depthFade: 0.6,
    points: true,
    autoScan: true,
    interactive: true,
    clickEffect: 'ping',
    intro: true,
    /** 性能：DPR 上限。深色大面积网格，1.5 足够，省一半像素 */
    dpr: 1.5,
    /** 视觉权重：让网格退到文字之后。
     *  配合 CSS 的 mix-blend-mode:screen，只保留发亮部分 */
    opacity: 0.5,
  },

  /* ==========================================================================
   *  2. 首屏环形图片 —— OrbitImages（延迟 500ms 出现）
   * ==========================================================================
   *  官网 URL: /animations/orbit-images?easing=easeInOut&radiusY=100
   *
   *  ★ 图片可改：images 数组换成任意图片 URL / public 下路径
   *  ★ 颜色可改：pathColor（轨道线色）
   */
  orbitImages: {
    enabled: true,
    /** 延迟出现时间（ms）—— 需求指定 500ms */
    delay: 500,
    /** 环形图片素材。可自由增删，建议 6–10 张，尺寸一致观感最好 */
    images: [
      '/orbit/orbit-01.svg',
      '/orbit/orbit-02.svg',
      '/orbit/orbit-03.svg',
      '/orbit/orbit-04.svg',
      '/orbit/orbit-05.svg',
      '/orbit/orbit-06.svg',
    ],
    easing: 'easeInOut',
    radiusY: 100,
    radiusX: 320,
    itemSize: 54,
    duration: 42,
    rotation: -8,
    /** 轨道线：默认不显示，保持克制；想强调可设 showPath: true */
    showPath: false,
    pathColor: 'rgba(247,181,197,0.35)',
    pathWidth: 1.5,
    depth: 0.45,
    itemRadius: 10,
    shadow: 0.35,
    hoverScale: 1.12,
    draggable: true,
    intro: true,
  },

  /* ==========================================================================
   *  3. 简历模块衔接背景 —— MicroSlats（滚动进入时淡入）
   * ==========================================================================
   *  官网 URL: /backgrounds/micro-slats?preset=storm&speed=1.5&direction=236
   *            &chop=1&glint=1.3&contrast=1.8&perspective=0.8&fog=0.35
   *            &glintColor=fffbf0&slatHeight=20&stretch=0.3&scale=0.7
   *
   *  ★ 颜色可改：color（板条基色）/ glintColor（高光色）/ backgroundColor
   */
  microSlats: {
    enabled: true,
    preset: 'storm',
    color: '#2A2E36',
    glintColor: '#fffbf0',
    backgroundColor: '#0B0C0E',
    slatWidth: 10,
    slatHeight: 20,
    gap: 3,
    roundness: 0.75,
    scale: 0.7,
    speed: 1.5,
    direction: 236,
    chop: 1,
    glint: 1.3,
    contrast: 1.8,
    perspective: 0.8,
    fog: 0.35,
    stretch: 0.3,
    interactive: true,
    cursorStrength: 0.6,
    cursorSize: 40,
    swirl: 0,
    trail: 1.4,
    lean: 0,
    intro: true,
    introDuration: 1.2,
    dpr: 1.4,
    /** 视觉权重：作为衔接层，必须退到最后 */
    opacity: 0.5,
  },

  /* ==========================================================================
   *  4. 页面底部固定背景 + 个人信息模块背景 —— GradientASCII
   * ==========================================================================
   *  官网 URL: /backgrounds/gradient-ascii?shape=rise
   *            &colors=a855f7,a277cd,fffbf0,ffffff
   *            &grain=0.05&glow=0.15&speed=2&flicker=0.5
   *
   *  ★ 颜色可改：colors 数组（按顺序构成渐变）
   */
  gradientASCII: {
    enabled: true,
    shape: 'rise',
    colors: ['#a855f7', '#a277cd', '#fffbf0', '#ffffff'],
    grain: 0.05,
    glow: 0.15,
    speed: 2,
    flicker: 0.5,
    cellSize: 18,
    density: 0.75,
    glyphOpacity: 0.6,
    softness: 0.5,
    gradientOpacity: 0.85,
    flow: 0.5,
    scale: 1,
    variation: 0,
    mouseInteraction: true,
    scrambleRadius: 0.1,
    clickEffect: 'wave',
    intro: true,
    dpr: 1.25,
    /** 底部固定层：必须极低对比，否则会抢正文可读性 */
    fixedOpacity: 0.32,
    /** 个人信息模块背景层 */
    profileOpacity: 0.2,
  },

  /* ==========================================================================
   *  5. 全局性能预算
   * ==========================================================================
   *  WebGL 层同时活着太多会掉帧。这里限制同一时刻活跃的 canvas 数量。
   */
  perf: {
    /** 动效强度低于此值 → 全部关闭，只留静态渐变 */
    minIntensity: 0.2,
    /** 同一屏最多同时运行几个 WebGL canvas（超出则让最旧的下线） */
    maxLiveCanvases: 2,
    /** 移动端（<900px）是否启用重动效。false = 只用 CSS 兜底背景 */
    enableOnMobile: false,
  },
};

export default effectsConfig;
