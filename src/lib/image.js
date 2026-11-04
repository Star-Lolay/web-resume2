/**
 * ============================================================================
 *  image.js  —— 图片裁剪与压缩（纯浏览器端，不上传）
 * ============================================================================
 *  需求：证件照固定 4:3，上传后自动居中裁剪，体积 < 5MB（实际压到 ~300KB）。
 *  做法：
 *   1. createImageBitmap 解码（支持 EXIF 方向，性能优于 <img>）
 *   2. 按目标比例计算居中裁剪区域（cover 策略：宁可裁掉也不拉伸）
 *   3. canvas 绘制到目标尺寸
 *   4. 逐级降质编码，直到 ≤ maxBytes（JPEG）
 *   5. 失败时回退 PNG（保留透明）并给出提示
 * ============================================================================
 */

/** 解码文件为 ImageBitmap / HTMLImageElement（兼容 Safari 旧版） */
async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* 回退下方 <img> 方案 */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片解码失败，可能不是有效图片'));
    };
    img.src = url;
  });
}

/**
 * 居中裁剪为指定宽高比并缩放。
 * @param {File} file
 * @param {Object} opts
 * @param {number} opts.aspect      目标宽高比，如 4/3
 * @param {number} opts.targetWidth 输出宽度（px）
 * @param {number} opts.maxBytes    体积上限（字节）
 * @param {string} opts.format      'jpeg' | 'png'
 * @param {number} opts.quality     初始质量 0–1
 * @returns {Promise<{dataUrl:string, width:number, height:number, bytes:number, ratio:number, wasCropped:boolean}>}
 */
export async function cropToRatio(file, opts = {}) {
  const {
    aspect = 4 / 3,
    targetWidth = 960,
    maxBytes = 400 * 1024,
    format = 'jpeg',
    quality = 0.92,
  } = opts;

  if (!file) throw new Error('没有选择文件');
  if (!file.type.startsWith('image/'))
    throw new Error('请选择图片文件（JPG / PNG / WebP）');

  const src = await decode(file);
  const sw = src.width || src.naturalWidth;
  const sh = src.height || src.naturalHeight;
  if (!sw || !sh) throw new Error('图片尺寸无效');

  // cover：以较紧的一边为基准，计算居中裁剪框
  const srcRatio = sw / sh;
  let cropW;
  let cropH;
  if (srcRatio > aspect) {
    cropH = sh;
    cropW = Math.round(sh * aspect); // 图更宽 → 裁左右
  } else {
    cropW = sw;
    cropH = Math.round(sw / aspect); // 图更高 → 裁上下
  }
  const cropX = Math.round((sw - cropW) / 2);
  const cropY = Math.round((sh - cropH) / 2);
  const wasCropped = cropW !== sw || cropH !== sh;

  const outW = Math.min(targetWidth, cropW);
  const outH = Math.round(outW / aspect);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器不支持 Canvas 2D');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // JPEG 无透明通道，先铺底色避免透明区变黑
  if (format === 'jpeg') {
    ctx.fillStyle = '#111316';
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.drawImage(src, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  if (src.close) src.close();

  // 逐级降质，逼近体积上限
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  let q = quality;
  let dataUrl = canvas.toDataURL(mime, q);
  let bytes = approxBytes(dataUrl);
  let guard = 0;
  while (bytes > maxBytes && q > 0.4 && guard < 8) {
    q = Math.max(0.4, q - 0.1);
    dataUrl = canvas.toDataURL(mime, q);
    bytes = approxBytes(dataUrl);
    guard += 1;
  }

  if (bytes > maxBytes) {
    // 仍超限 → 缩尺寸再试一次（只做一次，避免无限循环）
    const scale = Math.sqrt(maxBytes / bytes) * 0.92;
    const w2 = Math.max(320, Math.round(outW * scale));
    const h2 = Math.round(w2 / aspect);
    const c2 = document.createElement('canvas');
    c2.width = w2;
    c2.height = h2;
    const x2 = c2.getContext('2d');
    if (format === 'jpeg') {
      x2.fillStyle = '#111316';
      x2.fillRect(0, 0, w2, h2);
    }
    x2.imageSmoothingQuality = 'high';
    x2.drawImage(canvas, 0, 0, w2, h2);
    dataUrl = c2.toDataURL(mime, 0.78);
    bytes = approxBytes(dataUrl);
    return {
      dataUrl,
      width: w2,
      height: h2,
      bytes,
      ratio: w2 / h2,
      wasCropped,
    };
  }

  return { dataUrl, width: outW, height: outH, bytes, ratio: outW / outH, wasCropped };
}

/** base64 字符串的近似字节数（比 atob 逐字符快） */
export function approxBytes(dataUrl) {
  const i = dataUrl.indexOf(',');
  if (i < 0) return 0;
  const b64 = dataUrl.slice(i + 1);
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
