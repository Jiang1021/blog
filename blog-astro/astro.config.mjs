import { defineConfig } from 'astro/config';

// 纯静态输出。局域网部署目标：http://192.168.31.149
// 若日后换域名，改 site 即可（仅影响 canonical / sitemap）。
export default defineConfig({
  site: 'http://192.168.31.149',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
