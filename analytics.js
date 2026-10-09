/* Existing Baidu property; local previews keep events in memory and send nothing. */
(() => {
  const PROPERTY_ID = '33d4e2063277f9ff61ee2c5681e2a3da'; // Public site identifier, not an API credential.
  const isPublished = location.hostname === 'fp7f2tt2m7-gif.github.io' && location.pathname.startsWith('/mazhean-video-portfolio/');
  const code = new URLSearchParams(location.search).get('hr') || 'direct';
  const source = /^[a-zA-Z0-9_-]{1,32}$/.test(code) ? code : 'invalid';
  window._hmt = window._hmt || [];
  if (isPublished) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://hm.baidu.com/hm.js?${PROPERTY_ID}`;
    document.head.append(script);
  }
  function track(category, action, label, value) {
    const event = ['_trackEvent', category, action, label];
    if (Number.isFinite(value)) event.push(Math.max(0, Math.round(value)));
    window._hmt.push(event);
  }
  function videoLabel(video) {return `${source} | ${video.title}`;}

  let lastSample = performance.now();
  let wasVisible = !document.hidden;
  let visibleSeconds = 0;
  const dwellMilestones = new Set();
  let visitFlushed = false;
  let video = null;
  let videoPlaying = false;
  let previousMediaTime = 0;
  function sample() {
    const now = performance.now();
    const elapsed = Math.min(5, Math.max(0, (now - lastSample) / 1000));
    lastSample = now;
    if (wasVisible) {
      visibleSeconds += elapsed;
      for (const milestone of [10, 30, 60, 120]) {
        if (visibleSeconds >= milestone && !dwellMilestones.has(milestone)) {
          dwellMilestones.add(milestone);
          track('portfolio', `engaged-${milestone}s`, source);
        }
      }
      if (video && videoPlaying && !player.seeking && player.readyState >= 3) {
        const advance = player.currentTime - previousMediaTime;
        // Seeking must not turn a jump in playback position into watched time.
        if (advance > 0 && advance <= elapsed * Math.max(1, player.playbackRate) + 1) {
          video.seconds += Math.min(elapsed, advance / player.playbackRate);
          // Merge played intervals so rewatching or seeking cannot inflate coverage.
          video.ranges.push([previousMediaTime, player.currentTime]);
          video.ranges.sort((a, b) => a[0] - b[0]);
          const merged = [];
          for (const range of video.ranges) {
            const previous = merged.at(-1);
            if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
            else merged.push([...range]);
          }
          video.ranges = merged;
          const covered = merged.reduce((total, range) => total + range[1] - range[0], 0);
          const watchedFraction = video.duration > 0 ? covered / video.duration : 0;
          for (const milestone of [25, 50, 75]) {
            if (watchedFraction >= milestone / 100 && !video.milestones.has(milestone)) {
              video.milestones.add(milestone);
              track('portfolio-video', `watched-${milestone}pct`, videoLabel(video));
            }
          }
        }
      }
    }
    previousMediaTime = player.currentTime;
  }
  function flushVideo() {
    if (!video || video.flushed) return;
    video.flushed = true;
    if (video.started) track('portfolio-video', 'watch-seconds', videoLabel(video), video.seconds);
  }
  function flushVisit() {
    sample(); flushVideo();
    if (!visitFlushed) {
      visitFlushed = true;
      track('portfolio', 'visible-seconds', source, visibleSeconds);
    }
  }

  track('portfolio', 'visit', source);
  document.addEventListener('portfolio:tabchange', event => {
    if (!event.detail.changed) return;
    const project = projects.find(item => item.id === event.detail.id);
    if (project) track('portfolio-project', 'select', `${source} | ${project.short}`);
  });
  document.addEventListener('portfolio:playeropen', event => {
    sample(); flushVideo();
    video = {...event.detail.video, seconds: 0, ranges: [], started: false, completed: false, flushed: false, milestones: new Set()};
    previousMediaTime = 0; videoPlaying = false;
    track('portfolio-video', 'play', videoLabel(video)); // Same category/action as the original site.
  });
  document.addEventListener('portfolio:playerclosing', () => {
    sample(); flushVideo(); video = null; videoPlaying = false;
  });
  player.addEventListener('playing', () => {
    sample(); videoPlaying = true; previousMediaTime = player.currentTime;
    if (video && !video.started) {
      video.started = true;
      track('portfolio-video', 'started', videoLabel(video));
    }
  });
  for (const event of ['pause', 'waiting', 'seeking']) player.addEventListener(event, () => {sample(); videoPlaying = false;});
  player.addEventListener('seeked', () => {
    sample(); videoPlaying = !player.paused && player.readyState >= 3;
    previousMediaTime = player.currentTime;
  });
  player.addEventListener('ended', () => {
    sample(); videoPlaying = false;
    if (video && !video.completed && video.duration > 0 && video.milestones.has(75)) {
      video.completed = true;
      track('portfolio-video', 'completed', videoLabel(video));
    }
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (link && /(?:^|\/)resume\.pdf(?:[?#]|$)/.test(link.getAttribute('href'))) {
      track('portfolio-resume', link.hasAttribute('download') ? 'download' : 'open', source);
    }
  });
  document.addEventListener('visibilitychange', () => {
    sample(); wasVisible = !document.hidden; lastSample = performance.now(); previousMediaTime = player.currentTime;
  });
  window.addEventListener('pagehide', flushVisit);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    // A return from history starts a new foreground segment, not an invented PV.
    lastSample = performance.now(); wasVisible = !document.hidden; visibleSeconds = 0; visitFlushed = false; dwellMilestones.clear();
    if (video) {video.seconds = 0; video.ranges = []; video.flushed = false; video.completed = false; video.milestones.clear();}
  });
  setInterval(sample, 1000);
})();
