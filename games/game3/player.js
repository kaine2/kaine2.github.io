(() => {
  'use strict';
  const embedded = window.parent !== window || new URLSearchParams(location.search).get('embed') === '1';
  document.body.classList.toggle('embedded', embedded);
  const canvas = document.getElementById('unity-canvas');
  const player = document.getElementById('player');
  const orientationHint = document.getElementById('orientation-hint');
  // Keep Unity's viewport landscape even inside a portrait window or fullscreen iframe.
  // Resize the canvas itself so rendering and pointer coordinates share the same bounds.
  const fitCanvas = () => {
    const width = Math.min(player.clientWidth, player.clientHeight * 16 / 9);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${width * 9 / 16}px`;
    orientationHint.hidden = player.clientHeight <= player.clientWidth;
  };
  new ResizeObserver(fitCanvas).observe(player);
  window.addEventListener('resize', fitCanvas, {passive:true});
  window.visualViewport?.addEventListener('resize', fitCanvas, {passive:true});
  fitCanvas();
  const loading = document.getElementById('loading');
  const message = document.getElementById('loading-message');
  const progress = document.getElementById('progress');
  const label = document.getElementById('progress-label');
  let failed = false;
  let ready = false;
  const send = (type, value) => { if (window.parent !== window) window.parent.postMessage({source:'game3-player',type,value},location.origin); };
  function fail(error) {
    if (failed) return;
    failed = true;
    clearTimeout(slowTimer);
    console.error('Game3 could not start:', error);
    loading.hidden = false;
    message.textContent = '게임을 불러오지 못했습니다.';
    document.getElementById('loading-note').textContent = 'PC의 최신 Chrome 또는 Edge에서 다시 시도해주세요. 문제가 계속되면 브라우저의 그래픽 가속 설정과 인터넷 연결을 확인해주세요.';
    progress.hidden = label.hidden = true;
    document.getElementById('retry').hidden = false;
    document.getElementById('fallback').hidden = false;
    send('error');
  }
  const slowTimer = setTimeout(() => {
    if (!ready && !failed) document.getElementById('loading-note').textContent = '준비에 시간이 조금 더 걸리고 있습니다. 잠시 기다려주세요.';
  }, 60000);
  window.addEventListener('portfolio-game-ready', () => {
    if (failed || ready) return;
    ready = true;
    clearTimeout(slowTimer);
    loading.hidden = true;
    canvas.focus();
    send('ready');
  });
  document.getElementById('retry').addEventListener('click', () => location.reload());
  window.addEventListener('message', (event) => {
    if (event.origin === location.origin && event.source === window.parent && event.data?.source === 'game3-host' && event.data.type === 'focus') canvas.focus();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') send('escape'); });
  document.getElementById('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.getElementById('player').requestFullscreen();
      canvas.focus();
    } catch { document.getElementById('fullscreen').textContent = '브라우저 확대 기능을 이용해주세요'; }
  });
  document.addEventListener('fullscreenchange', () => canvas.focus());
  async function start() {
    if (typeof WebAssembly !== 'object') throw new Error('WebAssembly is not supported');
    const response = await fetch('build-config.json');
    if (!response.ok) throw new Error(`Build config HTTP ${response.status}`);
    const {loaderUrl, ...config} = await response.json();
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = loaderUrl;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Unity loader download failed'));
      document.body.append(script);
    });
    config.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    config.showBanner = (text, type) => { if (type === 'error') fail(text); else console.warn(text); };
    await createUnityInstance(canvas, config, (value) => {
      progress.value = value;
      label.textContent = `${Math.round(value * 100)}%`;
      message.textContent = value >= .9 ? '전투 화면을 준비하고 있습니다.' : '게임을 내려받고 있습니다.';
      send('progress', value);
    });
  }
  start().catch(fail);
})();
