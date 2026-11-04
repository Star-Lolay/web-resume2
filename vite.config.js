import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * ============================================================================
 *  Vite 配置
 * ============================================================================
 *  BASE 环境变量用于「子路径部署」：
 *    根域部署（Cloudflare Pages 默认）        → 不用管，默认 '/'
 *    GitHub Pages 项目页（/web-resume2/）     → BASE=/web-resume2/ npm run build
 *
 *  代码里引用 public 资源一律走 src/lib/asset.js 的 resolveAsset()，
 *  它会自动拼上这里的 base，所以改 base 不需要改任何业务代码。
 * ============================================================================
 */
export default defineConfig({
  base: process.env.BASE || '/',
  plugins: [react()],
  server: { port: 5173, open: false },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 700,
  },
});
