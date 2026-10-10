/* One renderer and one player lifecycle; motion.js only enhances these views. */
const tabs = document.querySelector('#experience-tabs');
const panel = document.querySelector('#project-panel');
let activeProject = projects[0].id;

function posterSurface(video, {primary = false} = {}) {
  return `<span class="poster-surface"><img src="${escapeHTML(posterFor(video))}" alt="${escapeHTML(video.title)}封面" ${primary ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>${primary ? '<span class="work-label">代表作品 / SELECTED</span>' : ''}<span class="play-badge" aria-hidden="true"></span></span>`;
}
function videoCard(video, isExperiment = false) {
  return `<article class="video-card is-${video.format === '横屏' ? 'landscape' : 'portrait'}"><button class="video-poster" ${playAttributes(video)} style="--poster:url('${escapeHTML(posterFor(video))}')">${posterSurface(video)}</button><h4>${escapeHTML(video.title)}</h4><p class="video-meta">${metaHTML(video, isExperiment)}</p></article>`;
}
function renderTabs() {
  tabs.innerHTML = projects.map((project, index) => `<button class="experience-tab" role="tab" id="tab-${project.id}" aria-controls="project-panel" aria-selected="${project.id === activeProject}" tabindex="${project.id === activeProject ? 0 : -1}" data-project="${project.id}"><span class="tab-number">${String(index + 1).padStart(2, '0')}</span><span><strong class="tab-title">${project.short}</strong><span class="tab-direction">${project.direction}</span><span class="tab-date">${project.period}</span></span></button>`).join('');
  tabs.setAttribute('aria-orientation', 'horizontal');
}
function updateSelectedTab() {
  for (const tab of tabs.querySelectorAll('[role="tab"]')) {
    const selected = tab.dataset.project === activeProject;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
}
function renderProject() {
  const project = projects.find(item => item.id === activeProject);
  const index = projects.indexOf(project), videos = videosFor(project.id), primary = videos[0], next = projects[(index + 1) % projects.length];
  const horizontalCount = videos.filter(video => video.format === '横屏').length;
  const layout = horizontalCount === videos.length ? 'landscape' : horizontalCount ? 'mixed' : 'portrait';
  panel.setAttribute('aria-labelledby', `tab-${project.id}`);
  panel.innerHTML = `<div class="project-intro"><div><div class="project-topline"><span>PROJECT ${String(index + 1).padStart(2, '0')}</span><span>${project.period}</span></div><h3 class="project-heading">${project.title}</h3><p class="project-company">${project.company}<br>${project.position}</p></div><div><p class="project-summary">${project.summary}</p><div class="project-roles"><span class="roles-label">本段经历职责</span>${project.roles.map(role => `<span class="role-tag">${role}</span>`).join('')}</div></div></div><div class="work-gallery is-${layout}">${primary ? `<article class="primary-work is-${primary.format === '横屏' ? 'landscape' : 'portrait'}"><button class="primary-poster" ${playAttributes(primary)} style="--poster:url('${escapeHTML(posterFor(primary))}')">${posterSurface(primary, {primary: true})}</button><div class="primary-caption"><h4>${escapeHTML(primary.title)}</h4><p class="video-meta">${metaHTML(primary)}</p><p class="work-note">${escapeHTML(project.description)}</p></div></article>` : ''}${videos.slice(1).map(video => videoCard(video)).join('')}</div><div class="project-next"><span>${videos.length} 条视频 · 详细履历与成果见简历</span><button data-project="${next.id}">${next.short} · ${next.direction} →</button></div>`;
  document.dispatchEvent(new CustomEvent('portfolio:projectrender'));
}
function ensureTabVisible({instant = false} = {}) {
  const tab = tabs.querySelector('[aria-selected="true"]');
  if (!tab || tabs.scrollWidth <= tabs.clientWidth) return;
  const left = tab.offsetLeft, right = left + tab.offsetWidth;
  if (left < tabs.scrollLeft || right > tabs.scrollLeft + tabs.clientWidth) tabs.scrollTo({left: Math.max(0, left - 10), behavior: instant || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
}
function selectProject(id, {scroll = false, focus = false, writeHash = true} = {}) {
  if (!projects.some(project => project.id === id)) return;
  const changed = activeProject !== id;
  activeProject = id;
  updateSelectedTab();
  if (changed) renderProject();
  ensureTabVisible();
  document.dispatchEvent(new CustomEvent('portfolio:tabchange', {detail: {id, changed}}));
  if (writeHash) history.replaceState(null, '', `#project-${id}`);
  if (scroll) document.querySelector('#portfolio').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
  if (focus) document.querySelector(`#tab-${id}`).focus({preventScroll: true});
}
function projectFromHash() {
  const id = location.hash.replace(/^#project-/, '');
  return projects.some(project => project.id === id) ? id : null;
}
document.addEventListener('click', event => {
  const projectButton = event.target.closest('[data-project]');
  if (projectButton) {
    const isTab = !!projectButton.closest('.experience-tabs');
    selectProject(projectButton.dataset.project, {scroll: !isTab, focus: isTab});
    return;
  }
  const play = event.target.closest('[data-play]');
  if (play) openPlayer(play.dataset.play, Number(play.dataset.index), play);
});
tabs.addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const current = projects.findIndex(project => project.id === activeProject);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? projects.length - 1 : (current + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + projects.length) % projects.length;
  selectProject(projects[next].id, {focus: true});
});
window.addEventListener('hashchange', () => {
  const id = projectFromHash();
  if (id) selectProject(id, {scroll: true, writeHash: false});
});

const dialog = document.querySelector('#video-dialog'), player = document.querySelector('#video-player');
const status = document.querySelector('#player-status'), message = document.querySelector('#player-message'), retry = document.querySelector('#retry-player');
const previousVideo = document.querySelector('#previous-video'), nextVideo = document.querySelector('#next-video');
let currentVideo = null, returnFocus = null, loadingTimer = null, bufferingTimer = null;
let hasStartedPlayback = false, pendingSeek = 0, playerSession = 0;
const LOAD_TIMEOUT_MS = 15000, BUFFER_TIMEOUT_MS = 12000;
function clearPlayerTimers() {
  clearTimeout(loadingTimer); clearTimeout(bufferingTimer);
  loadingTimer = null; bufferingTimer = null;
}
function setPlayerStatus(text, {error = false, visible = true} = {}) {
  status.hidden = !visible;
  status.classList.toggle('error', error);
  message.textContent = text;
  retry.hidden = !error;
}
function startVideo({resumeTime = 0} = {}) {
  if (!currentVideo) return;
  const session = ++playerSession;
  clearPlayerTimers(); player.pause(); hasStartedPlayback = false;
  pendingSeek = Number.isFinite(resumeTime) ? Math.max(0, resumeTime) : 0;
  setPlayerStatus('正在加载视频…');
  const relative = String(currentVideo.url).replace(/^\/+/, '');
  player.poster = posterFor(currentVideo);
  const mediaUrl = new URL(/^https?:/.test(relative) ? relative : `${CDN}/${relative}`);
  if (currentVideo.mediaVersion) mediaUrl.searchParams.set('v', currentVideo.mediaVersion);
  player.src = mediaUrl.href;
  player.load();
  loadingTimer = setTimeout(() => {
    loadingTimer = null;
    if (session === playerSession && dialog.open && player.readyState < 3) setPlayerStatus('加载较慢，可以重新加载或切换下一条。', {error: true});
  }, LOAD_TIMEOUT_MS);
  player.play()?.catch(() => {
    if (session === playerSession && player.readyState >= 2 && !player.error) setPlayerStatus('点击播放器中的播放按钮继续。', {visible: false});
  });
}
function openPlayer(id, index, opener) {
  const videos = videosFor(id), video = videos[index];
  if (!video) return;
  if (opener) returnFocus = opener;
  currentVideo = video;
  const project = projects.find(item => item.id === id);
  document.querySelector('#player-context').textContent = project ? `${project.short} · ${project.direction}` : 'AI 制作实验 · 个人创意探索';
  document.querySelector('#player-title').textContent = video.title;
  document.querySelector('#player-detail').textContent = [video.format, durationLabel(video.durationSeconds)].filter(Boolean).join(' / ');
  document.querySelector('#player-position').textContent = `${index + 1} / ${videos.length}`;
  previousVideo.disabled = index === 0; nextVideo.disabled = videos.length < 2;
  nextVideo.textContent = index === videos.length - 1 ? '回到第一条 ↻' : '下一条 →';
  const opening = !dialog.open;
  if (opening) {dialog.showModal(); document.body.classList.add('modal-open');}
  document.dispatchEvent(new CustomEvent('portfolio:playeropen', {detail: {opening, video: {projectId: id, index, title: video.title, duration: video.durationSeconds}}}));
  startVideo();
}
function closePlayer() {if (dialog.open) dialog.close();}
dialog.addEventListener('close', () => {
  document.dispatchEvent(new CustomEvent('portfolio:playerclosing'));
  ++playerSession; clearPlayerTimers(); player.pause(); player.removeAttribute('src'); player.load();
  currentVideo = null; hasStartedPlayback = false; pendingSeek = 0; status.hidden = true;
  document.body.classList.remove('modal-open');
  if (returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
});
document.querySelector('#close-player').addEventListener('click', closePlayer);
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePlayer();
});
player.addEventListener('loadedmetadata', () => {
  if (!currentVideo || !dialog.open) return;
  document.querySelector('#player-detail').textContent = `${player.videoWidth > player.videoHeight ? '横屏' : '竖屏'} / ${durationLabel(player.duration)}`;
  if (pendingSeek > 0) {
    const resumeAt = Number.isFinite(player.duration) ? Math.min(pendingSeek, Math.max(0, player.duration - .25)) : pendingSeek;
    pendingSeek = 0; player.currentTime = resumeAt;
  }
});
player.addEventListener('canplay', () => {
  if (!dialog.open || !currentVideo) return;
  clearPlayerTimers(); status.hidden = true;
});
player.addEventListener('playing', () => {
  if (!dialog.open || !currentVideo) return;
  hasStartedPlayback = true; clearPlayerTimers(); status.hidden = true;
});
function handleBuffering() {
  if (!dialog.open || !currentVideo || player.error || (player.paused && !player.seeking) || !hasStartedPlayback) return;
  if (bufferingTimer || status.classList.contains('error') && !status.hidden) return;
  setPlayerStatus('正在缓冲视频…');
  const session = playerSession;
  bufferingTimer = setTimeout(() => {
    bufferingTimer = null;
    if (session === playerSession && dialog.open && currentVideo) setPlayerStatus('缓冲时间较长，可重新加载继续观看，或切换下一条。', {error: true});
  }, BUFFER_TIMEOUT_MS);
}
player.addEventListener('waiting', handleBuffering);
player.addEventListener('stalled', handleBuffering);
player.addEventListener('pause', () => {
  clearTimeout(bufferingTimer); bufferingTimer = null;
  if (hasStartedPlayback && !status.classList.contains('error')) status.hidden = true;
});
player.addEventListener('ended', () => {clearPlayerTimers(); status.hidden = true;});
player.addEventListener('error', () => {
  if (!dialog.open || !currentVideo) return;
  clearPlayerTimers(); setPlayerStatus('视频暂时无法加载，请重新尝试。', {error: true});
});
retry.addEventListener('click', () => startVideo({resumeTime: player.currentTime}));
previousVideo.addEventListener('click', () => {
  if (currentVideo && currentVideo.index > 0) openPlayer(currentVideo.projectId, currentVideo.index - 1);
});
nextVideo.addEventListener('click', () => {
  if (currentVideo) openPlayer(currentVideo.projectId, (currentVideo.index + 1) % videosFor(currentVideo.projectId).length);
});
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const copyStatus = document.querySelector('#copy-status');
  try {await navigator.clipboard.writeText(button.dataset.copy); copyStatus.textContent = '邮箱已复制。';}
  catch {copyStatus.textContent = `请手动复制：${button.dataset.copy}`;}
}));

// Render only once. The effects layer enhances the existing DOM.
activeProject = projectFromHash() || projects[0].id;
renderTabs(); renderProject();
document.querySelector('#experiment-grid').innerHTML = videosFor('ai-video').map(video => videoCard(video, true)).join('');
if (projectFromHash()) requestAnimationFrame(() => {
  ensureTabVisible({instant: true});
  document.querySelector('#portfolio').scrollIntoView({behavior: 'instant'});
});
