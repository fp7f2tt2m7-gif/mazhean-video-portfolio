/* Optional effects: never replace renderers or rebuild content. */
const motionReduced = matchMedia('(prefers-reduced-motion: reduce)');
const motionPointer = matchMedia('(hover: hover) and (pointer: fine)');
function motionAnimate(targets, options) {
  if (motionReduced.matches || !window.anime?.animate) return;
  return window.anime.animate(targets, options);
}
function updateTabIndicator(instant = false) {
  const selected = tabs.querySelector('[aria-selected="true"]'), indicator = document.querySelector('.tab-indicator');
  if (!selected || !indicator) return;
  indicator.style.width = `${selected.offsetWidth}px`;
  indicator.style.transform = `translateX(${selected.offsetLeft - tabs.scrollLeft}px)`;
  if (instant) {indicator.style.transition = 'none'; requestAnimationFrame(() => indicator.style.removeProperty('transition'));}
}
function animateProject() {
  motionAnimate(panel.querySelectorAll('.project-intro,.primary-work,.video-card'), {opacity: [0, 1], y: [12, 0], duration: 420, delay: window.anime?.stagger?.(35) || 0, ease: 'outExpo'});
}
function updateExperienceOverflow() {
  const rail = document.querySelector('.tab-rail'), overflow = tabs.scrollWidth > tabs.clientWidth + 2;
  rail.classList.toggle('can-scroll-left', overflow && tabs.scrollLeft > 3);
  rail.classList.toggle('can-scroll-right', overflow && tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 3);
  document.querySelector('#experience-hint').textContent = overflow ? '共 6 段经历 · 左右滑动' : '共 6 段经历 · 由近及远';
}
tabs.addEventListener('scroll', () => {updateTabIndicator(true); updateExperienceOverflow();}, {passive: true});
document.addEventListener('portfolio:tabchange', () => updateTabIndicator());
document.addEventListener('portfolio:projectrender', animateProject);
document.addEventListener('portfolio:playeropen', event => {
  if (event.detail.opening) motionAnimate(dialog, {opacity: [0, 1], scale: [.97, 1], duration: 240, ease: 'outExpo'});
});

// Scroll position is the source of truth for section navigation.
const sectionLinks = [...document.querySelectorAll('.site-header nav a,.mobile-dock a[data-section]')];
const navSections = ['portfolio', 'experiments', 'contact'].map(id => document.getElementById(id));
let navigationFrame = 0;
function updateActiveNavigation() {
  navigationFrame = 0;
  const threshold = document.querySelector('.site-header').getBoundingClientRect().bottom + 64;
  let current = 'portfolio';
  for (const section of navSections) if (section.getBoundingClientRect().top <= threshold) current = section.id;
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 3) current = 'contact';
  for (const link of sectionLinks) {
    const selected = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  }
}
function scheduleNavigationUpdate() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateActiveNavigation);
}
window.addEventListener('scroll', scheduleNavigationUpdate, {passive: true});
window.addEventListener('hashchange', scheduleNavigationUpdate);
window.addEventListener('resize', () => {
  ensureTabVisible({instant: true}); updateTabIndicator(true); updateExperienceOverflow(); scheduleNavigationUpdate();
});
document.addEventListener('portfolio:projectrender', scheduleNavigationUpdate);

motionAnimate('.hero-line', {opacity: [0, 1], y: [18, 0], filter: ['blur(7px)', 'blur(0px)'], delay: window.anime?.stagger?.(80) || 0, duration: 650, ease: 'outExpo'});
motionAnimate('.hero-role,.hero-description,.hero-actions', {opacity: [0, 1], y: [10, 0], delay: window.anime?.stagger?.(55, {start: 140}) || 0, duration: 550, ease: 'outExpo'});
motionAnimate('.hero-scene', {opacity: [0, 1], y: [15, 0], duration: 750, delay: 150, ease: 'outExpo'});
motionAnimate('.accent-word path', {strokeDashoffset: [230, 0], strokeDasharray: 230, duration: 700, delay: 350, ease: 'outExpo'});
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer.unobserve(entry.target);
    motionAnimate(entry.target, {opacity: [.2, 1], y: [18, 0], duration: 650, ease: 'outExpo'});
  }
}, {threshold: .12}) : null;
document.querySelectorAll('.section-heading,.experiment-grid,.contact').forEach(element => revealObserver?.observe(element));

// The button stays fixed. Only .poster-surface responds to these variables.
let motionPointerFrame = 0;
document.addEventListener('pointermove', event => {
  if (!motionPointer.matches || motionReduced.matches) return;
  const card = event.target.closest('.primary-poster,.video-poster');
  if (!card) return;
  cancelAnimationFrame(motionPointerFrame);
  const x = event.clientX, y = event.clientY;
  motionPointerFrame = requestAnimationFrame(() => {
    if (!card.isConnected) return;
    const rect = card.getBoundingClientRect();
    const dx = Math.max(-.5, Math.min(.5, (x - rect.left) / rect.width - .5)), dy = Math.max(-.5, Math.min(.5, (y - rect.top) / rect.height - .5));
    card.style.setProperty('--rx', `${-dy * 6}deg`); card.style.setProperty('--ry', `${dx * 6}deg`);
    card.style.setProperty('--shine-x', `${(dx + .5) * 100}%`); card.style.setProperty('--shine-y', `${(dy + .5) * 100}%`);
  });
});
document.addEventListener('pointerout', event => {
  const card = event.target.closest('.primary-poster,.video-poster');
  if (!card || card.contains(event.relatedTarget)) return;
  cancelAnimationFrame(motionPointerFrame); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
});
document.querySelectorAll('.magnetic').forEach(button => {
  button.addEventListener('pointermove', event => {
    if (!motionPointer.matches || motionReduced.matches) return;
    const rect = button.getBoundingClientRect();
    button.style.transform = `translate(${((event.clientX - rect.left) / rect.width - .5) * 7}px,${((event.clientY - rect.top) / rect.height - .5) * 7}px)`;
  });
  button.addEventListener('pointerleave', () => button.style.transform = 'translate(0,0)');
});
const scene = document.querySelector('.hero-scene');
scene.addEventListener('pointermove', event => {
  if (!motionPointer.matches || motionReduced.matches) return;
  const rect = scene.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width - .5, y = (event.clientY - rect.top) / rect.height - .5;
  scene.querySelectorAll('.scene-card').forEach((card, index) => {
    card.style.setProperty('--mx', `${x * (index + 1) * 5}px`); card.style.setProperty('--my', `${y * (index + 1) * 5}px`);
  });
});
scene.addEventListener('pointerleave', () => scene.querySelectorAll('.scene-card').forEach(card => {
  card.style.setProperty('--mx', '0px'); card.style.setProperty('--my', '0px');
}));
motionReduced.addEventListener('change', () => {
  if (motionReduced.matches) document.querySelectorAll('.primary-poster,.video-poster,.magnetic,.scene-card').forEach(element => {
    for (const property of ['transform', '--rx', '--ry', '--mx', '--my']) element.style.removeProperty(property);
  });
});
animateProject();
requestAnimationFrame(() => {updateTabIndicator(true); updateExperienceOverflow(); updateActiveNavigation();});
