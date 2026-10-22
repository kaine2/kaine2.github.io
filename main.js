const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
let ticking = false;
function updateCurrent() {
  let current = null;
  for (const section of sections) {
    if (section && section.getBoundingClientRect().top <= 130) current = section.id;
  }
  for (const link of navLinks) {
    if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  ticking = false;
}
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(updateCurrent); }
}, {passive:true});
updateCurrent();
