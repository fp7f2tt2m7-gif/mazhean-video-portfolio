/* Shared vector icons; decorative SVG is hidden from accessible names. */
const portfolioIconPaths={"north-east":"<path d=\"M6 18 18 6M6 6h12v12\"/>","east":"<path d=\"M4 12h16m-6-6 6 6-6 6\"/>","west":"<path d=\"M20 12H4m6-6-6 6 6 6\"/>","north":"<path d=\"M12 20V4m-6 6 6-6 6 6\"/>","south":"<path d=\"M12 4v16m-6-6 6 6 6-6\"/>","swap":"<path d=\"M3 12h18M7 8l-4 4 4 4m10-8 4 4-4 4\"/>","repeat":"<path d=\"M19.5 8a8 8 0 1 0 .5 7M19.5 3v5h-5\"/>","play":"<path d=\"m8 5 11 7-11 7Z\" fill=\"currentColor\" stroke=\"none\"/>","spark":"<path d=\"M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6\"/>","close":"<path d=\"m6 6 12 12M6 18 18 6\"/>"};
function uiIcon(name){
  const shape=portfolioIconPaths[name];
  if(!shape)throw Error('Unknown UI icon: '+name);
  return '<svg class="ui-icon" data-ui-icon="'+name+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+shape+'</svg>';
}
/* One renderer and one player lifecycle; motion.js only enhances these views. */
const tabs = document.querySelector('#experience-tabs');
const panel = document.querySelector('#project-panel');
let activeProject = projects[0].id;

function posterSurface(video, {primary = false} = {}) {
  const source = escapeHTML(posterFor(video));
  const fallback = escapeHTML(posterFallbackFor(video));
  const width = Number(video.width) > 0 ? Math.round(Number(video.width)) : video.format === '横屏' ? 1920 : 1080;
  const height = Number(video.height) > 0 ? Math.round(Number(video.height)) : video.format === '横屏' ? 1080 : 1920;
  const image = primary
    ? `src="${source}" fetchpriority="high"`
    : `src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${source}" class="deferred-poster" decoding="async"`;
  return `<span class="poster-surface"><img ${image} data-poster-fallback="${fallback}" width="${width}" height="${height}" alt="${escapeHTML(video.title)}封面"><span class="play-badge" aria-hidden="true"></span></span>`;
}
function videoCard(video, isExperiment = false) {
  return `<article class="video-card is-${video.format === '横屏' ? 'landscape' : 'portrait'}"><button class="video-poster" ${playAttributes(video)}>${posterSurface(video)}</button><h4>${escapeHTML(video.title)}</h4><p class="video-meta">${metaHTML(video, isExperiment)}</p></article>`;
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
  const selectedRoles = {
    'pukang-infoflow':['选题脚本','拍摄剪辑统筹','素材迭代'],
    'doctor-ip':['内容方向','选题策划','脚本优化'],
    'laofengxiang':['内容规划','视觉拍摄统筹','直播内容'],
    'ruanshi':['内容策划','产品拍摄','视频剪辑'],
    'wuling':['选题文案','视频拍摄','剪辑制作'],
    'saber-tooth':['现场拍摄','后期包装','项目交付']
  };
  const roles = (selectedRoles[project.id] || project.roles.slice(0,3)).filter(role => project.roles.includes(role));
  panel.setAttribute('aria-labelledby', `tab-${project.id}`);
  panel.innerHTML = `<div class="project-intro"><div><h3 class="project-heading">${project.title}</h3><p class="project-company">${project.company}</p><p class="project-position"><span>${project.position}</span><span>${project.period}</span></p></div><div class="project-roles" aria-label="本段经历职责">${roles.map(role => `<span class="role-tag">${role}</span>`).join('')}</div></div><div class="work-gallery is-${layout}">${primary ? `<article class="primary-work is-${primary.format === '横屏' ? 'landscape' : 'portrait'}"><button class="primary-poster" ${playAttributes(primary)}>${posterSurface(primary, {primary: true})}</button><div class="primary-caption"><h4>${escapeHTML(primary.title)}</h4><p class="video-meta">${metaHTML(primary)}</p></div></article>` : ''}${videos.slice(1).map(video => videoCard(video)).join('')}</div><div class="project-next"><span>${videos.length} 条作品</span><button data-project="${next.id}" aria-label="查看下一段经历：${next.short} · ${next.direction}">下一段：${next.short} ${uiIcon('east')}</button></div>`;
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
  const optimizedMediaPaths = Object.freeze({
    "assets/videos/pukang-infoflow/02-混剪种草.mp4": "assets/videos-optimized-20261106/talk-web-crf20.mp4",
    "assets/videos/ai-video/06-ai-work-3.mp4": "assets/videos-optimized-20261106/typography-web-crf20.mp4",
    "assets/videos/ai-video/09-ai-work-6.mp4": "assets/videos-optimized-20261106/outdoor-web-crf20.mp4"
  });
  const mediaPath = optimizedMediaPaths[relative] || relative;
  player.poster = posterFallbackFor(currentVideo);
  const mediaUrl = new URL(/^https?:/.test(mediaPath) ? mediaPath : `${CDN}/${mediaPath}`);
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
  dialog.dataset.format = video.format === '横屏' ? 'landscape' : 'portrait';
  dialog.style.setProperty('--video-ratio', Number(video.width) > 0 && Number(video.height) > 0 ? video.width + ' / ' + video.height : '16 / 9');
  const project = projects.find(item => item.id === id);
  document.querySelector('#player-context').textContent = project ? `${project.short} · ${project.direction}` : 'AI 制作实验 · 个人创意探索';
  document.querySelector('#player-title').textContent = video.title;
  document.querySelector('#player-detail').textContent = [video.format, durationLabel(video.durationSeconds)].filter(Boolean).join(' / ');
  document.querySelector('#player-position').textContent = `${index + 1} / ${videos.length}`;
  previousVideo.disabled = index === 0; nextVideo.disabled = videos.length < 2;
  nextVideo.innerHTML = index === videos.length - 1 ? '回到第一条 ' + uiIcon('repeat') : '下一条 ' + uiIcon('east');
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
  dialog.dataset.format = player.videoWidth > player.videoHeight ? 'landscape' : 'portrait';
  if (player.videoWidth && player.videoHeight) dialog.style.setProperty('--video-ratio', player.videoWidth + ' / ' + player.videoHeight);
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
let bufferingAtTime = null;
function handleBuffering() {
  if (!dialog.open || !currentVideo || player.error || player.ended || (player.paused && !player.seeking) || !hasStartedPlayback) return;
  if (player.readyState >= 3 && !player.seeking) return;
  if (bufferingTimer || status.classList.contains('error') && !status.hidden) return;
  bufferingAtTime = player.currentTime;
  setPlayerStatus('正在缓冲视频…');
  const session = playerSession;
  bufferingTimer = setTimeout(() => {
    bufferingTimer = null;
    if (session !== playerSession || !dialog.open || !currentVideo || player.error) return;
    const advancing = bufferingAtTime !== null && player.currentTime > bufferingAtTime + 0.01;
    if (player.paused || player.ended || advancing || (player.readyState >= 3 && !player.seeking)) {
      status.hidden = true;
      bufferingAtTime = null;
      return;
    }
    setPlayerStatus('缓冲时间较长，可重新加载继续观看，或切换下一条。', {error: true});
  }, BUFFER_TIMEOUT_MS);
}
player.addEventListener('waiting', handleBuffering);
player.addEventListener('stalled', () => {
  if (player.readyState < 3) handleBuffering();
});
player.addEventListener('timeupdate', () => {
  if (bufferingAtTime === null || !dialog.open || !currentVideo || player.paused || player.seeking || player.error) return;
  if (player.currentTime > bufferingAtTime + 0.01 && player.readyState >= 3) {
    clearPlayerTimers();
    status.hidden = true;
    bufferingAtTime = null;
  }
});
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
