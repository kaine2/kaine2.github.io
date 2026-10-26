(() => {
  'use strict';
  // Portfolio GA4 web stream.
  const measurementId = 'G-Y7V0EW2BLB';
  if (!/^G-[A-Z0-9]+$/.test(measurementId) || location.hostname !== 'kaine2.github.io') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);

  const assets = {
    '/docs/dragonia-postmortem.pdf': ['portfolio_pdf_click', 'dragonia', 'postmortem'],
    '/docs/demon-defense.pdf': ['portfolio_pdf_click', 'demon', 'combat_system'],
    '/docs/nikke-proof.pdf': ['portfolio_pdf_click', 'proof', 'character_design'],
    '/docs/way-back-home-postmortem.pdf': ['portfolio_pdf_click', 'wayback', 'postmortem'],
    '/nikke-proof-simulator/': ['portfolio_simulator_click', 'proof', 'simulator']
  };
  const videos = {
    '/wCEhq5Cnb8g': ['portfolio_video_click', 'dragonia', 'gameplay'],
    '/W2ZDe3I5ya4': ['portfolio_video_click', 'wayback', 'gameplay'],
    '/Fsa514hesbk': ['portfolio_video_click', 'wayback', 'ending']
  };
  function recordClick(event) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    const item = url.hostname === 'kaine2.github.io' ? assets[url.pathname]
      : url.hostname === 'youtu.be' ? videos[url.pathname] : null;
    if (!item) return;
    window.gtag('event', item[0], {
      project_id: item[1],
      content_name: item[2],
      link_section: link.closest('section')?.id || 'other',
      link_url: url.origin + url.pathname,
      transport_type: 'beacon'
    });
  }
  // Leave navigation untouched even when analytics is blocked or unavailable.
  document.addEventListener('click', recordClick);
  document.addEventListener('auxclick', recordClick);
})();
