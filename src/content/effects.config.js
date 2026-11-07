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
 *   - GridScan 不支持 paused（只有 OrbitImages / MicroSlats / Iridescence 支持）
 *   - GradientASCII / Galaxy 不支持 paused
 *   这些改为「滚动不可见时卸载 + 页面隐藏时不挂载」来控制开销。
 *
 *  ── 分层结构（按滚动位置，从首屏到最后一屏） ─────────────────────────────
 *   ① GridScan       仅首屏（严格 100vh，不向下延伸）
 *   ② MicroSlats     首屏之后 → 最后一屏之前（个人档案 / 经历 / 项目 / 优势 …）
 *   ③ Galaxy         最后一屏（滚动到距底部不足一屏时淡入）
 *   ④ 白色流动边缘    最后一屏底部的一小条（纯 CSS，不占 WebGL 配额）
 *   ⑤ Iridescence    亮色主题的全站固定背景（深色主题不渲染）
 * ============================================================================
 */

const effectsConfig = {
  /* ==========================================================================
   *  1. 首屏背景 —— GridScan（仅第一页，不向下延伸）
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
   *  ★ reflection 置 0：官网给的 0.2 会在网格下方画一层地面倒影，
   *    滚动到首屏底部时表现为一块压暗的"阴影"。这里关掉，底部用 CSS 渐隐衔接。
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
    /** 关掉地面倒影 —— 它会在首屏底部形成一块压暗的阴影 */
    reflection: 0,
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
    /** 底部渐隐高度（占视口比例）—— 让首屏与下一段自然接上，不出现硬边 */
    bottomFadePx: 190,
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
   *  3. 简历模块中段背景 —— MicroSlats（方块流动）
   * ==========================================================================
   *  官网 URL: /backgrounds/micro-slats?preset=storm&speed=1.5&direction=236
   *            &chop=1&glint=1.3&contrast=1.8&perspective=0.8&fog=0.35
   *            &glintColor=fffbf0&slatHeight=20&stretch=0.3&scale=0.7
   *
   *  覆盖范围：首屏之后 → 最后一屏之前的所有模块
   *            （个人档案 / 经历 / 项目 / 优势 / 自定义模块 …）
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
    /** 视觉权重：这一层是简历页的主背景，需要"看得见但不抢文字"。
     *  配合 CSS 的 brightness(1.6) contrast(0.92)，实测中段平均亮度
     *  从不调的 31.5 提到 35.2，而对比度略降 —— 更亮但更柔和。 */
    opacity: 0.8,
  },

  /* ==========================================================================
   *  4. 最后一屏背景 —— Galaxy（sparkle 星野）
   * ==========================================================================
   *  官网 URL: /backgrounds/galaxy?preset=sparkle&twinkleIntensity=0.6
   *            &saturation=0.5&starSize=1.2&starSpeed=1.5
   *            &starColors=ffffff,ffd9a3,a8c8ff&density=1.5
   *            &flareIntensity=3&repulsionStrength=1.5
   *
   *  只在「滚动到距底部不足一屏」时淡入，作为整站收尾。
   *
   *  ★ 颜色可改：starColors 数组（星点色，最多 4 个）
   */
  galaxy: {
    enabled: true,
    twinkleIntensity: 0.6,
    saturation: 0.5,
    starSize: 1.2,
    starSpeed: 1.5,
    starColors: ['#ffffff', '#ffd9a3', '#a8c8ff'],
    density: 1.5,
    flareIntensity: 3,
    repulsionStrength: 1.5,
    // 官网预设隐含参数
    focal: [0.5, 0.5],
    rotation: [1.0, 0.0],
    hueShift: 140,
    speed: 1.0,
    mouseInteraction: true,
    glowIntensity: 0.3,
    mouseRepulsion: true,
    rotationSpeed: 0.1,
    autoCenterRepulsion: 0,
    transparent: true,
    lightMode: false,
    layers: 4,
    direction: 'forward',
    clickWarp: true,
    intro: true,
    dpr: 1.4,
    /** 视觉权重：作为收尾背景，星点要清晰但不刺眼 */
    opacity: 0.9,
  },

  /* ==========================================================================
   *  5. 最后一屏底部边缘 —— 白色流动光带（纯 CSS，不占 WebGL）
   * ==========================================================================
   *  需求：最后一页不要紫色边缘动效，只保留一小块白色流动边缘。
   *  用 CSS 渐变 + 位移动画实现：轻量、无着色器、不会与 Galaxy 抢上下文。
   *
   *  ★ 颜色可改：colors 数组
   */
  edgeGlow: {
    enabled: true,
    /** 光带高度（占视口比例）。"一小块"→ 0.14 左右 */
    heightVh: 14,
    /** 峰值不透明度 */
    opacity: 0.5,
    colors: ['#ffffff', '#e8eef5', '#ffffff'],
    /** 流动一个周期的时间（秒） */
    duration: 9,
  },

  /* ==========================================================================
   *  6. 亮色主题全站背景 —— Iridescence
   * ==========================================================================
   *  官网 URL: /backgrounds/iridescence?speed=1.2&brightness=1.2
   *            &color=fffbf0&scale=1.5&contrast=1.2&detail=10
   *            &amplitude=0.3&warp=0.8
   *
   *  只在亮色配色（paleAsh）下渲染 —— 深色主题下它的浅色底会压制文字。
   *  亮色主题时它是全站固定背景，不再按滚动切换其它动效。
   *
   *  ★ 颜色可改：color
   */
  iridescence: {
    enabled: true,
    speed: 1.2,
    brightness: 1.2,
    color: '#fffbf0',
    scale: 1.5,
    contrast: 1.2,
    detail: 10,
    amplitude: 0.3,
    warp: 0.8,
    // 其余默认值
    mouseReact: true,
    rotation: 0,
    hueShift: 0,
    /** 降到 0.5：默认 1 会输出高饱和彩虹，铺在简历上过于花哨 */
    saturation: 0.5,
    stir: 0.4,
    sheen: 0.25,
    clickSwirl: true,
    grain: 0.015,
    fade: 0,
    resolution: 1,
    dpr: 1.25,
    /** 视觉权重：亮色底上要很淡，只做一层隐隐的珠光质感 */
    opacity: 0.34,
  },

  /* ==========================================================================
   *  7. 全局性能预算
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
