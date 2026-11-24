(() => {
  'use strict';
  const stage = document.querySelector('[data-game-stage]');
  if (!stage) return;
  const cover = document.querySelector('[data-game-cover]');
  const launch = document.querySelector('[data-game-launch]');
  const status = document.querySelector('[data-game-status]');
  const fullscreen = document.querySelector('[data-game-fullscreen]');
  const exit = document.querySelector('[data-game-exit]');
  const collapse = document.querySelector('[data-game-collapse]');
  const shortcut = document.querySelector('[data-game-shortcut]');
  const shortcutClose = document.querySelector('[data-game-shortcut-close]');
  let frame = null;
  const focusGame = () => {
    if (frame) { frame.focus(); frame.contentWindow.postMessage({source:'game3-host',type:'focus'},location.origin); }
  };
  async function closeExpanded() {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    stage.classList.remove('is-expanded');
    document.body.classList.remove('game-expanded');
    fullscreen.textContent = '전체 화면 ⛶';
    focusGame();
  }
  const track = (name, section = 'playable_prototype') => {
    if (typeof window.gtag === 'function') window.gtag('event', name, {game_name:'game3',link_section:section});
  };
  if (shortcut) {
    const updateShortcutVisibility = () => {
      shortcut.classList.toggle('is-scroll-ready', window.scrollY >= 300);
    };
    window.addEventListener('scroll', updateShortcutVisibility, {passive:true});
    window.addEventListener('pageshow', updateShortcutVisibility);
    updateShortcutVisibility();
    shortcutClose.addEventListener('click', () => {
      shortcut.hidden = true;
      // Return keyboard focus to a stable navigation target after dismissing.
      document.querySelector('.brand')?.focus({preventScroll:true});
    });
    shortcut.querySelector('[data-game-shortcut-link]').addEventListener('click', () => track('portfolio_game_shortcut_click', 'floating_shortcut'));
    // The invitation should not cover the game or compete with its own Play button.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        shortcut.classList.toggle('is-game-visible', entry.isIntersecting);
      }).observe(document.querySelector('[data-game-player]'));
    }
  }
  launch.addEventListener('click', () => {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.title = '창작게임3 — 주사위·동전·슬롯 전투 프로토타입';
    frame.src = 'games/game3/';
    frame.allow = 'autoplay; fullscreen';
    frame.allowFullscreen = true;
    stage.append(frame);
    cover.hidden = true;
    fullscreen.disabled = false;
    exit.hidden = false;
    status.textContent = '게임을 불러오는 중입니다…';
    frame.focus();
    track('portfolio_game_start');
  });
  window.addEventListener('message', (event) => {
    if (!frame || event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.source !== 'game3-player') return;
    if (event.data.type === 'progress') status.textContent = `게임을 불러오는 중입니다… ${Math.round(Math.max(0,Math.min(1,Number(event.data.value)||0))*100)}%`;
    if (event.data.type === 'ready') { status.textContent = '플레이 중 · 더 크게 보려면 전체 화면을 눌러주세요.'; track('portfolio_game_ready'); }
    if (event.data.type === 'error') status.textContent = '게임을 불러오지 못했습니다. 게임을 닫고 다시 실행하거나 새 창에서 열어주세요.';
    if (event.data.type === 'escape' && stage.classList.contains('is-expanded')) closeExpanded();
  });
  fullscreen.addEventListener('click', async () => {
    if (!frame) return;
    if (stage.classList.contains('is-expanded') || document.fullscreenElement) { await closeExpanded(); return; }
    try {
      await stage.requestFullscreen();
    } catch {
      stage.classList.add('is-expanded');
      document.body.classList.add('game-expanded');
      fullscreen.textContent = '확대 화면 종료 ⛶';
    }
    focusGame();
    status.textContent = '플레이 중 · 화면 축소 버튼 또는 Esc 키로 돌아갈 수 있습니다.';
    track('portfolio_game_fullscreen');
  });
  collapse.addEventListener('click', closeExpanded);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && stage.classList.contains('is-expanded')) closeExpanded(); });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.textContent = document.fullscreenElement ? '전체 화면 종료 ⛶' : '전체 화면 ⛶';
    focusGame();
  });
  exit.addEventListener('click', async () => {
    await closeExpanded();
    frame?.remove();
    frame = null;
    cover.hidden = false;
    fullscreen.disabled = true;
    exit.hidden = true;
    status.textContent = '게임을 닫았습니다. 다시 실행하면 새 전투가 시작됩니다.';
    launch.focus();
    track('portfolio_game_exit');
  });
})();
