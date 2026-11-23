(() => {
  'use strict';
  const hero = document.querySelector('[data-hero-carousel]');
  if (!hero) return;
  const slides = [...hero.querySelectorAll('[data-hero-slide]')];
  const dots = [...hero.querySelectorAll('[data-hero-dot]')];
  const controls = hero.querySelector('.hero-controls');
  const toggle = hero.querySelector('[data-hero-toggle]');
  const title = hero.querySelector('[data-hero-title]');
  const kind = hero.querySelector('[data-hero-kind]');
  const link = hero.querySelector('[data-hero-link]');
  const status = hero.querySelector('[data-hero-status]');
  const progress = hero.querySelector('[data-hero-progress]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 8000;
  let index = 0;
  let paused = reducedMotion.matches || Boolean(navigator.connection?.saveData);
  let visible = true;
  let elapsed = 0;
  let previousTime = 0;
  let frame = 0;
  let pointerStart = null;

  function running() {
    return !paused && !document.hidden && visible;
  }

  function syncMedia() {
    slides.forEach((slide, i) => {
      const video = slide.querySelector('video');
      if (!video) return;
      if (i !== index || !running()) {
        video.pause();
        return;
      }
      if (!video.hasAttribute('src')) {
        video.src = video.dataset.src;
        video.load();
      }
      video.muted = true;
      video.play()?.catch(() => {
        // A persistent poster stays visible when autoplay or the video is unavailable.
        slide.classList.remove('is-playing');
      });
    });
  }

  function syncToggle() {
    toggle.setAttribute('aria-label', paused ? '배경 콘텐츠 자동 재생 시작' : '배경 콘텐츠 자동 재생 일시정지');
    toggle.querySelector('[data-hero-toggle-text]').textContent = paused ? '자동 재생' : '일시정지';
    toggle.classList.toggle('is-paused', paused);
    hero.classList.toggle('is-paused', paused);
  }

  function selectSlide(next, announce = false) {
    index = (next + slides.length) % slides.length;
    elapsed = 0;
    previousTime = 0;
    progress.style.transform = 'scaleX(0)';
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      if (i !== index) slide.querySelector('video')?.pause();
    });
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    const active = slides[index];
    title.textContent = active.dataset.title;
    kind.textContent = active.dataset.kind;
    link.href = active.dataset.href;
    link.textContent = active.dataset.linkText;
    link.setAttribute('aria-label', `${active.dataset.title} ${active.dataset.linkText} (새 탭)`);
    if (announce) status.textContent = `${index + 1} / ${slides.length}, ${active.dataset.title}, ${active.dataset.kind}`;
    syncMedia();
  }

  function tick(now) {
    if (!running()) { frame = 0; return; }
    if (previousTime) elapsed += now - previousTime;
    previousTime = now;
    if (elapsed >= interval) selectSlide(index + 1);
    progress.style.transform = `scaleX(${Math.min(elapsed / interval, 1)})`;
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    syncToggle();
    syncMedia();
    if (running()) frame = requestAnimationFrame(tick);
  }

  function navigate(delta) { selectSlide(index + delta, true); }
  hero.querySelector('[data-hero-prev]').addEventListener('click', () => navigate(-1));
  hero.querySelector('[data-hero-next]').addEventListener('click', () => navigate(1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => selectSlide(i, true)));
  toggle.addEventListener('click', () => { paused = !paused; syncPlayback(); });

  controls.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    paused = true;
    navigate(event.key === 'ArrowRight' ? 1 : -1);
    syncPlayback();
  });
  controls.addEventListener('focusin', event => {
    if (event.target.matches(':focus-visible')) { paused = true; syncPlayback(); }
  });

  hero.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || event.target.closest('a, button')) return;
    pointerStart = {x:event.clientX, y:event.clientY};
  }, {passive:true});
  hero.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const x = event.clientX - pointerStart.x;
    const y = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(x) > 55 && Math.abs(x) > Math.abs(y) * 1.5) navigate(x < 0 ? 1 : -1);
  }, {passive:true});
  hero.addEventListener('pointercancel', () => { pointerStart = null; });

  slides.forEach(slide => {
    const video = slide.querySelector('video');
    if (!video) return;
    video.addEventListener('playing', () => {
      // Prevent a late play promise from reviving an inactive clip.
      if (slide !== slides[index] || !running()) { video.pause(); return; }
      slide.classList.add('is-playing');
    });
    video.addEventListener('error', () => slide.classList.remove('is-playing'));
  });

  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pagehide', () => { visible = false; syncPlayback(); });
  window.addEventListener('pageshow', () => { visible = true; syncPlayback(); });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) { paused = true; syncPlayback(); }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }, {threshold:0}).observe(hero);
  }

  controls.hidden = false;
  selectSlide(0);
  syncPlayback();
})();
