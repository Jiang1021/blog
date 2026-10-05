/**
 * island-loader.ts —— 灵动岛的懒加载调度。
 *
 * 照搬参考站（Bad0RANG3/Bad0RANG3.github.io）src/scripts/bootstrap.ts 里的
 * schedulePlayer()：岛是 chrome 而不是正文，控制器（~20KB）等页面空闲或访客
 * 先伸手碰播放器时再拉取，避免和首屏的 CSS / 字体抢带宽。
 *
 * 与参考站唯一的形式差别：参考站用 Vite 的 `void import('./player')`，这里用
 * 显式拼到 public/ 下的 /player.js 的 <script type="module">，因为我们的项目
 * 没有让 Astro 处理这个模块（内容必须原样保留参考站的实现）。
 */

const PLAYER_URL = '/player.js';

let playerLoaded = false;
let scriptInjected = false;

function loadPlayer(): void {
  if (playerLoaded) return;
  playerLoaded = true;
  if (scriptInjected) return;
  scriptInjected = true;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = PLAYER_URL;
  script.async = true;
  script.dataset.islandPlayer = 'true';
  script.addEventListener('load', () => {
    const bind = (window as unknown as { __b0IslandBind?: () => void }).__b0IslandBind;
    if (typeof bind === 'function') bind();
    else document.dispatchEvent(new CustomEvent('b0-island-ready'));
  });
  document.head.appendChild(script);
}

export function registerIsland(): void {
  const island = document.getElementById('site-island');
  if (!(island instanceof HTMLElement) || island.dataset.playerScheduled === '1') return;
  island.dataset.playerScheduled = '1';

  const warm = () => {
    island.removeEventListener('pointerenter', warm);
    island.removeEventListener('pointerdown', warm);
    island.removeEventListener('focusin', warm);
    loadPlayer();
  };
  island.addEventListener('pointerenter', warm, { passive: true });
  island.addEventListener('pointerdown', warm, { passive: true });
  island.addEventListener('focusin', warm);

  const runWhenIdle = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(loadPlayer, { timeout: 1800 });
    else window.setTimeout(loadPlayer, 400);
  };
  if (document.readyState === 'complete') runWhenIdle();
  else window.addEventListener('load', runWhenIdle, { once: true });
}
