/**
 * ============================================================================
 *  webglBudget.js —— WebGL 上下文配额协调器
 * ============================================================================
 *
 *  为什么需要：
 *  浏览器对同时存活的 WebGL 上下文有上限（低端机 / 软件渲染环境可能只有 1–2 个）。
 *  超出后新的会创建失败、旧的会被强制丢失，表现为「背景突然变灰 / 动画停住」。
 *  本站有多处动效，如果各自独立挂载，很容易撞到这个上限。
 *
 *  方案：
 *  所有 WebGL 动效层挂载前先申请一个「槽位」，卸载时归还。
 *  槽位满了就排队（不是直接拒绝），等前面的层卸载后自动获得。
 *  这样无论用户在哪个滚动位置，同时存活的 canvas 数都不会超过配额。
 *
 *  配额值：2。首屏 GridScan 占 1 个；环形图片是 2D canvas（不吃 WebGL 配额）；
 *  中段 MicroSlats 与最后一屏 Galaxy 通过滚动错开，共用另 1 个。
 * ============================================================================
 */

const MAX_SLOTS = 2;

/** 当前占用的槽位 id */
const holders = new Set();
/** 排队等待的请求 */
const queue = [];
let seq = 0;

/** 该环境是否真的有 WebGL（没有就完全不用排队） */
let supported = null;
function detectSupport() {
  if (supported !== null) return supported;
  if (typeof document === 'undefined') return false;
  try {
    // 只创建不销毁：loseContext() 在某些环境会把该页面的 WebGL
    // 标记为不可用，后续真实创建反而失败。让探测用的 canvas 自行被 GC 回收即可。
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl');
    supported = !!gl && !gl.isContextLost();
  } catch {
    supported = false;
  }
  return supported;
}

/** 环境是否支持 WebGL（给调用方做降级判断） */
export function hasWebGL() {
  return detectSupport();
}

/**
 * 申请一个槽位。
 *
 * @param {() => void} onGrant 获得槽位时回调（通常在这里 setState 挂载组件）
 * @returns {() => void} 释放函数；未获得时调用表示取消排队
 */
export function acquireSlot(onGrant) {
  if (!detectSupport()) return () => {};

  const id = ++seq;

  const grantNow = () => {
    holders.add(id);
    onGrant();
  };

  if (holders.size < MAX_SLOTS) {
    grantNow();
  } else {
    queue.push({ id, onGrant });
  }

  return function release() {
    // 已获得：释放并唤醒队首
    if (holders.delete(id)) {
      while (queue.length && holders.size < MAX_SLOTS) {
        const next = queue.shift();
        holders.add(next.id);
        next.onGrant();
      }
      return;
    }
    // 仍在排队：取消
    const qi = queue.findIndex((q) => q.id === id);
    if (qi >= 0) queue.splice(qi, 1);
  };
}

/** 调试用：当前占用情况 */
export function debugSlots() {
  return { active: holders.size, max: MAX_SLOTS, queued: queue.length };
}
